import { bot } from '../Label';
import { Value } from "../Value";
import { DefineFFF } from '../Define';
import { EcmaObject } from './EcmaObject';
import * as constants from '../Constants';
import { MonitorBase } from '../MonitorBase';
import { ValueTypes, IEcmaObject } from '../Interfaces';

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------
export class BuiltinMethodObject extends EcmaObject {

  host: Function | string;
  actualFunction: (this: EcmaObject, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]) => Value<ValueTypes>;
  self: EcmaObject;

  constructor(self: EcmaObject | undefined, f: (this: EcmaObject, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]) => Value<ValueTypes>, n: number, host: Function | string) {
    super();
    this.host = host;
    this.actualFunction = f;
    this.self = self || this;

    this.Class = 'Function';

    this.Prototype = new Value(monitor.instances.FunctionPrototype, bot);
    this.Extensible = true;

    DefineFFF(this, constants.length, n);
  }

  Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    try {
      return this.actualFunction.call(this.self, thisArg, args);
    } catch (e) {
      monitor.tryRethrow(e, true);
      monitor.fatal(`BuiltinMethodObject.Call, unable to lift ${e} (error is of type ${typeof e} \noriginating from ${this.actualFunction} \nrepresenting host ${this.host}) \ncalled with this: ${thisArg.value} \nand args: ${args}`);
      throw 'TypeScript';
    }
  }

  Construct(args: Value<ValueTypes>[]): Value<IEcmaObject> {
    monitor.Throw(
      "TypeError",
      'cannot be used as a constructor',
      bot
    );
    throw 'TypeScript';
  }

  toString(): string {
    if (this.host) {
      return this.host.toString();
    } else {
      return this.actualFunction.toString();
    }
  }

}