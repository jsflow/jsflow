import { ErrorConstructor } from "./ErrorConstructor";
import { bot } from "../Label";
import { Value } from "../Value";
import { TypeErrorObject } from "../Objects/TypeErrorObject";
import { ValueTypes } from "../Interfaces";
import { MonitorBase } from "../MonitorBase";

declare var monitor: MonitorBase;

export class TypeErrorConstructor extends ErrorConstructor {

    constructor(host : TypeError) {
        super(host);
    }

    Setup() : void {
        this.SetupBase(monitor.instances.TypeErrorPrototype);
    }

    Construct(args: Value<ValueTypes>[]): Value<TypeErrorObject> {
        var message = args[0] || new Value(undefined, bot);
        var o = new TypeErrorObject(message);
        return new Value(o, bot);
    }
}
