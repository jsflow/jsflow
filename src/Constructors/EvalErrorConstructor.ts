import { ErrorConstructor } from "./ErrorConstructor";
import { bot } from "../Label";
import { Value } from "../Value";
import { EvalErrorObject } from "../Objects/EvalErrorObject";
import { MonitorBase } from "../MonitorBase";
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;

export class EvalErrorConstructor extends ErrorConstructor {

    constructor(host : EvalError) {
        super(host);
    }

    Setup() : void {
        this.SetupBase(monitor.instances.EvalErrorPrototype);
    }

    Construct(args: Value<ValueTypes>[]): Value<EvalErrorObject>{
        var message = args[0] || new Value(undefined, bot);
        var o = new EvalErrorObject(message);
        return new Value(o, bot);
    }
}
