#!/usr/bin/env node

var manifestFile = './src/manifest.json',
	manifest = require(manifestFile),
	semver = require('semver'),
	fs = require('fs'),
	exec = require('exec'),
	inquirer = require('inquirer'),
	args = process.argv.slice(2),
	currentVer = manifest.version;

inquirer.prompt({
	message: 'Release type',
	name: 'type',
	type: 'list',
	choices: ['patch','minor','major']
}, function (answers) {
	newVersion = semver.inc(currentVer, answers.type);

	console.log('Current Version:', currentVer);
	console.log('New Version:', newVersion);

	inquirer.prompt({
		type: 'confirm',
		name: 'confirm',
		message: 'Proceed with release ' + newVersion,
		default: false
	}, function (answers) {
		if(answers.confirm === false) {
			console.log('Aborting release');
			return;
		}

		manifest.version = newVersion;
		fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 4), 'utf-8');
		exec('cd src && zip ../bundle-'+ newVersion +'.zip * && cd -', function () {
			console.log('Release has been created.');
			console.log('bundle-'+ newVersion +'.zip');
		});
	});
});
