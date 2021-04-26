import { NodeJSMonitor } from "../../Toplevel/nodejs/NodeJSMonitor";
import { Require } from "../Require";
import { Value } from "../../Value";
import { ValueTypes } from "../../Interfaces";
import { Module } from "../Module";
import { relabel } from "../../Toplevel/Entity";
import { NodeJSModule } from "./Module";
import { lub } from "../../Label";
import { normalize, join, resolve } from "path";
import { existsSync } from "fs";

declare var monitor: NodeJSMonitor;

// ---

export class NodeJSRequire extends Require {

    constructor(module: Module) {
        super(module);
    }

    // --

    TryLoad(labeledID: Value<string>): Value<ValueTypes> | undefined {
        let id = labeledID.value;

        for (let parentPath of this.module.paths) {
            if (id.startsWith('/')) {
                parentPath = '/';
            }

            if (id.startsWith('./') || id.startsWith('/') || id.startsWith('../')) {
                let modulePath = resolve(join(parentPath, id));
                if (existsSync(modulePath)) {

                    if (Require.cache.get(modulePath)) {
                        let module = Require.cache.get(modulePath) as Value<Module>;
                        module.raise(lub(this.label, labeledID.label));
                        return module;
                    }

                    return NodeJSModule.LoadModule(new Value(modulePath, labeledID.label));
                }

                modulePath = resolve(join(parentPath, id + '.js'));
                if (existsSync(modulePath)) {

                    if (Require.cache.get(modulePath)) {
                        let module = Require.cache.get(modulePath) as Value<Module>;
                        module.raise(lub(this.label, labeledID.label));
                        return module;
                    }

                    return NodeJSModule.LoadModule(new Value(modulePath, labeledID.label));
                }
            }

            try {
                let path = require.resolve(id, { paths: this.module.paths });

                if (Require.cache.get(path)) {
                    let module = Require.cache.get(path) as Value<Module>;
                    module.raise(lub(this.label, labeledID.label));
                    return module;
                }

                let nativeModule = require(path);

                let moduleLabeler = monitor.policy.GetModuleLabeler(id);
                let labeledModule = relabel(nativeModule, moduleLabeler, monitor.GlobalObject.modelstate);
                let module = new Value(labeledModule, labeledID.label);
                Require.cache.set(id, module);
                return module;
            } catch (e) {
                console.log(e);
            }
        }

        return undefined;
    }


}