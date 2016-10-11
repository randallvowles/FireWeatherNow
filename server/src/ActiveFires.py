# encoding: utf-8
"""Parse crap from active fires kml"""
#TODO error try/catch, add epoch date to save

class ActiveFires:

    def __init__(self, args):
        self.args = args

    def get_kml(self, url):
        import urllib
        url = 'http://rmgsc.cr.usgs.gov/outgoing/GeoMAC/ActiveFirePerimeters.kml'
        # response = (urllib.urlparse(kml_url)).read()
        response = urllib.urlopen(url).read()
        return response

    def desc_regexr(self, string):
        import re
        # Remove spaces
        remove_spaces = re.sub(r'\n\s+', "", string)

        link_url = re.search(r'(http://inciweb.nwcg.gov/incident/)(.*?)(\d+)', remove_spaces)
        remove_hrefs = re.sub(r'<a href(.*?)<\/a>', "", remove_spaces)

        junk = re.sub(r'<br \/>', r'\n', remove_hrefs)
        junk = re.sub(r'<b>(.*?)</b>', "", junk)
        junk = re.sub(r'\n', ",", junk)

        # Extract the relevent metadata
        agency = (re.search(r'Agency(.*?)(\w+)', junk).group(0)).split(': ')
        unit_id = (re.search(r'Unit Identifer(.*?)(\w+)', junk).group(0)).split(': ')
        fire_code = (re.search(r'Fire Code:(.*?)(\w+)', junk).group(0)).split(': ')
        fire_name = (re.search(r'Fire Name(.*?)(\w+\s\w+)', junk).group(0)).split(': ')
        acres = (re.search(r'Acres(.*?)(\d+)', junk).group(0)).split(': ')
        start_date = (re.search(r'Perimeter Date(.*?)(\d+\/\d+\/\d+)', junk).group(0)).split(': ')
        unique_id = (re.search(r'Unique(.*?)(\d+)(-\w+)(-\d+)', junk).group(0)).split(': ')


        # Package this all back up.
        # !! Removing the `url_link` for now, due to encoding issues.
        metadata = {agency[0]:agency[1], unit_id[0]:unit_id[1],
                    fire_code[0]:fire_code[1], fire_name[0]:fire_name[1],
                    acres[0]:acres[1], start_date[0]:start_date[1],
                    unique_id[0]:unique_id[1]}

        return metadata

    def parser(self, response):
        """Active fires KML parser"""

        import xmltodict

        # Initiate the parser's working vars
        this = xmltodict.parse(response, encoding='UTF-8')
        that = dict()
        # this = xmltodict.parse(self.get_kml(self.args['source']))
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
                    'outerBoundaryIs']['LinearRing']['coordinates'].split('\n')
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

    def emitter(self, dict_, filename, timestamp):
        """Emit the file"""
        import json
        import time
        if timestamp is True:
            timestamp = time.strftime('%Y%m%d%H%M', time.gmtime())
        else:
            timestamp = ''
        # !! This is where problems can occur.  This should be surfaced as an option.
        filename1 = str(timestamp) + str(filename) + '.json'
        output_dir = '../storage/fire_data/'
        file_out = output_dir +filename1
        with open(file_out, 'w') as file_out:
            json.dump(dict_, file_out, sort_keys=True, indent=4)





