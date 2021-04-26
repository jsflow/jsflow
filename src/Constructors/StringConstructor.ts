
import { Value } from "../Value";
import * as constants from '../Constants';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { HasInstance } from '../HasInstance';
import { ToUInt16 } from '../Conversion/ToUInt16';
import { ToString } from '../Conversion/ToString';
import { MonitorBase } from '../MonitorBase';
import { DefineFFF, DefineTFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';
import { bot, Label, lub } from '../Label';
import { StringObject } from '../Objects/StringObject';
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// The String Constructor, 15.5.2

export class StringConstructor extends EcmaObject {

    host: any;

    constructor(host: String) {
        super();

        this.Class = 'Function';
        // not mandated by standard
        this.Extensible = true;
        this.host = host;
    }

    Setup(): void {
        this.Prototype = new Value(monitor.instances.FunctionPrototype, bot);

        DefineFFF(this, constants.length, 1);
        DefineFFF(this, constants.prototype, monitor.instances.StringPrototype);
        DefineTFT(this, constants.fromCharCode, new BuiltinFunctionObject(fromCharCode, 1, this.host.fromCharCode));
    }

    HasInstance(V: Value<ValueTypes>): Value<boolean> {
        return HasInstance.call(this, V);
    }

    // 15.5.1.1 -----------------------------------------------------------------
    Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {

        if (!args[0]) {
            return new Value('', bot);
        }

        var str = ToString(args[0]);
        return str;
    }

    // 15.5.2.1 ----------------------------------------------------------------- 
    Construct(args: Value<ValueTypes>[]): Value<StringObject> {
        var value = args[0];

        var str : StringObject;
        if (value) {
            var x = ToString(value);
            str = new StringObject(x.value, x.label);
        } else {
            str = new StringObject('');
        }
        return new Value(str, bot);
    }
}

// --------------------------------------------------------------------------
// fromCharCode, 15.5.3.2 

function fromCharCode(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<string> {

    var lbl = new Label();
    var _args: number[] = [];
    for (var i = 0, len = args.length; i < len; i++) {
        var arg = ToUInt16(args[i]);
        lbl = lub(lbl, arg.label);
        _args[i] = arg.value;
    }

    var _String = monitor.instances.StringConstructor.host;
    var v = _String.fromCharCode.apply(_String, _args);
    return new Value(v, lbl);
}