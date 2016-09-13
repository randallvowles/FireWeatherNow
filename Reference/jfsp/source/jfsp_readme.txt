###############
Readme for the JFSP Spot Forecast Verification Project
Written by Matt Lammers
matt.lammers@utah.edu
12 March 2015
###############

	So, you're interested in understanding how the code for the verification works. Well, it's essentially all in one file
which is called 'spots_processing_daily.py' (currently found in /horel-local/oper/jfsp). This document outlines how the code
operates, what it takes in, what it outputs, etc.

	Firstly, the code requires a few Python modules that you hopefully (likely) have: cPickle, matplotlib, and shapefile. Okay, 
so unless you're on meso1, you probably don't have shapefile. It took me a whole day to install because it requires GDAL as
one of its dependencies, which is also conveniently not really installed on any of the systems. Fortunately, the code that
is dependent upon shapefile is just a little bit of QC that tests whether a spot forecast is actually within the boundaries of
the CWA issuing it. You can get rid of it, and things will run just fine.

	So once all of that is done, you'll need (or need access to) a few other files. These include the cPickle containing the
shapefile data (w_01ap14.pkl) and the cPickles containing the RTMA/NDFD lat/lon grids (rtmahres_lats.pkl and rtmahres_lons.pkl).
So now that you have these things, you can run the code...erm...well...assuming you're connected to the CHPC filesystem. Otherwise
it will break because the directories to which you will be writing to/reading from will not exist. Luckily, these are not hardcoded
necessarily. If you modify the variable 'enddir', that will write everything to a different place.

	Okay, so now that we think that you can run the code, we should figure out what everything does in here. This was a somewhat
organically-created codebase, so there are the occasional inefficiencies and what not contained within. It starts off with all of
the important function definitions. These include the following:
	
	inCWA: does the QC to determine whether a spot forecast location is
	toC: pretty obvious, converts a number from Fahrenheit to Celsius
	dp2rh: given dewpoint and temperature, returns relative humidity values
	distance: python implementation of the Haversine Formula to compute distance from one latitude/longitude to another, returns
		the distance in kilometers
	minimize: finds the nearest gridpoint to the spot forecast latitude/longitude
	getPointData: gets the interpolated value given a point, a bunch of gridded data and its latitude/longitude definitions. By
		default it does a bilinear interpolation, but that can be adjusted by changing "intorder" as an input.
	knot2mps: easy conversion function from knots to meters-per-second
	mph2mps: converts from miles-per-hour to meters-per-second
	variability: not directly used in the current code iteration, this computes the mean and standard deviation from all grid points
		within some number of grid points from a latitude/longitude set of coordinates
		
	After the functions comes the actual scripting - starting with acquiring the raw files from the FTP server. These files are
stored in YYYYMMDD directories. Then the requests are processed, as relevant values are pulled from each request form and stored
in a YYYYMMDD.txt file. There's a complex system of logic that powers the text parser, only grabbing relevant values from the
request form, as well as converting the 'Weather Parameters' fields into binary integers (1,1,1, for example, gets stored as 7).
Each line in the YYYYMMDD.txt file contains 20-something comma separated values teased out of the request form.

	Once that file is created from the requests, the actual verification of the forecasts themselves can begin. Wildfires and 
Prescribed burns are done separately. The YYYYMMDD.txt file is read through, and certain variables are tested, such as 
Temperature and Relative Humidity forecast period requested and anticipated burn time. If the request passes these checks, 
then the forecast itself is opened and parsed for the values to be verified. The extraction process is based on trial-and-error, 
determining which words are important to look for to tease out the numerical values. Things like hyphens denoting ranges 
of values are assessed in this section, as well as certain validity checks on the extracted values.
	
	After the variable strings are extracted, they are stored in the central dictionary for the verification, called "approved". 
The next code block loops through "approved" and creates numerical values from the strings to use for verification. This includes
averaging strings representing ranges, pulling max/min values from strings representing time series, and throwing out strings
from which numbers cannot be extracted.

	In the next section, the code hooks into the MesoWest internal database to discover the four nearest stations to the latitude/
longitude taken from the request form. If you are not on Utah CHPC hardware and running this code...props for this research actually
getting used somewhere other than just in MesoWest space...sweet. You will need at least the metadata for stations to complete this
section of code. The four nearest stations are ascertained (currently only stations within the NWS/FAA and RAWS networks are 
permitted in this assessment), and any stations outside of the 333 vertical meter range are excluded.

	Now we move on to getting the surface observation values for comparison with the spot forecast values. We do this by querying
the database (or if not on CHPC hardware, perhaps use the MesoWest API...assuming it still exists when you are reading this) for
all of the values for the relevant variables between 15Z and 00Z on the relevant day. The maximum wind speed and temperature
values are stored, as well as the minimum relative humidity. If the query fails or there are no stations with reasonable
values remaining, the spot forecast is not verified.

	Next is the gridded stuff - first the lat/lon grids are pulled in from their respective cPickle files. Then the relevant NDFD
9Z grids are looped through and values are extracted. This is one place where the code could be made more efficient, as the grids
are opened 27 times for each spot forecast (to get each variable for each forecast period). These individual values are stored in
arrays, then the max/min value is taken from them to compare with the observations. The time of the max/min values are also
stored in the dictionary. Then the RTMA grids from each hour are opened for each variable and the same process occurs.

	The next chunk of code is used to compute a bunch of statistics on that given day, then things are calculated like Median
Absolute Error for NDFD forecasts relative to observations for Maximum Temperature. These are printed out, along with some joint
marginal distributions of errors between the NDFD and spot forecasts. All of these values get printed out and stored in a file
called YYYYMMDD_stats.txt. 

	The last thing the primary loop does is output the "approved" dictionary to a pickle called datapickle_PRESCRIBED.pkl or
datapickle_WILDFIRE.pkl. These files are then read in the next loop to create the daily_spots.csv and daily_spots_WF.csv
files. These are the files read by the jfsp website to populate the crossfilters/map. There is some logic here to handle
cases where an entry in approved is missing certain fields so that the code doesn't break (that's really why most of this
is in here...the script is designed to not fail on anything, and so far it has been working just fine, albeit occasionally
skipping forecasts unnecessarily).

	There is one final loop that looks at the daily_spots.csv files and finds the relevant lines for forecasts to insert into
the forecast office and regional spots archives, also for the website. Here you will also need to modify the "startdir"
variable if you are in a different environment than CHPC space.

	So that's it...there is a lot more nuance in the code itself, some of which is more like patchwork fixes for potential
issues, while others are there because it's the only way it will work. The website code will work just fine and requires
no maintenance as far as I can think of. Just keep deleting files off the ftp server every month-ish so that it doesn't fill
up, and everything should run just fine.