import { MonitorBase } from './MonitorBase';
import { transformSync } from "@babel/core";
//import env from "@babel/preset-env"
import { JSFLowBabelPreset } from "./BabelPreset";

export abstract class BabelMonitorBase extends MonitorBase  {

    constructor(global, print, log, info, warn, error) {
      super(global, print, log, info, warn, error);
    
      /* babel turns on automatic bablifying of executed code to handle (a subset of) ecma6+ features - 
       * may require the use of a babel polyfill runtime
       */
      this.options.declare('monitor.babel', 'boolean', false, 'babel es6 support');
    }

    transform(code : string) : string {
      if (!this.options.get('monitor.babel') || code.startsWith("// #JSFLOW-NO-BABLIFY")) {
        return code;
      }

      var babelified = transformSync(code, { 'presets': [ JSFLowBabelPreset ], 'sourceType': 'script', 'sourceMaps': true });
      return babelified.code;
    }

    Execute(code: string, origin: string, preventTranspile?: boolean) {

      let babel = this.options.get('monitor.babel');
      this.options.set('monitor.babel', !preventTranspile);
      let result = super.Execute(code, origin);
      this.options.set('monitor.babel', babel);

      return result;
    }
  }

  