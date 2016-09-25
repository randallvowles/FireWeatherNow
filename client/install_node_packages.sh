#!/bin/sh
echo "Assuming you have node.js installed ..."

npm install grunt --save-dev
npm install grunt-cli --save-dev
npm install grunt-strip-code --save-dev
npm install grunt-contrib-uglify --save-dev
npm install grunt-contrib-jshint --save-dev
npm install grunt-contrib-clean --save-dev
npm install grunt-import --save-dev
npm install grunt-jsbeautifier --save-dev

grunt
