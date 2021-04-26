import { Label } from "./Label";
import { Value } from "./Value";
import { PropertyLabel } from "./PropertyLabel";

import * as estree from 'estree';
import { LexicalEnvironment } from "./LexicalEnvironment";
import { LabeledPropertyDescriptor, JSFPropertyDescriptor } from "./PropertyDescriptor";
import { WorkListPtr } from "./Context";

// ---

export type ThrowType = "Error" | "EvalError" | "RangeError" | "ReferenceError" | "SyntaxError" | "TypeError" | "URIError"

export type PrimitiveValueTypes = undefined | null | number | boolean | string
export type ValueTypes = PrimitiveValueTypes | IEcmaObject | IEcmaFunction | LabeledPropertyDescriptor;

export interface IEcmaObject {

  Class?: string;
  Prototype: Value<IEcmaObject | null>;
  Extensible: boolean;

  // encoding
  properties: { [s: string]: any };

  // security
  labels: { [s: string]: PropertyLabel };
  struct: Label;

  // standard mandated inner properties
  GetOwnProperty(s: Value<string | number>): Value<LabeledPropertyDescriptor | undefined>;
  GetProperty(s: Value<string | number>): Value<LabeledPropertyDescriptor | undefined>;
  Get(s: Value<string | number>): Value<ValueTypes>;
  CanPut(p: Value<string | number>): Value<boolean>;
  Put(s: Value<string | number>, v: Value<ValueTypes>, Throw?: boolean): void;
  HasProperty(s: Value<string | number>): Value<boolean>;
  Delete(s: Value<string | number>, Throw?: boolean): Value<boolean>;
  DefaultValue(hint?: "string" | "number"): Value<PrimitiveValueTypes>;
  DefineOwnProperty(s: Value<string | number>, desc: JSFPropertyDescriptor, Throw?: Boolean): Value<boolean>;

  // other internal properties
  getOwnPropertyNames(label: Label): Value<string>[];
  getOwnEnumerablePropertyNames(label: Label): Value<string>[];
  getEnumerablePropertyNames(initialLabel: Label): Value<string>[];
}


export function IsIEcmaObject(x: Value<ValueTypes>): x is Value<IEcmaObject> {
  return typeof x.value === 'object' && x.value !== null && "Class" in x.value;
}

// NOTE: Call may get values, see, e.g., 15.3.4.3
export interface IEcmaFunction extends IEcmaObject {

  Scope?: Value<LexicalEnvironment>;
  FormalParameters?: Array<estree.Pattern>;
  Code?: estree.Statement | estree.Expression;

  HasInstance(V: Value<ValueTypes>): Value<boolean>;
  Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes>
  Construct(args: Value<ValueTypes>[]): Value<IEcmaObject>
  AsyncCall?(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): WorkListPtr
  AsyncCallEnd?(): Value<ValueTypes>
  AsyncConstruct?(args: Value<ValueTypes>[]): WorkListPtr
  AsyncConstructEnd?(): Value<IEcmaObject | undefined>
}

export interface IEnvironmentRecord {
  HasBinding(p: Value<string>): Value<boolean>;
  CreateMutableBinding(p: Value<string>, d?: boolean): void;
  GetBindingValue(p: Value<string>, s? : boolean): Value<ValueTypes>;
  SetMutableBinding(p: Value<string>, v: Value<ValueTypes>, s?: boolean): void;
  DeleteBinding(p: Value<string>): Value<boolean>;
  ImplicitThisValue(): Value<IEcmaObject | undefined>;
}
