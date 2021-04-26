import { Value } from "../Value";
import * as constants from '../Constants';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { bot, Label, lub } from '../Label';
import { DefineFFF, DefineTFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';
import { ArrayObject } from '../Objects/ArrayObject';
import { HasInstance } from '../HasInstance';

import { MonitorBase } from '../MonitorBase';
import { IEcmaFunction, ValueTypes, IEcmaObject } from '../Interfaces';
import { IsConstructor } from "../Utility/IsConstructor";
import { ToString } from "../Conversion/ToString";
declare var monitor: MonitorBase;

// ------------------------------------------------------------
// 15.4.3 

export class ArrayConstructor extends EcmaObject implements IEcmaFunction {

    host: any;

    constructor(host: Array<any>) {
        super();
        this.Class = 'Function';
        this.Extensible = true;
        this.host = host;
    }

    Setup() {
        this.Prototype = new Value(monitor.instances.FunctionPrototype, bot);

        DefineFFF(this, constants.length, 1);
        DefineFFF(this, constants.prototype, monitor.instances.ArrayPrototype);

        DefineTFT(this, constants.isArray, new BuiltinFunctionObject(isArray, 1, Array.isArray));

        // ES6, 22.1.2.3
        DefineTFT(this, constants.of, new BuiltinFunctionObject(of, 1, Array.of));
    }


    HasInstance(V: Value<ValueTypes>): Value<boolean> {
        return HasInstance.call(this, V);
    }

    Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ArrayObject> {
        return this.Construct(args);
    }

    // ------------------------------------------------------------

    Construct(args: Value<ValueTypes>[]): Value<ArrayObject> {

        let array: ArrayObject;
        let len = args.length;

        if (len === 0 || len >= 2) {
            array = ArrayObject.fromValueArray(args, bot);
        } else {

            let arg = args[0];
            if (typeof arg.value === 'number') {
                array = new ArrayObject();
                array.properties.length = arg.value;
                array.labels.length = {
                    value: arg.label,
                    existence: bot
                };
            } else {
                array = ArrayObject.fromValueArray(args, bot);
            }
        }

        return new Value(array, bot);
    }
}

// ------------------------------------------------------------
// isArray, 15.4.3.1

function isArray(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]) {
    let arg = args[0] || new Value(undefined, bot);

    if (arg.value === null || typeof arg.value !== 'object') {
        return new Value(false, arg.label);
    }

    return new Value(arg.value.Class === 'Array', arg.label);
};

// ------------------------------------------------------------
// ES6: of, 22.1.2.3

function of(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]) {
    let len = args.length;
    let lbl = new Label();
    for (let arg of args) {
        lbl = lub(lbl, arg.label);
    }

    let A;
    if (IsConstructor(thisArg)) {
        // @ts-ignore
        A = thisArg.value.Construct([new Value(len, lbl)]);
    } else {
        A = new ArrayObject();
        A.properties.length = len;
        A.labels.length = {
            value: lbl,
            existence: bot
        };
    }

    let k = 0;
    while (k < len) {
        let kValue = args[k];
        let Pk = ToString(new Value(k, kValue.label));

        // 7.3.4 in ES6 will make this..
        let desc = {
            value: kValue.value,
            label: kValue.label,
            writable: true,
            enumerable: true,
            configurable: true
        };

        A.DefineOwnProperty(Pk, desc);
        k++;
    }

    return A;
};
