import { Value } from "../Value";
import * as constants from '../Constants';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { DefineFFF, DefineTFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';
import { bot } from '../Label';
import { MonitorBase } from '../MonitorBase';
import { ValueTypes } from "../Interfaces";
import { IsBooleanObject } from "../Objects/BooleanObject";


// ------------------------------------------------------------

declare var monitor: MonitorBase;

// 15.6.4 ------------------------------------------------------------

export class BooleanPrototype extends EcmaObject {
    PrimitiveValue : Boolean;
    host : any;

    constructor(host : Boolean) {
        super();
        this.Class = 'Boolean';
        this.PrimitiveValue = new Boolean(false);
        this.host = host;
    }

    Setup() : void {
        this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);

        DefineTFT(this, constants.constructor, monitor.instances.BooleanConstructor);
        DefineTFT(this, constants.toString, new BuiltinFunctionObject(toString, 0, this.host.toString));
        DefineTFT(this, new Value('valueOf', bot), new BuiltinFunctionObject(valueOf, 0, this.host.valueOf));
    }
}


// toString, 15.6.4.2 -----------------------------------------

function toString(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let b = valueOf(thisArg, args);
    let s = b.value ? 'true' : 'false';
    return new Value(s, b.label);
};

// valueOf, 15.6.4.3 ------------------------------------------ 

function valueOf(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {

    if (typeof thisArg.value === 'boolean') {
        return new Value(thisArg.value, thisArg.label);
    }

    if (IsBooleanObject(thisArg)) {
        return new Value(thisArg.value.PrimitiveValue.valueOf(), thisArg.label);
    }

    monitor.Throw(
        "TypeError",
        'Boolean.prototype.valueOf is not generic',
        thisArg.label
    );
    throw 'TypeScript';
};