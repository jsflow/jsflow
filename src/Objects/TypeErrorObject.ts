import { MonitorBase } from '../MonitorBase';

import { NativeErrorObject } from './NativeErrorObject';
import { Value } from '../Value';

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------

export class TypeErrorObject extends NativeErrorObject {
    Type = 'TypeError';

    constructor(v : Value<string>) {
        super(monitor.instances.TypeErrorPrototype, v);
    }
}
