import { Label } from "./Label";
import { IEcmaFunction } from "./Interfaces";

export interface LabeledPropertyDescriptor extends PropertyDescriptor {
  label: Label;
}

export interface JSFPropertyDescriptor {
  configurable?: boolean;
  enumerable?: boolean;
  value?: any;
  writable?: boolean;
  get?: IEcmaFunction;
  set?: IEcmaFunction;
  label: Label;
}

// ------------------------------------------------------------
// Property descriptors, 8.10

export function IsAccessorDescriptor(pd) {
  if (pd === undefined) {
    return false;
  } else {
    return ('get' in pd || 'put' in pd);
  }
}

export function IsDataDescriptor(pd) {
  if (pd === undefined) {
    return false;
  } else {
    return ('value' in pd || 'writable' in pd);
  }
}