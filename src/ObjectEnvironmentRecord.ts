import { Label, bot } from "./Label";
import { Value } from "./Value";
import { EcmaObject } from './Objects/EcmaObject';
import { ValueTypes, IEcmaObject } from "./Interfaces";
import { LexicalEnvironment } from "./LexicalEnvironment";
import { MonitorBase } from "./MonitorBase";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// 10.2.2.3

export function NewObjectEnvironment(o : Value<EcmaObject>, e : Value<LexicalEnvironment>) {
    var envRec = new ObjectEnvironmentRecord(o);
    var env = new LexicalEnvironment(envRec, e);
    return env;
}

// ------------------------------------------------------------
// Environment records, 10.2.1.2

export class ObjectEnvironmentRecord extends EcmaObject {

    bindingObject: Value<EcmaObject>;
    provideThis: boolean = false;

    constructor(p: Value<EcmaObject>) {
        super();
        if (p.value === undefined)
            monitor.fatal('ObjectEnvironmentRecord, undefined binding object');

        this.bindingObject = p; // Value
    }

    // ---

    raise(l: Label): void {
        this.bindingObject.raise(l);
    }

    // ---

    // HasBinding, 10.2.1.2.1
    HasBinding(p: Value<string>): Value<boolean> {
        return this.bindingObject.HasProperty(p);
    }

    // ---

    // CreateMutableBinding, 10.2.1.2.2
    CreateMutableBinding(p: Value<string>, d?: boolean): void {
        var desc = {
            value: undefined,
            label: monitor.context.effectivePC,
            writable: true,
            enumerable: true,
            configurable: !!d
        };

        this.bindingObject.DefineOwnProperty(p, desc, true);
    }

    // ---

    // GetBindingValue, 10.2.1.2.4
    GetBindingValue(p: Value<string>, s): Value<ValueTypes> {
        return this.bindingObject.Get(p);
    }

    // SetMutableBinding, 10.2.1.2.3
    SetMutableBinding(p: Value<string>, v: Value<ValueTypes>, s?: boolean): void {
        this.bindingObject.Put(p, v, s);
    }

    // DeleteBinding, 10.2.1.2.5
    DeleteBinding(p: Value<string>): Value<boolean> {
        return this.bindingObject.Delete(p);
    }

    // ImplicitThisValue, 10.2.1.2.6
    ImplicitThisValue(): Value<IEcmaObject | undefined> {
        if (this.provideThis) {
            return this.bindingObject.clone();
        } else {
            return new Value(undefined, bot);
        }
    }
}