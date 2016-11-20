#!/uufs/chpc.utah.edu/common/home/u0540701/MyVenv/bin/python
# encoding: utf-8
"""Provides the `Active Fires` API"""


api_token = 'c5213a1102b8422c80378944e1246d10' # replace with config.parser
base_url = 'http://api.mesowest.net/v2/stations/latest?'
params = {'network': '1,2', 'complete': '1', 'status': 'active',
          'token': api_token, 'recent': '720'}

def haversine(lon1, lat1, lon2, lat2):
    from math import radians, cos, sin, asin, sqrt, atan2, degrees
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    http://stackoverflow.com/questions/4913349/haversine-formula-in-python-bearing-and-distance-between-two-gps-points
    """
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * asin(sqrt(a))
    r = 3959  # Radius of earth in miles. Use 6371 for kilometers
    distance = c * r
    bearing = atan2(sin(lon2 - lon1) * cos(lat2), cos(lat1) *
                    sin(lat2) - sin(lat1) * cos(lat2) * cos(lon2 - lon1))
    bearing = degrees(bearing)
    bearing = (bearing + 360) % 360
    if distance is None or bearing is None:
        print('Error calculating with lat/lon '+str(lat1)+','+str(lon1)+','+str(lat2)+','+str(lon2))
    else:
        return distance, bearing


# def polygonArea(firedict):
#     """ """
#     import numpy as np
#     # args = {}
#     # AF = ActiveFires.ActiveFires(args)
#     # firedict = AF.parser(AF.get_kml(""))
#     nfiredict = firedict
#     for i in firedict:
#         firedict[i]['polygon']['polygon_area'] = []
#         x = []
#         y = []
#         for j in firedict[i]['polygon']:
#             x.append(firedict[i]['lat'][j])
#             y.append(firedict[i]['lon'][j])
#         firedict[i]['polygon']['polygon_area'].append(0.5*np.abs(np.dot(x, np.roll(y, 1))-np.dot(y, np.roll(x, 1))))
#         print firedict[i]['polygon']['polygon_area']


# def update_fires():
#     """Grabs and parses the latest KML file, emits a json dict"""
#     # args = {
#     #     "source": "..\static_data\ActiveFirePerimeters.kml",
#     #     "output_file": "current.json",
#     #     "output_dir": "..\output\\"
#     # }
#     args = {}
#     AF = ActiveFires.ActiveFires(args)
#     # AF.emitter(AF.parser(AF.get_kml("")))
#     AF.emitter(AF.parser(AF.get_kml("")), '_ActiveFiresDict', True)


def nearest_peri_point (dict_, lat, lon):
    """Calculates shortest distance from station to perimeter"""
    import sys
    poly_dict = dict_
    st_lat = float(lat)
    st_lon = float(lon)
    DFPa = []
    for i in range(len(poly_dict)):
        try:
            plat = float(poly_dict[i]['lat'])
            plon = float(poly_dict[i]['lon'])
            DFP = haversine(st_lon, st_lat, plon, plat)
            if i == 0:
                DFPa = DFP
            else:
                if DFP[0] < DFPa[0]:
                    DFPa = DFP
        except(TypeError):
            for j in range(len(poly_dict[i])):
                plat = float(poly_dict[i][j]['lat'])
                plon = float(poly_dict[i][j]['lon'])
                DFP = haversine(st_lon, st_lat, plon, plat)
                if i == 0:
                    DFPa = DFP
                else:
                    if DFP[0] < DFPa[0]:
                        DFPa = DFP
    return DFPa


def stationquery():
    """Queries for nearest stations for each polygon element"""
    import urllib
    import json
    args = {}
    AF = ActiveFires.ActiveFires(args)
    firedict = AF.parser(AF.get_kml(""))
    for i in firedict:
        firedict[i]['nearest_stations'] = []
        lat = firedict[i]['lat']
        lon = firedict[i]['lon']
        query = urllib.urlopen(base_url+urllib.urlencode(params)+
                               '&radius='+(lat)+','+(lon)+',200').read()
        response = json.loads(query)
        for j in range(len(response["STATION"])):
            stid = response["STATION"][j]["STID"]
            slat = response["STATION"][j]["LATITUDE"]
            slon = response["STATION"][j]["LONGITUDE"]
            distance = str(response["STATION"][j]["DISTANCE"])
            name = response["STATION"][j]["NAME"]
            DFP = nearest_peri_point(firedict[i]['polygon'], slat, slon)
            nearest_stations = {'STID': stid, 'LAT': slat, 'LON': slon,
                                'DFO': distance, 'NAME': name, 'DFP': DFP}
            firedict[i]['nearest_stations'].append(nearest_stations)
        firedict[i]['n_nearest_stations'].append(str(len(response["STATION"])))
    AF.emitter(firedict, 'AF_NS_current', False)
    AF.emitter(firedict, 'AF_NS', True)
    return firedict



if __name__ == '__main__':
    if __package__ is None:
        import sys
        from os import path
        sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))
        from src import ActiveFires as ActiveFires
    else:
        from src import ActiveFires as ActiveFires


# Init.
# update_fires()
stationquery()
# polygonArea(stationquery())
# put the code here to get the stations and serve the info back to the user.
# look at `Tornado` to do this.  It's the defacto standard.
