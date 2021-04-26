import { Value } from "../Value";
import { ValueTypes } from "../Interfaces";

// -------------------------------------------------------------
// ToBoolean, 9.2

export function ToBoolean(x: Value<ValueTypes>): Value<boolean> {
  return new Value(Boolean(x.value), x.label);
}