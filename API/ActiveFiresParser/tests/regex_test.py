import re


string = "<a href='http://www.geomac.gov' target='_blank'><img src='http://wildfire.cr.usgs.gov/geomac/images/geomac_logo_redo.png' width='144' height='42' /></a><br />\n             <b>Fire Information - <a href='http://www.geomac.gov/viewer/viewer.htm?yesAlaska=t&box=557929.874152025:1280670.91538977:597929.874152025:1320670.91538977' target = '_blank'>Steamboat Creek 7/25/2016 12:00:00 PM</a></b><br />\n             Agency: DVF<br />\n             Unit Identifer: AKCRS<br />\n             Fire Code: KF4K<br />\n             Fire Name: Steamboat Creek<br />\n             Complex Name:  <br />\n            Acres: 19719.03<br />\n             Perimeter Date: 7/25/2016 12:00:00 PM<br />\n             Unique Fire Identifier: 2016-AKCRS-614521<br />\n             Comments: Pulled from Alaska REST Service<br />\n             <a href='http://www.nifc.gov/fireInfo/fireinfo_nfn.html' target='_blank'>National Fire News</a><br />\n             <a href='http://www.geomac.gov/' target='_blank'>Geomac Wildland Fire Support</a><br />\n             <a href='http://inciweb.nwcg.gov/incident/4867' target='_blank'>Inciweb</a>"

# Remove spaces
remove_spaces = re.sub(r'\n\s+', "", string)
#print remove_spaces

remove_hrefs = re.sub(r'<a href(.*?)<\/a>', "", remove_spaces)
#print remove_hrefs

junk = re.sub(r'<br \/>', r'\n', remove_hrefs)
junk = re.sub(r'<b>(.*?)</b>', "", junk)
junk = re.sub(r'\n', ",", junk)
print junk

