
import { Value } from "../Value";
import * as constants from '../Constants';
import * as _ from 'underscore';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { MonitorBase } from '../MonitorBase';

import { bot, lub, Label } from '../Label';
import { Define, DefineTFT, DefineTFF } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';

import { ArrayObject } from '../Objects/ArrayObject';
import { ToBoolean } from '../Conversion/ToBoolean';
import { ToInteger } from '../Conversion/ToInteger';
import { ToString } from '../Conversion/ToString';
import { ToObject } from '../Conversion/ToObject';
import { IsCallable } from '../Utility/IsCallable';
import { ToUInt32 } from '../Conversion/ToUInt32';
import { ValueTypes } from "../Interfaces";
import { exec } from "child_process";

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// 15.4.4
export class ArrayPrototype extends EcmaObject {

    host: Array<any>;

    constructor(host: Array<any>) {
        super();
        this.Class = 'Array';

        this.host = host;
    }

    Setup(): void {
        this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);

        DefineTFT(this, constants.constructor, monitor.instances.ArrayConstructor);
        DefineTFF(this, constants.length, 0);

        DefineTFT(this, constants.toString, new BuiltinFunctionObject(toString, 0, Array.prototype.toString));
        DefineTFT(this, constants.toLocaleString, new BuiltinFunctionObject(toLocaleString, 0, Array.prototype.toLocaleString));
        DefineTFT(this, constants.concat, new BuiltinFunctionObject(concat, 1, Array.prototype.concat));
        DefineTFT(this, constants.join, new BuiltinFunctionObject(join, 1, Array.prototype.join));
        DefineTFT(this, constants.pop, new BuiltinFunctionObject(pop, 0, Array.prototype.pop));
        DefineTFT(this, constants.push, new BuiltinFunctionObject(push, 1, Array.prototype.push));
        DefineTFT(this, constants.reverse, new BuiltinFunctionObject(reverse, 0, Array.prototype.reverse));
        DefineTFT(this, constants.shift, new BuiltinFunctionObject(shift, 0, Array.prototype.shift));
        DefineTFT(this, constants.slice, new BuiltinFunctionObject(slice, 2, Array.prototype.slice));
        DefineTFT(this, constants.sort, new BuiltinFunctionObject(sort, 1, Array.prototype.sort));
        DefineTFT(this, constants.splice, new BuiltinFunctionObject(splice, 2, Array.prototype.splice));
        DefineTFT(this, constants.unshift, new BuiltinFunctionObject(unshift, 1, Array.prototype.unshift));
        DefineTFT(this, constants.indexOf, new BuiltinFunctionObject(indexOf, 1, Array.prototype.indexOf));
        DefineTFT(this, constants.lastIndexOf, new BuiltinFunctionObject(lastIndexOf, 1, Array.prototype.lastIndexOf));
        DefineTFT(this, constants.every, new BuiltinFunctionObject(every, 1, Array.prototype.every));
        DefineTFT(this, constants.some, new BuiltinFunctionObject(some, 1, Array.prototype.some));
        DefineTFT(this, constants.forEach, new BuiltinFunctionObject(forEach, 1, Array.prototype.forEach));
        DefineTFT(this, constants.map, new BuiltinFunctionObject(map, 1, Array.prototype.map));
        DefineTFT(this, constants.filter, new BuiltinFunctionObject(filter, 1, Array.prototype.filter));
        DefineTFT(this, constants.reduce, new BuiltinFunctionObject(reduce, 1, Array.prototype.reduce));
        DefineTFT(this, constants.reduceRight, new BuiltinFunctionObject(reduceRight, 1, Array.prototype.reduceRight));

    }

}
// ------------------------------------------------------------
// toString, 15.4.4.2

function toString(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let array = ToObject(thisArg);
    let func = array.Get(constants.join);

    if (!IsCallable(func)) {
        func = monitor.instances.ObjectPrototype.Get(constants.toString);
    }

    // @ts-ignore
    return func.value.Call(array, []);
}

// ------------------------------------------------------------
// toLocaleString, 15.4.4.3
function toLocaleString(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {

    let array = ToObject(thisArg);
    let arrayLen = array.Get(new Value("length", bot));
    let len = ToUInt32(arrayLen);
    let separator = ',';

    let label = lub(monitor.context.effectivePC, array.label);

    if (len.value === 0) {
        return new Value("", label);
    }

    let firstElement = array.Get(new Value("0", bot));
    let R: Value<ValueTypes>;

    if (firstElement.value === undefined || firstElement.value === null) {
        R = new Value("", label);
    }
    else {
        let elementObj = ToObject(firstElement);
        let func = elementObj.Get(new Value("toLocaleString", bot));

        if (!IsCallable(func)) {
            monitor.Throw(
                "TypeError",
                'Array.prototype.toLocaleString: not a function',
                bot
            );
            throw 'TypeScript;'
        }

        // ES6 standard is doing this, and ES5 should be able to handle it
        R = ToString(func.value.Call(elementObj, []));
    }

    let k = 1;
    while (k < len.value) {
        //@ts-ignore TYPES
        let S = R.value.concat(separator);

        let nextElement = array.Get(new Value('' + k, bot));

        if (nextElement.value === undefined || firstElement.value === null) {
            R = new Value("", label);
        }
        else {
            let elementObj = ToObject(nextElement);
            let func = elementObj.Get(new Value("toLocaleString", bot));

            if (!IsCallable(func)) {
                monitor.Throw(
                    "TypeError",
                    'Array.prototype.toLocaleString: not a function',
                    bot
                );
                throw 'TypeScript;'
            }

            // ES6 standard is doing this, and ES5 should be able to handle it
            R = ToString(func.value.Call(elementObj, []));
        }
        R = new Value(S.concat(R.value), R.label);
        k++;
    }

    R.raise(label);
    //@ts-ignore TYPES
    return R;
}


// ------------------------------------------------------------
// concat, 15.4.4.4
function concat(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ArrayObject> {
    let O = ToObject(thisArg);
    let A = new ArrayObject();

    let n = 0;
    let c = monitor.context;
    let label = new Label();

    function aux(E) {
        c.pushPC(E.label);

        label = lub(label, E.label);

        if (E.value && E.value.Class === 'Array') {
            let k = 0;
            let len = E.Get(constants.length);

            label = lub(label, len.label);

            monitor.context.pushPC(len.label);

            while (k < len.value) {
                let _k = new Value(k, bot);
                let exists = E.HasProperty(_k);

                if (exists.value) {
                    monitor.context.pushPC(exists.label);

                    let subElement = E.Get(_k);

                    A.DefineOwnProperty(new Value(n, label), {
                        value: subElement.value,
                        label: subElement.label,
                        writable: true,
                        enumerable: true,
                        configurable: true
                    }, false);

                    monitor.context.popPC();
                }

                n++;
                k++;
            }

            monitor.context.popPC();

        } else {
            A.DefineOwnProperty(new Value(n, label), {
                value: E.value,
                label: E.label,
                writable: true,
                enumerable: true,
                configurable: true
            }, false);
            n++;
        }

        c.popPC();
    }

    aux(O);
    for (let i = 0, len = args.length; i < len; i++) {
        aux(args[i]);
    }

    // This is a fix they added in ECMA-262 v6 standard, but browsers used it
    // in ECMA-262 v5 as well.
    A.Put(new Value("length", bot), new Value(n, bot), false);

    return new Value(A, bot);
};

// ------------------------------------------------------------
// join, 15.4.4.5

function join(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let O = ToObject(thisArg);
    let len = ToUInt32(O.Get(constants.length));

    let arg0 = args[0] || new Value(',', bot);
    let separator: Value<string>;

    if (arg0.value === undefined) {
        separator = new Value(',', arg0.label);
    }
    else {
        separator = ToString(arg0);
    }

    let label = lub(len.label, separator.label);
    let arr: string[] = [];
    for (let i = 0; i < len.value; i++) {

        let v = O.Get(new Value(i, bot));
        let y: Value<string>;
        if (v.value === undefined || v.value === null) {
            y = new Value('', v.label);
        } else {
            y = ToString(v);
        }

        arr[i] = y.value;

        label = lub(label, y.label);
    }

    let res = arr.join(separator.value);
    return new Value(res, label);
}

// ------------------------------------------------------------
// pop, 15.4.4.6

function pop(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let O = ToObject(thisArg);
    let len = ToUInt32(O.Get(constants.length));

    if (len.value === 0) {
        O.Put(constants.length, len, true);
        return new Value(undefined, len.label);
    }

    let indx = new Value(len.value - 1, len.label);
    let element = O.Get(indx);

    O.Delete(indx, true);

    O.Put(constants.length, indx, true);
    return element;
}

// ------------------------------------------------------------
// push, 15.4.4.7

function push(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let O = ToObject(thisArg);
    let n = ToUInt32(O.Get(constants.length));

    for (let i = 0, len = args.length; i < len; i++) {
        let E = args[i];
        O.Put(n, E);
        n.value++;
    }

    O.Put(constants.length, n, true);

    return n;
}

// ------------------------------------------------------------
// reverse, 15.4.4.8

function reverse(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<EcmaObject> {
    let O = ToObject(thisArg);
    let len = ToUInt32(O.Get(constants.length));

    let middle = Math.floor(len.value / 2);
    let lower = 0;

    let c = monitor.context;

    while (lower !== middle && lower > -2) {
        let upper = len.value - lower - 1;

        let upperP = ToString(new Value(upper, len.label));
        let lowerP = ToString(new Value(lower, len.label));

        let lowerValue = O.Get(lowerP);
        let upperValue = O.Get(upperP);
        let lowerExists = O.HasProperty(lowerP);
        let upperExists = O.HasProperty(upperP);

        c.pushPC(lub(lowerExists.label, upperExists.label, len.label));

        if (lowerExists.value && upperExists.value) {
            O.Put(lowerP, upperValue, true);
            O.Put(upperP, lowerValue, true);
        } else if (!lowerExists.value && upperExists.value) {
            O.Put(lowerP, upperValue, true);
            O.Delete(upperP, true);
        } else if (lowerExists.value && !upperExists.value) {
            O.Delete(lowerP, true);
            O.Put(upperP, lowerValue, true);
        }
        c.popPC();
        lower++;
    }

    return O;
}

// ------------------------------------------------------------
// shift, 15.4.4.9

function shift(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    if (len.value === 0) {
        monitor.context.pushPC(len.label);
        O.Put(constants.length, len, true);
        monitor.context.popPC();

        return new Value(undefined, len.label);
    }

    let first = O.Get(new Value(0, bot));
    let k = 1;

    monitor.context.pushPC(len.label);

    while (k < len.value) {

        let from = k;
        let _from = new Value(from, len.label);
        let to = k - 1;
        let _to = new Value(to, len.label);

        let fromPresent = O.HasProperty(_from);

        if (fromPresent.value) {
            monitor.context.pushPC(fromPresent.label);

            let fromVal = O.Get(_from);
            O.Put(_to, fromVal, true);

            monitor.context.popPC();
        } else {
            O.Delete(_to, true);
        }
        k++;
    }
    monitor.context.popPC();

    len.value--;
    O.Delete(len, true);
    O.Put(constants.length, len, true);

    return first;
}


// ------------------------------------------------------------
// slice, 15.4.4.10

function slice(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ArrayObject> {
    let O = ToObject(thisArg);
    let A = new ArrayObject();

    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let start = args[0] ? args[0] : new Value(undefined, bot);
    let end = args[1] ? args[1] : new Value(undefined, bot);

    let relativeStart = ToInteger(start);

    let k = new Value(0, lub(len.label, relativeStart.label));

    if (relativeStart.value < 0) {
        k.value = Math.max(len.value + relativeStart.value, 0);
    } else {
        k.value = Math.min(relativeStart.value, len.value);
    }

    let relativeEnd : Value<number>;
    if (end.value === undefined) {
        relativeEnd = len;
    } else {
        relativeEnd = ToInteger(end);
    }

    let _final = new Value(0, lub(len.label, relativeStart.label));

    if (relativeEnd.value < 0) {
        _final.value = Math.max(len.value + relativeEnd.value, 0);
    } else {
        _final.value = Math.min(relativeEnd.value, len.value);
    }

    let n = 0;

    monitor.context.pushPC(lub(k.label, _final.label));

    while (k.value < _final.value) {
        let Pk = ToString(k);
        let kPresent = O.HasProperty(Pk);
        if (kPresent.value) {
            let kValue = O.Get(Pk);
            A.DefineOwnProperty(new Value(n, bot), {
                value: kValue.value,
                label: kValue.label,
                writable: true,
                enumerable: true,
                configurable: true
            }, false);
        }
        k.value++;
        n++;
    }

    monitor.context.popPC();
    return new Value(A, bot);
}

// ------------------------------------------------------------
// sort, 15.4.4.11

function sort(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<EcmaObject> {
    let comparefun = args[0] || new Value(undefined, bot);

    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let label = lub(O.label, len.label);

    let c = monitor.context;
    c.pushPC(len.label);

    let array : Value<ValueTypes>[] = [];
    let k = new Value(0, len.label);
    while (k.value < len.value) {
        let kPresent = O.HasProperty(k);

        c.labels.pc = lub(c.labels.pc, kPresent.label);
        label = lub(label, kPresent.label);

        if (kPresent.value) {
            let kValue = O.Get(k);
            kValue.raise(label);

            array[k.value] = kValue;
        }
        k.value++;
    }

    let isCallable = IsCallable(comparefun);
    c.labels.pc = lub(c.labels.pc, comparefun.label);

    if (comparefun.value !== undefined && !isCallable) {
        monitor.Throw(
            "TypeError",
            'Array.prototype.sort: not a function',
            bot
        );
    }

    let comparefunWrapper : (x : Value<ValueTypes>, y : Value<ValueTypes>) => ValueTypes;
    if (comparefun.value) {

        comparefunWrapper = function (x, y) {
            if (x.value === undefined) {
                label = lub(label, x.label);
                return 1;
            }
            if (y.value === undefined) {
                label = lub(label, y.label);
                return -1;
            }
            let result = comparefun.Call(new Value(undefined, bot), [x, y]);
            c.labels.pc = lub(c.labels.pc, result.label, x.label, y.label);
            label = lub(label, result.label, x.label, y.label);
            return result.value;
        };

    } else {

        comparefunWrapper = function (x, y) {

            if (x.value === undefined) {
                label = lub(label, x.label);
                return 1;
            }
            if (y.value === undefined) {
                label = lub(label, y.label);
                return -1;
            }

            let xString = ToString(x);
            let yString = ToString(y);

            c.labels.pc = lub(c.labels.pc, xString.label, yString.label);
            label = lub(label, xString.label, yString.label);

            if (xString.value < yString.value) {
                return -1;
            }

            if (xString.value > yString.value) {
                return 1;
            }

            return 0;
        };

    }
    //@ts-ignore TYPES
    array = array.sort(comparefunWrapper);

    for (let i = 0, len = array.length; i < len; i++) {
        let v = array[i];

        if (v) {
            O.Put(new Value(i, label), v, true);
        } else {
            O.Delete(new Value(i, label), true);
        }
    }

    c.popPC();
    return O;
}

// ------------------------------------------------------------
// splice, 15.4.4.12
function splice(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {

    let start = args[0] || new Value(undefined, bot);
    let arg1 = args[1] || new Value(undefined, bot);

    let O = ToObject(thisArg);
    let A = new ArrayObject();

    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let relativeStart = ToInteger(start);
    let actualStart : Value<number | null> = new Value(null, lub(len.label, relativeStart.label));

    if (relativeStart.value < 0) {
        actualStart.value = Math.max((len.value + relativeStart.value), 0);
    } else {
        actualStart.value = Math.min(relativeStart.value, len.value);
    }

    let deleteCount = ToInteger(arg1);
    let actualDeleteCount : Value<number | null> = new Value(null, lub(deleteCount.label, actualStart.label));
    actualDeleteCount.value = Math.min(Math.max(deleteCount.value, 0), len.value - actualStart.value);

    let k = 0;
    monitor.context.pushPC(actualDeleteCount.label);
    while (k < actualDeleteCount.value) {
        let from = new Value(actualStart.value + k, actualStart.label);
        let fromPresent = O.HasProperty(from);

        monitor.context.pushPC(fromPresent.label);
        if (fromPresent.value) {
            let fromValue = O.Get(from);
            A.DefineOwnProperty(new Value(k, actualDeleteCount.label), {
                value: fromValue.value,
                label: fromValue.label,
                writable: true,
                enumerable: true,
                configurable: true
            }
            );
        }
        monitor.context.popPC();

        k++;
    }
    monitor.context.popPC();

    let items : Value<ValueTypes>[] = [];
    for (let i = 0; i < args.length - 2; i++) {
        items[i] = args[i + 2];
    }

    let itemCount = items.length;
    if (itemCount < actualDeleteCount.value) {
        let k = actualStart.value;

        monitor.context.pushPC(actualStart.label);

        while (k < len.value - actualDeleteCount.value) {
            let from = new Value(k + actualDeleteCount.value, lub(actualStart.label, actualDeleteCount.label));
            let to = new Value(k + itemCount, actualStart.label);
            let fromPresent = O.HasProperty(from);

            monitor.context.pushPC(fromPresent.label);

            if (fromPresent.value) {
                let fromValue = O.Get(from);
                O.Put(to, fromValue, true);
            } else {
                O.Delete(to, true);
            }

            k++;

            monitor.context.popPC();
        }

        monitor.context.popPC();

        k = len.value;

        monitor.context.pushPC(lub(len.label, actualDeleteCount.label));

        while (k > (len.value - actualDeleteCount.value + itemCount)) {
            O.Delete(new Value(k, len.label));
            k--;
        }

        monitor.context.popPC();

    } else if (itemCount > actualDeleteCount.value) {

        let k = len.value - actualDeleteCount.value;

        monitor.context.pushPC(lub(len.label, actualDeleteCount.label));

        while (k > actualStart.value) {
            let from = new Value(k + actualDeleteCount.value - 1, actualDeleteCount.label);
            let to = new Value(k + itemCount - 1, bot);
            let fromPresent = O.HasProperty(from);


            if (fromPresent.value) {
                let fromValue = O.Get(from);
                O.Put(to, fromValue, true);
            } else {
                O.Delete(to, true);
            }
            k--;
        }

        monitor.context.popPC();

    }

    k = actualStart.value;
    for (let i = 0; i < items.length; i++) {
        O.Put(new Value(k + i, actualStart.label), items[i], true);
    }

    O.Put(constants.length, new Value(len.value - actualDeleteCount.value + itemCount, lub(len.label, actualDeleteCount.label)), true);
    return new Value(A, bot);
}

// ------------------------------------------------------------
// unshift, 15.4.4.13

function unshift(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);
    let argCount = args.length;
    let k = len.value;

    monitor.context.pushPC(len.label);
    while (k > 0) {
        let from = new Value(k - 1, len.label);
        let to = new Value(k + argCount - 1, len.label);
        let fromPresent = O.HasProperty(from);

        monitor.context.pushPC(fromPresent.label);
        if (fromPresent.value) {
            let fromValue = O.Get(from);
            O.Put(to, fromValue, true);
        } else {
            O.Delete(to, true);
        }
        monitor.context.popPC();

        k--;
    }
    monitor.context.popPC();

    let j = 0;
    let items = args;
    for (; j < argCount; j++) {
        let E = items[j];
        O.Put(new Value(j, bot), E, true);
    }

    O.Put(constants.length, new Value(len.value + argCount, len.label));
    return new Value(len.value + argCount, len.label);
};

// ------------------------------------------------------------
// indexOf, 15.4.4.14

function indexOf(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let searchElement = args[0] || new Value(undefined, bot);
    let fromIndex = args[1];

    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let c = monitor.context;

    if (len.value === 0) {
        return new Value(-1, len.label);
    }

    let label = lub(len.label);
    c.pushPC(len.label);

    let n = fromIndex ? ToInteger(fromIndex) : new Value(0, bot);

    c.labels.pc = lub(c.labels.pc, n.label);
    label = lub(label, n.label);

    if (n.value >= len.value) {
        c.popPC();
        return new Value(-1, label);
    }

    let k : Value<number>;
    if (n.value >= 0) {
        k = n;
    } else {
        k = new Value(len.value - Math.abs(n.value), lub(len.label, n.label));
        if (k.value < 0) {
            k.value = 0;
        }
    }

    while (k.value < len.value) {
        let kString = ToString(k);
        let kPresent = O.HasProperty(kString);

        c.labels.pc = lub(c.labels.pc, kPresent.label);
        label = lub(label, kPresent.label);

        if (kPresent.value) {
            let elementK = O.Get(kString);

            c.labels.pc = lub(c.labels.pc, elementK.label);
            label = lub(label, elementK.label);

            let same = searchElement.value === elementK.value;

            if (same) {
                k.label = label;
                c.popPC();
                return k;
            }
        }

        k.value++;
    }

    c.popPC();
    k.value = -1;
    k.label = label;
    return k;
}

// ------------------------------------------------------------
// lastIndexOf, 15.4.4.15

function lastIndexOf(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let searchElement = args[0] || new Value(undefined, bot);
    let fromIndex = args[1];

    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let c = monitor.context;

    if (len.value === 0) {
        return new Value(-1, len.label);
    }

    let label = lub(len.label);

    c.pushPC(len.label);

    let n = fromIndex ? ToInteger(fromIndex) : new Value(len.value - 1, len.label);

    let k : Value<number>;
    if (n.value >= 0) {
        k = new Value(Math.min(n.value, len.value - 1), lub(n.label, len.label));
    } else {
        k = new Value(len.value - Math.abs(n.value), lub(n.label, len.label));
    }

    c.labels.pc = lub(c.labels.pc, k.label);
    label = lub(label, k.label);

    while (k.value >= 0) {
        let kPresent = O.HasProperty(k);
        c.labels.pc = lub(c.labels.pc, kPresent.label);
        label = lub(label, kPresent.label);

        if (kPresent.value) {
            let elementK = O.Get(k);

            c.labels.pc = lub(c.labels.pc, elementK.label);
            label = lub(label, elementK.label);

            let same = searchElement.value === elementK.value;

            if (same) {
                k.label = label;
                c.popPC();
                return k;
            }
        }
        k.value--;
    }

    c.popPC();

    k.value = -1;
    k.label = label;
    return k;
}

// ------------------------------------------------------------
// every, 15.4.4.16

function every(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {
    let callbackfn = args[0] || new Value(undefined, bot);
    let callbackthisArg = args[1] || new Value(undefined, bot);

    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let c = monitor.context;
    let isCallable = IsCallable(callbackfn);

    let label = lub(callbackfn.label);

    c.pushPC(callbackfn.label);

    if (!isCallable) {
        monitor.Throw(
            "TypeError",
            'Array.prototype.every: not a function',
            bot
        );
    }

    let k = new Value(0, len.label);
    c.labels.pc = lub(c.labels.pc, len.label);
    label = lub(label, len.label);
    while (k.value < len.value) {
        let kPresent = O.HasProperty(k);
        c.labels.pc = lub(c.labels.pc, kPresent.label);
        label = lub(label, kPresent.label);

        if (kPresent.value) {
            let kValue = O.Get(k);
            let testResult = callbackfn.Call(callbackthisArg, [kValue, k, O]);
            let b = ToBoolean(testResult);
            c.labels.pc = lub(c.labels.pc, b.label);
            label = lub(label, b.label);

            if (!b.value) {
                c.popPC();
                return new Value(false, label);
            }
        }
        k.value++;
    }

    c.popPC();
    return new Value(true, label);
}

// ------------------------------------------------------------
// some, 15.4.4.17

function some(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {
    let callbackfn = args[0] || new Value(undefined, bot);
    let callbackthisArg = args[1] || new Value(undefined, bot);

    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let c = monitor.context;
    let isCallable = IsCallable(callbackfn);

    let label = lub(callbackfn.label);

    c.pushPC(callbackfn.label);

    if (!isCallable) {
        monitor.Throw(
            "TypeError",
            'Array.prototype.every: not a function',
            bot
        );
    }

    let k = new Value(0, len.label);
    c.labels.pc = lub(c.labels.pc, len.label);
    label = lub(label, len.label);
    while (k.value < len.value) {
        let kPresent = O.HasProperty(k);
        c.labels.pc = lub(c.labels.pc, kPresent.label);
        label = lub(label, kPresent.label);

        if (kPresent.value) {
            let kValue = O.Get(k);
            let testResult = callbackfn.Call(callbackthisArg, [kValue, k, O]);
            let b = ToBoolean(testResult);
            c.labels.pc = lub(c.labels.pc, b.label);
            label = lub(label, b.label);

            if (b.value) {
                c.popPC();
                return new Value(true, label);
            }
        }
        k.value++;
    }

    c.popPC();
    return new Value(false, label);
}

// ------------------------------------------------------------
// forEach, 15.4.4.18

function forEach(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<undefined> {
    let callbackfn = args[0] || new Value(undefined, bot);
    let callbackthisArg = args[1] || new Value(undefined, bot);

    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let c = monitor.context;
    let isCallable = IsCallable(callbackfn);

    c.pushPC(callbackfn.label);

    if (!isCallable) {
        monitor.Throw(
            "TypeError",
            'Array.prototype.every: not a function',
            bot
        );
    }

    let k = new Value(0, len.label);
    c.labels.pc = lub(c.labels.pc, len.label);

    while (k.value < len.value) {
        let kPresent = O.HasProperty(k);
        c.labels.pc = lub(c.labels.pc, kPresent.label);

        if (kPresent.value) {
            let kValue = O.Get(k);
            callbackfn.Call(callbackthisArg, [kValue, k, O]);
        }
        k.value++;
    }

    c.popPC();
    return new Value(undefined, bot);
}

// ------------------------------------------------------------
// map, 15.4.4.19

function map(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ArrayObject> {
    let callbackfn = args[0] || new Value(undefined, bot);
    let callbackthisArg = args[1] || new Value(undefined, bot);

    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let c = monitor.context;
    let isCallable = IsCallable(callbackfn);

    c.pushPC(callbackfn.label);

    if (!isCallable) {
        monitor.Throw(
            "TypeError",
            'Array.prototype.every: not a function',
            bot
        );
    }

    let A = new ArrayObject();
    A.properties.length = len.value;
    A.labels.length = {
        value: len.label,
        existence: bot
    };

    let k = new Value(0, len.label);
    c.labels.pc = lub(c.labels.pc, len.label);

    while (k.value < len.value) {
        let kPresent = O.HasProperty(k);
        c.labels.pc = lub(c.labels.pc, kPresent.label);

        if (kPresent.value) {
            let kValue = O.Get(k);
            let mappedValue = callbackfn.Call(callbackthisArg, [kValue, k, O]);

            A.DefineOwnProperty(k, {
                value: mappedValue.value,
                label: mappedValue.label,
                writable: true,
                enumerable: true,
                configurable: true
            }, false);

        }
        k.value++;
    }

    c.popPC();
    return new Value(A, bot);
}

// ------------------------------------------------------------
// filter, 15.4.4.20

function filter(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ArrayObject> {
    let callbackfn = args[0] || new Value(undefined, bot);
    let callbackthisArg = args[1] || new Value(undefined, bot);

    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let c = monitor.context;
    let isCallable = IsCallable(callbackfn);

    c.pushPC(callbackfn.label);

    if (!isCallable) {
        monitor.Throw(
            "TypeError",
            'Array.prototype.every: not a function',
            bot
        );
    }

    let A = new ArrayObject();

    let k = new Value(0, len.label);
    let to = new Value(0, len.label);

    c.labels.pc = lub(c.labels.pc, len.label);

    while (k.value < len.value) {
        let kPresent = O.HasProperty(k);
        c.labels.pc = lub(c.labels.pc, kPresent.label);

        if (kPresent.value) {
            let kValue = O.Get(k);
            let selected = callbackfn.Call(callbackthisArg, [kValue, k, O]);
            selected = ToBoolean(selected);

            c.labels.pc = lub(c.labels.pc, selected.label);

            if (selected.value) {
                A.DefineOwnProperty(to, {
                    value: kValue.value,
                    label: kValue.label,
                    writable: true,
                    enumerable: true,
                    configurable: true
                }, false);

                to.value++;
            }
        }
        k.value++;
    }

    c.popPC();
    return new Value(A, bot);
}

// ------------------------------------------------------------
// reduce, 15.4.4.21

function reduce(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let callbackfn = args[0] || new Value(undefined, bot);
    let initialValue = args[1];

    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let c = monitor.context;
    let isCallable = IsCallable(callbackfn);

    let label = lub(callbackfn.label);

    c.pushPC(callbackfn.label);

    if (!isCallable) {
        monitor.Throw(
            "TypeError",
            'Array.prototype.every: not a function',
            bot
        );
    }

    let k = new Value(0, len.label);
    let accumulator : Value<ValueTypes> = new Value(undefined, bot);

    if (initialValue) {
        accumulator = initialValue;
    } else {
        let kPresent = new Value(false, bot);

        c.labels.pc = lub(c.labels.pc, len.label);
        label = lub(label, len.label);

        while (!kPresent.value && k.value < len.value) {
            kPresent = O.HasProperty(k);

            c.labels.pc = lub(c.labels.pc, kPresent.label);
            label = lub(label, kPresent.label);

            if (kPresent.value) {
                accumulator = O.Get(k);
            }
            k.value++;
        }

        if (!kPresent.value) {
            monitor.Throw(
                "TypeError",
                'Array.prototype.reduce: empty array with no initial value',
                bot
            );
        }
    }

    while (k.value < len.value) {
        let kPresent = O.HasProperty(k);

        c.labels.pc = lub(c.labels.pc, kPresent.label);
        label = lub(label, kPresent.label);

        if (kPresent.value) {
            let kValue = O.Get(k);
            accumulator = callbackfn.Call(new Value(undefined, bot), [accumulator, kValue, k, O]);
        }
        k.value++;
    }

    c.popPC();
    accumulator.raise(label);
    return accumulator;
}

// ------------------------------------------------------------
// reduceRight, 15.4.4.22

function reduceRight(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let callbackfn = args[0] || new Value(undefined, bot);
    let initialValue = args[1];

    let O = ToObject(thisArg);
    let lenVal = O.Get(constants.length);
    let len = ToUInt32(lenVal);

    let c = monitor.context;
    let isCallable = IsCallable(callbackfn);

    let label = lub(callbackfn.label);

    c.pushPC(callbackfn.label);

    if (!isCallable) {
        monitor.Throw(
            "TypeError",
            'Array.prototype.every: not a function',
            bot
        );
    }

    let k = new Value(len.value - 1, len.label);
    let accumulator : Value<ValueTypes> = new Value(undefined, bot);

    if (initialValue) {
        accumulator = initialValue;
    } else {
        let kPresent = new Value(false, bot);

        c.labels.pc = lub(c.labels.pc, len.label);
        label = lub(label, len.label);

        while (!kPresent.value && k.value >= 0) {
            kPresent = O.HasProperty(k);

            c.labels.pc = lub(c.labels.pc, kPresent.label);
            label = lub(label, kPresent.label);

            if (kPresent.value) {
                accumulator = O.Get(k);
            }
            k.value--;
        }

        if (!kPresent.value) {
            monitor.Throw(
                "TypeError",
                'Array.prototype.reduce: empty array with no initial value',
                bot
            );
        }
    }

    while (k.value >= 0) {
        let kPresent = O.HasProperty(k);

        c.labels.pc = lub(c.labels.pc, kPresent.label);
        label = lub(label, kPresent.label);

        if (kPresent.value) {
            let kValue = O.Get(k);
            accumulator = callbackfn.Call(new Value(undefined, bot), [accumulator, kValue, k, O]);
        }
        k.value--;
    }

    c.popPC();
    accumulator.raise(label);
    return accumulator;
}