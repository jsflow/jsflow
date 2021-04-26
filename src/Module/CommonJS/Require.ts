import { normalize, join, resolve } from "path";
import { existsSync } from "fs";
import { Require } from "../Require";
import { Module } from "../Module";
import { Value } from "../../Value";
import { ValueTypes } from "../../Interfaces";
import { lub } from "../../Label";
import { CommonJSModule } from "./Module";


export class CommonJSRequire extends Require {

    constructor(module: Module) {
        super(module);
    }

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

                    return CommonJSModule.LoadModule(new Value(modulePath, labeledID.label), this.module);
                }

                modulePath = resolve(join(parentPath, id + '.js'));
                if (existsSync(modulePath)) {

                    if (Require.cache.get(modulePath)) {
                        let module = Require.cache.get(modulePath) as Value<Module>;
                        module.raise(lub(this.label, labeledID.label));
                        return module;
                    }

                    return CommonJSModule.LoadModule(new Value(modulePath, labeledID.label), this.module);
                }
            }
        }

        return undefined;
    }
}