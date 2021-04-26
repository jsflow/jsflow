import { Label, bot, lub } from '../Label';
import { Value } from "../Value";
import { DefineFFF, DefineTFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';

import * as constants from '../Constants';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";

import { MonitorBase } from '../MonitorBase';

import { ToInteger } from '../Conversion/ToInteger';
import { ToString } from '../Conversion/ToString';
import { ToObject } from '../Conversion/ToObject';
import { CheckObjectCoercible } from '../Utility/CheckObjectCoercible';
import { ValueTypes } from '../Interfaces';
import { IsNumberObject, NumberObject } from '../Objects/NumberObject';
import { ToNumber } from '../Conversion/ToNumber';

declare var  monitor: MonitorBase;

// ------------------------------------------------------------
// The Number Prototype, 15.7.4
export class NumberPrototype extends EcmaObject {

    host: Number;
    PrimitiveValue: Number;
    PrimitiveLabel: Label;

    constructor(host: Number) {
        super();
        this.Class = 'Number';
        this.PrimitiveValue = new Number(0);
        this.PrimitiveLabel = bot;

        this.host = host;
    }

    Setup(): void {
        this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);
        DefineTFT(this, constants.constructor, monitor.instances.NumberConstructor);

        DefineTFT(this, constants.toString, new BuiltinFunctionObject(toString, 1, this.host.toString));
        DefineTFT(this, constants.toLocaleString, new BuiltinFunctionObject(toLocaleString, 0, this.host.toLocaleString));
        DefineTFT(this, new Value('valueOf', bot), new BuiltinFunctionObject(valueOf, 0, this.host.valueOf));
        DefineTFT(this, constants.toFixed, new BuiltinFunctionObject(toFixed, 0, this.host.toFixed));
        DefineTFT(this, constants.toExponential, new BuiltinFunctionObject(toExponential, 0, this.host.toExponential));
        DefineTFT(this, constants.toPrecision, new BuiltinFunctionObject(toPrecision, 0, this.host.toPrecision));
    }
}

function assertNumber(v : Value<any>, caller : string) : number {

    if (IsNumberObject(v)) {
        return v.value.PrimitiveValue.valueOf();
    }

    if (typeof v.value == "number") {
        return v.value;
    }


        monitor.context.pushPC(v.label);
        monitor.Throw(
            "TypeError",
            caller + ' is not generic',
            bot
        );
}

function IsNumberObjectOrNumber(x : Value<any>) : x is Value<NumberObject | number> {
    return typeof x.value === 'number' || IsNumberObject(x);
}

// ------------------------------------------------------------
// toString, 15.7.4.2
function toString(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {

    if (!IsNumberObjectOrNumber(thisArg)) {
        monitor.Throw(
            "TypeError",
            'Number.prototype.toString is not generic',
            thisArg.label
        );
        throw 'TypeScript';
    }

    let arg0 = args[0] || new Value(undefined, bot);
    if (arg0.value === undefined) {
        arg0.value = 10;
    }

    let radix = ToInteger(arg0);
    if (typeof thisArg.value === 'number') {
        let result = thisArg.value.toString(radix.value);
        return new Value(result, lub(thisArg.label, radix.label));
    }
    else {
        let result = thisArg.value.PrimitiveValue.toString(radix.value);
        return new Value(result, lub(thisArg.value.PrimitiveLabel, radix.label));
    }

};

// ------------------------------------------------------------
// toLocaleString, 15.7.4.3
function toLocaleString(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let newArgs = args.length > 0 ? args.slice(1) : args;
    return toString(thisArg, newArgs);
}

// ------------------------------------------------------------
// valueOf, 15.7.4.4
function valueOf(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {

    if (!IsNumberObjectOrNumber(thisArg)) {
        monitor.Throw(
            "TypeError",
            'Number.prototype.toString is not generic',
            thisArg.label
        );
        throw 'TypeScript';
    }

    if (typeof thisArg.value === 'number') {
        return new Value(thisArg.value, thisArg.label);
    }

    let result = thisArg.value.PrimitiveValue.valueOf();
    return new Value(result, thisArg.value.PrimitiveLabel);
};

// ------------------------------------------------------------
// toFixed, 15.7.4.5
function toFixed(thisArg: Value<NumberObject>, args: Value<ValueTypes>[]): Value<string> {
    let primitiveValue = assertNumber(thisArg, 'toFixed');


    let arg0 = args[0] ? args[0]: new Value(undefined, bot);
    let precision = ToInteger(arg0);

    return new Value(primitiveValue.toFixed(precision.value), lub(precision.label, thisArg.label));
};

// ------------------------------------------------------------
// toExponential, 15.7.4.6
function toExponential(thisArg: Value<NumberObject>, args: Value<ValueTypes>[]): Value<string> {
    let primitiveValue = assertNumber(thisArg, 'toExponential');

    let arg0 = args[0] ? args[0]: new Value(undefined, bot);
    let precision = ToInteger(arg0);

    return new Value(primitiveValue.toExponential(precision.value), lub(precision.label, thisArg.label));
};

// ------------------------------------------------------------
// toPrecision, 15.7.4.7
function toPrecision(thisArg: Value<NumberObject>, args: Value<ValueTypes>[]): Value<string> {
    let primitiveValue = assertNumber(thisArg, 'toPrecision');

    let arg0 = args[0] ? args[0]: new Value(undefined, bot);
    
    let lbl = lub(arg0.label, thisArg.label);
    if (arg0.value === undefined) {
        let strX = ToString(thisArg); //step 2
        return new Value(strX.value, lbl);
    }

    let precision = ToInteger(arg0); //step 3
    if (primitiveValue === NaN) return new Value('NaN', lbl); //step 4


    return new Value(primitiveValue.toPrecision(precision.value), lbl);
};
