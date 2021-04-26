
import { bot } from '../Label';
import { Value } from "../Value";
import { DefineFFF } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';
import * as constants from '../Constants';
import { HasInstance } from '../HasInstance';
import { NumberObject } from '../Objects/NumberObject';

// ------------------------------------------------------------

import { MonitorBase } from '../MonitorBase';

import { ToNumber } from '../Conversion/ToNumber';
import { ValueTypes } from '../Interfaces';
declare var monitor: MonitorBase;

// ------------------------------------------------------------
// The Number Constructor, 15.7.2

export class NumberConstructor extends EcmaObject {

    host: any;

    constructor(host: Number) {
        super();

        this.Class = 'Function';
        // not mandated by standard
        this.Extensible = true;

        this.host = host
    }

    Setup(): void {
        this.Prototype = new Value(monitor.instances.FunctionPrototype, bot);

        DefineFFF(this, constants.prototype, monitor.instances.NumberPrototype);
        DefineFFF(this, constants.length, 1);
        DefineFFF(this, constants.MAX_VALUE, this.host.MAX_VALUE);
        DefineFFF(this, constants.MIN_VALUE, this.host.MIN_VALUE);
        DefineFFF(this, constants.NaN, this.host.NaN);
        DefineFFF(this, constants.NEGATIVE_INFINITY, this.host.NEGATIVE_INFINITY);
        DefineFFF(this, constants.POSITIVE_INFINITY, this.host.POSITIVE_INFINITY);
    }

    HasInstance(V: Value<ValueTypes>): Value<boolean> {
        return HasInstance.call(this, V);
    }

    // 15.7.1.1
    Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
        if (!args[0]) {
            return new Value(0, bot);
        }

        return ToNumber(args[0]);
    }

    // 15.7.2.1
    Construct(args: Value<ValueTypes>[]): Value<NumberObject> {
        let arg0 = args[0] ? ToNumber(args[0]) : new Value(0, bot);
        let res = new NumberObject(arg0.value, arg0.label);
        return new Value(res, bot);
    }
}