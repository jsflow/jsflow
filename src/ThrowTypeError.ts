import { FunctionObject } from "./Objects/FunctionObject";
import { Value } from "./Value";
import { bot } from "./Label";
import { DefineFFF } from "./Define";
import * as esprima from 'esprima';
import * as constants from './Constants';

import { MonitorBase } from "./MonitorBase";

declare var monitor: MonitorBase;


  // 13.2.3
  export class ThrowTypeError extends FunctionObject {

    static instance : ThrowTypeError;
    static get Instance(): ThrowTypeError {
        if (ThrowTypeError.instance === undefined) {
            ThrowTypeError.instance = new ThrowTypeError();
        }
        return ThrowTypeError.instance;
    }

    constructor() {
      super(
        [],
        //@ts-ignore
        esprima.parse("(function() { throw new TypeError(); })").body[0].expression,
        new Value(monitor.GlobalEnvironment, bot)
      );
  
      DefineFFF(this, constants.length, 0);
      this.Extensible = false;
    }
  }