import { Value } from "../Value";
import { EcmaObject } from '../Objects/EcmaObject';
import * as constants from '../Constants';
import { ToString } from '../Conversion/ToString';
import { bot } from '../Label';
import { MonitorBase } from '../MonitorBase';
import { ValueTypes } from "../Interfaces";
import { StackTrace } from "../StackTrace";


// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------

export class ErrorObject extends EcmaObject {

  stack: StackTrace;
  message: string;

  constructor(v: Value<ValueTypes>) {
    super();
    this.Prototype = new Value(monitor.instances.ErrorPrototype, bot);
    this.Class = 'Error';
    this.Extensible = true;

    let message = new Value("", bot);

    if (v.value !== undefined) {
      message = ToString(v);
    }

    this.DefineOwnProperty(
      constants.message,
      {
        value: message.value,
        label: message.label,
        writable: true,
        enumerable: false,
        configurable: true
      }
    );

    // for toString
    this.message = message.value;
    this.stack = monitor.stackTrace();
  }

  toString(): string {
    let str = 'Error: ' + this.message + '\n' + this.stack.toString();
    return str;
  }
}