
import urllib
import json
# import gmplot
error_log = open('./fire_error_log.txt', 'a')
baseURL = 'http://api.mesowest.net/v2/stations/latest?'
API_params = {'token': 'c5213a1102b8422c80378944e1246d10', 'qc': 'all',
           'complete': '1', 'network': '1,2', 'status': 'active',
           'recent': '360'}
# inciweb_url = 'http://inciweb.nwcg.gov/feeds/rss/incidents/'
# inciweb = feedparser.parse(inciweb_url)
fire_lat = []
fire_lon = []
file_in = 'C:\\FireWeatherNow\\storage\\fire_data\\active_fires.json'
with open(file_in, 'r') as file1:
    json.load(file1)
print(file1)


nearest_stids = []
for k in range(len(fire_lat)): #put polygon path here
    r = urllib.get(baseURL+API_params + '&radius=' + str(fire_lat[k]) + ',' +
                   str(fire_lon[k])+',50')
    nearest_stids.append(r.json())
all_stations = []
stid_dict = {}
for l in range(len(nearest_stids)):
    all_stations = nearest_stids[l]['STATION']
    stid_dict[fire_title[l]] = []
    for m in range(len(all_stations)):
        stid_dict[fire_title[l]].append(all_stations[m]['STID'])



'''
# API query gets latest 12 hours of data from RAWS and AWOS/ASOS/FAA stations
API_request = requests.get(baseURL + 'timeseries?' + token + parameters)
API_data = API_request.json()
API_url = API_request.url
station_lat = []
station_lon = []

# plotting stations and active fires
for i in range(len(API_data['STATION'])):
   try:
       station_lat.append(float(API_data['STATION'][i]['LATITUDE']))
       station_lon.append(float(API_data['STATION'][i]['LONGITUDE']))
   except:
       print('STATION '+API_data['STATION'][i]['STID']+' has bad location')
       print(API_data['STATION'][i]['LATITUDE'])
       print(API_data['STATION'][i]['LONGITUDE'])
gmap = gmplot.GoogleMapPlotter(48, -98, 4)
gmap.scatter(fire_lat, fire_lon, 'r', marker=False, size=25000)
gmap.scatter(station_lat, station_lon, 'b', marker=False, size=7000)
gmap.draw("my-firemap.html")
'''
