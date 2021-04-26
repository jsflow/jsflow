import { ToNumber } from "./ToNumber";
import { Value } from "../Value";
import { ValueTypes } from "../Interfaces";

 // -------------------------------------------------------------
  // ToUInt32, 9.6

  export function ToUInt32(x : Value<ValueTypes>) : Value<number> {
    return ToNumber(x);
  }
