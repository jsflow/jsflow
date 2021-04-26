
import { Value } from "../Value";
import * as constants from '../Constants';
import * as esprima from 'esprima';
import { BuiltinFunctionObject } from "./BuiltinFunctionObject";
import { ToNumber } from '../Conversion/ToNumber';
import { ToString } from '../Conversion/ToString';
import { MonitorBase } from '../MonitorBase';

import { DefineFFF, DefineTFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';

import { bot, top, lub, le, Label } from '../Label';
import { ValueTypes, IsIEcmaObject } from "../Interfaces";
import { ToInt32 } from "../Conversion/ToInt32";
import { enterEvalCode, execute } from "../Engine/Execute";

declare var monitor: MonitorBase;


// ------------------------------------------------------------

export class GlobalObject extends EcmaObject {

    host: any;

    constructor(host: any) {
        super();
        this.Class = 'global';

        if (this.Prototype === undefined || this.Prototype.value === null) {
            this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);
        }

        this.host = host;

        // 15.1.1
        DefineFFF(this, constants.NaN, NaN);
        DefineFFF(this, constants['Infinity'], Infinity);
        DefineFFF(this, constants['undefined'], undefined);

        // 15.1.2
        DefineTFT(this, constants['eval'], new BuiltinFunctionObject(__eval, 1, host.eval));
        DefineTFT(this, constants.parseInt, new BuiltinFunctionObject(__parseInt, 2, host.parseInt));
        DefineTFT(this, constants.parseFloat, new BuiltinFunctionObject(__parseFloat, 1, host.parseFloat));
        DefineTFT(this, constants.isNaN, new BuiltinFunctionObject(__isNaN, 1, host.isNaN));
        DefineTFT(this, constants.isFinite, new BuiltinFunctionObject(__isFinite, 1, host.isFinite));

        // 15.1.3
        DefineTFT(this, constants.decodeURI, new BuiltinFunctionObject(__decodeURI, 1, host.decodeURI));
        DefineTFT(this, constants.decodeURIComponent, new BuiltinFunctionObject(__decodeURIComponent, 1, host.decodeURIComponent));
        DefineTFT(this, constants.encodeURI, new BuiltinFunctionObject(__encodeURI, 1, host.encodeURI));
        DefineTFT(this, constants.encodeURIComponent, new BuiltinFunctionObject(__encodeURIComponent, 1, host.encodeURIComponent));

        // 15.1.4
        DefineTFT(this, constants.Object, monitor.instances.ObjectConstructor);
        DefineTFT(this, constants.Function, monitor.instances.FunctionConstructor);
        DefineTFT(this, constants.Array, monitor.instances.ArrayConstructor);
        DefineTFT(this, constants.String, monitor.instances.StringConstructor);
        DefineTFT(this, constants.Boolean, monitor.instances.BooleanConstructor);
        DefineTFT(this, constants.Number, monitor.instances.NumberConstructor);
        DefineTFT(this, constants.Date, monitor.instances.DateConstructor);
        DefineTFT(this, constants.RegExp, monitor.instances.RegExpConstructor);
        DefineTFT(this, constants.Error, monitor.instances.ErrorConstructor);
        DefineTFT(this, constants.EvalError, monitor.instances.EvalErrorConstructor);
        DefineTFT(this, constants.RangeError, monitor.instances.RangeErrorConstructor);
        DefineTFT(this, constants.ReferenceError, monitor.instances.ReferenceErrorConstructor);
        DefineTFT(this, constants.SyntaxError, monitor.instances.SyntaxErrorConstructor);
        DefineTFT(this, constants.TypeError, monitor.instances.TypeErrorConstructor);
        DefineTFT(this, constants.URIError, monitor.instances.URIErrorConstructor);
        DefineTFT(this, constants.Math, monitor.instances.MathObject);
        DefineTFT(this, constants.JSON, monitor.instances.JSONObject);

        DefineTFT(this, new Value("globalThis", bot), this);


        // B.2
        DefineTFT(this, constants.escape, new BuiltinFunctionObject(__escape, 1, host.escape));
        DefineTFT(this, constants.unescape, new BuiltinFunctionObject(__unescape, 1, host.unescape));

        DefineTFT(this, new Value('write', bot), new BuiltinFunctionObject(__print, 0, 'write'));
        DefineTFT(this, new Value('print', bot), new BuiltinFunctionObject(__lprint, 0, 'print'));
        // legacy
        DefineTFT(this, new Value('jsflog', bot), new BuiltinFunctionObject(__lprint, 0, 'lprint'));

        DefineFFF(this, new Value('upg', bot), new BuiltinFunctionObject(__dupg, 1, undefined));
        DefineFFF(this, new Value('upgs', bot), new BuiltinFunctionObject(__dupgs, 1, undefined));
        DefineFFF(this, new Value('upge', bot), new BuiltinFunctionObject(__dupge, 1, undefined));

        DefineFFF(this, new Value('lbl', bot), new BuiltinFunctionObject(__upg, 1, undefined));
        DefineFFF(this, new Value('lbls', bot), new BuiltinFunctionObject(__upgs, 1, undefined));
        DefineFFF(this, new Value('lble', bot), new BuiltinFunctionObject(__upge, 1, undefined));
        DefineFFF(this, new Value('lblparts', bot), new BuiltinFunctionObject(__upgparts, 1, undefined));


        DefineFFF(this, new Value('upgl', bot), new BuiltinFunctionObject(__upgl, 1, undefined));

        DefineFFF(this, new Value('declassify', bot), new BuiltinFunctionObject(__declassify, 1, undefined));

        /*
        DefineFFF(this , new Value('upgs'   , bot) , new BuiltinFunctionObject(__upgs   , 1, undefined));
        DefineFFF(this , new Value('dupgs'  , bot) , new BuiltinFunctionObject(__dupgs  , 1, undefined));
        DefineFFF(this , new Value('getPC'  , bot) , new BuiltinFunctionObject(__getPC  , 0, undefined));
        DefineFFF(this , new Value('setPC'  , bot) , new BuiltinFunctionObject(__setPC  , 1, undefined));
        DefineFFF(this , new Value('getEXC' , bot) , new BuiltinFunctionObject(__getEXC , 0, undefined));
        DefineFFF(this , new Value('setEXC' , bot) , new BuiltinFunctionObject(__setEXC , 1, undefined));
        DefineFFF(this , new Value('getRET' , bot) , new BuiltinFunctionObject(__getRET , 0, undefined));
        DefineFFF(this , new Value('setRET' , bot) , new BuiltinFunctionObject(__setRET , 1, undefined));
        */
    }

    toString() { return '[global object]'; }
}

// ------------------------------------------------------------
// B.2.1
function __escape(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let arg = args[0] !== undefined ? args[0] : new Value(undefined, bot);
    let str = ToString(arg);
    return new Value(escape(str.value), str.label);
}

// ------------------------------------------------------------
// unescape, B.2.2
function __unescape(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let arg = args[0] ? args[0] : new Value(undefined, bot);
    let str = ToString(arg);

    return new Value(unescape(str.value), str.label);
}

// ------------------------------------------------------------
// 15.1.2.1
function __eval(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let arg0 = args[0];
    if (arg0 === undefined) return new Value(undefined, bot);
    if (typeof arg0.value !== 'string') return arg0;

    let prog;

    // raise the pc w.r.t. the program string; parsing may result in an exception
    monitor.context.pushPC(arg0.label);

    try {
        let transformed = monitor.transform(arg0.value);
        prog = esprima.parse(transformed, { loc: true });
    } catch (e) {
        let msg = e.description + ' in eval:' + e.lineNumber + ':' + e.column;
        monitor.Throw(
            "SyntaxError",
            msg,
            arg0.label
        );
        throw 'TypeScript';
    }

    let evalCtx = enterEvalCode(prog, __eval);
    monitor.contextStack.push(evalCtx);

    // this is not a value, it is a result!!
    let result = execute(prog, false);


    // if value is 'empty' (represented by null)
    if (!result.value) {
        result.value = new Value(undefined, bot);
    }

    result.value.raise(arg0.label);

    // NOTE: parser should guarantee the result type is never return
    monitor.contextStack.pop();

    if (result.type === 'throw') {
        throw result.value;
    }



    monitor.context.popPC();

    return result.value;
}

// ------------------------------------------------------------
// 15.1.2.2
function __parseInt(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let stringArg = args[0] || new Value(undefined, bot);
    let arg1 = args[1] || new Value(undefined, bot);

    let string = ToString(stringArg);
    let radix = ToInt32(arg1);
    let value = parseInt(string.value, radix.value);
    return new Value(value, lub(string.label, radix.label));
}

// ------------------------------------------------------------
// 15.1.2.3
function __parseFloat(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<number> {
    let stringArg = args[0] || new Value(undefined, bot);
    let string = ToString(stringArg);
    let value = parseFloat(string.value);
    return new Value(value, string.label);
}

// ------------------------------------------------------------
// 15.1.2.4
function __isNaN(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {
    let numberArg = args[0] || new Value(undefined, bot);
    let number = ToNumber(numberArg);
    let value = isNaN(number.value);
    return new Value(value, number.label);
}

// ------------------------------------------------------------
// 15.1.2.5
function __isFinite(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<boolean> {
    let numberArg = args[0] || new Value(undefined, bot);
    let number = ToNumber(numberArg);
    let value = isFinite(number.value);
    return new Value(value, number.label);
}

// ------------------------------------------------------------
// 15.1.3.1
function __decodeURI(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let arg0 = args[0] ? args[0] : new Value(undefined, bot);
    let enc = ToString(arg0);
    let res = new Value(decodeURI(enc.value), enc.label);
    return res;
}

// ------------------------------------------------------------
// 15.1.3.2
function __decodeURIComponent(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let arg0 = args[0] ? args[0] : new Value(undefined, bot);
    let enc = ToString(arg0);
    let res = new Value(decodeURIComponent(enc.value), enc.label);
    return res;
}

// ------------------------------------------------------------
// 15.1.2.3
let __encodeURI = function __encodeURI(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let arg0 = args[0] ? args[0] : new Value(undefined, bot);
    let enc = ToString(arg0);
    let res = new Value(encodeURI(enc.value), enc.label);
    return res;
}

// ------------------------------------------------------------
// 15.1.3.4
function __encodeURIComponent(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {
    let arg0 = args[0] !== undefined ? args[0] : new Value(undefined, bot);
    let componentString = ToString(arg0);
    return new Value(encodeURIComponent(componentString.value), componentString.label);
}

// ------------------------------------------------------------

function __print(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<undefined> {
    let str = '';
    for (let i = 0; i < args.length; i++)
        str += args[i].value;
    monitor.print(str);

    return new Value(undefined, bot);
}

function __lprint(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<undefined> {
    if (monitor.options.get('monitor.testMode')) {
        __print(thisArg, args);
        return new Value(undefined, bot);
    }

    let str = '';
    for (let i = 0; i < args.length; i++)
        str += ToString(args[i]);

    if (monitor.options.get('monitor.taintMode')) {
        monitor.print(str);
    } else {
        monitor.print('(' + monitor.context.effectivePC + '):' + str);
    }

    return new Value(undefined, bot);
}

// ------------------------------------------------------------

function __upgl(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<undefined> {
    let arg0 = args[0] ? args[0] : new Value('default', bot);
    let labelName = ToString(arg0);

    monitor.assert(le(labelName.label, bot), 'upgl expected label of label string to be bot');

    let lbl = bot;
    for (let i = 1; i < args.length; i++) {
        let arg = ToString(args[i]);

        monitor.assert(le(arg.label, bot), 'upgl expected label of label string to be bot');
        lbl = lub(lbl, Label.fromString(arg.value));
    }

    lbl = lbl.equals(bot) ? top : lbl;

    let lblmap = monitor.context.labels.labelmap;
    let name = labelName.value;
    if (!lblmap[name]) {
        lblmap[name] = {
            label: lbl,
            pcmarker: undefined
        };
    }

    lblmap[name].label = lub(lblmap[name].label, lbl);
    let marker = lblmap[name].pcmarker;
    if (marker !== undefined) {
        monitor.context.pcStack.map(
            function (l) {
                return lub(l, lbl);
            },
            marker
        );
    }

    return new Value(undefined, bot);
}

// ------------------------------------------------------------

function __upg(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let arg0 = args[0] ? args[0] : new Value(undefined, bot);

    let lbl = bot;
    for (let i = 1; i < args.length; i++) {
        let arg = ToString(args[i]);
        monitor.assert(le(arg.label, bot), 'upg expected label of label string to be bot');
        lbl = lub(lbl, Label.fromString(arg.value));
    }

    lbl = lbl.equals(bot) ? top : lbl;

    return new Value(arg0.value, lub(arg0.label, lbl));
}

// ---

function __upgparts(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let arg0 = args[0] ? args[0] : new Value(undefined, bot);

    let lbl = bot;
    for (let i = 1; i < args.length; i++) {
        let arg = ToString(args[i]);
        monitor.assert(le(arg.label, bot), 'upg expected label of label string to be bot');
        lbl = lub(lbl, Label.fromString(arg.value));
    }

    lbl = lbl.equals(bot) ? top : lbl;

    if (IsIEcmaObject(arg0)) {
        for (let prop in arg0.value.labels) {
            let labelData = arg0.value.labels[prop];
            labelData.value = lub(labelData.value, lbl);
            labelData.existence = lub(labelData.existence, lbl);
        }

        arg0.value.struct = lub(arg0.value.struct, lbl);
        return arg0;
    } 

    return new Value(arg0.value, lub(arg0.label, lbl));
}


// ------------------------------------------------------------

function __dupg(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let arg0 = args[0] ? args[0] : new Value(undefined, bot);

    let lbl = bot;
    for (let i = 1; i < args.length; i++) {
        lbl = lub(lbl, args[i].label);
    }

    return new Value(arg0.value, lub(arg0.label, lbl));
}

// ------------------------------------------------------------

function __upgs(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let obj = args[0] ? args[0] : new Value(undefined, bot);

    let lbl = bot;
    for (let i = 1; i < args.length; i++) {
        let arg = ToString(args[i]);
        monitor.assert(le(arg.label, bot), 'upgs expected label of label string to be bot');
        lbl = lub(lbl, Label.fromString(arg.value));
    }

    lbl = lbl.equals(bot) ? top : lbl;


    if (IsIEcmaObject(obj)) {
        obj.value.struct = lub(obj.value.struct, lbl);
    }

    return obj;
}

// ------------------------------------------------------------

function __dupgs(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    let arg0 = args[0] ? args[0] : new Value(undefined, bot);

    let lbl = bot;
    for (let i = 1; i < args.length; i++) {
        lbl = lub(lbl, args[i].label);
    }

    if (IsIEcmaObject(arg0)) {
        arg0.value.struct = lub(arg0.value.struct, lbl);
    }

    return arg0;
}

// ------------------------------------------------------------

function __upge(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<undefined> {
    let obj = args[0] ? args[0] : new Value(undefined, bot);
    let arg1 = args[1] ? args[1] : new Value(undefined, bot);

    if (obj.value === undefined || obj.value === null) {
        return new Value(undefined, bot);
    }

    let ix = ToString(arg1);

    let lbl = bot;
    for (let i = 2; i < args.length; i++) {
        let arg = ToString(args[i]);
        monitor.assert(le(arg.label, bot), 'upge expected label of label string to be bot');
        lbl = lub(lbl, Label.fromString(arg.value));
    }

    lbl = lbl.equals(bot) ? top : lbl;

    if (IsIEcmaObject(obj)) {
        let prop = obj.value.labels[ix.value];
        if (prop) {
            prop.existence = lub(prop.existence, lbl);
        }
    }

    return new Value(undefined, bot);
}

// ------------------------------------------------------------

function __dupge(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<undefined> {
    let obj = args[0] ? args[0] : new Value(undefined, bot);
    let arg1 = args[1] ? args[1] : new Value(undefined, bot);

    if (obj.value === undefined || obj.value === null) {
        return new Value(undefined, bot);
    }

    let ix = ToString(arg1);

    let lbl = bot;
    for (let i = 1; i < args.length; i++) {
        lbl = lub(lbl, args[i].label);
    }

    if (IsIEcmaObject(obj)) {
        let prop = obj.value.labels[ix.value];
        if (prop) {
            prop.existence = lub(prop.existence, lbl);
        }
    }

    return new Value(undefined, bot);
}

function __declassify(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {

    var val = new Value(args[0] ? args[0].value : undefined, bot);
    return val;

}
