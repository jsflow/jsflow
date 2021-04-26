import { Value } from "../Value";
import { ToNumber } from "./ToNumber";
import { ValueTypes } from "../Interfaces";

// -------------------------------------------------------------
// ToInteger, 9.4
//        Using ToNumber to capture the ToPrimitive
//        and rely on the internal conversion at the point of use
//        should suffice.

export function ToInteger(x: Value<ValueTypes>): Value<number> {
  let number = ToNumber(x);

  if (isNaN(number.value)) {
    return new Value(0, number.label);
  }
  else if (number.value === 0 ||
    number.value === Number.POSITIVE_INFINITY ||
    number.value === Number.NEGATIVE_INFINITY) {
    return number;
  }
  else {
    return new Value(
      sign(number.value) * Math.floor(Math.abs(number.value)),
      number.label
    );
  }
}

function sign(n: number): 1 | 0 | -1 {
  if (n > 0) {
    return 1;
  }
  else if (n < 0) {
    return -1;
  }

  return 0;
}