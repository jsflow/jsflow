import { Value } from "../Value";
import * as constants from '../Constants';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { ToNumber } from '../Conversion/ToNumber';
import { MonitorBase } from '../MonitorBase';

import { DefineFFF, DefineTFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';

import { bot, lub, Label, le } from '../Label';
import { IsDateObject, DateObject } from "../Objects/DateObject";
import { BooleanPrototype } from "./BooleanPrototype";
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// The Date Prototype, 15.9.5
export class DatePrototype extends EcmaObject {

    host: Date;

    PrimitiveValue: Value<number>;

    constructor(host : Date) {
        super();

        this.Class = 'Date';
        this.PrimitiveValue = new Value(NaN, bot);

        this.host = host;
    }

    Setup() : void {

        this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);

        DefineTFT(this, constants.constructor, monitor.instances.DateConstructor);
        DefineTFT(this, constants.toString, new BuiltinFunctionObject(toString, 0, this.host.toString));
        DefineTFT(this, constants.toDateString, new BuiltinFunctionObject(toDateString, 0, this.host.toDateString));
        DefineTFT(this, constants.toTimeString, new BuiltinFunctionObject(toTimeString, 0, this.host.toTimeString));
        DefineTFT(this, constants.toLocaleString, new BuiltinFunctionObject(toLocaleString, 0, this.host.toLocaleString));
        DefineTFT(this, constants.toLocaleDateString, new BuiltinFunctionObject(toLocaleDateString, 0, this.host.toLocaleDateString));
        DefineTFT(this, constants.toLocaleTimeString, new BuiltinFunctionObject(toLocaleTimeString, 0, this.host.toLocaleTimeString));
        DefineTFT(this, new Value('valueOf', bot), new BuiltinFunctionObject(valueOf, 0, this.host.valueOf));
        DefineTFT(this, constants.getTime, new BuiltinFunctionObject(getTime, 0, this.host.getTime));
        DefineTFT(this, constants.getFullYear, new BuiltinFunctionObject(getFullYear, 0, this.host.getFullYear));
        DefineTFT(this, constants.getUTCFullYear, new BuiltinFunctionObject(getUTCFullYear, 0, this.host.getUTCFullYear));
        DefineTFT(this, constants.getMonth, new BuiltinFunctionObject(getMonth, 0, this.host.getMonth));
        DefineTFT(this, constants.getUTCMonth, new BuiltinFunctionObject(getUTCMonth, 0, this.host.getUTCMonth));
        DefineTFT(this, constants.getDate, new BuiltinFunctionObject(getDate, 0, this.host.getDate));
        DefineTFT(this, constants.getUTCDate, new BuiltinFunctionObject(getUTCDate, 0, this.host.getUTCDate));
        DefineTFT(this, constants.getDay, new BuiltinFunctionObject(getDay, 0, this.host.getDay));
        DefineTFT(this, constants.getUTCDay, new BuiltinFunctionObject(getUTCDay, 0, this.host.getUTCDay));
        DefineTFT(this, constants.getHours, new BuiltinFunctionObject(getHours, 0, this.host.getHours));
        DefineTFT(this, constants.getUTCHours, new BuiltinFunctionObject(getUTCHours, 0, this.host.getUTCHours));
        DefineTFT(this, constants.getMinutes, new BuiltinFunctionObject(getMinutes, 0, this.host.getMinutes));
        DefineTFT(this, constants.getUTCMinutes, new BuiltinFunctionObject(getUTCMinutes, 0, this.host.getUTCMinutes));
        DefineTFT(this, constants.getSeconds, new BuiltinFunctionObject(getSeconds, 0, this.host.getSeconds));
        DefineTFT(this, constants.getUTCSeconds, new BuiltinFunctionObject(getUTCSeconds, 0, this.host.getUTCSeconds));
        DefineTFT(this, constants.getMilliseconds, new BuiltinFunctionObject(getMilliseconds, 0, this.host.getMilliseconds));
        DefineTFT(this, constants.getUTCMilliseconds, new BuiltinFunctionObject(getUTCMilliseconds, 0, this.host.getUTCMilliseconds));
        DefineTFT(this, constants.getTimezoneOffset, new BuiltinFunctionObject(getTimezoneOffset, 0, this.host.getTimezoneOffset));
        DefineTFT(this, constants.setTime, new BuiltinFunctionObject(setTime, 1, this.host.setTime));
        DefineTFT(this, constants.setMilliseconds, new BuiltinFunctionObject(setMilliseconds, 0, this.host.setMilliseconds));
        DefineTFT(this, constants.setUTCMilliseconds, new BuiltinFunctionObject(setUTCMilliseconds, 0, this.host.setUTCMilliseconds));
        DefineTFT(this, constants.setSeconds, new BuiltinFunctionObject(setSeconds, 0, this.host.setSeconds));
        DefineTFT(this, constants.setUTCSeconds, new BuiltinFunctionObject(setUTCSeconds, 0, this.host.setUTCSeconds));
        DefineTFT(this, constants.setMinutes, new BuiltinFunctionObject(setMinutes, 0, this.host.setMinutes));
        DefineTFT(this, constants.setUTCMinutes, new BuiltinFunctionObject(setUTCMinutes, 0, this.host.setUTCMinutes));
        DefineTFT(this, constants.setHours, new BuiltinFunctionObject(setHours, 0, this.host.setHours));
        DefineTFT(this, constants.setUTCHours, new BuiltinFunctionObject(setUTCHours, 0, this.host.setUTCHours));
        DefineTFT(this, constants.setDate, new BuiltinFunctionObject(setDate, 0, this.host.setDate));
        DefineTFT(this, constants.setUTCDate, new BuiltinFunctionObject(setUTCDate, 0, this.host.setUTCDate));
        DefineTFT(this, constants.setMonth, new BuiltinFunctionObject(setMonth, 2, this.host.setMonth));
        DefineTFT(this, constants.setUTCMonth, new BuiltinFunctionObject(setUTCMonth, 0, this.host.setUTCMonth));
        DefineTFT(this, constants.setFullYear, new BuiltinFunctionObject(setFullYear, 0, this.host.setFullYear));
        DefineTFT(this, constants.setUTCFullYear, new BuiltinFunctionObject(setUTCFullYear, 0, this.host.setUTCFullYear));
        DefineTFT(this, constants.toUTCString, new BuiltinFunctionObject(toUTCString, 0, this.host.toUTCString));
        DefineTFT(this, constants.toISOString, new BuiltinFunctionObject(toISOString, 0, this.host.toISOString));
        DefineTFT(this, constants.toJSON, new BuiltinFunctionObject(toJSON, 0, this.host.toJSON));
        // @ts-ignore
        DefineTFT(this, constants.setYear, new BuiltinFunctionObject(setYear, 1, this.host.setYear));
        // @ts-ignore
        DefineTFT(this, constants.getYear, new BuiltinFunctionObject(getYear, 0, this.host.getYear));
        // @ts-ignore
        DefineTFT(this, constants.toGMTString, new BuiltinFunctionObject(toUTCString, 0, this.host.toGTMString));
    }

}

function assertDate(v : Value<any>, caller : string) : void {

    if (!IsDateObject(v)) {
        monitor.context.pushPC(v.label);
        monitor.Throw(
            "TypeError",
            caller + ' is not generic',
            bot
        );
    }

}

// ------------------------------------------------------------

function mkGenericGet(fname : string) {
    return function (thisArg: Value<DateObject>, args: Value<ValueTypes>[]): Value<ValueTypes> {
        assertDate(thisArg, fname);

        let label = lub(thisArg.label, thisArg.value.PrimitiveLabel);
        let date = thisArg.value.PrimitiveValue;

        let value = date[fname].call(date);

        return new Value(value, label);
    };
}

// ------------------------------------------------------------

function mkGenericSet(fname : string) {
    return function (thisArg: Value<DateObject>, args: Value<ValueTypes>[]): Value<ValueTypes> {
        assertDate(thisArg, fname);

        let context = lub(thisArg.label, monitor.context.effectivePC);

        monitor.assert(le(context, thisArg.value.PrimitiveLabel),
            fname + ': context ' + context + ' not below state label of Date object ' + thisArg.value.PrimitiveLabel
        );

        let _args : number[] = [];
        let label = new Label();

        for (let i = 0, len = args.length; i < len; i++) {
            let x = ToNumber(args[i]);
            label = lub(label, x.label);
            _args[i] = x.value;
        }

        thisArg.value.PrimitiveLabel = lub(thisArg.value.PrimitiveLabel, label);
        label = lub(thisArg.label, thisArg.value.PrimitiveLabel);

        let date = thisArg.value.PrimitiveValue;
        let value = date[fname].apply(date, _args);

        return new Value(value, label);
    };
}
// ------------------------------------------------------------
// toISOString, 15.9.5.43
let toISOString = mkGenericGet('toISOString');

// ------------------------------------------------------------
// toString, 15.9.5.2
let toString = mkGenericGet('toString');

// ------------------------------------------------------------
// toDateString, 15.9.5.?
let toDateString = mkGenericGet('toDateString');

// ------------------------------------------------------------
// toTimeString, 15.9.5.?
let toTimeString = mkGenericGet('toTimeString');

// ------------------------------------------------------------
// toLocaleString, 15.9.5.?
let toLocaleString = mkGenericGet('toLocaleString');

// ------------------------------------------------------------
// toLocaleDateString, 15.9.5.?
let toLocaleDateString = mkGenericGet('toLocaleDateString');

// ------------------------------------------------------------
// toLocaleTimeString, 15.9.5.?
let toLocaleTimeString = mkGenericGet('toLocaleTimeString');

// ------------------------------------------------------------
// valueOf, 15.9.5.?
function valueOf(thisArg, args) {
    assertDate(thisArg, 'valueOf');
    return new Value(thisArg.value.PrimitiveValue.valueOf(), thisArg.label);
}

// ------------------------------------------------------------
// getTime, 15.9.5.9
let getTime = mkGenericGet('getTime');

// ------------------------------------------------------------
// getFullYear, 15.9.5.?
let getFullYear = mkGenericGet('getFullYear');

// ------------------------------------------------------------
// getUTCFullYear, 15.9.5.?
let getUTCFullYear = mkGenericGet('getUTCFullYear');

// ------------------------------------------------------------
// getMonth, 15.9.5.?
let getMonth = mkGenericGet('getMonth');

// ------------------------------------------------------------
// getUTCMonth, 15.9.5.?
let getUTCMonth = mkGenericGet('getUTCMonth');

// ------------------------------------------------------------
// getDate, 15.9.5.?
let getDate = mkGenericGet('getDate');

// ------------------------------------------------------------
// getUTCDate, 15.9.5.?
let getUTCDate = mkGenericGet('getUTCDate');

// ------------------------------------------------------------
// getDay, 15.9.5.?
let getDay = mkGenericGet('getDay');

// ------------------------------------------------------------
// getUTCDay, 15.9.5.?
let getUTCDay = mkGenericGet('getUTCDay');

// ------------------------------------------------------------
// getHours, 15.9.5.?
let getHours = mkGenericGet('getHours');

// ------------------------------------------------------------
// getUTCHours, 15.9.5.?
let getUTCHours = mkGenericGet('getUTCHours');

// ------------------------------------------------------------
// getMinutes, 15.9.5.?
let getMinutes = mkGenericGet('getMinutes');

// ------------------------------------------------------------
// getUTCMinutes, 15.9.5.?
let getUTCMinutes = mkGenericGet('getUTCMinutes');

// ------------------------------------------------------------
// getSeconds, 15.9.5.?
let getSeconds = mkGenericGet('getSeconds');

// ------------------------------------------------------------
// getUTCSeconds, 15.9.5.?
let getUTCSeconds = mkGenericGet('getUTCSeconds');

// ------------------------------------------------------------
// getMilliseconds, 15.9.5.?
let getMilliseconds = mkGenericGet('getMilliseconds');

// ------------------------------------------------------------
// getUTCMilliseconds, 15.9.5.?
let getUTCMilliseconds = mkGenericGet('getUTCMilliseconds');

// ------------------------------------------------------------
// getTimezoneOffset, 15.9.5.?
let getTimezoneOffset = mkGenericGet('getTimezoneOffset');

// ------------------------------------------------------------
// setTime, 15.9.5.?
let setTime = mkGenericSet('setTime');

// ------------------------------------------------------------
// setMilliseconds, 15.9.5.?
let setMilliseconds = mkGenericSet('setMilliseconds');

// ------------------------------------------------------------
// setUTCMilliseconds, 15.9.5.?
let setUTCMilliseconds = mkGenericSet('setUTCMilliseconds');

// ------------------------------------------------------------
// setSeconds, 15.9.5.?
let setSeconds = mkGenericSet('setSeconds');

// ------------------------------------------------------------
// setUTCSeconds, 15.9.5.?
let setUTCSeconds = mkGenericSet('setUTCSeconds');

// ------------------------------------------------------------
// setMinutes, 15.9.5.?
let setMinutes = mkGenericSet('setMinutes');

// ------------------------------------------------------------
// setUTCMinutes, 15.9.5.?
let setUTCMinutes = mkGenericSet('setUTCMinutes');

// ------------------------------------------------------------
// setHours, 15.9.5.?
let setHours = mkGenericSet('setHours');

// ------------------------------------------------------------
// setUTCHours, 15.9.5.?
let setUTCHours = mkGenericSet('setUTCHours');

// ------------------------------------------------------------
// setDate, 15.9.5.?
let setDate = mkGenericSet('setDate');

// ------------------------------------------------------------
// setUTCDate, 15.9.5.?
let setUTCDate = mkGenericSet('setUTCDate');

// ------------------------------------------------------------
// setMonth, 15.9.5.?
let setMonth = mkGenericSet('setMonth');

// ------------------------------------------------------------
// setUTCMonth, 15.9.5.?
let setUTCMonth = mkGenericSet('setUTCMonth');

// ------------------------------------------------------------
// setFullYear, 15.9.5.?
let setFullYear = mkGenericSet('setFullYear');

// ------------------------------------------------------------
// setUTCFullYear, 15.9.5.?
let setUTCFullYear = mkGenericSet('setUTCFullYear');

// ------------------------------------------------------------
// toUTCString, 15.9.5.?
let toUTCString = mkGenericGet('toUTCString');

// ------------------------------------------------------------
// toJSON, 15.9.5.?
let toJSON = mkGenericGet('toJSON');

// ------------------------------------------------------------
// getYear, B.2.4
let getYear = mkGenericGet('getYear');

// ------------------------------------------------------------
// setYear, B.2.5
let setYear = mkGenericSet('setYear');

// ------------------------------------------------------------
// setYear, B.2.6
let toGMTString = mkGenericSet('toGMTString');