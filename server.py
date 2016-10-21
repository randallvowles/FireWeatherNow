#!/usr/bin/env python

import cgi
import sys
import json

sys.stderr = sys.stdout

# Args and header
args = cgi.FieldStorage()
print "Content-Type: text/plain\n"

ROOT_PATH = "/uufs/chpc.utah.edu/common/home/u0751826/public_html/fireserver/"

# Check to see if the user passed a token
auth_token = args.getvalue('token')
if auth_token is 'null' or auth_token != "abc123":
    print json.dumps({"message": "auth failure", "err_code": -1})
    sys.exit()

# Read in our big o' data file
f = ROOT_PATH + "AF_NS.json"
d = open(f)
AF = json.load(d)
d.close()

# Deal with API args
if "showlist" in args:
    fire_list = []
    for key in AF:
        fire_list.append(json.dumps(key))
    print fire_list

elif "fire" in args:
    fire_id = args.getvalue('fire')
    print json.dumps(AF[fire_id])

else:
    print json.dumps({"message": "no args set", "err_code": -2})

sys.exit()