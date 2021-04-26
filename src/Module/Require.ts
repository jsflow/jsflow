import { Value } from "../Value";
import { ValueTypes } from "../Interfaces";
import { EcmaObject } from "../Objects/EcmaObject";
import { Label, lub } from "../Label";
import { Module } from "./Module";
import { MonitorBase } from "../MonitorBase";

declare var monitor: MonitorBase;

// ---

export abstract class Require extends EcmaObject {

    label: Label;

    module: Module;
    main?: Module;
    static cache: Map<string, Value<ValueTypes>> = new Map();

    constructor(module: Module) {
        super();
        this.Class = 'Require';
        this.module = module;

        // this is the topmost require
        if (module.parent === undefined) {
            this.label = monitor.context.effectivePC;
        } else {
            this.main = module.parent.require.main;
            this.label = lub(module.label, monitor.context.effectivePC);
        }
    }

    // ---

    Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {
        let labeledID = args[0];
        if (typeof labeledID.value !== 'string') {
            monitor.Throw(
                "TypeError",
                'require expects a string',
                thisArg.label
            );
            throw 'TypeScript';
        }

        let module = this.TryLoad(labeledID as Value<string>);

        if (module === undefined) {

            monitor.Throw(
                "Error",
                `${labeledID.value} not found`,
                thisArg.label
            );
            throw 'TypeScript';

        }

        return module;
    }

    Construct(args: Value<ValueTypes>[]): Value<ValueTypes> {
        monitor.fatal('Cannot use require as a constructor');
        throw 'TypeScript';
    }

    // ---
    abstract TryLoad(labeledID: Value<string>): Value<ValueTypes> | undefined;
}