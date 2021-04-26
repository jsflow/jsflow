import { lub, bot } from './Label';
import { Value } from "./Value";
import * as constants from './Constants';

import { MonitorBase } from './MonitorBase';
import { ValueTypes, IEcmaObject, IsIEcmaObject } from './Interfaces';

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------

export function HasInstance(this: IEcmaObject, X: Value<ValueTypes>) {
  let F = this;
  let l = X.label;

  if (IsIEcmaObject(X)) {
    // needed to make typechecking work, otherwise V gets type Value<ValueTypes> in while below
    let V = X;

    let O = F.Get(constants.prototype);
    if (!IsIEcmaObject(O)) {
      monitor.Throw(
        "TypeError",
        'HasInstance',
        bot
      );
      throw "TypeScript";
    }

    while (V.value !== null) {
      V = V.value.Prototype;
      l = lub(l, V.label);
      if (O.value === V.value) return new Value(true, l);
    }
  }

  return new Value(false, l);
}
