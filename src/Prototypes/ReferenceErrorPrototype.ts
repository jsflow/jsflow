import { ErrorPrototype } from "./ErrorPrototype";
import { MonitorBase } from "../MonitorBase";

declare var monitor: MonitorBase;

export class ReferenceErrorPrototype extends ErrorPrototype {

    constructor(host: ReferenceError) {
        super(host);
    }

    Setup(): void {
        this.SetupBase(monitor.instances.ErrorConstructor, 'ReferenceError');
    }

}