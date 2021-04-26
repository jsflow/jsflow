/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var readline = require('readline');

let test = false;
let taint = false;
let observable = true;
let progress = false;
let interactive = false;

var tasks = [];

import * as fs from 'fs';

// ------------------------------------------------------------ 
// 1. process command line arguments

processArguments();

// ------------------------------------------------------------ 
// 2. initialize monitor

// @ts-ignore
var global = (function () { return this; })();
import { MonitorBase } from '../../MonitorBase';
import { JSFlowMonitor } from './JSFlowMonitor';

import * as sms from 'source-map-support';
import { ReportException } from '../ReportException';
sms.install();

let print = console.log;
// if test mode, suppress log and warn
let log = test ? () => { } : console.log;
let info = test ? () => { } : console.log;
let warn = test ? () => { } : console.log;
let error = console.log;

let monitor: MonitorBase = new JSFlowMonitor(global, print, log, info, warn, error);

monitor.options.set('monitor.testMode', test);
monitor.options.set('monitor.taintMode', taint);
monitor.options.set('monitor.observableMode', observable);
monitor.options.set('monitor.progress', progress);

// ------------------------------------------------------------ 
// 3. evaluate all files and given code

try {
  for (var i = 0; i < tasks.length; i++) {
    if ('file' in tasks[i]) {
      var script = fs.readFileSync(tasks[i].file);
      //@ts-ignore TYPES
      var result = monitor.Execute(script, tasks[i].file);
    }

    if ('exec' in tasks[i]) {
      var result = monitor.Execute(tasks[i].exec, 'execute');
    }
  }
} catch (e) {
  ReportException(e);
  process.exit(1);
}

// ------------------------------------------------------------ 
// 4. if interactive, initialize an interactive session

function report(result) {
  var value = result.value === null ? undefined : result.value;
  console.log(String(value));
}

function dreport(result) {
  var resstr = JSON.stringify(result);
  resstr.replace('\n', ' ');
  console.log('completion record: ' + resstr);
  monitor.printWorkList();
}

if (interactive) {
  console.log('jsflow 1.1.0, :? for help');
  if (monitor.options.get('monitor.testMode')) {
    console.log('Test mode enabled (security printing disabled)');
  }
  if (monitor.options.get('monitor.taintMode')) {
    console.log('Taint mode enabled (security contexts disabled)');
  }
  if (monitor.options.get('monitor.observableMode')) {
    console.log('Observable mode enabled (security errors do not stop execution)');
  }
  if (monitor.options.get('monitor.progress')) {
    console.log('Execution progress reporting enabled');
  }

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.setPrompt('jsflow>', 7);
  rl.prompt();
  rl.on('line', function (_line) {
    var line = _line.trim();
    var result;

    if (line === '') {
      if (monitor.debug.active && monitor.running()) {
        dreport(monitor.step());
      }
      rl.prompt();
      return;
    }

    if (line[0] === ':') {

      switch (line) {

        case ':debug':
          monitor.debug.active = true;
          console.log('stepping active');
          break;

        case ':step':
          if (monitor.running()) {
            dreport(monitor.step());
          }
          break;

        case ':continue':
          if (monitor.running()) {
            report(monitor.resume());
          }
          break;

        case ':wl':
          monitor.printWorkList();
          break;

        case ':taint':
          var toggle = !monitor.options.get('monitor.taintMode');
          monitor.options.set('monitor.taintMode', toggle);
          console.log('Taint mode', toggle ? 'on' : 'off');
          break;

      }

    } else {
      try {
        let result = monitor.Execute(line, 'REPL');
        console.log(String(result));
      } catch (e) {
        ReportException(e);
      }

      //  report(monitor.interactive(line,'console'));
    }

    rl.prompt();
  });
  rl.on('close', function () {
    process.exit(0);
  });
}

// ------------------------------------------------------------ 

function usage() {
  console.log('spiderflow [options] [<filenames>] [-e] <code>');
  console.log(' --observable enable observable mode');
  console.log(' --taint enable taint mode');
  console.log(' --progress enable progress mode');
  console.log(' --interactive | -i enter interactive mode');
  console.log(' -e execute script');

  process.exit(1);
}

// ------------------------------------------------------------ 
// process command line arguments
// redo using optimist

function processArguments() {

  var argv = process.argv;

  for (var i = 2; i < argv.length; i++) {

    switch (argv[i]) {

      case '-i':
      case '--interactive':
        interactive = true;
        break;

      case '-e':
      case '--execute':
        if (argv[i + 1] !== undefined &&
          argv[i + 1][0] !== '-') {
          tasks.push({ 'exec': argv[i + 1] });
          i++;
        } else {
          usage();
        }
        break;

      case '-t':
      case '--test':
        test = true;
        break;

      case '--taint':
        taint = true;
        break;

      case '--observable':
        observable = true;
        break;

      case '--progress':
        progress = true;
        break;

      default:
        if (argv[i][0] !== '-') {
          tasks.push({ 'file': argv[i] })
        }
        break;
    }
  }

  if (tasks.length === 0) interactive = true;
}

