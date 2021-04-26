import { relabelPropertyDescriptor, unlabelPropertyDescriptor, EntityObject, EntityFunction, relabel } from '../Entity';
import { Value } from "../../Value";
import { ChromiumMonitor } from './ChromiumMonitor';
import { GlobalObject } from '../../Objects/GlobalObject';
import { IsDataDescriptor, IsAccessorDescriptor, LabeledPropertyDescriptor, JSFPropertyDescriptor } from '../../PropertyDescriptor';
import { ModelState } from '../Policy';
import { lub, bot } from '../../Label';

declare var monitor: ChromiumMonitor;

function has_own_property(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

// -------------------------------------------------------------------------- 

export class WindowObject extends GlobalObject {

  // protected from read and write through
  protected = {
    read : {
      "Symbol" : true,
      "WeakMap" : true,
      "Set" : true,
      "Map" : true,
      "ArrayBuffer" : true,
      "Promise" : true,
      "crypto" : true,
      "define" : true,
      "globalThis" : true,
      "Float32Array" : true,
      "btoa" : true,
      "atob" : true
     },
    write : {
      "Symbol" : true,
      "WeakMap" : true,
      "Set" : true,
      "Map" : true,
      "ArrayBuffer" : true,
      "Promise" : true,
      "crypto" : true,
      "define" : true,
      "globalThis" : true,
      "Float32Array" : true,
      "btoa" : true,
      "atob" : true
    }
  }

  modelstate: ModelState;

  labeledprototype?: Value<EntityObject | EntityFunction>;

  constructor(host: object) {
    super(host);

    this.modelstate = monitor.policy.globalmodelstate;

    let prototypeLabeler = monitor.policy.global.PrototypeLabeler;
    let descLabeler = prototypeLabeler.ReadLabeler;

    let value = relabel(Object.getPrototypeOf(this.host), descLabeler.ValueLabeler, this.modelstate);
    this.Prototype = new Value(<EntityObject | EntityFunction>value, bot);

    // NOTE: predefined are protected from overwriting, since otherwise loops may be created
    for (let prop of Object.getOwnPropertyNames(this.properties)) {
      this.protected.write[prop] = true;
    }

    monitor.entitymap.set(host, this);
  }

    // ---
    // a full push/pull policy - values are pushed to the host and read from the host
  
    // local properties always take precedence - it is assumed that changing values are 
    // modeled by getters and setters

    // properties protected from read through are always read locally only - the reason 
    // to protect from read through might be that they do not autowrap properly and are
    // better served with a polyfill

  GetOwnProperty(p: Value<string>): Value<LabeledPropertyDescriptor | undefined> {

    // undefined if not existing, LabeledPropertyDescriptor otherwise
    let jsfdesc = super.GetOwnProperty(p);

    // if protected from read trhough then always return
    if (has_own_property(this.protected.read, p.value)) {
      return jsfdesc;
    }

    // if defined by jsflow, or if already cached, use cached values
    // the assumption is that value never change and hence that volatile values are modeled by accessors
    if (jsfdesc.value !== undefined) {
      return jsfdesc;
    }

    // if not defined locally, see if it is present on the host object
    let jsdesc = Object.getOwnPropertyDescriptor(this.host, p.value);

    // we know that jsfPropertyDesc is an undefined Value with the right labels
    // resue that when not defined locally either
    if (jsdesc === undefined) {
      return jsfdesc;
    }

    // otherwise, relabel the value, and cache it locally
    let propertyLabeler = monitor.policy.global.GetPropertyLabeler(p.value);
    let rldesc = relabelPropertyDescriptor(
      jsdesc,
      propertyLabeler.ReadLabeler,
      this.modelstate
    );

    // update the label and and cache the relabeled descriptor
    this.labels[p.value] = {
      value: rldesc.label,
      existence: p.label
    };

    Object.defineProperty(this.properties, p.value, rldesc);

    // return the result of the caching
    return super.GetOwnProperty(p);
  }

  

  DefineOwnProperty(p: Value<string>, desc: JSFPropertyDescriptor, Throw: boolean): Value<boolean> {
    // if the host does not have the propert it's like a normal definition, but with write through
    // otherwise if defined by the host, but not locally we set up labels first

    let propertyLabeler = monitor.policy.global.GetPropertyLabeler(p.value);

    if (!has_own_property(this.labels, p.value) && has_own_property(this.host, p.value)) {
      let label = propertyLabeler.Labeler.Label(this.modelstate);

      this.labels[p.value] = {
        value: label,
        existence: p.label
      };
    }

    let result = super.DefineOwnProperty(p, desc, Throw);

    // if not protected then write through
    if (!has_own_property(this.protected.write, p.value)) {

    // TODO: property descriptor type mismatch
    let jsdesc = unlabelPropertyDescriptor(
      //@ts-ignore DESC HELL
      desc,
      propertyLabeler.WriteUnlabeler,
      this.modelstate
    );

    let hostResult = Object.defineProperty(this.host, p.value, jsdesc);
    result.value = hostResult;
    }

    return result;
  }

}
