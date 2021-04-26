import { Reference } from "./Reference";
import { Value } from "./Value";
import { ToObject } from './Conversion/ToObject';
import { lub } from './Label';
import { IsDataDescriptor } from './PropertyDescriptor';
import { ValueTypes } from "./Interfaces";
import { MonitorBase } from "./MonitorBase";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// GetValue, 8.7.1


export function GetValue(v: Value<ValueTypes> | Reference ) : Value<ValueTypes>;
export function GetValue(v? : Value<ValueTypes> | Reference ) : Value<ValueTypes> | undefined {
    if (!v || !(v instanceof Reference)) {
      //@ts-ignore TYPES
      return v;
    }
  
    if (v.base.label === undefined)
      monitor.fatal('GetValue, base.label undefined');
  
    if (v.IsUnresolvableReference()) {
      monitor.Throw(
        "ReferenceError",
        v.propertyName.value + ' not defined',
        v.base.label
      );
    }
  
    let p = v.base;
    let s = v.propertyName;
  
    if (v.IsPropertyReference()) {
      if (!v.HasPrimitiveBase()) {
        return p.Get(s);
      }
      else {
        let o = ToObject(p);
        let ldesc = o.GetProperty(s);
  
        if (ldesc.value === undefined) {
          //@ts-ignore TYPES
          return ldesc;
        }
  
        let lbl = lub(ldesc.label, ldesc.value.label);
        let desc = ldesc.value;
  
        if (IsDataDescriptor(desc)) {
          return new Value(desc.value, lbl);
        }
  
        let get = desc.get;
        if (get === undefined) {
          new Value(undefined, lbl);
        }
  
        // TODO: this must be wrong! part of old handling of getter/setters?
        monitor.context.pushPC(lbl);
        //@ts-ignore TYPES
        let res = get.Call(get, v.base);
        monitor.context.popPC();
  
        res.raise(lbl);
        return res;
      }
    }
  
    return p.GetBindingValue(s);
  }
  