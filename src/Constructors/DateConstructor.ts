import { Value } from "../Value";
import * as constants from '../Constants';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { HasInstance } from '../HasInstance';
import { ToPrimitive } from '../Conversion/ToPrimitive';
import { ToNumber } from '../Conversion/ToNumber';
import { ToString } from '../Conversion/ToString';
import { DefineFFF, DefineTFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';
import { bot, Label, lub } from '../Label';
import { DateObject } from '../Objects/DateObject';

import { MonitorBase } from '../MonitorBase';
import { ValueTypes } from "../Interfaces";
declare var monitor: MonitorBase;


// ------------------------------------------------------------
// The Date Constructor, 15.9.3

export class DateConstructor extends EcmaObject {

    host: any;

    constructor(host: Date) {
        super();
        this.Class = 'Function';
        this.Extensible = true;
        this.host = host;
    }

    Setup() {
        this.Prototype = new Value(monitor.instances.FunctionPrototype, bot);

        DefineFFF(this, constants.length, 7);
        DefineFFF(this, constants.prototype, monitor.instances.DatePrototype);

        DefineTFT(this, constants.parse, new BuiltinFunctionObject(parse, 0, Date.parse));
        DefineTFT(this, constants.UTC, new BuiltinFunctionObject(UTC, 0, Date.UTC));
        DefineTFT(this, constants.now, new BuiltinFunctionObject(now, 0, Date.now));
    }

    HasInstance(V: Value<ValueTypes>): Value<boolean> {
        return HasInstance.call(this, V);
    }

    //----------------------------------------------------
    // 15.9.1.1
    Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
        let str = this.host();
        return new Value(str, bot);
    }

    //----------------------------------------------------

    // 15.9.3.1
    Construct(args: Value<ValueTypes>[]): Value<DateObject> {
        let _args: number[] = [];
        let label = new Label();
        let obj: DateObject;

        switch (args.length) {

            case 0:
                obj = new DateObject(new this.host(), new Label('Date'));

                break;

            case 1:
                let v = ToPrimitive(args[0]);
                if (typeof v.value !== 'string') {
                    v = ToNumber(v);
                }

                obj = new DateObject(new this.host(v.value), v.label);
                break;

            default:
                let len = args.length;
                let i = 0;
                for (; i < len; i++) {
                    let val = ToNumber(args[i]);
                    _args[i] = val.value;
                    lub(val.label);
                }

                if (len == 2) {
                    _args[2] = 1;
                }

                for (; i < 7; i++) {
                    _args[i] = 0;
                }

                let date = new this.host(
                    _args[0], _args[1], _args[2], _args[3], _args[4], _args[5], _args[6]
                );

                obj = new DateObject(date, label);
        }

        return new Value(obj, bot);
    };
}

// ------------------------------------------------------------
// parse, 15.9.4.2
function parse(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let arg = args[0] || new Value(undefined, bot);
    let string = ToString(arg);

    let number = monitor.instances.DateConstructor.host.parse(string.value);
    return new Value(number, string.label);
}

// ------------------------------------------------------------
// UTC, 15.9.4.3
function UTC(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let _args: number[] = [];
    let label = new Label();

    for (let i = 0, len = args.length; i < len; i++) {
        let val = ToNumber(args[i]);
        _args[i] = val.value;
        lub(val.label);
    }

    let number = monitor.instances.DateConstructor.host.UTC.apply(null, _args);
    return new Value(number, label);
}

// ------------------------------------------------------------
// now, 15.9.4.4
function now(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number>{
    let number = monitor.instances.DateConstructor.host.now();
    return new Value(number, bot/*top*/);
}
