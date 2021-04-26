import { ErrorConstructor } from "./ErrorConstructor";
import { bot } from "../Label";
import { Value } from "../Value";
import { ReferenceErrorObject } from "../Objects/ReferenceErrorObject";
import { MonitorBase } from "../MonitorBase";
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;

export class ReferenceErrorConstructor extends ErrorConstructor {

    constructor(host : ReferenceError) {
        super(host);
    }

    Setup() : void {
        this.SetupBase(monitor.instances.ReferenceErrorPrototype);
    }

    Construct(args: Value<ValueTypes>[]): Value<ReferenceErrorObject> {
        var message = args[0] || new Value(undefined, bot);
        var o = new ReferenceErrorObject(message);
        return new Value(o, bot);
    }
}
