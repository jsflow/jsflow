import { Label, lub, le, bot } from '../Label';
import { Value } from "../Value";
import { DefineTFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';

import * as constants from '../Constants';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { MonitorBase } from '../MonitorBase';

import { ToString } from '../Conversion/ToString';
import { ToObject } from '../Conversion/ToObject';
import { IsCallable } from '../Utility/IsCallable';
import { ValueTypes } from '../Interfaces';

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// The object prototype, 15.2.4

export class ObjectPrototype extends EcmaObject {

    host : Object;

    constructor(host : Object) {
      super();
      this.Prototype = new Value(null, bot);
      this.Class = 'Object';
      this.Extensible = true;
  
      this.host = host;
    }
  
    Setup() {
      // 15.2.4.1
      DefineTFT(this, constants.constructor, monitor.instances.ObjectConstructor);
  
      DefineTFT(this, constants.toString, new BuiltinFunctionObject(toString, 0, Object.prototype.toString));
      DefineTFT(this, constants.toLocaleString, new BuiltinFunctionObject(toLocaleString, 0, Object.prototype.toLocaleString));
      DefineTFT(this, new Value('valueOf', bot), new BuiltinFunctionObject(valueOf, 0, Object.prototype.valueOf));
      DefineTFT(this, constants.hasOwnProperty, new BuiltinFunctionObject(hasOwnProperty, 1, Object.prototype.hasOwnProperty));
      DefineTFT(this, constants.isPrototypeOf, new BuiltinFunctionObject(isPrototypeOf, 1, Object.prototype.isPrototypeOf));
      DefineTFT(this, constants.propertyIsEnumerable, new BuiltinFunctionObject(propertyIsEnumerable, 1, Object.prototype.propertyIsEnumerable));
    }
  
  }
  
  // ------------------------------------------------------------
  // Object.prototype.toString(), 15.2.4.2
  function toString(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
  
    if (thisArg.value === undefined)
      return new Value('[object Undefined]', thisArg.label);
  
    if (thisArg.value === null)
      return new Value('[object Null]', thisArg.label);
  
    let O = ToObject(thisArg);
    return new Value('[object ' + O.value.Class + ']', thisArg.label);
  }
  
  // ------------------------------------------------------------
  // 15.2.4.3
  
  function toLocaleString(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let O = ToObject(thisArg);
    let toString = O.Get(constants.toString);  
    let result;
  
    monitor.context.pushPC(toString.label);
    if (IsCallable(toString)) {
      result = toString.Call(O, []);
      result.raise(toString.label);
    } else {
      monitor.Throw(
        "TypeError",
        "property 'toString' of object " + O + " is not a function ",
        bot
      );
    }
    monitor.context.popPC();
  
    return result;
  }
  
  // ------------------------------------------------------------
  // 15.2.4.4
  
  function valueOf(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<EcmaObject> {
    let o = ToObject(thisArg);
    return o;
  }
  
  // ------------------------------------------------------------
  // 15.2.4.5
  
  function hasOwnProperty(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {
    let V = args[0] || new Value(undefined, bot);
    let P = ToString(V);
    let O = ToObject(thisArg);
  
    let desc = O.GetOwnProperty(P);
    let result = desc.value !== undefined;
  
    return new Value(result, desc.label);
  }
  
  // ------------------------------------------------------------
  // 15.2.4.6
  
  function isPrototypeOf(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {
    let c = monitor.context;
  
    let V = args[0] || new Value(undefined, bot);
  
    if (V.value === null || V.value === undefined || typeof V.value !== 'object') {
      return new Value(false, V.label);
    }
    
    c.pushPC(V.label);
    let O = ToObject(thisArg);
    c.popPC();
  
    let lbl = lub(V.label);
  
    let P = V.value.Prototype;
    
    while (true) {
      lbl = lub(lbl, P.label);

      if (P.value === null) {
        return new Value(false, lbl);
      }
  
      if (O.value === P.value) {
        return new Value(true, lbl);
      }
  
      if (P === undefined) {
        throw new Error('Object.prototype.isPrototypeOf: object with undefined prototype');
      }

      P = P.value.Prototype;
    }
  }
  
  // ------------------------------------------------------------
  // 15.2.4.7
  
  function propertyIsEnumerable(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {
    let V = args[0] || new Value(undefined, bot);
    let P = ToString(V);
    let O = ToObject(thisArg);
  
    let desc = O.GetOwnProperty(P);
    if (desc.value === undefined) {
      return new Value(false, desc.label);
    }
  
    return new Value(desc.value.enumerable === true, lub(desc.label, desc.value.label));
  }