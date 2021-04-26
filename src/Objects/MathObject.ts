import { Value } from "../Value";
import * as constants from '../Constants';
import { BuiltinFunctionObject } from "./BuiltinFunctionObject";
import { ToNumber } from '../Conversion/ToNumber';
import { MonitorBase } from '../MonitorBase';

import { DefineFFF, DefineTFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';

import { bot, lub } from '../Label';
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// The Math Object, 15.8.2

export class MathObject extends EcmaObject {

    host: Math;

    constructor(host: any) {
        super();

        this.Class = 'Math';
        // not mandated by standard
        this.Extensible = true;
        this.host = host;

    }

    Setup(): void {
        this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);

        DefineFFF(this, constants.length, 1);
        DefineFFF(this, constants.prototype, monitor.instances.ObjectPrototype);

        DefineFFF(this, constants.E, this.host.E);
        DefineFFF(this, constants.LN10, this.host.LN10);
        DefineFFF(this, constants.LN2, this.host.LN2);
        DefineFFF(this, constants.LOG2E, this.host.LOG2E);
        DefineFFF(this, constants.LOG10E, this.host.LOG10E);
        DefineFFF(this, constants.PI, this.host.PI);
        DefineFFF(this, constants.SQRT1_2, this.host.SQRT1_2);
        DefineFFF(this, constants.SQRT2, this.host.SQRT2);

        //@ts-ignore TYPES
        DefineTFT(this, constants.abs, new BuiltinFunctionObject(abs, 1, this.host.abs));
        //@ts-ignore TYPES
        DefineTFT(this, constants.acos, new BuiltinFunctionObject(acos, 1, this.host.acos));
        //@ts-ignore TYPES
        DefineTFT(this, constants.asin, new BuiltinFunctionObject(asin, 1, this.host.asin));
        //@ts-ignore TYPES
        DefineTFT(this, constants.atan, new BuiltinFunctionObject(atan, 1, this.host.atan));
        //@ts-ignore TYPES
        DefineTFT(this, constants.atan2, new BuiltinFunctionObject(atan2, 2, this.host.atan2));
        //@ts-ignore TYPES
        DefineTFT(this, constants.ceil, new BuiltinFunctionObject(ceil, 1, this.host.ceil));
        //@ts-ignore TYPES
        DefineTFT(this, constants.cos, new BuiltinFunctionObject(cos, 1, this.host.cos));
        //@ts-ignore TYPES
        DefineTFT(this, constants.exp, new BuiltinFunctionObject(exp, 1, this.host.exp));
        //@ts-ignore TYPES
        DefineTFT(this, constants.floor, new BuiltinFunctionObject(floor, 1, this.host.floor));
        //@ts-ignore TYPES
        DefineTFT(this, constants.log, new BuiltinFunctionObject(log, 1, this.host.log));
        //@ts-ignore TYPES
        DefineTFT(this, constants.max, new BuiltinFunctionObject(max, 2, this.host.max));
        //@ts-ignore TYPES
        DefineTFT(this, constants.min, new BuiltinFunctionObject(min, 2, this.host.min));
        //@ts-ignore TYPES
        DefineTFT(this, constants.pow, new BuiltinFunctionObject(pow, 2, this.host.pow));
        //@ts-ignore TYPES
        DefineTFT(this, constants.random, new BuiltinFunctionObject(random, 0, this.host.random));
        //@ts-ignore TYPES
        DefineTFT(this, constants.round, new BuiltinFunctionObject(round, 1, this.host.round));
        //@ts-ignore TYPES
        DefineTFT(this, constants.sin, new BuiltinFunctionObject(sin, 1, this.host.sin));
        //@ts-ignore TYPES
        DefineTFT(this, constants.sqrt, new BuiltinFunctionObject(sqrt, 1, this.host.sqrt));
        //@ts-ignore TYPES
        DefineTFT(this, constants.tan, new BuiltinFunctionObject(tan, 1, this.host.tan));
    }
}


// ------------------------------------------------------------
// abs, 15.8.2.1
function abs(this: { host(x: number): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// acos, 15.8.2.2
function acos(this: { host(x: number): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// asin, 15.8.2.3
function asin(this: { host(x: number): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// atan, 15.8.2.4
function atan(this: { host(x: number): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// atan2, 15.8.2.5
function atan2(this: { host(x: number, y: number): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    let y = args[1] ? ToNumber(args[1]) : new Value(NaN, bot);
    return new Value(this.host(x.value, y.value), lub(x.label, y.label));
}

// ------------------------------------------------------------
// ceil, 15.8.2.6
function ceil(this: { host(x: number): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// cos, 15.8.2.7
function cos(this: { host(x: number): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// exp, 15.8.2.8
function exp(this: { host(x: number): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// floor, 15.8.2.9
function floor(this: { host(x: number): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// log, 15.8.2.10
function log(this: { host(x: number): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// max, 15.8.2.11
function max(this: { host(...values: number[]): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    if (args.length === 0) return new Value(Number.NEGATIVE_INFINITY, bot);
    let myArgs: any[] = [];
    let l = bot;
    for (let i = 0; i < args.length; i++) {
        myArgs[i] = args[i].value;
        l = lub(l, args[i].label);
    }
    return new Value(this.host.apply(null, myArgs), l);
}

// ------------------------------------------------------------
// min, 15.8.2.12
function min(this: { host(...values: number[]): number }, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    if (args.length === 0) return new Value(Number.POSITIVE_INFINITY, bot);
    let myArgs: any[] = [];
    let l = bot;
    for (let i = 0; i < args.length; i++) {
        myArgs[i] = args[i].value;
        l = lub(l, args[i].label);
    }
    return new Value(this.host.apply(null, myArgs), l);
}

// ------------------------------------------------------------
// pow, 15.8.2.13
function pow(this : { host(x: number, y :number) : number },thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    let y = args[1] ? ToNumber(args[1]) : new Value(NaN, bot);
    return new Value(this.host(x.value, y.value), lub(x.label, y.label));
}

// ------------------------------------------------------------
// random, 15.8.2.14
function random(this : { host() : number },thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    return new Value(this.host(), bot);
}

// ------------------------------------------------------------
// round, 15.8.2.15
function round(this : { host(x: number) : number },thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// sin, 15.8.2.16
function sin(this : { host(x: number) : number },thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// sqrt, 15.8.2.17
function sqrt(this : { host(x: number) : number },thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}

// ------------------------------------------------------------
// tan, 15.8.2.18
function tan(this : { host(x: number) : number },thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let x = args[0] ? ToNumber(args[0]) : new Value(NaN, bot);
    return new Value(this.host(x.value), x.label);
}