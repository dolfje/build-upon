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
    buildings = []
    count = 0
    for node in tree.iter("way"):
        for tag in node.iter("tag"):
            if tag.get("k") == "building":
                building = []
                for i in node.iter("nd"):
                    building.append(i.get("ref"))
                buildings.append(building)
                break
        count += 1
        if count > 100:
            break
    return buildings

def createTranslation(tree, buildings):
    translate = {}
    for building in buildings:
        for ref in building:
            translate[ref] = None

    for node in tree.iter("node"):
        if node.get("id") in translate:
            num = deg2num(float(node.get("lat")), float(node.get("lon")))
            translate[node.get("id")] = num
    return translate

def translateBuildings(buildings, translate):
    for building in buildings:
        for i in range(len(building)):
            print translate[building[i]]
            building[i] = list(translate[building[i]])
            print building[i][0]*1.0, building[i][1]*1.0

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
    print offset_x
    offset_x = int(math.floor(offset_x))
    offset_y = int(math.floor(offset_y))
    max_x = int(math.ceil(max_x))
    max_y = int(math.ceil(max_y))
    width = int(max_x - offset_x) + 1
    height = int(max_y - offset_y) + 1

    print width, height

    import scipy.misc
    import scipy.ndimage
    import numpy as np
    from skimage.draw import line_aa
    img = np.zeros((height, width), dtype=np.uint8)
    for i in range(1, len(building)):
        point1 = building[i-1]
        point2 = building[i]

        print "--"
        print point1[1] - offset_y
        print point1[0] - offset_x
        print point2[1] - offset_y
        print point2[0] - offset_x
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
    printMatrix(matrix)
    return [matrix, offset_x, offset_y, 6]

def printMatrix(matrix):
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
            print "send chunk of", len(data)
            r = session.post("http://localhost:8002/api/blocks", json=data, headers={'Connection':'close'})
            assert r.status_code == 200
            assert json.loads(r.text)["ok"]
            data = []
    
with open('building.osm', 'rt') as f:
    tree = ElementTree.parse(f)

    buildings = extractBuildings(tree)
    trans = createTranslation(tree, buildings)
    translateBuildings(buildings, trans)
    for i in range(len(buildings)):
        data = createMatrix(buildings[i])
        blocks = createBlocks(data)
        sendBlocks(blocks)

        if i > 1000:
            die()

