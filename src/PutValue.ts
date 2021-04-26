import { Reference } from "./Reference";
import { ToObject } from './Conversion/ToObject';
import { lub } from './Label';
import { IsDataDescriptor, IsAccessorDescriptor } from './PropertyDescriptor';
import { MonitorBase } from "./MonitorBase";
import { Value } from "./Value";
import { ValueTypes } from "./Interfaces";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// PutValue

export function PutValue(r : Reference, v : Value<ValueTypes>) : void {
  
    if (!(r instanceof Reference)) {
      monitor.Throw(
        "ReferenceError",
        'PutValue: target is not a reference',
        //@ts-ignore TYPES
        r.label
      );

      throw "TS doesn't know monitor.Throw throws";
    }
  
    let p = r.base;
    let s = r.propertyName;
  
    if (r.IsUnresolvableReference()) {
      p.value = monitor.GlobalObject;
      p.Put(s, v);
    } else if (r.IsPropertyReference()) {
      if (r.HasPrimitiveBase()) {
        let o = ToObject(p);
        if (!o.CanPut(s).value) {
          return;
        }
  
        let ownDesc = o.GetOwnProperty(s);
        if (ownDesc.value && IsDataDescriptor(ownDesc.value)) {
          return;
        }
  
        // TODO: this must be wrong; part of old handling of getter/setters?
        let desc = o.GetProperty(s);
        if (desc.value && IsAccessorDescriptor(desc.value)) {
          monitor.context.pushPC(lub(ownDesc.label, desc.label)); // contains o.label
          //@ts-ignore TYPES
          desc.value.Set.Call(p, [v]);
          monitor.context.popPC();
        }
  
      } else {
        p.Put(s, v);
      }
    } else {
      p.SetMutableBinding(s, v);
    }
  }