"use strict";
var fsp = require('path');
var fs = require('fs');

var target = 'lib';
var verbose = true;

require('streamline').register();

var transformJs = require('streamline/lib/transformSync').transformFileSync;

function mkdirp(path) {
	if (fs.existsSync(path)) return;
	console.log("Create dir:",fsp.join(path, '..'));
	mkdirp(fsp.join(path, '..'));
	fs.mkdirSync(path);
}

function writeFile(path, text) {
	if (verbose) console.log('creating ' + path);
	fs.writeFileSync(path, text, 'utf8');
}

function compileFile(fname) {
	var srcPath = fsp.join(__dirname, fname);
	var dstPath = fsp.join(__dirname, target, fname);
	console.log("dstPath:",dstPath);
	dstPath = dstPath.replace(/\/src\/|\\src\\/g, '/');
	console.log("dstPath after:",dstPath);
	var source = fs.readFileSync(srcPath, 'utf8');
	var transformed = {};
	if (/\.json$/.test(srcPath)) {
		transformed.code = source;
	} else {
		transformed = transformJs(srcPath, {sourceMaps:true});
		dstPath = dstPath.replace(/\.[^\.]+$/, '.js');
	}
	if (transformed.code) writeFile(dstPath, transformed.code);
	// maps are invalid because of istanbul instrumentation
	if (transformed.map) {
		transformed.map.sourceRoot = '../src/';
		writeFile(dstPath.replace(/\.[^\.]+$/, '.js.map'), JSON.stringify(transformed.map));
	}
}

function compileDir(dir, deep) {
	console.log("Dir:",dir)
	fs.readdirSync(fsp.join(__dirname, dir)).forEach(function(sub) {
		console.log("Sub:",sub)
		var fname = fsp.join(dir, sub);
		console.log("fname:",fname);
		if (fs.lstatSync(fsp.join(__dirname, fname)).isDirectory()) {
			compileDir(fname);
		} else if (/\.(ts|js|_js|json)$/.test(sub) && !(/\.d\.ts$/.test(sub))){
			if (dir !== 'src') mkdirp(fsp.join(__dirname, target, dir));
			compileFile(fname);
		}
	})
}
console.log("Base:",fsp.join(__dirname, target));
mkdirp(fsp.join(__dirname, target));
compileDir('src', 0);
//compileDir('test');

process.exit(0);