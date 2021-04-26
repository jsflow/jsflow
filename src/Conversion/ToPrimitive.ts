import { ValueTypes, PrimitiveValueTypes } from "../Interfaces";
import { Value } from "../Value";

// -------------------------------------------------------------
// ToPrimitive, 9.1  

export function ToPrimitive(x : Value<ValueTypes>, PreferredType?: "string" | "number") : Value<PrimitiveValueTypes> {
    if (x.value === null || typeof x.value !== 'object') {
        // @ts-ignore
        return x;
    }

    // will run int the context of x due to value lifting
    var res = x.DefaultValue(PreferredType);
    return res;
}