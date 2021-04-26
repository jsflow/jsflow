
import { Value } from "../Value";
import * as constants from '../Constants';
import * as _ from 'underscore';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { ArrayObject } from '../Objects/ArrayObject';
import { ToInteger } from '../Conversion/ToInteger';
import { ToString } from '../Conversion/ToString';
import { MonitorBase } from '../MonitorBase';

import { bot, lub } from '../Label';
import { DefineFFF, DefineTFT, DefineTFF } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';
import { ValueTypes } from "../Interfaces";
import { IsRegExpObject, RegExpObject } from "../Objects/RegExpObject";


declare var monitor: MonitorBase;

// ------------------------------------------------------------
// The RegExp Prototype, 15.10.6
export class RegExpPrototype extends EcmaObject {

    host: RegExp;

    constructor(host : RegExp) {
        super();
        this.Class = 'RegExp';

        this.host = host;
    }

    Setup() : void {
        this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);

        DefineFFF(this, constants.source, '');
        DefineFFF(this, constants.global, false);
        DefineFFF(this, constants.ignoreCase, false);
        DefineFFF(this, constants.multiline, false);
        DefineTFF(this, constants.lastIndex, 0);

        DefineTFT(this, constants.constructor, monitor.instances.RegExpConstructor);

        DefineTFT(this, constants.exec, new BuiltinFunctionObject(exec, 1, RegExp.prototype.exec));
        DefineTFT(this, constants.test, new BuiltinFunctionObject(test, 1, RegExp.prototype.test));
        DefineTFT(this, constants.toString, new BuiltinFunctionObject(toString, 0, RegExp.prototype.toString));
    }
}

function assertRegExp(v : Value<any>, caller : string) : void {

    if (!IsRegExpObject(v)) {
        monitor.context.pushPC(v.label);
        monitor.Throw(
            "TypeError",
            caller + ' is not generic',
            bot
        );
    }

}

// ------------------------------------------------------------
// exec, 15.10.6.2
function exec(thisArg: Value<RegExpObject>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    assertRegExp(thisArg, 'exec');

    var string = args[0] || new Value(undefined, bot);
    var S = ToString(string);

    var lastIndex = ToInteger(thisArg.Get(constants.lastIndex));

    var pre = thisArg.value.PrimitiveValue;
    pre.lastIndex = lastIndex.value;

    var res = pre.exec(S.value);

    var l = lub(thisArg.label, S.label, lastIndex.label);

    if (res === null) {
        return new Value(null, l);
    }

    thisArg.Put(constants.lastIndex, new Value(pre.lastIndex, l));

    var array = ArrayObject.fromArray(res, l, l);

    array.DefineOwnProperty(constants.index,
        {
            value: res.index,
            writable: true,
            enumerable: true,
            configurable: true,
            label: l
        }
    );

    array.DefineOwnProperty(constants.input,
        {
            value: res.input,
            writable: true,
            enumerable: true,
            configurable: true,
            label: l
        }
    );

    return new Value(array, bot);
}

// ------------------------------------------------------------
// test, 15.10.6.3
function test(thisArg: Value<RegExpObject>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    assertRegExp(thisArg, 'test');

    var res = exec(thisArg, args);
    return new Value(res.value !== null, res.label);
}

// ------------------------------------------------------------
// toString, 15.10.6.3
function toString(thisArg: Value<RegExpObject>, args: Value<ValueTypes>[]): Value<ValueTypes> {
    assertRegExp(thisArg, 'toString');

    return new Value(thisArg.value.PrimitiveValue.toString(), thisArg.label);
}
