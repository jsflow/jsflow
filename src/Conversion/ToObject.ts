import { Value } from "../Value";
import { MonitorBase } from '../MonitorBase';

import { bot } from '../Label';
import { BooleanObject } from '../Objects/BooleanObject';
import { NumberObject } from '../Objects/NumberObject';
import { StringObject } from '../Objects/StringObject';
import { ValueTypes } from "../Interfaces";
import { EcmaObject } from "../Objects/EcmaObject";

declare var monitor: MonitorBase;

// -------------------------------------------------------------
// ToObject, 9.9

export function ToObject(x: Value<ValueTypes>): Value<EcmaObject> {
    // null or undefined, hence ==
    let value = x.value;
    if (value === null || value === undefined) {
        monitor.context.pushPC(x.label);

        monitor.Throw(
            "TypeError",
            'cannot convert ' + String(x.value) + ' to object',
            bot
        );
    }

    monitor.context.pushPC(x.label);
    let res: Value<EcmaObject> = undefined;
    switch (typeof x.value) {
        case 'boolean':
            res = new Value(new BooleanObject(x.value, x.label), x.label);
            break;
        case 'number':
            res = new Value(new NumberObject(x.value, x.label), x.label);
            break;
        case 'string':
            //@ts-ignore
            res = new Value(new StringObject(x.value, x.label), x.label);
            break;
    }

    monitor.context.popPC();
    if (res !== undefined) {
        return res;
    } else {
        //@ts-ignore
        return new Value(x.value, x.label);
    }
}