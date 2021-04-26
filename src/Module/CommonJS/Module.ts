import { Value } from "../../Value";
import { bot } from "../../Label";
import { Require } from "../Require";
import { Module } from "../Module";
import { MonitorBase } from "../../MonitorBase";
import { ValueTypes } from "../../Interfaces";
import { readFileSync } from "fs";
import { basename, dirname } from "path";
import { CommonJSRequire } from "./Require";


declare var monitor: MonitorBase;

//---

export class CommonJSModule extends Module {

    require: Require;

    constructor(filename?: Value<string>, parent?: Module) {
        super(filename, parent);

        this.parent = parent;
        this.require = new CommonJSRequire(this);
        this.Put(new Value('require', bot), new Value(this.require, bot), false);
    }

    static LoadModule(path: Value<string>, parent?: Module): Value<ValueTypes> {
        let script = readFileSync(path.value).toString();
        let moduleFunction = monitor.instances.FunctionConstructor.Construct(
            [
                new Value('require', bot),
                new Value('module', bot),
                new Value('exports', bot),
                new Value('__filename', bot),
                new Value('__dirname', bot),
                new Value(script, path.label)
            ]
        );

        let module = new CommonJSModule(path, parent);
        let exportsObject = module.Get(new Value('exports', bot));
        Require.cache.set(path.value, exportsObject);

        moduleFunction.Call(
            new Value(undefined, bot),
            [
                new Value(module.require, bot),
                new Value(module, bot),
                exportsObject,
                new Value(basename(path.value), path.label),
                new Value(dirname(path.value), path.label)
            ]
        );

        return module.Get(new Value('exports', bot));
    }
}