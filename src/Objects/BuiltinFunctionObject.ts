
import { Value } from "../Value";
import { ValueTypes } from '../Interfaces';
import { BuiltinMethodObject } from './BuiltinMethodObject';

// ------------------------------------------------------------

export class BuiltinFunctionObject extends BuiltinMethodObject {

  constructor(f: (this: BuiltinFunctionObject, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]) => Value<ValueTypes>, n: number, host: Function | string) {
    super(undefined, f, n, host);
  }

}