import { MonitorBase } from '../MonitorBase';

import { NativeErrorObject } from './NativeErrorObject';
import { Value } from '../Value';
import { ValueTypes } from '../Interfaces';

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------

export class EvalErrorObject extends NativeErrorObject {
  Type = 'NativeError';

  constructor(v: Value<ValueTypes>) {
    super(monitor.instances.EvalErrorPrototype, v);
  }
}