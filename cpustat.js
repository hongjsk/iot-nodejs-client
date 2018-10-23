/*******************************************************************************
* Copyright (c) 2015 IBM Corporation and other Contributors.
*
* All rights reserved. This program and the accompanying materials
* are made available under the terms of the Eclipse Public License v1.0
* which accompanies this distribution, and is available at
* http://www.eclipse.org/legal/epl-v10.html
*
* Contributors:
*   JeongSeok Hong - Initial Contribution
*******************************************************************************/

/*
 * JavaScript Program to get the stats for CPU.
 * Currently it gets the CPU temperature and CPU usage
 * Ref. https://github.com/sebhildebrandt/systeminformation
 * 
 * If you need to detect macOS temperature just run the following additional installation command:
 *
 * $ npm install osx-temperature-sensor --save
 */

var si = require('systeminformation')

async function getCPUTemp() {
	var cputemp;
	try {
		const data = await si.cpuTemperature();
		cputemp = data.main;
	} catch(e) {
		cputemp = (Math.random()*100).toFixed(0);
		console.error('cputemploc file does not exist. but returns ' + cputemp);
	}

	return cputemp;
}

async function getCPULoad() {

	var load = {};

	try {
		const data = await si.currentLoad();

		cputemp = data.avgload;

		load = {
			load1: data[0],
			load5: data[1],
			load15: data[2]
		};
	} catch(e) {
		load.load1 = (Math.random()*100).toFixed(0);
		console.error('cpuloadloc file does not exist. but returns ' + load.load1);
	}

	return load.load1;
}

module.exports = {
	getCPUTemp: getCPUTemp,
	getCPULoad: getCPULoad
};
