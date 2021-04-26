import { Value } from "../Value";
import { EcmaObject } from '../Objects/EcmaObject';
import { bot, Label } from '../Label';
import { MonitorBase } from '../MonitorBase';
import { ValueTypes } from "../Interfaces";

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// Boolean Object, 15.6.5

export class BooleanObject extends EcmaObject {

    PrimitiveValue : Boolean;
    PrimitiveLabel : Label;

    constructor(val : ValueTypes, lbl : Label) {
        super();
        this.Class = 'Boolean';
        this.PrimitiveValue = new Boolean(val);
        this.PrimitiveLabel = lbl;
        this.Extensible = true;
        this.Prototype = new Value(monitor.instances.BooleanPrototype, bot);
    }
}

// ---

export function IsBooleanObject(x : Value<any>) : x is Value<BooleanObject> {
    return typeof x.value === 'object' && x.value !== null && x.value.Class === 'Boolean';
}