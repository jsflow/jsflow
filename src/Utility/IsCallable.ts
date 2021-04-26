import { Value } from "../Value";
import { ValueTypes, IEcmaFunction } from "../Interfaces";
import { EcmaObject } from "../Objects/EcmaObject";

 // -------------------------------------------------------------
  // IsCallable, 9.11

  export function IsCallable(x : Value<ValueTypes>) : x is Value<IEcmaFunction> {
    var b = false;
    if (x.value !== null && typeof x.value === 'object') {
      b = 'Call' in x.value;
    }

    return b;
  }
