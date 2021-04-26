import { Value } from "../Value";
import { MonitorBase } from '../MonitorBase';

import { EcmaObject } from '../Objects/EcmaObject';
import { bot, Label } from '../Label';

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// Date Object, 15.9.5

export class DateObject extends EcmaObject {

    PrimitiveValue: Date;
    PrimitiveLabel: Label;

    constructor(date : Date, label : Label) {
        super();

        this.Class = 'Date';
        this.PrimitiveValue = date;
        this.PrimitiveLabel = label;
        this.Extensible = true;
        this.Prototype = new Value(monitor.instances.DatePrototype, bot);
    }

}

export function IsDateObject(x : Value<any>) : x is Value<DateObject> {
    return typeof x.value === 'object' && x.value !== null && x.value.Class === 'Date';
}