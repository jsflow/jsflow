import { ErrorPrototype } from "./ErrorPrototype";
import { MonitorBase } from "../MonitorBase";

declare var monitor: MonitorBase;

export class EvalErrorPrototype extends ErrorPrototype {

    constructor(host : EvalError) {
        super(host);
    }

    Setup(): void {
        this.SetupBase(monitor.instances.ErrorConstructor, 'EvalError');
    }
    
}