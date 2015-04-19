'use strict';
//
var webpack = require("webpack");
var fs = require('fs-extra');
var path = require("path");
var notifier = require('node-notifier');
var browserSync = require('browser-sync');
var browserReady = false;
var chokidar = require('chokidar');
//LOGGER
var log = console.log.bind(console);
//HELPER FUNCTIONS
function buildDeploy(){
	if(!browserReady) return;
    browserSync.reload();
}
function getFileName(fPath){
	var choppedUp = fPath.split("/");
	return choppedUp[choppedUp.length - 1];
}
//WATCHERS
var dist = "./app";
var src = "./src";
var watcher = chokidar.watch(src);
watcher
	.on('add', function(file) { log('File ', file, " has been added \n"); })
	.on('error', function(error) { log('Error with the watcher: ', error, '\n'); })
	.on('raw', function(event, wPath, details) {
	  	if (wPath.match(/assets$/)) {
		  	var fName = getFileName(wPath);
			var nPath = dist + "/assets/" + fName;
			path.exists(nPath, function (exists) {
			  	if(exists) return;
		  		fs.copy(wPath, nPath, function(err) {
				  	if (err) return log("Asset Failed to copy: ",err);
				  	log("Asset Coppied: ",fName);
				  	buildDeploy();
				});
			});
		}
		if (wPath.match(/index.html/)) {
			fs.copy(src + "/index.html", dist + "/index.html", function(err) {
			  	log('Copy Index.html');
			  	console.log("ERROR: ",err);
			  	buildDeploy();
			});
		}
 	}
);
//BROWSER SYNC INIT
browserSync({
	notify: true,
	server: { baseDir: dist }
});
browserReady = true;
//WEBPACK COMPILER
var compiler = webpack({
	entry: { 
		app: "./src/js/main",
	},
	node: {
	  	fs: "empty"
	},
    devtool: "source-map",
    output: {
        path: dist + "/js/",
        filename: "main.min.js",
    },
    resolve: {
    	extensions: ['', '.js', '.jsx']
  	},
    module: {
	  	loaders: [ 
	  		{ test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
	  		{ test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader?optional=runtime' },
	  		{ test: /\.scss$/, loaders: [
				    "style/useable",
				    "css-loader",
				    "autoprefixer-loader?browsers=last 2 version",
				    "sass-loader"
			  	]
			},
			{ test: /\.png$/,    loader: "file-loader" },
			{ test: /\.jpg$/,    loader: "file-loader" },
			{ test: /\.woff$/,   loader: "url-loader?prefix=font/&limit=5000" },
			{ test: /\.eot$/,    loader: "file-loader?prefix=font/" },
			{ test: /\.ttf$/,    loader: "file-loader?prefix=font/" },
			{ test: /\.svg$/,    loader: "file-loader?prefix=font/" },
    	]
	}
});
compiler.watch(200, function(err, stats) {
	if(stats.compilation.errors.length > 0) {
		log("Webpack Build Failed: \n",stats.compilation.errors);
		notifier.notify({
		  	title: 'Webpack Build Failed: ', message: stats.compilation.errors.length + " errors", icon: __dirname + '/fail.png',
		}, function (err, response) { });
	} else {
		log("Webpack Build Success");
		notifier.notify({
		  	title:  "WebPack Build Success!!!", message: "No problems", icon: __dirname + '/success.png',
		}, function (err, response) { });
	}
    buildDeploy();
});
