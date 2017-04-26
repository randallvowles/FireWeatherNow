# encoding: utf-8
"""Parse crap from active fires kml"""


class ActiveFires:
##
# Args:
# Returns:
##
    def __init__(self, args):
        self.args = args

    def get_kml(self, url):
        """Gets kml object online"""
        import urllib
        url = 'http://rmgsc.cr.usgs.gov/outgoing/GeoMAC/ActiveFirePerimeters.kml'
        # url = 'http://rmgsc.cr.usgs.gov/outgoing/GeoMAC/current_year_fire_data/KMLS/TNGSP-016062%20CHIMNEY%20TOPS%202%2011-29-2016%201940.kml'
        # url = 'https://rmgsc.cr.usgs.gov/outgoing/GeoMAC/2016_fire_data/KMLS/TNGSP-016062%20CHIMNEY%20TOPS%202%2011-29-2016%201940.kml'
        # url = 'https://rmgsc.cr.usgs.gov/outgoing/GeoMAC/2016_fire_data/KMLS/TNGSP-016062%20CHIMNEY%20TOPS%202%2012-13-2016%200000.kml'
        response = urllib.urlopen(url).read()
        return response

    def desc_regexr(self, string):
        """Pulls out metadata from description text with regex"""
        import re
        remove_spaces = re.sub(r'\n\s+', "", string)
        remove_hrefs = re.sub(r'<a href(.*?)<\/a>', "", remove_spaces)
        junk = re.sub(r'<br \/>', r'\n', remove_hrefs)
        junk = re.sub(r'<b>(.*?)</b>', "", junk)
        junk = re.sub(r'\n', ",", junk)
        agency = (re.search(r'Agency(.*?)(\w+)', junk).group(0)).split(': ')
        unit_id = (re.search(r'Unit Identifer(.*?)(\w+)',
                             junk).group(0)).split(': ')
        fire_code = (re.search(r'Fire Code:(.*?)(\w+)',
                               junk).group(0)).split(': ')
        fire_name = (re.search(r'Fire Name(.*?)(\w+)(?=,)',
                               junk).group(0)).split(': ')
        acres = (re.search(r'Acres(.*?)(\d+)', junk).group(0)).split(': ')
        start_date = (re.search(r'Perimeter Date(.*?)(\d+\/\d+\/\d+)',
                                junk).group(0)).split(': ')
        unique_id = (re.search(r'Unique(.*?)(\d+)(-\w+)(-\d+)',
                               junk).group(0)).split(': ')
        # Package this all back up.
        metadata = {agency[0]: agency[1], unit_id[0]: unit_id[1],
                    fire_code[0]: fire_code[1], fire_name[0]: fire_name[1],
                    acres[0]: acres[1], start_date[0]: start_date[1],
                    unique_id[0]: unique_id[1]}
        return metadata

    def parser(self, response):
        """Active fires KML parser"""
        import server.src.xmltodict as xmltodict
        # Initiate the parser's working vars

        this = xmltodict.parse(response, encoding='UTF-8')
        that = {}
        tmp = dict()
        nkeys = len(this['kml']['Document']['Placemark'])
        for x in xrange(nkeys):
            if this['kml']['Document']['Placemark'][x]['name'] not in that and\
                    'Point' in this['kml']['Document']['Placemark'][x]:
                tmp['name'] = this['kml']['Document']['Placemark'][x]['name']
                tmp['lon'] = this['kml']['Document']['Placemark'][x][
                    'LookAt']['longitude']
                tmp['lat'] = this['kml']['Document']['Placemark'][x][
                    'LookAt']['latitude']
                tmp['desc'] = self.desc_regexr(this['kml']['Document'][
                    'Placemark'][x]['description'])
                tmp['n_nearest_stations'] = []
            else:
                poly_keys = []
                if 'Polygon' in this['kml']['Document']['Placemark'][x]:
                    _coord = ((this['kml']['Document']['Placemark'][x][
                        'Polygon']['outerBoundaryIs'][
                            'LinearRing']['coordinates']).split('\n'))
                    _coords = [i.split(',') for i in _coord]
                    n_polygon_elements = len(_coords)
                    tmp['n_polygon_elements'] = str(n_polygon_elements)
                    tmp['polygon'] = []
                    for j in xrange(len(_coords)):
                        _junk = (_coords[j])
                        poly_keys = ({'lat': (str(_junk[1])).strip(),
                                      'lon': (str(_junk[0])).strip()})
                        tmp['polygon'].append(poly_keys)
                    that[this['kml']['Document']['Placemark'][x][
                        'name'].split(" ")[0]] = tmp
                    tmp = dict()
                elif 'Polygon' in this['kml']['Document']['Placemark'][x]['MultiGeometry']:
                    n_polygons = len(this['kml']['Document']['Placemark'][x][
                        'MultiGeometry']['Polygon'])
                    tmp['n_polygons'] = n_polygons
                    for i in xrange(n_polygons):
                        _coord = (this['kml']['Document']['Placemark'][x][
                            'MultiGeometry']['Polygon'][i][
                                'outerBoundaryIs']['LinearRing'][
                                    'coordinates']).split('\n')
                        _coords = [k.split(',') for k in _coord]
                        tmp['polygon'] = []
                        for j in xrange(len(_coords)):
                            _junk = (_coords[j])
                            poly_keys.append({'lat': (str(_junk[1])).strip(),
                                              'lon': (str(_junk[0])).strip()})
                            tmp['polygon'].append(poly_keys)
                    that[this['kml']['Document']['Placemark'][x][
                        'name'].split(" ")[0]] = tmp
                    tmp = dict()
                else:
                    print('Error in '+str(x)+' key, ' +
                          str(this['kml']['Document']['Placemark'][x]['name']))
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
        # !! This is where problems can occur.
        # This should be surfaced as an option.
        filename1 = str(timestamp) + str(filename) + '.json'
        # output_dir = 'C:\\FireWeatherNow\\storage\\fire_data\\'
        output_dir = '/uufs/chpc.utah.edu/common/home/u0540701/public_html/storage/fire_data/'
        file_out = output_dir + filename1
        with open(file_out, 'w') as file_out:
            # json.dump(dict_, file_out, sort_keys=True, separators=(',', ':'),
            #           encoding="utf-8")
            json.dump(dict_, file_out, sort_keys=True, indent=4)
# /uufs/chpc.utah.edu/common/home/u0540701/public_html/fireserver
