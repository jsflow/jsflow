import { bot } from '../Label';
import * as pp from '../PP';
import { Value } from "../Value";
import { DefineFFF, DefineTFT, DefineFFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';
import * as constants from '../Constants';
import { MonitorBase } from '../MonitorBase';

import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { ToUInt32 } from '../Conversion/ToUInt32';
import { IsCallable } from '../Utility/IsCallable';
import { ThrowTypeError } from '../ThrowTypeError';
import { ValueTypes, IEcmaObject } from '../Interfaces';
import { FunctionObject } from '../Objects/FunctionObject';

// import { MonitorBase } 

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// Function Prototype, 15.3.4

export class FunctionPrototype extends EcmaObject {

  host: Function;

  constructor(host: Function) {
    super();

    // 15.3.4
    this.Class = 'Function';
    this.Extensible = true;

    this.host = host;

  }

  Setup(): void {
    // 15.3.4.1
    DefineTFT(this, constants.constructor, monitor.instances.FunctionConstructor);
    this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);
    DefineFFT(this, constants.length, 0);

    DefineTFT(this, constants.toString, new BuiltinFunctionObject(toString, 0, Function.prototype.toString));
    DefineTFT(this, constants.apply, new BuiltinFunctionObject(apply, 2, Function.prototype.apply));
    DefineTFT(this, constants.call, new BuiltinFunctionObject(call, 1, Function.prototype.call));
    DefineTFT(this, constants.bind, new BuiltinFunctionObject(bind, 1, Function.prototype.bind));
  }

  // 15.3.4
  Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    return new Value(undefined, bot);
  }

  Construct(args: Value<ValueTypes>[]): Value<IEcmaObject> {
    return new Value(undefined, bot);
  }
}

// ------------------------------------------------------------
// 15.3.4.2 - Implementation Dependent
function toString(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
  return new Value(String(thisArg.value), thisArg.label);
}

// ------------------------------------------------------------
// 15.3.4.3
function apply(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
  let _this = args[0] ? args[0] : new Value(undefined, bot);
  let argArray = args[1] ? args[1] : new Value(undefined, bot);

  monitor.context.pushPC(thisArg.label);

  if (!IsCallable(thisArg)) {
    monitor.Throw(
      "TypeError",
      'apply, not a function',
      bot
    );
  }

  monitor.context.raisePC(argArray.label);

  if (argArray.value === null || argArray.value === undefined) {
    let res = thisArg.Call(_this, []);
    monitor.context.popPC();
    return res;
  }

  if (typeof argArray.value !== 'object' || argArray.value.Class === undefined) {
    monitor.Throw(
      "TypeError",
      'apply, argument array not an object',
      bot
    );
  }

  let len = argArray.Get(constants.length);
  let n = ToUInt32(len);

  let argList: Value<ValueTypes>[] = [];
  for (let index = 0; index < n.value; index++) {
    let nextArg = argArray.Get(new Value(index, n.label));
    argList.push(nextArg);
  }

  // Since we cannot transfer the structural or existence info to
  //  the array used by Call, we raise the context accordingly.
  //  This is sound, but potentially an over approximation.

  monitor.context.raisePC(n.label);

  let res = thisArg.Call(_this, argList);

  monitor.context.popPC();
  return res;
}

// ------------------------------------------------------------
// 15.3.4.4
function call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {

  let _this = args[0] ? args[0] : new Value(undefined, bot);
  let argList: Value<ValueTypes>[] = [];

  for (let i = 1; i < args.length; i++) {
    argList[i - 1] = args[i];
  }

  monitor.context.pushPC(thisArg.label);

  if (!IsCallable(thisArg)) {
    monitor.Throw(
      "TypeError",
      'call, not a function',
      bot
    );
  }

  let res = thisArg.Call(_this, argList);
  monitor.context.popPC();
  return res;
}

// ------------------------------------------------------------
// 15.3.4.5
function bind(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
  let Target = thisArg;
  let _this = args[0] ? args[0] : new Value(undefined, bot);
  let argList : Value<ValueTypes>[] = [];
  for (let i = 1; i < args.length; i++) {
    argList[i - 1] = args[i];
  }

  if (!IsCallable(Target)) {
    monitor.Throw(
      "TypeError",
      'bind: Target is not a function',
      bot
    );
  }

  let F = new EcmaObject();
  //@ts-ignore TYPES
  F.TargetFunction = Target;
  //@ts-ignore TYPES
  F.BoundThis = _this;
  //@ts-ignore TYPES
  F.BoundArgs = argList;
  F.Class = 'Function';
  F.Prototype = new Value(monitor.instances.FunctionPrototype, bot);

  //@ts-ignore TYPES
  F.Call = function (_thisVal, ExtraArgs) {
    //@ts-ignore TYPES
    let boundArgs = F.BoundArgs;
    //@ts-ignore TYPES
    let boundThis = F.BoundThis;
    //@ts-ignore TYPES
    let target = F.TargetFunction;
    let args = boundArgs.concat(ExtraArgs);
    return target.Call(boundThis, args);
  }

  //@ts-ignore TYPES
  F.Construct = function (ExtraArgs) {
    //@ts-ignore TYPES
    let target = F.TargetFunction;
    if (!target.Construct) {
      monitor.Throw(
        "TypeError",
        'bind construct: no internal method Construct',
        bot
      );
    }

    //@ts-ignore TYPES
    let boundArgs = F.BoundArgs;
    let args = boundArgs.concat(ExtraArgs);

    return target.Construct(args);
  }

  //@ts-ignore TYPES
  F.HasInstance = function (V) {
    //@ts-ignore TYPES
    let target = F.TargetFunction;
    if (!target.HasInstance) {
      monitor.Throw(
        "TypeError",
        'bind HasInstance: no internal method HasInstance',
        bot
      );
    }

    return target.HasInstance(V);
  }

  //@ts-ignore TYPES
  if (Target.Class === "Function") {
    //@ts-ignore TYPES
    let L = Target.length - args.length;
    //@ts-ignore TYPES
    F.length = L > 0 ? L : 0;
  } else {
    //@ts-ignore TYPES
    F.length = 0;
  }

  //@ts-ignore TYPES
  DefineFFF(F, constants.length, F.length);
  F.Extensible = true;

  let thrower = ThrowTypeError.Instance;
  F.DefineOwnProperty(
    constants.caller,
    {
      //@ts-ignore TYPES
      get: thrower,
      //@ts-ignore TYPES
      set: thrower,
      enumerable: false, configurable: false,
      label: bot
    },
    false
  );
  F.DefineOwnProperty(
    constants.arguments,
    {
      //@ts-ignore TYPES
      get: thrower,
      //@ts-ignore TYPES
      set: thrower,
      enumerable: false, configurable: false,
      label: bot
    },
    false
  );

  return new Value(F, bot);
}