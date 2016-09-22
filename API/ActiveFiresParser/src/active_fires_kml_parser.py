# encoding: utf-8
"""Parse crap from active fires kml"""
#TODO error try/catch, add epoch date to save

class ActiveFiresKML:

    def __init__(self, args):
        self.args = args

    def get_kml(self, file_):
        import urllib
        kml_url = 'http://rmgsc.cr.usgs.gov/outgoing/GeoMAC/ActiveFirePerimeters.kml'
        self.file = urllib.urlopen(kml_url)
        # Need to add the URLLIB stuff to get the KML file and return a string.
        return str((self.file).read())
        
    def desc_regexr(self, string):
        import re
        # Remove spaces
        remove_spaces = re.sub(r'\n\s+', "", string)
        #print remove_spaces
        remove_hrefs = re.sub(r'<a href(.*?)<\/a>', "", remove_spaces)
        #print remove_hrefs
        junk = re.sub(r'<br \/>', r'\n', remove_hrefs)
        junk = re.sub(r'<b>(.*?)</b>', "", junk)
        junk = re.sub(r'\n', ",", junk)
        # pull out the relevent metadata
        agency = (re.search(r'Agency(.*?)(\w+)', junk).group(0)).split(': ')
        unit_id = (re.search(r'Unit Identifer(.*?)(\w+)', junk).group(0)).split(': ')
        fire_code = (re.search(r'Fire Code:(.*?)(\w+)', junk).group(0)).split(': ')
        fire_name = (re.search(r'Fire Name(.*?)(\w+\s\w+)', junk).group(0)).split(': ')
        acres = (re.search(r'Acres(.*?)(\d+)', junk).group(0)).split(': ')
        start_date = (re.search(r'Perimeter Date(.*?)(\d+\/\d+\/\d+)', junk).group(0)).split(': ')
        unique_id = (re.search(r'Unique(.*?)(\d+)(-\w+)(-\d+)', junk).group(0)).split(': ')
        metadata = {agency[0]:agency[1], unit_id[0]:unit_id[1], 
                    fire_code[0]:fire_code[1], fire_name[0]:fire_name[1],
                    acres[0]:acres[1], start_date[0]:start_date[1], 
                    unique_id[0]:unique_id[1]}
        return metadata



    def parser(self):
        """
        Active fires KML parser

        Args: (as dict)
            source, source path of KML file
            output_file, emitter path

        """
        import xmltodict

        # Initiate the parser's working vars
        this = xmltodict.parse(self.get_kml)
        that = dict()
        #this = xmltodict.parse(self.get_kml(self.args['source']))
        that = dict()
        tmp = dict()

        first_pass = True
        nkeys = len(this['kml']['Document']['Placemark'])
        for x in range(nkeys):
            if first_pass is True:
                tmp['name'] = this['kml']['Document']['Placemark'][x]['name']
                tmp['desc'] = self.desc_regexr(this['kml']['Document'][
                    'Placemark'][x]['description'])
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
                for y in range(npoly_els):
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
        import time
        current_time = time.strftime('%Y, %m, %d, %H, %M', time.gmtime())
        output_file = 'current' + current_time + '.json',
        output_dir = '..\output\\'
        file_out = output_dir + output_file
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
