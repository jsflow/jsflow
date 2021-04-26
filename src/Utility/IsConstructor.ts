import { Value } from "../Value";

// -------------------------------------------------------------
// ES6: IsConstructor, 7.2.4

export function IsConstructor(argument : Value<any>): boolean {
    if (typeof argument.value !== 'object') {
        return false;
    }

    return argument.value.Construct !== undefined;
} 
  