import { Value } from "../Value";
import * as constants from '../Constants';
import * as _ from 'underscore';
import { MonitorBase } from '../MonitorBase';

import { bot, Label } from '../Label';
import { EcmaObject } from '../Objects/EcmaObject';

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// RegExp Object, 15.10.4.1

export class RegExpObject extends EcmaObject {

    PrimitiveValue: RegExp;
    PrimitiveLabel: Label;

    constructor(nativeRegExp: RegExp, l: Label) {
        super();

        this.Class = 'RegExp';
        this.PrimitiveValue = nativeRegExp;
        this.PrimitiveLabel = l;

        this.Extensible = true;
        this.Prototype = new Value(monitor.instances.RegExpPrototype, bot);

        this.DefineOwnProperty(constants.source,
            {
                value: this.PrimitiveValue.source,
                writable: false,
                enumerable: false,
                configurable: false,
                label: l
            }
        );

        this.DefineOwnProperty(constants.global,
            {
                value: this.PrimitiveValue.global,
                writable: false,
                enumerable: false,
                configurable: false,
                label: l
            }
        );

        this.DefineOwnProperty(constants.ignoreCase,
            {
                value: this.PrimitiveValue.ignoreCase,
                writable: false,
                enumerable: false,
                configurable: false,
                label: l
            }
        );

        this.DefineOwnProperty(constants.multiline,
            {
                value: this.PrimitiveValue.multiline,
                writable: false,
                enumerable: false,
                configurable: false,
                label: l
            }
        );

        this.DefineOwnProperty(constants.lastIndex,
            {
                value: this.PrimitiveValue.lastIndex,
                writable: true,
                enumerable: false,
                configurable: false,
                label: l
            }
        );


    }

    toString() {
        var v = this.PrimitiveValue.toString();
        return v;
    }
}

export function IsRegExpObject(x: Value<any>): x is Value<RegExpObject> {
    return typeof x.value === 'object' && x.value !== null && x.value !== undefined && x.value.Class === 'RegExp';
}