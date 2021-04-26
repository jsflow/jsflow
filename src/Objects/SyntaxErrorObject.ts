import { MonitorBase } from '../MonitorBase';

import { NativeErrorObject } from './NativeErrorObject';
import { Value } from '../Value';

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------

export class SyntaxErrorObject extends NativeErrorObject {
    Type = 'SyntaxError';

    constructor(v : Value<string>) {
        super(monitor.instances.SyntaxErrorPrototype, v);
    }
}
