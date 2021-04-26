
import { Label, bot } from '../Label';
import { Value } from "../Value";
import { EcmaObject } from '../Objects/EcmaObject';

import { MonitorBase } from '../MonitorBase';

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// Number Object, 15.7.5

export class NumberObject extends EcmaObject {

    PrimitiveValue: Number;
    PrimitiveLabel: Label;

    constructor(val : any, lbl : Label) {
        super();
        this.Class = 'Number';
        this.PrimitiveValue = new monitor.instances.NumberConstructor.host(val);
        this.PrimitiveLabel = lbl;
        this.Extensible = true;
        this.Prototype = new Value(monitor.instances.NumberPrototype, bot);
    }
}

// ---

export function IsNumberObject(x : Value<any>) : x is Value<NumberObject> {
    return typeof x.value === 'object' && x.value !== null && x.value.Class === 'Number';
}