import { ErrorPrototype } from "./ErrorPrototype";
import { MonitorBase } from "../MonitorBase";

declare var monitor: MonitorBase;

export class RangeErrorPrototype extends ErrorPrototype {

    constructor(host: RangeError) {
        super(host);
    }

    Setup(): void {
        this.SetupBase(monitor.instances.ErrorConstructor, 'RangeError');
    }

}