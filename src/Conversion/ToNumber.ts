import { Value } from "../Value";
import { MonitorBase } from '../MonitorBase';

import { ToPrimitive } from './ToPrimitive';
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;

// -------------------------------------------------------------
// ToNumber, 9.3

export function ToNumber(x : Value<ValueTypes>) {
    if (typeof x.value !== 'object') {
        return new Value(Number(x.value), x.label);
    }

    monitor.context.pushPC(x.label);
    var primValue = ToPrimitive(x, 'number');
    monitor.context.popPC();

    return new Value(Number(primValue.value), primValue.label);
}