import { ToNumber } from "./ToNumber";
import { Value } from "../Value";
import { ValueTypes } from "../Interfaces";

  // -------------------------------------------------------------
  // ToInt32, 9.5

  export function ToInt32(x : Value<ValueTypes>) : Value<number> {
    return ToNumber(x);
  }
