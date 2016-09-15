from xml.etree import ElementTree
import math

buildings = []

def deg2num(lat_deg, lon_deg):
  zoom = 16
  mperpixel = 2.3887
  lat_rad = math.radians(lat_deg)
  n = 2.0 ** zoom
  xtile = (lon_deg + 180.0) / 360.0 * n
  ytile = (1.0 - math.log(math.tan(lat_rad) + (1 / math.cos(lat_rad))) / math.pi) / 2.0 * n
  return (xtile * 256 * mperpixel, ytile * 256 * mperpixel)

def extractBuildings(tree):
    for node in tree.iter("way"):
        for tag in node.iter("tag"):
            if tag.get("k") == "building":
                building = []
                for i in node.iter("nd"):
                    building.append(i.get("ref"))
                yield building
                break

def createTranslation(tree):
    translate = {}
    for node in tree.iter("node"):
        num = deg2num(float(node.get("lat")), float(node.get("lon")))
        translate[node.get("id")] = num
    return translate

def translateBuildings(buildings, translate):
    for building in buildings:
        for i in range(len(building)):
            building[i] = list(translate[building[i]])

def createMatrix(building):
    offset_x = building[0][0]
    offset_y = building[0][1]
    max_x = 0
    max_y = 0
    for i in range(len(building)):
        if building[i][0] < offset_x:
            offset_x = building[i][0]
        if building[i][0] > max_x:
            max_x = building[i][0]
        if building[i][1] < offset_y:
            offset_y = building[i][1]
        if building[i][1] > max_y:
            max_y = building[i][1]
    offset_x = int(math.floor(offset_x))
    offset_y = int(math.floor(offset_y))
    max_x = int(math.ceil(max_x))
    max_y = int(math.ceil(max_y))
    width = int(max_x - offset_x) + 1
    height = int(max_y - offset_y) + 1

    import scipy.misc
    import scipy.ndimage
    import numpy as np
    from skimage.draw import line_aa
    img = np.zeros((height, width), dtype=np.uint8)
    for i in range(1, len(building)):
        point1 = building[i-1]
        point2 = building[i]

        rr, cc, val = line_aa(int(round(point1[1] - offset_y)),
                              int(round(point1[0] - offset_x)),
                              int(round(point2[1] - offset_y)),
                              int(round(point2[0] - offset_x)))
        img[rr, cc] = 1

    img = scipy.ndimage.binary_fill_holes(img).astype(int)

    matrix = []
    for i in range(width):
        matrix.append([])
        for j in range(height):
            matrix[i].append(img[j,i])
    return [matrix, offset_x, offset_y, 6]

def printMatrix(matrix):
    max_ = 40
    while len(matrix) > max_ or len(matrix[0]) > max_:
        print "shortened"
        matrix_n = []
        for row in range(0, len(matrix[0]), 2):
            matrix_n.append([])
            for  col in range(0, len(matrix), 2):
                matrix_n[row/2].append(matrix[col][row])
        matrix = matrix_n

    for row in range(len(matrix[0])):
        for  col in range(len(matrix)):
            if matrix[col][row]:
                print "1",
            else:
                print "0",
        print ""

def createBlocks(data):
    matrix, offset_x, offset_y, height = data

    blocks = []
    for row in range(len(matrix[0])):
        for  col in range(len(matrix)):
            if matrix[col][row]:
                for h in range(height):
                    blocks.append([row + offset_x, h, col + offset_y])

    return blocks

def sendBlocks(blocks):
    import requests
    import json

    session = requests.Session()

    data = []
    for block in blocks:
        data.append({
            "pos": {
                 "x": block[0],
                 "y": block[1],
                 "z": block[2]
              },
              "type": 2
        });
        if len(data) > 100:
            r = session.post("http://localhost:8002/api/blocks", data=json.dumps(data), headers={"content-type": "application/json"})
            assert r.status_code == 200
            assert json.loads(r.text)["ok"]
            data = []
    
with open('building.osm', 'rt') as f:
    tree = ElementTree.parse(f)

    count = 0

    trans = createTranslation(tree)
    for building in extractBuildings(tree):
        print "building", count
        translateBuildings([building], trans)
        data = createMatrix(building)

        matrix, offset_x, offset_y, height = data
        print offset_x, offset_y, height
        printMatrix(matrix)

        blocks = createBlocks(data)
        sendBlocks(blocks)

        count += 1
        #if count > 10000:
        #    die()
