import { MonitorBase } from '../MonitorBase';

import { NativeErrorObject } from './NativeErrorObject';
import { Value } from '../Value';

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------

export class ReferenceErrorObject extends NativeErrorObject {
    Type = 'ReferenceError';

    constructor(v : Value<string>) {
        super(monitor.instances.ReferenceErrorPrototype, v);
    }
}
