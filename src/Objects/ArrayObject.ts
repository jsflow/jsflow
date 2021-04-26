import { Value } from "../Value";
import { MonitorBase } from '../MonitorBase';

import { EcmaObject } from '../Objects/EcmaObject';
import { bot, le, lub, Label } from '../Label';
import { ValueTypes } from "../Interfaces";
import { JSFPropertyDescriptor } from "../PropertyDescriptor";
import { throwStatement } from "../Engine/Tracing/ThrowStatement";
import { threadId } from "worker_threads";
import { ToUInt32 } from "../Conversion/ToUInt32";
import { ToNumber } from "../Conversion/ToNumber";
import { ToString } from "../Conversion/ToString";

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// 15.4.2.1, and 15.4.2.2

export class ArrayObject extends EcmaObject {

    properties: ValueTypes[];

    constructor(struct?: Label) {
        super();
        this.Class = 'Array';

        this.Prototype = new Value(monitor.instances.ArrayPrototype, bot);
        this.Extensible = true;

        this.properties = [];
        this.labels = {};

        struct = struct || bot;
        this.labels.length = {
            value: struct,
            existence: bot
        };

        this.struct = struct;
    }

    // ---

    static fromValueArray(values: Value<ValueTypes>[], struct: Label): ArrayObject {
        let array = new ArrayObject(struct);

        for (let i = 0, len = values.length; i < len; i++) {
            let value = values[i];
            array.properties[i] = value.value;
            array.labels[i] = {
                value: value.label,
                existence: bot
            };
        }

        return array;
    }

    // ---

    static fromPropertyArray(values: Value<ValueTypes>[], struct: Label): ArrayObject {
        let array = new ArrayObject(struct);

        for (let i = 0, len = values.length; i < len; i++) {
            let value = values[i];
            array.properties[i] = value.value;
            array.labels[i] = {
                value: value.label,
                existence: value.label
            };
        }

        return array;
    }

    // ---

    static fromArray(values: ValueTypes[], label: Label, existence: Label): ArrayObject {
        let array = new ArrayObject(existence);

        for (let i = 0, len = values.length; i < len; i++) {
            array.properties[i] = values[i];
            array.labels[i] = {
                value: label,
                existence: existence
            };
        }
        return array;
    }

    // ---

    toString(): string {
        return this.properties.toString();
    }

    // ---

    toLabeledString(): string {
        let strs = [];
        for (let p in this.properties) {
            strs.push(this.properties[p] + '_' + this.labels[p].value.toString() + '(' + this.labels[p].existence.toString() + ')');
        }

        return '[ ' + strs.join(', ') + ' | ' + this.struct.toString() + ', length : ' + this.labels.length.value.toString() + '(' + this.labels.length.existence.toString() + ')' + ' ]';
    }



    // ---
    // 15.4.5.1
    DefineOwnProperty(s: Value<string | number>, desc: JSFPropertyDescriptor, Throw?: boolean): Value<boolean> {
        let c = monitor.context;

        /* Instead of lengthContext = lub(c.effectivePC, s.label), push s.label to
           pc-stack, and use pc (to make taintMode easier) */
        c.pushPC(s.label);
        if (!le(c.effectivePC, this.labels.length.value)) {
            monitor.securityError(
                `Array.prototype.DefineOwnProperty: write context ${c.effectivePC} not below length label ${this.labels.length.value}`
            );

            // For observable flows
            this.labels.length.value = lub(this.labels.length.value, c.effectivePC);
        }

        c.popPC();

        let oldLenDesc = this.GetOwnProperty(new Value('length', bot));
        let oldLen = new Value(oldLenDesc.value.value, oldLenDesc.label);
        if (s.value === 'length') {
            if (desc.value === undefined) {
                return super.DefineOwnProperty.call(this, s, desc, Throw);
            }

            let newLen = ToUInt32(new Value(desc.value, desc.label));
            if (newLen.value !== ToNumber(new Value(desc.value, desc.label)).value) {
                monitor.Throw(
                    'RangeError',
                    'Invalid length in Array.DefineOwnProperty',
                    bot
                )
            }

            if (newLen.value >= oldLen.value) {
                return super.DefineOwnProperty.call(
                    this,
                    s,
                    { value: newLen.value, label: lub(newLen.label, desc.label) },
                    Throw
                );
            }

            if (oldLenDesc.value.writable === false) {
                if (Throw) {
                    monitor.Throw(
                        'TypeError',
                        'Non-writable descriptor in Array.DefineOwnProperty',
                        bot
                    )
                } else {
                    return new Value(false, bot);
                }
            }

            desc.value = newLen.value;
            desc.label = lub(desc.label, newLen.label);

        }

        return super.DefineOwnProperty.call(this, s, desc, Throw);
    }
}