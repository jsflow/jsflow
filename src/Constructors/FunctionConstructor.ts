import { lub, bot } from '../Label';
import { Value } from "../Value";
import { DefineFFF } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';
import * as constants from '../Constants';
import { MonitorBase } from '../MonitorBase';

import { FunctionObject } from '../Objects/FunctionObject';
import { HasInstance } from '../HasInstance';

import * as esprima from 'esprima';
import { ToString } from '../Conversion/ToString';
import { ValueTypes } from '../Interfaces';
import { exists } from 'fs';

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// Function Constructor, 15.3.2 (15.3.1, 15.3.1.1)

export class FunctionConstructor extends EcmaObject {

    host : any;

    constructor(host : Function) {
      super();
  
      // Properties, 15.3.3.
      this.Class = 'Function';
      this.host = host;
      this.Extensible = true;
  
    }
  
    Setup() : void {
      // 15.3.3.1 
      DefineFFF(this, constants.prototype, monitor.instances.FunctionPrototype);
      this.Prototype = new Value(monitor.instances.FunctionPrototype, bot);
  
      // 15.3.3.2 
      DefineFFF(this, constants.length, 1);
    }
  
  
    // ---
  
    HasInstance(V: Value<ValueTypes>): Value<boolean> {
      return HasInstance.call(this, V);
    }
  
    // 15.3.1
    Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<FunctionObject> {
      return this.Construct(args);
    }
  
    // 15.3.2
    Construct(args: Value<ValueTypes>[]): Value<FunctionObject> {
      var argCount = args.length;
      var P = '';
      var body :  Value<ValueTypes>;
      var label = bot;
  
      if (argCount === 0) {
        body = new Value('', bot);
      } else if (argCount === 1) {
        body = args[0];
      } else {
        var firstArg = ToString(args[0]);
        label = lub(label, firstArg.label);
        P = firstArg.value;
  
        for (var i = 1; i < argCount - 1; i++) {
          var nextArg = ToString(args[i]);
          label = lub(label, firstArg.label);
          P += ', ' + nextArg.value;
        }
  
        body = args[argCount - 1];
      }
  
      let strbody = ToString(body);
      label = lub(label, strbody.label);

      // transform may use a parser, which means we cannot transform the body
      // in isolation (e.g., it may contain return), and we cannot assume that the
      // transformation returns a function
      var transformed = monitor.transform(`function __jsflow_transformed() {
        arguments.callee = __jsflow_callee;
        arguments.caller = __jsflow_caller;
        ${strbody.value}
      }`);

      P = `(function ( ${P} ) {
        let __jsflow_callee = arguments.callee;
        let __jsflow_caller = arguments.caller;
        ${transformed};
        return __jsflow_transformed.apply(this, arguments);
      })`;

      var prog;
      try {
        prog = esprima.parse(P, { loc: true });
      } catch (e) {
        monitor.Throw(
          "SyntaxError",
          e.message,
          label
        );
      }
  
      // parsing returns a program --- we are interested in function declaration
      var func = prog.body[0].expression;
  
      var F = new FunctionObject(
        func.params,
        func.body,
        new Value(monitor.GlobalEnvironment, bot)
      );
  
      // For pretty printing
      F.Source = func;
  
      return new Value(F, label);
    }
  }