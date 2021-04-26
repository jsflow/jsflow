/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let readline = require('readline');
let fetch = require('node-fetch');
let url = require('url');
let path = require('path');
let fs = require('fs');

let test = false;
let taint = false;
let observable = false;
let progress = false;
let babel = true;
let interactive = false;
let get = false;

interface File {
  kind: "file",
  path: string
}

interface Script {
  kind: "script",
  code: string
}

interface StandardInput {
  kind: "stdin"
}


interface Runtime {
  kind: "runtime",
  path: string
}

type Source = File | Script | StandardInput | Runtime
let sources : Array<Source> = [];


// ------------------------------------------------------------ 
// 1. process command line arguments
let args = processOptions();

if (sources.length === 0) {
  interactive = true;
}

// ------------------------------------------------------------ 
// 2. initialize monitor

// @ts-ignore
let global = (function () { return this; })();
import { MonitorBase } from '../../MonitorBase';
import { NodeJSMonitor } from './NodeJSMonitor';

import * as sms from 'source-map-support';
import { Result } from '../../Result';
import { ReportException } from '../ReportException';
sms.install();

let print = console.log;
// if test mode, suppress log, info and warn
let log = test ? () => { } : console.log;
let info = test ? () => { } : console.log;
let warn = test ? () => { } : console.log;
let error = console.log

// node emulates node, which behaves differently from 

let monitor = new NodeJSMonitor(global, print, log, info, warn, error);

monitor.options.set('monitor.testMode', test);
monitor.options.set('monitor.taintMode', taint);
monitor.options.set('monitor.observableMode', observable);
monitor.options.set('monitor.progress', progress);
monitor.options.set('monitor.babel', babel);

sources.forEach(source => {
  switch (source.kind) {
    case "file":
      try {
        monitor.ExecuteModule(source.path);
      } catch (e) {
        ReportException(e);
        process.exit(1);
      }
      break;

    case "script":
      try {
        monitor.Execute(source.code, "execute");
      } catch (e) {
        ReportException(e);
        process.exit(1);
      }
      break;

    case "stdin":
      let code = "";
      process.stdin.on("data", (chunk) => code += chunk);
      process.stdin.on("end",
        function () {
          try {
            monitor.Execute(code, "execute");
          } catch (e) {
            ReportException(e);
            process.exit(1);
          }
        }
      );
      break;

      case "runtime":
        try {
          let runtime = fs.readFileSync(source.path);
          monitor.Execute(runtime, source.path, true);
        } 
        catch (e) {
          ReportException(e);
          process.exit(1);
        }
      break;
  }
});

if (interactive && !get) {
  Interactive();
}

// ------------------------------------------------------------ 

function report(result: Result) {
  let value = result.value === null ? undefined : result.value;
  console.log(String(value));
}

function dreport(result: Result) {
  let resstr = JSON.stringify(result);
  resstr.replace('\n', ' ');
  console.log('completion record: ' + resstr);
  monitor.printWorkList();
}

function Interactive() {
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
  if (monitor.options.get('monitor.babel')) {
    console.log('Transpiling using Babel enabled');
  }

  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.setPrompt('jsflow>', 7);
  rl.prompt();
  rl.on('line', function (_line: string) {
    let line = _line.trim();
    let result;

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
      }

    } else {
      try {
        let result = monitor.Execute(line, 'REPL');
        console.log(String(result));
      } catch (e) {
        ReportException(e);
      }
    }

    rl.prompt();
  });
  rl.on('close', function () {
    process.exit(0);
  });
}

// ------------------------------------------------------------ 

function usage() {
  console.log(' jsflow [ options ] [ -r <filename> | -e <filename> | <filename> | -i] [ arguments ] [ - ]');
  console.log(' -h show help');
  console.log(' -e execute script');
  console.log(' -r execute runtime (disables transpiling)')
  console.log(' -i enter interactive mode (allows for executing scrips and runtimes before entering interactive mode)');
  console.log(' -t | --test enable test mode');
  console.log(' --observable enable observable mode');
  console.log(' --taint enable taint mode');
  console.log(' --progress enable progress mode');
  console.log(' --no-transpile disable transpiling');

  process.exit(1);
}

// ------------------------------------------------------------ 
// jsflow [ options ] [ -e <filename> | <filename> | - ] [ arguments ]

function processOptions(): string[] {
  
  let argv = process.argv;

  let i = 2;
  options: for (; i < argv.length; i++) {

    switch (argv[i]) {

      case '-e':
        if (argv[i + 1] !== undefined &&
          argv[i + 1][0] !== '-') {
          sources.push({ kind: "script", code: argv[i + 1] });
          i++;
          break;
        } else {
          usage();
        }
        break;

        case '-r':
          if (argv[i + 1] !== undefined &&
            argv[i + 1][0] !== '-') {
            sources.push({ kind: "runtime", path: argv[i + 1] });
            i++;
            break;
          } else {
            usage();
          }
          break;

      case '-i':
        interactive = true;
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

      case '--get':
          get = true;

          if (argv[i+1] === undefined || argv[i+2] === undefined) {
            console.log("--get URL outdir");
            process.exit(1);
          }

          let source = argv[i+1];
          let targetDir = path.resolve(argv[i+2]);

          fetch(source)
          .then(res => res.text())
          .then(code => {
            let beautify = monitor.beautify(code);
            let codeES5 = monitor.transform(code);
            let beautifyES5 = monitor.beautify(codeES5);

            let parsed = url.parse(source);
            let basename = path.basename(parsed.pathname);

            fs.writeFileSync(path.join(targetDir, basename), "// #JSFLOW-NO-BABLIFY \n" + beautifyES5);
            fs.writeFileSync(path.join(targetDir, `${basename}_orig`), beautify);
            console.log(source, path.join(targetDir, basename));

          });
          i+=2;
      break;
        

      case '-':
        sources.push({ kind: "stdin" });
        break options;

      default:
        if (argv[i][0] !== '-') {
          sources.push({ kind: "file", path: argv[i] });
          break;
        }
        usage();
    }
  }

  return argv.slice(i + 1);
}

