
import { Value } from "../Value";
import { MonitorBase } from '../MonitorBase';

import { EcmaObject } from '../Objects/EcmaObject';
import { bot, Label } from '../Label';
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// String Object, 15.5.5

export class StringObject extends EcmaObject {

    PrimitiveValue: string;
    PrimitiveLabel: Label;

    constructor(val : string, lbl?: Label) {
        super();
        this.Class = 'String';
        this.PrimitiveValue = val;

        lbl = lbl || bot;
        this.PrimitiveLabel = lbl;

        // TODO: how to solve this to work with EcmaObject properly
        //@ts-ignore TYPES
        this.properties = new String(val);
        for (var i = 0, len = val.length; i < len; i++) {
            this.labels[i] = {
                value: lbl,
                existence: lbl
            };
        }

        this.labels.length = {
            value: lbl,
            existence: lbl
        };

        this.Extensible = true;
        this.Prototype = new Value(monitor.instances.StringPrototype, bot);

        // length is not modeled in this way, but by GetOwnProperty; however, e.g.,
        // delete will use the properties field for deletion. Thus, we add a fake model.
        //   ecma.DefineFFF(this, constants.length, 0);

    }
}


export function IsStringObject(x : Value<any>) : x is Value<StringObject> {
    return typeof x.value === 'object' && x.value !== null && x.value.Class === 'String';
}