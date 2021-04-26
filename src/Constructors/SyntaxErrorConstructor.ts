import { ErrorConstructor } from "./ErrorConstructor";
import { bot } from "../Label";
import { Value } from "../Value";
import { SyntaxErrorObject } from "../Objects/SyntaxErrorObject";
import { ValueTypes } from "../Interfaces";
import { MonitorBase } from "../MonitorBase";

declare var monitor: MonitorBase;

export class SyntaxErrorConstructor extends ErrorConstructor {

    constructor(host : SyntaxError) {
        super(host);
    }

    Setup() : void {
        this.SetupBase(monitor.instances.SyntaxErrorPrototype);
    }

    Construct(args: Value<ValueTypes>[]): Value<SyntaxErrorObject> {
        var message = args[0] || new Value(undefined, bot);
        var o = new SyntaxErrorObject(message);
        return new Value(o, bot);
    }
}
