import { Value } from "../Value";
import * as constants from '../Constants';
import { HasInstance } from '../HasInstance';
import { MonitorBase } from '../MonitorBase';
import { EcmaObject } from '../Objects/EcmaObject';
import { DefineFFF } from '../Define';
import { bot } from '../Label';
import { ErrorObject } from '../Objects/ErrorObject';
import { ErrorPrototype } from '../Prototypes/ErrorPrototype';
import { ValueTypes } from "../Interfaces";

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// 15.11 - The Error Constructor

export class ErrorConstructor extends EcmaObject {

    host: any;
    name: String;

    constructor(host : Error) {
        super();
        this.Class = 'Function';
        this.host = host;
        this.Extensible = true;
        this.name = 'Error';
    }

    Setup(): void {
        this.SetupBase(monitor.instances.ErrorPrototype);
    }

    SetupBase(prototype : ErrorPrototype): void {
        this.Prototype = new Value(monitor.instances.FunctionPrototype, bot);

        DefineFFF(this, constants.length, 1);
        DefineFFF(this, constants.prototype, prototype);
    }

    HasInstance(V: Value<ValueTypes>): Value<boolean> {
        return HasInstance.call(this, V);
    }

    // 15.11.2
    Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ErrorObject> {
        return this.Construct(args);
    }

    // 15.11.2.1
    Construct(args: Value<ValueTypes>[]): Value<ErrorObject> {
        var arg0 = args[0] ? args[0] : new Value(undefined, bot);
        var o = new ErrorObject(arg0);
        return new Value(o, bot);
    }
}
