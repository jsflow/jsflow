import { Value } from "./Value";
import { ValueTypes } from "./Interfaces";

// ------------------------------------------------------------
// The Completion Specification Type, 8.9

export type ResultType = 'normal' | 'break' | 'continue' | 'return' | 'throw'

export class Result {
  type: ResultType = 'normal';
  value: Value<ValueTypes> | null;
  target: string | null = null;

  constructor(value?: Value<ValueTypes>) {
    this.value = value || null;
  }
}
