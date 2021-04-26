import { Value } from "../Value";
import { MonitorBase } from "../MonitorBase";
import { ObjectObject } from "../Objects/ObjectObject";
import { dirname } from "path";
import { EcmaObject } from "../Objects/EcmaObject";
import { bot, Label, lub } from "../Label";
import { cwd } from "process";
import { Require } from "./Require";
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;

// ---

export abstract class Module extends EcmaObject {

    label: Label;
    filename?: string;
    paths: string[];

    parent: Module | undefined;

    abstract require: Require;

    constructor(filename?: Value<string>, parent?: Module) {
        super();
        this.Class = 'Module';

        if (filename !== undefined) {
            this.label = lub(filename.label, monitor.context.effectivePC);
            this.filename = filename.value;
            this.paths = this.computePaths(dirname(this.filename));
            this.Put(new Value('filename', bot), filename, false);
            this.Put(new Value('id', bot), filename, false);
        } else {
            this.label = monitor.context.effectivePC;
            this.paths = this.computePaths(cwd());
            this.Put(new Value('filename', bot), new Value(undefined, bot), false);
            this.Put(new Value('id', bot), new Value("<repl>", bot), false);

        }

        let exportsObject = new ObjectObject();
        this.Put(new Value('exports', bot), new Value(exportsObject, bot), false);
    }

    computePaths(dirname: string): string[] {
        return [dirname];
    }

}
