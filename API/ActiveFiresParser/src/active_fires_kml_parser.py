# encoding: utf-8
"""Parse crap from active files kml"""


class ActiveFiresKML:

    def __init__(self, args):
        self.args = args

    def get_kml(self, file_):
        # Need to add the URLLIB stuff to get the KML file and return a string.
        return open(file_, 'r').read()

    def parser(self):
        """
        Active fires KML parser

        Args: (as dict)
            source, source path of KML file
            output_file, emitter path

        """
        import xmltodict

        # Initiate the parser's working vars
        this = xmltodict.parse(self.get_kml(self.args['source']))
        that = dict()
        tmp = dict()

        first_pass = True
        nkeys = len(this['kml']['Document']['Placemark'])
        for x in xrange(nkeys):
            if first_pass is True:
                tmp['name'] = this['kml']['Document']['Placemark'][x]['name']
                tmp['desc'] = this['kml']['Document'][
                    'Placemark'][x]['description']
                tmp['lon'] = this['kml']['Document'][
                    'Placemark'][x]['LookAt']['longitude']
                tmp['lat'] = this['kml']['Document'][
                    'Placemark'][x]['LookAt']['latitude']
                first_pass = False

            else:
                _coords = this['kml']['Document']['Placemark'][1]['Polygon'][
                    'outerBoundaryIs']['LinearRing'][
                    'coordinates'].split('\n')

                npoly_els = len(_coords)
                tmp['n_polygon_elements'] = npoly_els
                tmp['polygon'] = []
                for y in xrange(npoly_els):
                    _junk = _coords[y].split(',')
                    tmp['polygon'].append({
                        "lon": float(_junk[0]),
                        "lat": float(_junk[1])
                    })
                first_pass = True

                that[this['kml']['Document']['Placemark'][x]['name'].split(" ")[
                    0]] = tmp
                tmp = dict()

        return that

    def emitter(self, dict_):
        """Emit the file"""
        import json

        file_out = self.args['output_dir'] + self.args['output_file']
        with open(file_out, 'w') as file_out:
            json.dump(dict_, file_out, sort_keys=True, indent=4)
            #json.dump(dict_, file_out)


# def main():
#     """Main handler"""

#     args = {
#         "source": "./static_data/ActiveFirePerimeters.kml",
#         "output_dir": "./output/",
#         "output_file": "current.json"
#     }
#     AF = ActiveFiresKML(args)
#     AF.emitter(AF.parser())


# if __name__ == "__main__":
#     main()
