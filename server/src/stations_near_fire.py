#/usr/bin/python3
from time import sleep
import feedparser
import requests
import gmplot
error_log = open('./fire_error_log.txt', 'a')
baseURL = 'http://api.mesowest.net/v2/stations/'
token = '&token=c5213a1102b8422c80378944e1246d10'
parameters = '&qc=all&complete=1&network=1,2&status=active&recent=720'
inciweb_url = 'http://inciweb.nwcg.gov/feeds/rss/incidents/'
inciweb = feedparser.parse(inciweb_url)
fire_lat = []
fire_lon = []
fire_title = []
fire_dict = {}
for j in range(len(inciweb['entries'])):
    try:
        fire_lat.append(float(inciweb['entries'][j]['geo_lat']))
        fire_lon.append(float(inciweb['entries'][j]['geo_long']))
        fire_title.append(inciweb['entries'][j]['title'])
    except (ValueError):
        error_log.write(str([j]) + ' Bad coordinates for ' +
                        inciweb['entries'][j]['link']+'\n')
for q in range(len(fire_title)):
    fire_dict[q] = []
    fire_dict[q].append(fire_title[q])
    fire_dict[q].append(fire_lat[q])
    fire_dict[q].append(fire_lon[q])
nearest_stids = []
for k in range(len(fire_lat)):
    r = requests.get(baseURL+'metadata?'+token+parameters +
                     '&radius=' + str(fire_lat[k]) + ',' +
                     str(fire_lon[k])+',50')
    nearest_stids.append(r.json())
all_stations = []
stid_dict = {}
for l in range(len(nearest_stids)):
    all_stations = nearest_stids[l]['STATION']
    stid_dict[fire_title[l]] = []
    for m in range(len(all_stations)):
        stid_dict[fire_title[l]].append(all_stations[m]['STID'])
        #stid_dict[fire_title[l](m)].append(all_stations[m]['LATITUDE'])
        #stid_dict[fire_title[l](m)].append(all_stations[m]['LONGITUDE'])
filename = 'stations_near_fires.txt'
filename2 = 'fire_locations.txt'
f = open(filename, 'w')
f2 = open(filename2, 'w')
f.write(str(stid_dict))
f2.write(str(fire_dict))
f.close
f2.close
print(stid_dict['Pioneer Fire (Wildfire)'])

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
