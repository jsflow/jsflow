import { MonitorBase } from '../MonitorBase';

import { NativeErrorObject } from './NativeErrorObject';
import { Value } from '../Value';

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------

export class RangeErrorObject extends NativeErrorObject {
    Type = 'RangeError';
    
    constructor(v : Value<string>) {
        super(monitor.instances.RangeErrorPrototype, v);
    }
}