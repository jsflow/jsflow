import { MonitorBase } from '../MonitorBase';

import { NativeErrorObject } from './NativeErrorObject';
import { Value } from '../Value';

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------

export class URIErrorObject extends NativeErrorObject {
    Type = 'URIError';

    constructor(v : Value<string>) {
        super(monitor.instances.URIErrorPrototype, v);
    }
}

