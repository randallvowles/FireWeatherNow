# encoding: utf-8
"""Parse crap from active fires kml"""
# TODO error try/catch, add epoch date to save


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
        """Pulls out metadata from description text"""
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
        metadata = {agency[0]: agency[1], unit_id[0]: unit_id[1],
                    fire_code[0]: fire_code[1], fire_name[0]: fire_name[1],
                    acres[0]: acres[1], start_date[0]: start_date[1],
                    unique_id[0]: unique_id[1]}
        return metadata

    def parser(self, response):
        """Active fires KML parser"""
        import xmltodict
        # Initiate the parser's working vars
        this = xmltodict.parse(response, encoding='UTF-8')
        # this = xmltodict.parse(self.get_kml(self.args['source']))
        that = {}
        tmp = dict()
        nkeys = len(this['kml']['Document']['Placemark'])
        for x in range(nkeys):
            if this['kml']['Document']['Placemark'][x]['name'] not in that and \
                    'Point' in this['kml']['Document']['Placemark'][x]:
            # if this['kml']['Document']['Placemark'][x]['name'] not in that :
                tmp['name'] = this['kml']['Document']['Placemark'][x]['name']
                tmp['lon'] = this['kml']['Document']['Placemark'][x]['LookAt']['longitude']
                tmp['lat'] = this['kml']['Document']['Placemark'][x]['LookAt']['latitude']
                tmp['desc'] = self.desc_regexr(this['kml']['Document']['Placemark'][x]['description'])
                # Append to big-o-array
                that[this['kml']['Document']['Placemark'][x]['name'].split(" ")[0]] = tmp
                # print(that)
            else :
            # elif this['kml']['Document']['Placemark'][x]['name'] in that :
                if 'Polygon' in this['kml']['Document']['Placemark'][x] :
                    n_polygon_elements = len(this['kml']['Document']['Placemark'][x]['Polygon'])
                    _coords = [this['kml']['Document']['Placemark'][x][
                                   'Polygon']['outerBoundaryIs']['LinearRing']['coordinates'].split('\n')]
                    tmp['n_polygon_elements'] = n_polygon_elements
                    for j in range(len(_coords)):
                        n_total_poly_points = []
                        n_total_poly_points.append(len(_coords[j]))
                    tmp['polygon'] = []
                    for y in range(n_polygon_elements):
                        _junk = _coords[y].split(',')
                        tmp['polygon'].append({"lon": float(_junk[0]), "lat": float(_junk[1])})
                        # Append to big-o-array
                    that[this['kml']['Document']['Placemark'][x]['name'].split(" ")[0]] = tmp
                elif 'Polygon' in this['kml']['Document']['Placemark'][x]['MultiGeometry'] :
                    n_polygons = len(this['kml']['Document']['Placemark'][x]['MultiGeometry'])
                    for i in range(n_polygons):
                        _coords = []
                        _coords.append([this['kml']['Document']['Placemark'][x]['MultiGeometry']['Polygon'][i]['outerBoundaryIs']['LinearRing']['coordinates'].split('\n')])
                        tmp['n_polygons'] = n_polygons
                    tmp['n_polygons'] = n_polygons
                    for j in range(len(_coords)):
                        n_total_poly_points = []
                        n_total_poly_points.append(len(_coords[j]))
                    tmp['polygon'] = []

                    print(_coords)
                    _junk = ()
                    new_coords = (line.split(',') for line in _coords)
                    newcoordsies = ((type[1], type[2]) for type in new_coords)
                    for x, y in newcoordsies:
                        _junk.append(x,y)
                    tmp['polygon'].append({"lon": float(_junk[0]), "lat": float(_junk[1])})
                    # Append to big-o-array
                    that[this['kml']['Document']['Placemark'][x]['name'].split(" ")[0]] = tmp
                else :
                    print('Error in '+str(x)+' key, '+ str(this['kml']['Document']['Placemark'][x]['name']))
                    # print(" ")
                    # print('Contents of key: '+str(this['kml']['Document']['Placemark'][x]))

            # n_polygons = len(_coords)
            # tmp['n_polygon_elements'] = n_polygons
            # for j in range(len(_coords)):
            #     n_total_poly_points = []
            #     n_total_poly_points.append(len(_coords[j]))
            # tmp['polygon'] = []
            # for y in range(n_polygons):
            #     _junk = _coords[y].split(',')
            #     tmp['polygon'].append({"lon": float(_junk[0]), "lat": float(_junk[1])})
            #     # Append to big-o-array
            #     that[this['kml']['Document']['Placemark'][x]['name'].split(" ")[0]] = tmp
            #     # else:
            #     #     print('Danger! Danger! Something went wrong!')
            #     #     continue
            tmp = dict()
        # print(that)
        return that

    # def emitter(self, dict_):
    def emitter(self, dict_, filename, timestamp):
        """Emit the file"""
        import json
        import time
        # Temp vars, delete soon
        # timestamp = True
        # filename = 'ActiveFires'
        if timestamp is True:
            timestamp = time.strftime('%Y%m%d%H%M', time.gmtime())
        else:
            timestamp = ''
        # !! This is where problems can occur.  This should be surfaced as an option.
        filename1 = str(timestamp) + str(filename) + '.json'
        output_dir = 'C:\\FireWeatherNow\\storage\\fire_data\\'
        # output_dir = '../storage/fire_data/'
        file_out = output_dir + filename1
        with open(file_out, 'w') as file_out:
            json.dump(dict_, file_out, sort_keys=True, indent=4)
