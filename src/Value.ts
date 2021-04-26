import { Label, lub } from "./Label";
import { ValueTypes, PrimitiveValueTypes, IEcmaFunction, IEnvironmentRecord, IEcmaObject } from "./Interfaces";
import { LabeledPropertyDescriptor, JSFPropertyDescriptor } from "./PropertyDescriptor";

import { MonitorBase } from "./MonitorBase";
declare var monitor: MonitorBase;

// ------------------------------------------------------------
// Value - labeled values

export class Value<T> {
  public value: T;
  public label: Label;
  constructor(value: T, label: Label) {
    this.value = value;
    this.label = label;
    if (label === undefined) {
      throw new Error("Value with undefined label");
    }
  }

  // ------------------------------------------------------------

  raise(l: Label): void {
    this.label = lub(this.label, l);
  }

  // ------------------------------------------------------------

  clone(): Value<T> {
    return new Value(this.value, this.label);
  }

  // ------------------------------------------------------------

  toString() {
    if (typeof this.value === 'string') {
      return "'" + this.value + "'_" + this.label;
    }
    else {
      return this.value + "_" + this.label;
    }
  }

  // ------------------------------------------------------------
  // Ecma
  GetOwnProperty(s: Value<string | number>): Value<LabeledPropertyDescriptor | undefined> {
    let value = <IEcmaObject><unknown>this.value;
    return InContext(this.label, () => { return value.GetOwnProperty(s); });
  }
  GetProperty(s: Value<string | number>): Value<LabeledPropertyDescriptor | undefined> {
    let value = <IEcmaObject><unknown>this.value;
    return InContext(this.label, () => { return value.GetProperty(s); });
  }
  Get(s: Value<string | number>): Value<ValueTypes> {
    let value = <IEcmaObject><unknown>this.value;
    return InContext(this.label, () => { return value.Get(s); });
  }
  CanPut(p: Value<string | number>): Value<boolean> {
    let value = <IEcmaObject><unknown>this.value;
    return InContext(this.label, () => { return value.CanPut(p); });
  }
  Put(s: Value<string | number>, v: Value<ValueTypes>, Throw?: boolean): void {
    let value = <IEcmaObject><unknown>this.value;
    return InContext(this.label, () => { return value.Put(s, v, Throw); });
  }
  HasProperty(s: Value<string | number>): Value<boolean> {
    let value = <IEcmaObject><unknown>this.value;
    return InContext(this.label, () => { return value.HasProperty(s); });
  }
  Delete(s: Value<string | number>, Throw?: boolean): Value<boolean> {
    let value = <IEcmaObject><unknown>this.value;
    return InContext(this.label, () => { return value.Delete(s, Throw); });
  }
  DefaultValue(hint?: "string" | "number"): Value<PrimitiveValueTypes> {
    let value = <IEcmaObject><unknown>this.value;
    return InContext(this.label, () => { return value.DefaultValue(hint); });
  }
  DefineOwnProperty(s: Value<string>, desc: JSFPropertyDescriptor, Throw?: Boolean): Value<boolean> {
    let value = <IEcmaObject><unknown>this.value;
    return InContext(this.label, () => { return value.DefineOwnProperty(s, desc, Throw); });
  }

  // ---
  // Function
  HasInstance(V: Value<ValueTypes>): Value<boolean> {
    let value = <IEcmaFunction><unknown>this.value;
    return InContext(this.label, () => { return value.HasInstance(V); });
  }
  Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let value = <IEcmaFunction><unknown>this.value;
    return InContext(this.label, () => { return value.Call(thisArg, args); });
  }
  Construct(args: Value<ValueTypes>[]): Value<IEcmaObject | undefined> {
    let value = <IEcmaFunction><unknown>this.value;
    return InContext(this.label, () => { return value.Construct(args); });
  }
  // ---
  // ObjectEnvironmentRecord, DeclarativeEnvironmentRecord
  HasBinding(p: Value<string>): Value<boolean> {
    let value = <IEnvironmentRecord><unknown>this.value;
    return InContext(this.label, () => { return value.HasBinding(p); });
  }
  CreateMutableBinding(p: Value<string>, d: boolean): void {
    let value = <IEnvironmentRecord><unknown>this.value;
    return InContext(this.label, () => { return value.CreateMutableBinding(p, d); });
  }
  GetBindingValue(p: Value<string>, s?: boolean): Value<ValueTypes> {
    let value = <IEnvironmentRecord><unknown>this.value;
    return InContext(this.label, () => { return value.GetBindingValue(p, s); });
  }
  SetMutableBinding(p: Value<string>, v: Value<ValueTypes>, s?: boolean): void {
    let value = <IEnvironmentRecord><unknown>this.value;
    return InContext(this.label, () => { return value.SetMutableBinding(p, v, s); });
  }
  DeleteBinding(p: Value<string>): Value<boolean> {
    let value = <IEnvironmentRecord><unknown>this.value;
    return InContext(this.label, () => { return value.DeleteBinding(p); });
  }
  ImplicitThisValue(): Value<IEcmaObject | undefined> {
    let value = <IEnvironmentRecord><unknown>this.value;
    return InContext(this.label, () => { return value.ImplicitThisValue(); });
  }
  // DeclarativeEnvironmentRecord
  CreateImmutableBinding(p: Value<string>): void {
    let value = <any>this.value;
    return InContext(this.label, () => { return value.CreateImmutableBinding(p); });
  }
  InitializeImmutableBinding(p: Value<string>, v: Value<ValueTypes>): void {
    let value = <any>this.value;
    return InContext(this.label, () => { return value.InitializeImmutableBinding(p, v); });
  }
}

function InContext<T>(l: Label, f: () => T): T {
  monitor.context.pushPC(l);
  let res = f();
  monitor.context.popPC();

  if (res instanceof Value) {
    res.raise(l);
  }

  return res;
}
