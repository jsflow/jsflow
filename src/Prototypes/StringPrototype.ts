
import { Value } from "../Value";
import * as constants from '../Constants';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { ArrayObject } from '../Objects/ArrayObject';
import { ToInteger } from '../Conversion/ToInteger';
import { ToString } from '../Conversion/ToString';
import { CheckObjectCoercible } from '../Utility/CheckObjectCoercible';
import { MonitorBase } from '../MonitorBase';

import { DefineTFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';

import { bot, Label, lub, le } from '../Label';
import { ValueTypes } from "../Interfaces";
import { IsStringObject } from "../Objects/StringObject";
import { IsRegExpObject, RegExpObject } from "../Objects/RegExpObject";
import { IsCallable } from "../Utility/IsCallable";
import { ToInt32 } from "../Conversion/ToInt32";
import { ToNumber } from "../Conversion/ToNumber";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// The String Prototype, 15.5.4
export class StringPrototype extends EcmaObject {

    host: String;

    PrimitiveValue: string;
    PrimitiveLabel: Label;

    constructor(host: String) {
        super();
        this.Class = 'String';
        this.PrimitiveValue = '';
        this.PrimitiveLabel = bot;

        //@ts-ignore TYPES
        this.properties = new String('');
        this.labels.length = {
            value: bot,
            existence: bot
        };

        this.host = host;
    }

    Setup(): void {
        this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);
        DefineTFT(this, constants.constructor, monitor.instances.StringConstructor);
        DefineTFT(this, constants.toString, new BuiltinFunctionObject(toString, 0, this.host.toString));
        DefineTFT(this, constants.valueOf, new BuiltinFunctionObject(valueOf, 0, this.host.valueOf));
        DefineTFT(this, constants.charAt, new BuiltinFunctionObject(charAt, 1, this.host.charAt));
        DefineTFT(this, constants.charCodeAt, new BuiltinFunctionObject(charCodeAt, 1, this.host.charCodeAt));
        DefineTFT(this, constants.concat, new BuiltinFunctionObject(concat, 1, this.host.concat));
        DefineTFT(this, constants.indexOf, new BuiltinFunctionObject(indexOf, 1, this.host.indexOf));
        DefineTFT(this, constants.lastIndexOf, new BuiltinFunctionObject(lastIndexOf, 1, this.host.lastIndexOf));
        DefineTFT(this, constants.localeCompare, new BuiltinFunctionObject(localeCompare, 1, this.host.localeCompare));
        DefineTFT(this, constants.match, new BuiltinFunctionObject(match, 1, this.host.match));
        DefineTFT(this, constants.replace, new BuiltinFunctionObject(replace, 2, this.host.replace));
        DefineTFT(this, constants.search, new BuiltinFunctionObject(search, 1, this.host.search));
        DefineTFT(this, constants.slice, new BuiltinFunctionObject(slice, 2, this.host.slice));
        DefineTFT(this, constants.split, new BuiltinFunctionObject(split, 2, this.host.split));
        DefineTFT(this, constants.substring, new BuiltinFunctionObject(substring, 2, this.host.substring));
        DefineTFT(this, constants.toLowerCase, new BuiltinFunctionObject(toLowerCase, 0, this.host.toLowerCase));
        DefineTFT(this, constants.toLocaleLowerCase, new BuiltinFunctionObject(toLocaleLowerCase, 0, this.host.toLocaleLowerCase));
        DefineTFT(this, constants.toUpperCase, new BuiltinFunctionObject(toUpperCase, 0, this.host.toUpperCase));
        DefineTFT(this, constants.toLocaleUpperCase, new BuiltinFunctionObject(toLocaleUpperCase, 0, this.host.toLocaleUpperCase));
        DefineTFT(this, constants.trim, new BuiltinFunctionObject(trim, 0, this.host.trim));

        DefineTFT(this, constants.substr, new BuiltinFunctionObject(substr, 2, this.host.substr));
    }
}


// ------------------------------------------------------------
// toString, 15.5.4.2
function toString(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {

    if (typeof thisArg.value === 'string') {
        return new Value(thisArg.value, thisArg.label);
    }

    if (!IsStringObject(thisArg)) {
        monitor.Throw(
            "TypeError",
            'String.prototype.toString is not generic',
            thisArg.label
        );
        throw 'TypeScript';
    }

    let result = thisArg.value.PrimitiveValue.toString();
    return new Value(result, thisArg.value.PrimitiveLabel);
}

// ------------------------------------------------------------
// valueOf, 15.5.4.3
let valueOf = toString;

// ------------------------------------------------------------
// charAt, 15.5.4.4
function charAt(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let pos = args[0] || new Value(undefined, bot);
    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let position = ToInteger(pos);

    let c = S.value.charAt(position.value);
    return new Value(c, lub(position.label, S.label));
}

// ------------------------------------------------------------
// charCodeAt, 15.5.4.5
function charCodeAt(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let pos = args[0] || new Value(undefined, bot);
    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let position = ToInteger(pos);

    let c = S.value.charCodeAt(position.value);
    return new Value(c, lub(position.label, thisArg.label));
}

// ------------------------------------------------------------
// concat, 15.5.4.6
function concat(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let lbl = new Label();
    let _args: string[] = [];
    for (let i = 0, len = args.length; i < len; i++) {
        let arg = ToString(args[i]);
        lbl = lub(lbl, arg.label);
        _args[i] = arg.value;
    }
    let str: string = S.value.concat.apply(S.value, _args);
    lbl = lub(lbl, thisArg.label);
    return new Value(str, lbl);
}

// ------------------------------------------------------------
// indexOf, 15.5.4.7
function indexOf(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let searchString = args[0] || new Value(undefined, bot);
    let position = args[1] || new Value(0, bot);

    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let searchStr = ToString(searchString);
    let pos = ToInteger(position);

    let lbl = lub(S.label, searchStr.label, pos.label);
    let str = S.value.indexOf(searchStr.value, pos.value);

    return new Value(str, lbl);
}

// ------------------------------------------------------------
// lastIndexOf, 15.5.4.8
function lastIndexOf(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let searchString = args[0] || new Value(undefined, bot);
    let position = args[1] || new Value(undefined, bot);

    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let searchStr = ToString(searchString);

    let pos = ToNumber(position);
    if (isNaN(pos.value)) {
        pos.value = Infinity;
    } else {
        pos = ToInteger(pos)
    }
    
    let lbl = lub(S.label, searchStr.label, pos.label);

    let str = S.value.lastIndexOf(searchStr.value, pos.value);

    return new Value(str, lbl);
}

// ------------------------------------------------------------
// localeCompare, 15.5.4.9
function localeCompare(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let arg0 = args[0] || new Value(undefined, bot);

    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let that = ToString(arg0);

    let lbl = lub(S.label, that.label);
    let result = S.value.localeCompare(that.value);

    return new Value(result, lbl);
}

// ------------------------------------------------------------
// match, 15.5.4.10
function match(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ArrayObject | null> {
    let regexp = args[0] || new Value(undefined, bot);

    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);

    let rx: Value<RegExpObject>;
    if (IsRegExpObject(regexp)) {
        rx = regexp;
    } else {
        rx = monitor.instances.RegExpConstructor.Construct([regexp]);
    }

    let lbl = lub(S.label, rx.value.PrimitiveLabel);
    monitor.assert(
        le(rx.label, rx.value.PrimitiveLabel),
        'String.prototype.match: label of regular expression object not below regular expression label'
    );

    rx.value.PrimitiveLabel = lbl;
    let primitiveArray = S.value.match(rx.value.PrimitiveValue);

    if (primitiveArray === null) {
        return new Value(null, lbl);
    }

    let array = ArrayObject.fromArray(primitiveArray, lbl, lbl);

    array.DefineOwnProperty(constants.index,
        {
            value: primitiveArray.index,
            writable: true,
            enumerable: true,
            configurable: true,
            label: lbl
        }
    );

    array.DefineOwnProperty(constants.input,
        {
            value: primitiveArray.input,
            writable: true,
            enumerable: true,
            configurable: true,
            label: lbl
        }
    );

    return new Value(array, bot);
}

// ------------------------------------------------------------
// replace, 15.5.4.11
function replace(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let arg0 = args[0] || new Value(undefined, bot);
    let arg1 = args[1] || new Value(undefined, bot);

    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);

    let sV: RegExp | string, rV: (() => string) | string;

    let label = lub(arg0.label, arg1.label);

    if (IsRegExpObject(arg0)) {
        sV = arg0.value.PrimitiveValue;
    } else {
        let searchValue = ToString(arg0);
        label = lub(label, searchValue.label);
        sV = searchValue.value;
    }

    let fL = bot;

    if (IsCallable(arg1)) {
        rV = function () {
            let _args: Value<ValueTypes>[] = [];
            for (let i = 0; i < arguments.length; i++) {
                _args[i] = new Value(arguments[i], label);
            }
            _args.length = arguments.length;
            let res = arg1.Call(arg1, _args);
            let strRes = ToString(res)
            fL = lub(fL, strRes.label);
            return strRes.value;
        };
    } else {
        let replaceValue = ToString(arg1);
        rV = replaceValue.value;
    }

    //@ts-ignore TYPES
    let res = S.value.replace(sV, rV);

    return new Value(res, lub(label, fL));
}

// ------------------------------------------------------------
// search, 15.5.4.12
function search(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let regexp = args[0] || new Value(undefined, bot);

    CheckObjectCoercible(thisArg);
    let string = ToString(thisArg);

    let rx: Value<RegExpObject>;
    if (IsRegExpObject(regexp)) {
        rx = regexp;
    } else {
        rx = monitor.instances.RegExpConstructor.Construct([regexp]);
    }

    let lbl = lub(string.label, rx.value.PrimitiveLabel);
    monitor.assert(
        le(rx.label, rx.value.PrimitiveLabel),
        'String.prototype.match: label of regular expression object not below regular expression label'
    );

    rx.value.PrimitiveLabel = lbl;
    let result = string.value.search(rx.value.PrimitiveValue);

    return new Value(result, lbl);
}

// ------------------------------------------------------------
// slice, 15.5.4.13
function slice(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let c = monitor.context;

    let start = args[0] || new Value(undefined, bot);
    let end = args[1] || new Value(undefined, bot);

    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let len = S.value.length;

    let intStart = ToInteger(start);

    c.pushPC(end.label);
    let intEnd : Value<number>;
    if (end.value === undefined) {
        intEnd = new Value(len, lub(S.label, end.label));
    } else {
        intEnd = ToInteger(end);
    }
    c.popPC();

    let str = S.value.slice(intStart.value, intEnd.value);
    let lbl = lub(S.label, intStart.label, intEnd.label);
    return new Value(str, lbl);
}

// ------------------------------------------------------------
// split, 15.5.4.14
function split(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ArrayObject> {
    let arg0 = args[0] || new Value(undefined, bot);
    let arg1 = args[1] || new Value(undefined, bot);

    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);

    let limit :number;
    let lbl = lub(S.label, arg0.label);
    if (arg1.value === undefined) {
        lbl = lub(lbl, arg1.label);
        limit = 4294967295;
    } else {
        let intLimit = ToInt32(arg1);
        lbl = lub(lbl, intLimit.label);
        limit = intLimit.value;
    }

    let separator : RegExp | string;
    if (arg0.value === undefined) {
        separator = undefined;
    } else if (IsRegExpObject(arg0)) {
        separator = arg0.value.PrimitiveValue;

        monitor.assert(
            le(arg0.label, arg0.value.PrimitiveLabel),
            'String.prototype.split: label of regular expression object not below label of regular expression'
        );

        arg0.value.PrimitiveLabel = lbl;
    } else {
        let stringSeparator = ToString(arg0);
        separator = stringSeparator.value;
        lbl = lub(lbl, stringSeparator.label);
    }

    let primitiveArray = S.value.split(separator, limit);
    let array = ArrayObject.fromArray(primitiveArray, lbl, lbl);
    return new Value(array, bot);
}

// ------------------------------------------------------------
// substring, 15.5.4.15
function substring(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let arg0 = args[0] || new Value(undefined, bot);
    let arg1 = args[1] || new Value(undefined, bot);

    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let start = ToInteger(arg0);

    let len = S.value.length;
    let end : Value<number>;

    if (arg1.value === undefined) {
        end = new Value(len, arg1.label);
    } else {
        end = ToInteger(arg1);
    }

    let lbl = lub(S.label, start.label, end.label);
    let str = S.value.substring(start.value, end.value);
    return new Value(str, lbl);
}

// ------------------------------------------------------------
function substr(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let arg0 = args[0] || new Value(undefined, bot);
    let arg1 = args[1] || new Value(undefined, bot);

    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let start = ToInteger(arg0);

    let len = S.value.length;
    let end : Value<number>;

    if (arg1.value === undefined) {
        end = new Value(len, arg1.label);
    } else {
        end = ToInteger(arg1);
    }

    let lbl = lub(S.label, start.label, end.label);
    let str = S.value.substr(start.value, end.value);

    return new Value(str, lbl);
}

// ------------------------------------------------------------
// toLowerCase, 15.5.4.16
function toLowerCase(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let L = S.value.toLowerCase();
    return new Value(L, S.label);
}

// ------------------------------------------------------------
// toLocaleLowerCase, 15.5.4.17
function toLocaleLowerCase(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let L = S.value.toLocaleLowerCase();
    return new Value(L, S.label);
}

// ------------------------------------------------------------
// toUpperCase, 15.5.4.18
function toUpperCase(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let L = S.value.toUpperCase();
    return new Value(L, S.label);
}

// ------------------------------------------------------------
// toLocaleUpperCase, 15.5.4.19
function toLocaleUpperCase(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let L = S.value.toLocaleUpperCase();
    return new Value(L, S.label);
}

// ------------------------------------------------------------
// trim, 15.5.4.20
function trim(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    CheckObjectCoercible(thisArg);
    let S = ToString(thisArg);
    let T = S.value.trim();
    return new Value(T, S.label);
}