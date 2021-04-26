import { Value } from "../Value";
import { ToPrimitive } from "./ToPrimitive";
import { MonitorBase } from "../MonitorBase";
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;

// -------------------------------------------------------------
// ToString, 9.8

export function ToString(x: Value<ValueTypes>): Value<string> {
  if (typeof x.value !== 'object')
    return new Value(String(x.value), x.label);

  monitor.context.pushPC(x.label);
  var primValue = ToPrimitive(x, 'string');
  monitor.context.popPC();
  return new Value(String(primValue.value), primValue.label);
}