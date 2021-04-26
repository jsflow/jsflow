
import { Label, lub, le, bot } from '../Label';
import { Value } from "../Value";
import { DefineTFT, DefineFFF } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';

import * as constants from '../Constants';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { MonitorBase } from '../MonitorBase';

import { ObjectObject } from '../Objects/ObjectObject';
import { ArrayObject } from '../Objects/ArrayObject';
import { ToBoolean } from '../Conversion/ToBoolean';
import { HasInstance } from '../HasInstance';
import { ToString } from '../Conversion/ToString';
import { ToObject } from '../Conversion/ToObject';
import { IsDataDescriptor, JSFPropertyDescriptor } from '../PropertyDescriptor';
import { ValueTypes, IEcmaObject, IsIEcmaObject } from '../Interfaces';


// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// Object Constructor, 15.2.3

export class ObjectConstructor extends EcmaObject {

  host: any;

  constructor(host: Object) {
    super();

    this.Class = 'Function';
    this.host = host;
  }

  Setup(): void {

    DefineFFF(this, constants.length, 1);

    // 15.2.3
    this.Prototype = new Value(monitor.instances.FunctionPrototype, bot);
    // 15.2.3.1
    DefineFFF(this, constants.prototype, monitor.instances.ObjectPrototype);

    DefineTFT(this, constants.getPrototypeOf, new BuiltinFunctionObject(getPrototypeOf, 1, Object.getPrototypeOf));
    DefineTFT(this, constants.getOwnPropertyDescriptor, new BuiltinFunctionObject(getOwnPropertyDescriptor, 2, Object.getOwnPropertyDescriptor));
    DefineTFT(this, constants.getOwnPropertyNames, new BuiltinFunctionObject(getOwnPropertyNames, 1, Object.getOwnPropertyNames));
    DefineTFT(this, constants.create, new BuiltinFunctionObject(create, 2, Object.create));
    DefineTFT(this, constants.defineProperty, new BuiltinFunctionObject(defineProperty, 3, Object.defineProperty));
    DefineTFT(this, constants.defineProperties, new BuiltinFunctionObject(defineProperties, 2, Object.defineProperties));
    DefineTFT(this, constants.seal, new BuiltinFunctionObject(seal, 1, Object.seal));
    DefineTFT(this, constants.freeze, new BuiltinFunctionObject(freeze, 1, Object.freeze));
    DefineTFT(this, constants.preventExtensions, new BuiltinFunctionObject(preventExtensions, 1, Object.preventExtensions));
    DefineTFT(this, constants.isSealed, new BuiltinFunctionObject(isSealed, 1, Object.isSealed));
    DefineTFT(this, constants.isFrozen, new BuiltinFunctionObject(isFrozen, 1, Object.isFrozen));
    DefineTFT(this, constants.isExtensible, new BuiltinFunctionObject(isExtensible, 1, Object.isExtensible));
    DefineTFT(this, constants.keys, new BuiltinFunctionObject(keys, 1, Object.keys));

  }

  HasInstance(V: Value<ValueTypes>): Value<boolean> {
    return HasInstance.call(this, V);
  }

  // ------------------------------------------------------------
  // 15.2.1.1
  Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<EcmaObject> {
    let arg0 = args[0] || new Value(undefined, bot);

    let res: Value<EcmaObject>;
    monitor.context.pushPC(arg0.label);
    if (arg0.value === undefined || arg0.value === null) {
      res = this.Construct(args);
      res.raise(arg0.label);
      monitor.context.popPC();
      return res;
    }

    res = ToObject(arg0);
    monitor.context.popPC();
    return res;
  }

  // ------------------------------------------------------------
  // 15.2.2.1
  Construct(args: Value<ValueTypes>[]): Value<ObjectObject> {

    let arg0 = args[0] || new Value(undefined, bot);

    monitor.context.pushPC(arg0.label);

    let res: Value<ObjectObject>;
    if (arg0.value === undefined || arg0.value === null) {
      let o = new ObjectObject();

      res = new Value(o, arg0.label);
      monitor.context.popPC();
      return res;
    }

    if (typeof arg0.value === 'object') {
      res = new Value(arg0.value, arg0.label);
      monitor.context.popPC();
      return res;
    }

    res = ToObject(arg0);
    monitor.context.popPC();
    return res;
  }
}

// ------------------------------------------------------------

function AssertObject(arg: Value<ValueTypes>, callee: string): void {

  monitor.context.pushPC(arg.label);

  monitor.Throw(
    "TypeError",
    callee + ' called on non-object (' + String(arg.value) + ')', 
    arg.label
  );
}



// ------------------------------------------------------------
// 15.2.3.2
function getPrototypeOf(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<IEcmaObject | null> {
  let O = args[0] || new Value(undefined, bot);

  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.getPrototypeOf');
    throw 'TypeScript';
  }

  let proto = O.value.Prototype;
  return new Value(proto.value, lub(proto.label, O.label));
}

// ------------------------------------------------------------
// 15.2.3.3

let getOwnPropertyDescriptor = function (thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ObjectObject | undefined> {
  let O = args[0] || new Value(undefined, bot);
  let P = args[1] || new Value(undefined, bot);

  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.getOwnPropertyDescriptor');
    throw 'TypeScript';
  }

  let name = ToString(P);
  let desc = O.GetOwnProperty(name);

  if (desc.value === undefined) {
    return new Value(undefined, desc.label);
  }

  let obj = new ObjectObject();
  if (IsDataDescriptor(desc.value)) {
    obj.DefineOwnProperty(
      constants.value,
      {
        value: desc.value.value,
        writable: true, enumerable: true, configurable: true,
        label: desc.value.label
      },
      false
    );

    obj.DefineOwnProperty(
      constants.writable,
      {
        value: desc.value.writable,
        writable: true, enumerable: true, configurable: true,
        label: desc.value.label
      },
      false
    );
  } else {
    //@ts-ignore DESC HELL
    let get = desc.value.get ? desc.value.get.actualFunction : desc.value.get;
    obj.DefineOwnProperty(
      constants.get,
      {
        value: get,
        writable: true, enumerable: true, configurable: true,
        label: desc.value.label
      },
      false
    );

    //@ts-ignore DESC HELL
    let set = desc.value.set ? desc.value.set.actualFunction : desc.value.set;
    obj.DefineOwnProperty(
      constants.set,
      {
        value: set,
        writable: true, enumerable: true, configurable: true,
        label: desc.value.label
      },
      false
    );
  }

  obj.DefineOwnProperty(
    constants.enumerable,
    {
      value: desc.value.enumerable,
      writable: true, enumerable: true, configurable: true,
      label: desc.value.label
    },
    false
  );

  obj.DefineOwnProperty(
    constants.configurable,
    {
      value: desc.value.configurable,
      writable: true, enumerable: true, configurable: true,
      label: desc.value.label
    },
    false
  );

  return new Value(obj, desc.label);
};


// ------------------------------------------------------------
// 15.2.3.4

function getOwnPropertyNames(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ArrayObject> {
  let O = args[0] || new Value(undefined, bot);
  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.getOwnPropertyNames');
    throw 'TypeScript';
  }

  let propertyNames = O.value.getOwnPropertyNames(O.label);
  let array = ArrayObject.fromPropertyArray(propertyNames, O.value.struct);
  return new Value(array, bot);
}

// ------------------------------------------------------------
// 15.2.3.5

function create(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ObjectObject> {
  let O = args[0] || new Value(undefined, bot);
  let Properties = args[1] || new Value(undefined, bot);

  if (O.value !== null && !IsIEcmaObject(O)) {
    AssertObject(O, 'Object.create');
    throw 'TypeScript';
  }

  let obj = new ObjectObject();
  obj.Prototype = O;
  let objValue = new Value(obj, bot);

  if (Properties.value !== undefined) {
    defineProperties(thisArg, [objValue, Properties]);
  }
  return objValue;
}

// ------------------------------------------------------------

function ToPropertyDescriptor(Obj: Value<EcmaObject>): JSFPropertyDescriptor {
  if (!IsIEcmaObject(Obj)) {
    AssertObject(Obj, 'Object.ToPropertyDescriptor');
    throw 'TypeScript';
  }

  let c = monitor.context;

  let lbl = new Label();
  let desc: JSFPropertyDescriptor = { label: bot };

  let b: Value<boolean>;
  let x: Value<ValueTypes>;
  let propertyName: Value<string | number>;

  // enumerable
  propertyName = constants.enumerable;
  b = Obj.HasProperty(propertyName);

  lbl = lub(lbl, b.label);
  if (b.value) {
    c.pushPC(b.label);
    x = ToBoolean(Obj.Get(propertyName));
    c.popPC();
    lbl = lub(lbl, x.label);
    desc[propertyName.value] = x.value;
  }

  // configurable
  propertyName = constants.configurable;
  b = Obj.HasProperty(propertyName);

  lbl = lub(lbl, b.label);
  if (b.value) {
    c.pushPC(b.label);
    x = ToBoolean(Obj.Get(propertyName));
    c.popPC();
    lbl = lub(lbl, x.label);
    desc[propertyName.value] = x.value;
  }

  // value
  propertyName = constants.value;
  b = Obj.HasProperty(propertyName);

  lbl = lub(lbl, b.label);
  if (b.value) {
    c.pushPC(b.label);
    x = Obj.Get(propertyName);
    c.popPC();
    lbl = lub(lbl, x.label);
    desc[propertyName.value] = x.value;
  }

  // writable
  propertyName = constants.writable;
  b = Obj.HasProperty(propertyName);

  lbl = lub(lbl, b.label);
  if (b.value) {
    c.pushPC(b.label);
    x = ToBoolean(Obj.Get(propertyName));
    c.popPC();
    lbl = lub(lbl, x.label);
    desc[propertyName.value] = x.value;
  }

  // get
  propertyName = constants.get;
  b = Obj.HasProperty(propertyName);

  lbl = lub(lbl, b.label);
  if (b.value) {
    c.pushPC(b.label);
    x = Obj.Get(propertyName);
    c.popPC();
    lbl = lub(lbl, x.label);
    desc[propertyName.value] = x.value;
  }

  // set
  propertyName = constants.set;
  b = Obj.HasProperty(propertyName);

  lbl = lub(lbl, b.label);
  if (b.value) {
    c.pushPC(b.label);
    x = Obj.Get(propertyName);
    c.popPC();
    lbl = lub(lbl, x.label);
    desc[propertyName.value] = x.value;
  }

  desc.label = lbl;
  return desc;
}


// ------------------------------------------------------------
// 15.2.3.6

function defineProperty(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<IEcmaObject> {
  let O = args[0] || new Value(undefined, bot);
  let P = args[1] || new Value(undefined, bot);
  let Attributes = args[2] || new Value(undefined, bot);

  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.defineProperty');
    throw 'TypeScript';
  }

  let name = ToString(P);
  let desc = ToPropertyDescriptor(Attributes);
  O.DefineOwnProperty(name, desc, true);
  return O;
}

// ------------------------------------------------------------
// 15.2.3.7

function defineProperties(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<IEcmaObject> {
  let O = args[0] || new Value(undefined, bot);
  let Properties = args[1] || new Value(undefined, bot);

  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.defineProperties');
    throw 'TypeScript';
  }

  let props = ToObject(Properties);
  let names = props.value.getOwnEnumerablePropertyNames(props.label);

  let descriptors: { name: Value<string>, descriptor: JSFPropertyDescriptor }[] = [];

  for (let i = 0, len = names.length; i < len; i++) {
    let P = names[i];
    let descObject = props.Get(P);
    //@ts-ignore DEC HELL
    let desc = ToPropertyDescriptor(descObject);

    descriptors.push({ name: P, descriptor: desc });
  }

  for (let i = 0, len = descriptors.length; i < len; i++) {
    let P = descriptors[i].name;
    let desc = descriptors[i].descriptor;
    O.DefineOwnProperty(P, desc, true);
  }

  return O;
}

// ------------------------------------------------------------
// 15.2.3.8

function seal(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<IEcmaObject> {
  let O = args[0] || new Value(undefined, bot);

  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.defineProperties');
    throw 'TypeScript';
  }

  let context = lub(monitor.context.effectivePC, O.label);

  monitor.assert(
    le(context, O.value.struct),
    'Object.seal: context label ' + context + ' not below structural label ' + O.value.struct + ' of object'
  );

  let labels = O.value.labels;
  for (let x in labels) {
    if (Object.hasOwnProperty.call(labels, x)) {
      monitor.assert(
        le(context, labels[x].value),
        'Object.seal: context label ' + context + ' not below label ' + labels[x].value + ' of ' + x
      );
    }
  }

  Object.seal(O.value.properties);
  O.value.Extensible = false;
  return O;
}

// ------------------------------------------------------------
// 15.2.3.9

function freeze(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<IEcmaObject> {
  let O = args[0] || new Value(undefined, bot);
  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.freeze');
    throw 'TypeScript';
  }

  let context = lub(monitor.context.effectivePC, O.label);

  monitor.assert(
    le(context, O.value.struct),
    'Object.freeze: context label ' + context + ' not below structural label ' + O.value.struct + ' of object'
  );

  let labels = O.value.labels;
  let properties = O.value.properties;

  for (let x in properties) {
    if (Object.hasOwnProperty.call(properties, x)) {
      let desc = Object.getOwnPropertyDescriptor(properties, x);
      if (desc.enumerable) {
        monitor.assert(
          le(context, labels[x].value),
          'Object.freeze: context label ' + context + ' not below label ' + labels[x].value + ' of ' + x
        );
      }
    }
  }

  Object.freeze(O.value.properties);
  O.value.Extensible = false;
  return O;

}

// ------------------------------------------------------------
// 15.2.3.10

function preventExtensions(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<IEcmaObject> {
  let O = args[0] || new Value(undefined, bot);
  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.preventExtensions');
    throw 'TypeScript';
  }

  let context = lub(monitor.context.effectivePC, O.label);

  monitor.assert(
    le(context, O.value.struct),
    'Object.preventExtensions: context label ' + context + ' not below structural label ' + O.value.struct + ' of object'
  );

  Object.preventExtensions(O.value.properties);
  O.value.Extensible = false;
  return O;
}

// ------------------------------------------------------------
// 15.2.3.11

function isSealed(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {
  let O = args[0] || new Value(undefined, bot);
  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.isSealed');
    throw 'TypeScript';
  }

  let result = Object.isSealed(O.value.properties);
  return new Value(result, lub(O.label, O.value.struct));
}


// ------------------------------------------------------------
// 15.2.3.12

function isFrozen(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {
  let O = args[0] || new Value(undefined, bot);
  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.isFrozen');
    throw 'TypeScript';
  }

  let result = Object.isFrozen(O.value.properties);
  return new Value(result, lub(O.label, O.value.struct));
}

// ------------------------------------------------------------
// 15.2.3.13

function isExtensible(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {
  let O = args[0] || new Value(undefined, bot);
  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.isExtensible');
    throw 'TypeScript';
  }

  let result = Object.isExtensible(O.value.properties);
  return new Value(result, lub(O.label, O.value.struct));
}

// ------------------------------------------------------------
// 15.2.3.14
function keys(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ArrayObject> {
  let O= args[0] || new Value(undefined, bot);

  if (!IsIEcmaObject(O)) {
    AssertObject(O, 'Object.isExtensible');
    throw 'TypeScript';
  }

  let enumerable = O.value.getOwnEnumerablePropertyNames(O.label);
  let array = ArrayObject.fromPropertyArray(enumerable, O.value.struct);

  return new Value(array, bot);
}