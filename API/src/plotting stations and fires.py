import feedparser
import requests
import gmplot

error_log = open('./fire_error_log.txt', 'a')
inciweb_url = 'http://inciweb.nwcg.gov/feeds/rss/incidents/'
inciweb = feedparser.parse(inciweb_url)
published = inciweb['feed']['published']
for i in range(len(inciweb['entries'])):
    entries = inciweb['entries'][i]
fire_lat = []
fire_lon = []
for j in range(len(inciweb['entries'])):
    try:
        fire_lat.append(float(inciweb['entries'][j]['geo_lat']))
        fire_lon.append(float(inciweb['entries'][j]['geo_long']))
    except (ValueError):
        error_log.write('Bad coordinates for ' + inciweb['entries'][j]['link'])

# entries['title'] = name of fire
# entries['published'] = start of fire
# entries['summary'] = text paragraph description
# entries['geo_lat'] = latitude
# entries['geo_long'] = longitude
# entries['link'] = web link to fire details
# TODO change to metadata query
# API query gets latest 12 hours of data from RAWS and AWOS/ASOS/FAA stations
API_request = requests.get('http://api.mesowest.net/v2/stations/timeseries?' +
                           '&token=c5213a1102b8422c80378944e1246d10&qc=all' +
                           '&complete=1&network=1,2&status=active&recent=720')
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