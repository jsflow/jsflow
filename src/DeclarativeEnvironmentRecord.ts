import { bot } from "./Label";
import { Value } from "./Value";
import { EcmaObject } from './Objects/EcmaObject';
import { ValueTypes, IEnvironmentRecord, IEcmaObject } from "./Interfaces";
import { LexicalEnvironment } from "./LexicalEnvironment";
import { MonitorBase } from "./MonitorBase";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// 10.2.2.2

export function NewDeclarativeEnvironment(e : Value<LexicalEnvironment>) {
    var envRec = new DeclarativeEnvironmentRecord();
    var env = new LexicalEnvironment(envRec, e);
    return env;
}

// ------------------------------------------------------------
// Declarative Environment Record, 10.2.1.1

export class DeclarativeEnvironmentRecord extends EcmaObject implements IEnvironmentRecord {

    constructor() {
        super();
    }

    // HasBinding, 10.2.1.1.1
    HasBinding(s: Value<string>): Value<boolean> {
        return this.HasProperty(s);
    }

    // CreateMutableBinding, 10.2.1.1.2
    CreateMutableBinding(p: Value<string>, d?: boolean): void {

        var desc = {
            value: undefined,
            label: monitor.context.effectivePC,
            writable: true,
            enumerable: true,
            configurable: d
        };

        this.DefineOwnProperty(p, desc, true);
    }

    // GetBindingValue 10.2.1.1.4
    GetBindingValue(p: Value<string>, s?: boolean): Value<ValueTypes> {
        return this.Get(p);
    }

    // SetMutableBinding, 10.2.1.1.3
    SetMutableBinding(p: Value<string>, v: Value<ValueTypes>, s?: boolean): void {
        this.Put(p, v, s === true);
    }

    // DeleteBinding, 10.2.1.1.5
    DeleteBinding(p: Value<string>): Value<boolean> {
        return this.Delete(p);
    }

    // ImplicitThisValie. 10.2.1.1.6
    ImplicitThisValue(): Value<IEcmaObject | undefined> {
        return new Value(undefined, bot);
    }

    // CreateImmutableBinding, 10.2.1.1.7
    CreateImmutableBinding(p: Value<string>): void {

        var desc = {
            value: undefined,
            label: bot,
            writable: false,
            enumerable: true,
            configurable: true
        };

        this.DefineOwnProperty(p, desc, false);
    }

    // InitializeImmutableBinding, 10.2.1.1.8
    InitializeImmutableBinding(p: Value<string>, v: Value<ValueTypes>): void {
        var desc = this.GetOwnProperty(p).value;
        if (desc === undefined) {
            monitor.fatal(`InitializeImmutableBinding: no bindinging for {p.value}`);
        } else {
            desc.value = v.value;
            desc.label = v.label;

            // @ts-ignore desc should be a data descriptor created by CreateImmutableBinding
            this.DefineOwnProperty(p, desc, false);
        }
    }
}