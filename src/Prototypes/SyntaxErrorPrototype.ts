import { ErrorPrototype } from "./ErrorPrototype";
import { MonitorBase } from "../MonitorBase";

declare var monitor: MonitorBase;

export class SyntaxErrorPrototype extends ErrorPrototype {

    constructor(host : SyntaxError) {
        super(host);
    }

    Setup(): void {
        this.SetupBase(monitor.instances.ErrorConstructor, 'SyntaxError');
    }
    
}