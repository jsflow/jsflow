import { ErrorPrototype } from "./ErrorPrototype";
import { MonitorBase } from "../MonitorBase";

declare var monitor: MonitorBase;

export class URIErrorPrototype extends ErrorPrototype {

    constructor(host : URIError) {
        super(host);
    }

    Setup(): void {
        this.SetupBase(monitor.instances.ErrorConstructor, 'URIError');
    }
    
}