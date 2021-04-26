import { Value } from "../Value";
import { EcmaObject } from '../Objects/EcmaObject';
import * as constants from '../Constants';
import { ToString } from '../Conversion/ToString';
import { bot } from '../Label';
import { MonitorBase } from '../MonitorBase';
import { StackTrace } from "../StackTrace";
import { ValueTypes } from "../Interfaces";


// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------

export abstract class NativeErrorObject extends EcmaObject {

    abstract Type: string;
    message: string;
    stack: StackTrace;
    nativeStack : string;

    constructor(proto: EcmaObject, v: Value<ValueTypes>) {
        super();
        this.Prototype = new Value(proto, bot);
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
        this.nativeStack = Error().stack;
    }

    toString(): string {
        let str = this.Type + ': ' + this.message + '\n' + this.stack.toString() + '\n' + this.nativeStack;
        return str;
    }
}