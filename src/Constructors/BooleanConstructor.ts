import { Value } from "../Value";
import * as constants from '../Constants';
import { HasInstance } from '../HasInstance';
import { DefineFFF } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';
import { bot } from '../Label';
import { BooleanObject } from '../Objects/BooleanObject';
import { ToBoolean } from '../Conversion/ToBoolean';

import { MonitorBase } from '../MonitorBase';
import { ValueTypes } from "../Interfaces";
declare var monitor: MonitorBase;

// ------------------------------------------------------------
// 15.6.2 

export class BooleanConstructor extends EcmaObject {

    host: any;

    constructor(host: Boolean) {
        super();
        this.Class = 'Function';
        this.Extensible = true;
        this.host = host;
    }

    Setup() {
        this.Prototype = new Value(monitor.instances.FunctionPrototype, bot);
        DefineFFF(this, constants.length, 1); //REMOVE ?
        DefineFFF(this, constants.prototype, monitor.instances.BooleanPrototype);
    }

    HasInstance(V: Value<ValueTypes>): Value<boolean> {
        return HasInstance.call(this, V);
    }

    // 15.6.1.1
    Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {
        let arg0 = args[0] ? args[0] : new Value(undefined, bot);

        return ToBoolean(arg0);
    }

    // 15.6.2.1
    Construct(args: Value<ValueTypes>[]): Value<BooleanObject> {
        let arg0 = args[0] ? args[0] : new Value(undefined, bot);

        let b = ToBoolean(arg0);
        let obj = new BooleanObject(b.value, b.label);

        return new Value(obj, bot);
    }
}