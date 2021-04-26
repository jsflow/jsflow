import { Value } from "../Value";
import { ToNumber } from "./ToNumber";
import { ValueTypes } from "../Interfaces";

// -------------------------------------------------------------
// ToUInt16, 9.7

export function ToUInt16(x: Value<ValueTypes>): Value<number> {
  let number = ToNumber(x);
  if (isNaN(number.value) ||
    number.value === 0 ||
    number.value === Number.POSITIVE_INFINITY ||
    number.value === Number.NEGATIVE_INFINITY) {
    return new Value(0, number.label);
  }

  let posInt = sign(number.value) * Math.floor(Math.abs(number.value));
  let int16bit = posInt % Math.pow(2, 16);
  return new Value(int16bit, number.label);
}

function sign(n: number): 1 | 0 | -1 {
  if (n > 0) {
    return 1;
  }
  else if (n < 0) {
    return -1;
  }

  return 0;
};
