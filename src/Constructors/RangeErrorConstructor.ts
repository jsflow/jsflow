import { ErrorConstructor } from "./ErrorConstructor";
import { bot } from "../Label";
import { Value } from "../Value";
import { RangeErrorObject } from "../Objects/RangeErrorObject";
import { MonitorBase } from "../MonitorBase";
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;

export class RangeErrorConstructor extends ErrorConstructor {

    constructor(host : RangeError) {
        super(host);
    }

    Setup() : void {
        this.SetupBase(monitor.instances.RangeErrorPrototype);
    }

    Construct(args: Value<ValueTypes>[]): Value<RangeErrorObject> {
        var message = args[0] || new Value(undefined, bot);
        var o = new RangeErrorObject(message);
        return new Value(o, bot);
    }
}
