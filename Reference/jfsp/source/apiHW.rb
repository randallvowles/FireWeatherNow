#!/usr/bin/ruby
#Require these two libraries
require "net/http"
require "uri"
#To easily convert the returned JSON string to a Ruby hash
#also require "rubygems" and "json"

#Specify request parameters
stid = "WBB"
latestobs = "1"
token = "YourToken"

#Construct the query string
apiString = "stid="+stid+"&latest_obs="+latestobs+"&token="+token

#Parse the API URL and get the body of the response (the JSON)
uri = URI.parse("http://api.mesowest.net/stations?"+apiString)
response = Net::HTTP.get_response(uri)
dataString = response.body #JSON comes in as a string
#data = JSON.parse(dataString) Converts JSON string to a Ruby hash
#Do stuff with the data!