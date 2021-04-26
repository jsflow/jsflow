import { IEcmaObject, ValueTypes, PrimitiveValueTypes } from "../Interfaces";
import { LabeledPropertyDescriptor, JSFPropertyDescriptor } from "../PropertyDescriptor";
import { Value } from "../Value";
import { bot, Label, lub, le } from "../Label";
import { PropertyLabel } from "../PropertyLabel";
import { IsAccessorDescriptor, IsDataDescriptor } from "../PropertyDescriptor";
import * as constants from '../Constants';
import { IsCallable } from "../Utility/IsCallable";
import { MonitorBase } from "../MonitorBase";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// Ecma Objects, 8.6.2

export class EcmaObject implements IEcmaObject {

  Class?: string;

  _prototype : Value<IEcmaObject | null> = new Value(null, bot);

  get Prototype(): Value<IEcmaObject | null> {
     return this._prototype;
  }

  set Prototype(p : Value<IEcmaObject | null>) {
    this._prototype = p;
  }

  Extensible: boolean = true;

  properties: { [key: string]: ValueTypes } | ValueTypes[] = {};

  labels: { [key: string]: PropertyLabel } = {};
  struct: Label;

  constructor() {

    this.properties = {};
    this.labels = {};

    this.struct = monitor.context.effectivePC;

    Object.defineProperty(this, 'map', {
      get: function () {
        throw new Error('Something touched Ecma.map');
      },
      configurable: true
    });

  }

  // ---

  toString() : string {
    return this.Class ? this.Class : 'EcmaObject';
  }

  // --- used by lprint

  toLabeledString() : string {
    return this.toString();
  }

  // ---

  getOwnPropertyNames(label: Label): Value<string>[] {
    let names = Object.getOwnPropertyNames(this.properties);
    let result: Value<string>[] = [];

    for (let i = 0, len = names.length; i < len; i++) {
      let name = names[i];
      result[i] = new Value(name, lub(label, this.labels[name].existence));
    }

    return result;
  }

  // ---

  getOwnEnumerablePropertyNames(label: Label): Value<string>[] {
    let names = Object.getOwnPropertyNames(this.properties);
    let enumerable: Value<string>[] = [];
    let j = 0;

    for (let i = 0, len = names.length; i < len; i++) {
      let name = names[i];
      // from getOwnPropertyNames; guaranteed to be found
      let desc = <PropertyDescriptor>Object.getOwnPropertyDescriptor(this.properties, name);
      if (desc.enumerable) {
        enumerable[j++] = new Value(name, lub(label, this.labels[name].existence));
      }
    }
    return enumerable;
  }

  // ---

  getEnumerablePropertyNames(initialLabel: Label): Value<string>[] {

    let defined = {};
    let result: Value<string>[] = [];

    let j = 0;

    let current: EcmaObject | null = this;
    let lbl = initialLabel || bot;

    while (current) {
      let enumerable = current.getOwnEnumerablePropertyNames(lbl);

      for (let i = 0, len = enumerable.length; i < len; i++) {
        let name = enumerable[i];
        if (!defined.hasOwnProperty(name.value)) {
          defined[name.value] = true;
          result[j++] = name;
        }
      }

      let next = current.Prototype;
      //@ts-ignore TYPES
      current = next.value;
      lbl = lub(lbl, next.label);
    }

    return result;
  }

  // GetOwnProperty, 8.12.1 -----------------------------------------------------

  GetOwnProperty(s: Value<string | number>): Value<LabeledPropertyDescriptor | undefined> {
    let propName = s.value;
    let propNameLabel = s.label;

    let jsdesc = Object.getOwnPropertyDescriptor(this.properties, propName);

    if (jsdesc === undefined) {
      return new Value(undefined, lub(this.struct, propNameLabel));
    }
    let propLabel = this.labels[propName];

    // @ts-ignore
    jsdesc.label = propLabel.value;

    let result = new Value(<LabeledPropertyDescriptor>jsdesc, lub(propNameLabel, propLabel.existence));
    return result;
  }

  // GetProperty, 8.12.2 --------------------------------------------------------

  GetProperty(s: Value<string | number>): Value<LabeledPropertyDescriptor | undefined> {
    let prop = this.GetOwnProperty(s);
    if (prop.value !== undefined) {
      return prop;
    }

    let proto = this.Prototype;
    let lbl = lub(prop.label, proto.label);

    if (proto.value === null) {
      return new Value(undefined, lbl);
    }

    // DEBUG: remove
    if (proto.value === undefined) {
      monitor.fatal('ECMA Object with undefined Prototype');
    }

    let res = proto.GetProperty(s);
    res.label = lub(lbl, res.label);
    return res;
  }

  // Get, 8.12.3 ----------------------------------------------------------------

  Get(s: Value<string | number>): Value<ValueTypes> {

    let descValue = this.GetProperty(s);

    if (descValue.value === undefined) {
      return new Value(undefined, descValue.label);
    }

    let v: Value<ValueTypes>;
    let desc = descValue.value;

    monitor.context.pushPC(descValue.label);

    if ('value' in desc) {
      v = new Value(desc.value, desc.label);
    } else if (desc.get) {
      monitor.context.pushPC(desc.label);
      v = desc.get.call(this);
      monitor.context.popPC();
    } else {
      v = new Value(undefined, descValue.label);
    }

    monitor.context.popPC();

    v.raise(descValue.label);
    return v;
  }

  // CanPut, 8.12.4 -------------------------------------------------------------

  CanPut(p: Value<string | number>): Value<boolean> {
    let labeledDesc = this.GetOwnProperty(p);

    let label = labeledDesc.label;

    if (labeledDesc.value) {
      let desc = labeledDesc.value;
      label = lub(label, desc.label);

      if (IsAccessorDescriptor(desc)) {
        return new Value(desc.set !== undefined, label);
      } else {
        return new Value(!!desc.writable, label);
      }
    }

    let proto = this.Prototype;
    if (proto.value === null) {
      return new Value(this.Extensible, label);
    }

    let lableledPrototypeDesc = proto.GetProperty(p);
    label = lub(label, lableledPrototypeDesc.label);

    if (lableledPrototypeDesc.value === undefined) {
      return new Value(this.Extensible, label);
    }

    let prototypeDesc = lableledPrototypeDesc.value;
    label = lub(label, prototypeDesc.label);

    if (IsAccessorDescriptor(prototypeDesc)) {
      return new Value(prototypeDesc.set !== undefined, label);
    } else {
      if (!this.Extensible) {
        return new Value(false, label);
      } else {
        return new Value(!!prototypeDesc.writable, label);
      }
    }
  }

  // Put, 8.12.5 ----------------------------------------------------------------

  Put(s: Value<string | number>, v: Value<ValueTypes>, Throw: boolean): void {
    let c = monitor.context;

    let canPut = this.CanPut(s);
    if (!canPut.value) {
      if (Throw) {
        c.pushPC(canPut.label);
        monitor.Throw(
          "TypeError",
          'illegal access',
          bot
        );
      }

      return;
    }

    c.pushPC(new Label());

    let ownDesc = this.GetOwnProperty(s);

    if (ownDesc.value && IsDataDescriptor(ownDesc.value)) {
      this.DefineOwnProperty(s, { value: v.value, label: v.label }, Throw);
      c.popPC();
      return;
    }

    let desc = this.GetProperty(s);
    if (desc.value && IsAccessorDescriptor(desc.value)) {

      this.struct = lub(this.struct, s.label);
      if (desc.value.set) {
        c.labels.pc = lub(c.labels.pc, desc.label);

        try {
          desc.value.set.call(this, v);
        } catch (e) {
          monitor.tryRethrow(e, Throw);
          monitor.fatal(`EcmaObject.Put, unable to lift ${e} of type ${typeof e} (Put(${s.value}, ${v.value}) on ${this.properties})`);
        }

      }

      c.popPC();
      return;
    }

    c.labels.pc = lub(c.labels.pc, desc.label);
    this.DefineOwnProperty(s,
      {
        value: v.value,
        label: v.label,
        writable: true,
        enumerable: true,
        configurable: true
      }, Throw);
    c.popPC();
    return;
  }

  // HasProperty, 8.12.6 --------------------------------------------------------

  HasProperty(s: Value<string | number>): Value<boolean> {
    let desc = this.GetProperty(s);

    let val = new Value(desc.value !== undefined, desc.label);
    return val;
  }

  // Delete, 8.12.7 -------------------------------------------------------------

  Delete(s: Value<string | number>, Throw?: boolean): Value<boolean> {
    let c = monitor.context;
    let propertyName = s.value;

    let desc = this.GetOwnProperty(s);

    if (desc.value === undefined) {
      return new Value(true, desc.label);
    }

    if (!le(c.effectivePC, this.struct)) {
      let msg = `Ecma.prototype.Delete: security context ${c.effectivePC} not below structure ${this.struct}`;
      monitor.securityError(msg);

      // For observable flows
      this.struct = lub(this.struct, c.effectivePC);
    }

    let lbl = lub(c.effectivePC, desc.label);
    let existence = this.labels[propertyName].existence;

    // use pc stack for taint mode
    c.pushPC(lbl);
    if (!le(c.effectivePC, existence)) {
      let msg = `Ecma.prototype.Delete: security context ${lbl} not below exstence label ${existence}`;
      monitor.securityError(msg);

      // For observable flows
      existence = lub(existence, lbl);
    }
    c.popPC();

    let res;
    try {
      res = delete this.properties[propertyName];
      if (res) {
        delete this.labels[propertyName];
      }
    } catch (e) {
      monitor.tryRethrow(e, Throw);
      monitor.fatal(`EcmaObject.Delete, unable to lift ${e} of type ${typeof e} (Delete(${s.value}) on ${this.properties})`);
    }

    return new Value(res, lub(desc.label, existence));
  }

  // DefaultValue, 8.12.8 -------------------------------------------------------

  DefaultValue(hint?: "string" | "number"): Value<PrimitiveValueTypes> {

    if (hint === undefined) {
      if (this.Class === 'Date')
        hint = 'string';
      else
        hint = 'number';
    }

    if (hint === 'string') {
      let toString = this.Get(constants.toString);

      if (IsCallable(toString)) {
        let str = toString.Call(new Value(this, bot), []);

        if (isDefinedPrimitiveValue(str))
          return str;
      }

      monitor.context.pushPC(toString.label);

      let valueOf = this.Get(constants.valueOf);
      if (IsCallable(valueOf)) {
        let str = valueOf.Call(new Value(this, bot), []);

        if (isDefinedPrimitiveValue(str)) {
          str.raise(toString.label);
          monitor.context.popPC();
          return str;
        }
      }

      // return new Value('DefaultValue: unable to convert', bot);

      monitor.Throw(
        "TypeError",
        'default value, unable to convert',
        lub(toString.label, valueOf.label)
      );
    }

    // hint must be 'number'


    let valueOf = this.Get(constants.valueOf);
    if (IsCallable(valueOf)) {
      let str = valueOf.Call(new Value(this, bot), []);

      if (isDefinedPrimitiveValue(str))
        return str;
    }

    monitor.context.pushPC(valueOf.label);

    let toString = this.Get(constants.toString);

    if (IsCallable(toString)) {
      let str = toString.Call(new Value(this, bot), []);
      if (isDefinedPrimitiveValue(str)) {
        str.raise(valueOf.label);
        monitor.context.popPC();
        return str;
      }
    }

    return monitor.Throw(
      "TypeError",
      'default value, unable to convert',
      lub(toString.label, valueOf.label)
    );
  }

  // DefineOwnProperty, 8.12.9 --------------------------------------------------

  DefineOwnProperty(s: Value<string | number>, desc: JSFPropertyDescriptor, Throw?: Boolean): Value<boolean> {
    let c = monitor.context;

    let propName = s.value;
    let propNameLabel = s.label;

    let contextLabel = lub(c.effectivePC, propNameLabel);

    try {
      if (Object.hasOwnProperty.call(this.properties, propName)) {
        let valueLabel = this.labels[propName].value;

        // use the pc stack to make taint mode easier
        c.pushPC(contextLabel);
        if (!le(c.effectivePC, valueLabel)) {
          let msg = `Ecma.prototype.DefineOwnProperty: security context ${contextLabel} not below existing value label ${valueLabel} for property ${propName}`;
          monitor.securityError(msg);

          // For observable flows
          valueLabel = lub(valueLabel, contextLabel);
        }
        c.popPC();
      } else {
        if (!le(c.effectivePC, this.struct)) {
          let msg = `Ecma.prototype.DefineOwnProperty: security context ${c.effectivePC} not below structure ${this.struct}`;
          monitor.securityError(msg);

          // For observable flows
          this.struct = lub(this.struct, c.effectivePC);
        }
      }

      this.struct = lub(this.struct, propNameLabel);

      if (desc.get) {
        let get = desc.get;
        //@ts-ignore DESC HELL
        desc.get = function () { return get.Call(new Value(this, bot), []); };
        //@ts-ignore DESC HELL
        desc.get.actualFunction = get;
      }

      if (desc.set) {
        let set = desc.set;
        //@ts-ignore DESC HELL
        desc.set = function (v) { return set.Call(new Value(this, bot), [v]); };
        //@ts-ignore DESC HELL
        desc.set.actualFunction = set;
      }

      //@ts-ignore DESC HELL
      Object.defineProperty(this.properties, propName, desc);
      this.labels[propName] = { value: lub(desc.label, contextLabel), existence: contextLabel };

    } catch (e) {
      //@ts-ignore TYPES
      monitor.tryRethrow(e, Throw);
      monitor.fatal(`EcmaObject.DefineOwnProperty, unable to lift ${e} of type ${typeof e} (DefineOwnProperty(${s.value}, ${desc}) on ${this.properties})`);
    }

    return new Value(true, bot);
  }

}

function isDefinedPrimitiveValue(value: Value<any>): value is Value<PrimitiveValueTypes> {
  return typeof value.value === 'boolean' || typeof value.value === 'string' || typeof value.value === 'number'
}