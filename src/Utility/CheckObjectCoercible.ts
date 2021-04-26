import { MonitorBase } from '../MonitorBase';
import { Value } from '../Value';
import { ValueTypes, IEcmaObject, IEcmaFunction } from '../Interfaces';

declare var monitor: MonitorBase;
 
 // -------------------------------------------------------------
  // CheckObjectCoercible, 9.10

  export function CheckObjectCoercible(x : Value<ValueTypes>)  : x is Value<boolean | number | string | IEcmaObject | IEcmaFunction> {
    if (x.value === null || x.value === undefined) {
      
      monitor.context.raisePC(x.label);

      monitor.Throw(
        "TypeError",
        String(x.value) + ' is not coercible',
        x.label
      );

      throw 'TypeScript';
    }

    return true;
  }