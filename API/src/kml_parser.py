import xml.sax
import xml.sax.handler
import requests
import json
import gmplot
import csv


def build_table(mapping):
    sep = ','
    output = 'Name' + sep + 'Coordinates\n'
    points = ''
    lines = ''
    shapes = ''
    for key in mapping:
        #print(mapping[key])
        coord_str = mapping[key]['coordinates'] + sep
        if 'LookAt' in mapping[key]:  # points
           points += key + sep + coord_str + "\n"
        elif 'LineString' in mapping[key]:  # lines
            lines += key + sep + coord_str + "\n"
        else:  # shapes
            shapes += key + sep + coord_str + "\n"
    output += points + lines + shapes
    return output
    #return mapping


class PlacemarkHandler(xml.sax.handler.ContentHandler):
    def __init__(self):
        self.inName = False  # handle XML parser events
        self.inPlacemark = False
        self.mapping = {}
        self.buffer = ""
        self.name_tag = ""

    def startElement(self, name, attributes):
        if name == "Placemark":  # on start Placemark tag
            self.inPlacemark = True
            self.buffer = ""
        if self.inPlacemark:
            if name == "name":  # on start title tag
                self.inName = True  # save name text to follow

    def characters(self, data):
        if self.inPlacemark:  # on text within tag
            self.buffer += data  # save text if in title

    def endElement(self, name):
        self.buffer = self.buffer.strip('\n\t')
        if name == "Placemark":
            self.inPlacemark = False
            self.name_tag = ""  # clear current name
        elif name == "name" and self.inPlacemark:
            self.inName = False  # on end title tag
            self.name_tag = self.buffer.strip()
            self.mapping[self.name_tag] = {}

        elif self.inPlacemark:
            if name in self.mapping[self.name_tag]:
                self.mapping[self.name_tag][name] += self.buffer
            else:
                self.mapping[self.name_tag][name] = self.buffer
        self.buffer = ""


if __name__ == '__main__':
    FPurl = 'http://rmgsc.cr.usgs.gov/outgoing/GeoMAC/ActiveFirePerimeters.kml'
    r = (requests.get(FPurl, stream=True))
    #file  = r.write(filename, 'w')
    filename = 'ActiveFirePerimeters.kml'
    kml = r.raw
    parser = xml.sax.make_parser()
    handler = PlacemarkHandler()
    parser.setContentHandler(handler)
    parser.parse(kml)
    kml.close()
    outstr = build_table(handler.mapping)
    out_filename = filename[:-3] + "csv"
    #f = open(out_filename, "w")
    with open(out_filename, 'w') as f:
        json.dump(outstr, f)
with open('ActiveFirePerimeters.csv', 'rb') as f:
    reader = csv.reader(f)
    #AFPlist = array(reader)

print(reader)
#gmap = gmplot.GoogleMapPlotter(48, -98, 4)
#gmap.polygon(outstr)
#gmap.draw("my-fireperimetermap.html")


