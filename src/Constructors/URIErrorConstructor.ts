import { ErrorConstructor } from "./ErrorConstructor";
import { bot } from "../Label";
import { Value } from "../Value";
import { URIErrorObject } from "../Objects/URIErrorObject";
import { MonitorBase } from "../MonitorBase";
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;

export class URIErrorConstructor extends ErrorConstructor {

    constructor(host) {
        super(host);
    }

    Setup() : void {
        this.SetupBase(monitor.instances.URIErrorPrototype);
    }

    Construct(args: Value<ValueTypes>[]): Value<URIErrorObject>{
        var message = args[0] || new Value(undefined, bot);
        var o = new URIErrorObject(message);
        return new Value(o, bot);
    }
}
