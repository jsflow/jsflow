// temporary hack to get types in
import {
  IObjectLabeler
  , IFunctionLabeler
  , ModelState
  , DescriptorLabeler
  , DescriptorUnlabeler
  , ValueLabeler
  , ValueUnlabeler
  , AbstractName
  , FunctionUnlabeler,
  ObjectLabeler
} from './Policy';

import { IsDataDescriptor, IsAccessorDescriptor } from '../PropertyDescriptor';
import { EcmaObject } from '../Objects/EcmaObject';

import { FunctionObject } from '../Objects/FunctionObject';
import { Label, lub, bot, le } from '../Label';
import { Value } from "../Value";

import { LabeledPropertyDescriptor } from "../PropertyDescriptor";
import { PolicyMonitorBase } from './PolicyMonitorBase';
import { ValueTypes } from '../Interfaces';
import { isJSFlowError } from '../Error';
import { JSFlowDebugError } from '../Engine/Debug';
import { HasInstance } from '../HasInstance';
import { DefineFFF } from '../Define';
import * as constants from '../Constants';
import { monitorEventLoopDelay } from 'perf_hooks';
import { pretty } from '../PP';


export interface IWrapperMonitor {
  entitymap: WeakMap<object, EcmaObject>;
}

declare var monitor: PolicyMonitorBase;

// The types for relabel which will not become EntityObject or EntityFunction
type PrimitiveType = string | number | undefined | boolean | null;

// --------------------------------------------------------------------------


function has_own_property(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

// --------------------------------------------------------------------------
// EntityObject
//
// Wraps a JavaScript object as a JSFlow object

export class EntityObject extends EcmaObject {
  host: object;

  modelstate: ModelState;
  labeler: IObjectLabeler;
  labeledprototype?: Value<EntityObject | EntityFunction>;

  constructor(host: object, labeler: IObjectLabeler, outermodelstate: ModelState) {
    super();

    if (labeler === undefined) {
      monitor.fatal("EntityObject: undefined labelmodel");
      throw "TypeScript";
    }

    this.modelstate = new ModelState(outermodelstate);

    this.Class = 'Object';

    if (Array.isArray(host)) {
      this.Class = 'Array';
    }

    if (host instanceof Error) {
      this.Class = 'Error';
    }

    this.host = host;

    this.labeler = labeler;

    // TODO: make this lazy? Note that this does not allow for setting the prototype in the sense that
    // the overwritten prototype will not be used when looking up things. The internal property
    // Prototype is used for that.
    // This fails on Debian
    // DefineFFF(this, constants.prototype, this.Prototype.value);

  }

  // ---
  // lazy allocation of prototypes

  get Prototype(): Value<EcmaObject> {
    if (this.labeledprototype === undefined) {
      let prototypeLabeler = this.labeler.PrototypeLabeler;
      let descLabeler = prototypeLabeler.ReadLabeler;

      let value = relabel(Object.getPrototypeOf(this.host), descLabeler.ValueLabeler, this.modelstate);

      // TODO: what about this label - should we keep it?
      let label1 = prototypeLabeler.Labeler.Label(this.modelstate);
      let label2 = descLabeler.Labeler.Label(this.modelstate);

      this.labeledprototype = new Value(<EntityObject | EntityFunction>value, lub(label1, label2));
    }

    return this.labeledprototype;
  }

  // needed for strict
  set Prototype(value: Value<EcmaObject>) {
  }

  // ---
  //

  toString() {
    return this.host.toString();
  }

  // ---
  // TODO: add the additional labels
  // --- to enable taintmode tainting of getters in the API

  Get(s: Value<string>): Value<ValueTypes> {

    let descValue = this.GetProperty(s);

    if (descValue.value === undefined) {
      return new Value(undefined, descValue.label);
    }

    let v: Value<ValueTypes>;
    let desc = descValue.value;

    monitor.context.pushPC(descValue.label);

    if ('value' in desc) {
      v = new Value(desc.value, desc.label);
    } else if (desc.get) {
      monitor.context.pushPC(desc.label);
      v = desc.get.call(this);
      monitor.context.popPC();
    } else {
      v = new Value(undefined, descValue.label);
    }

    monitor.context.popPC();

    v.raise(lub(descValue.label, desc.label));
    return v;
  }

  // ---
  // new version, relies on the cachability of values

  GetOwnProperty(p: Value<string>) {

    // undefined if not existing, LabeledPropertyDescriptor otherwise
    let jsfdesc = super.GetOwnProperty(p);

    // if defined by jsflow, or if already cached, use cached values
    // the assumption is that value never change and hence that volatile values are modeled by accessors
    if (jsfdesc.value !== undefined) {
      return jsfdesc;
    }

    // if not defined locally, see if it is present on the host object
    let jsdesc = Object.getOwnPropertyDescriptor(this.host, p.value);

    let propertyLabeler = this.labeler.GetPropertyLabeler(p.value);

    // we know that jsfPropertyDesc is an undefined Value, and we want to label it
    // to be able to label the non-precence of certain parts of the environment
    if (jsdesc === undefined) {
      jsfdesc.label = lub(jsfdesc.label, propertyLabeler.Labeler.Label(this.modelstate));
      return jsfdesc;
    }

    // otherwise, relabel the value, and cache it locally
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

    /* DEPRECATED: old version, remove after more extensive testing of new

    if (!has_own_property(this.host, p.value)) {
      return super.GetOwnProperty(p);
    }

    ---

    let propertyLabeler = this.labeler.GetPropertyLabeler(p.value);
    let label = propertyLabeler.Labeler.Label(this.modelstate);

    if (!has_own_property(this.labels, p.value)) {
      this.labels[p.value] = {
        value: label,
        existence: p.label
      };
    }

    let jsdesc = Object.getOwnPropertyDescriptor(this.host, p.value);
    if (jsdesc === undefined) {
      return new Value(undefined, label);
    }

    if (has_own_property(this.properties, p.value)
      && (IsDataDescriptor(jsdesc) && !jsdesc.writable ||
        IsAccessorDescriptor(jsdesc) && !jsdesc.configurable)) {
      // non-writable propert or non-configurable accessor means cannot be updated
      // return what is there           
      return super.GetOwnProperty(p);
    }

    try {
    let desc = relabelPropertyDescriptor(
      jsdesc,
      propertyLabeler.ReadLabeler,
      this.modelstate
    );

    desc.label = lub(desc.label, label);
    Object.defineProperty(this.properties, p.value, desc);

    return super.GetOwnProperty(p);
    } catch(e) {
      monitor.error('when setting', p.value, 'on', this.host);
    }
    */
  }

  // ---

  DefineOwnProperty(p: Value<string>, desc, Throw: boolean) {

    let propertyLabeler = this.labeler.GetPropertyLabeler(p.value);

    if (has_own_property(this.host, p.value)
      && !has_own_property(this.labels, p.value)) {

      let label = propertyLabeler.Labeler.Label(this.modelstate);

      this.labels[p.value] = {
        value: label,
        existence: lub(p.label, label)
      };
    }

    let result = super.DefineOwnProperty(p, desc, Throw);

    let jsdesc = unlabelPropertyDescriptor(
      desc,
      propertyLabeler.WriteUnlabeler,
      this.modelstate
    );
    let jsresult = Object.defineProperty(this.host, p.value, jsdesc);
    result.value = jsresult;

    return result;
  }

  // ---

  getOwnEnumerablePropertyNames(label: Label): Value<string>[] {
    let enumerables = super.getOwnEnumerablePropertyNames(label);

    // Need this to ensure we're not pushing properties from this.host that
    // were already present in this.properties.
    let ownPropNames = Object.getOwnPropertyNames(this.properties);

    let hostNames = Object.getOwnPropertyNames(this.host);
    for (let name of hostNames) {
      if (!ownPropNames.includes(name)) {
        let desc = Object.getOwnPropertyDescriptor(this.host, name);
        // @ts-ignore desc is not undefined
        if (desc.enumerable) {
          enumerables.push(new Value(name, label));
        }
      }
    }

    return enumerables;
  }

//--

getOwnPropertyNames(label: Label): Value<string>[] {
  let names = Object.getOwnPropertyNames(this.host);
  let result: Value<string>[] = [];

  for (let i = 0, len = names.length; i < len; i++) {
    let name = names[i];
    // TODO: labeling
    result[i] = new Value(name, label);
  }

  return result;
}

}

// --------------------------------------------------------------------------
// EntityFunction
// 
// Wraps a JavaScript function as a JSFlow function

export class EntityFunction extends EntityObject {

  //@ts-ignore assigned by super constructor
  host: Function;
  //@ts-ignore assigned by super constructor
  labeler: FunctionLabeler | UnknownLabeler;

  constructor(host: Function, labelmodel: IFunctionLabeler, outermodelstate: ModelState) {
    super(host, labelmodel, outermodelstate);

    /*
    if (!host.toString().includes('native')) {
      monitor.warn("EntityFunction; wrapping non-native function", host)
      throw new JSFlowDebugError();
    }
    */

    this.Class = 'Function';
  }

  // ---

  Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {

    let modelstate = new ModelState(this.modelstate);
    monitor.policy.PushModelState(modelstate);

    // unlabel the thisArg and all the arguments to be able to call the original function
    let argsunlabelmodels = this.labeler.ArgumentsUnlabeler;

    for (let i = 0, j = 0; i < args.length; i++ , j++) {
      while (!argsunlabelmodels.GetArgumentUnlabeler(j).ModelFor(args[i])) {
        j++;
      }
      args[i] = unlabelValue(args[i], argsunlabelmodels.GetArgumentUnlabeler(j), modelstate);
    }

    let thisunlabelmodel = this.labeler.SelfUnlabeler;
    let unlabeledThis = unlabelValue(thisArg, thisunlabelmodel, modelstate);

    // call the original function, and label the result
    let result: any;
    try {
      result = this.host.apply(unlabeledThis, args);
    }
    catch (e) {
      // monitor.warn(e, e.stack);

      if ((typeof e !== 'object' && typeof e !== 'function') || e === null) {
        monitor.error('Entity.ts: Value caught!', Error().stack);
        // TODO: labeling!
        throw new Value(e, bot);
      }

      let excmodel = this.labeler.GetExceptionLabelModel(e.name);
      let le = new EntityObject(e, excmodel, this.modelstate);
      let exclabel = this.labeler.GetExceptionLabel(e.name);
      throw new Value(le, exclabel);
    }

    let returnlabelmodel = this.labeler.ReturnLabeler;
    let returnlabel = returnlabelmodel.Labeler.Label(modelstate);
    let labeledvalue = relabel(result, returnlabelmodel.ValueLabeler, modelstate);

    let pc = monitor.context.effectivePC;

    monitor.assert(le(pc, returnlabel),
      'write context ' + pc + ' not below ' +
      'return context ' + returnlabel
    );

    // This is for the new mode of operation, for observable flows
    returnlabel = lub(returnlabel, pc);

    monitor.policy.PopModelState();
    return new Value(labeledvalue, returnlabel);
  }

  // ---

  Construct(args: Value<ValueTypes>[]): Value<EcmaObject> {
    let modelstate = new ModelState(this.modelstate);
    monitor.policy.PushModelState(modelstate);

    // unlabel the arguments

    let argsunlabelmodels = this.labeler.ArgumentsUnlabeler;

    for (let i = 0, j = 0; i < args.length; i++ , j++) {
      while (!argsunlabelmodels.GetArgumentUnlabeler(j).ModelFor(args[i])) {
        j++;
      }
      args[i] = unlabelValue(args[i], argsunlabelmodels.GetArgumentUnlabeler(j), modelstate);
    }

    let result: object;
    try {

      // we need to call new with an argument array, and use bind and apply to do this
      // new F(1,2,3,...) === new F.bind.apply(F, [null, 1,2,3,...])
      args.unshift(null);
      result = new (this.host.bind.apply(this.host, args));

      // old way! TODO: remove
      // result = eval(`result = new this.host(${stringArgs});`);
    }
    catch (e) {

      // TOOD: rethink this
      monitor.tryRethrow(e, true);

      let excmodel = this.labeler.GetExceptionLabelModel(e.name);
      let le = new EntityObject(e, excmodel, this.modelstate);
      let exclabel = this.labeler.GetExceptionLabel(e.name);
      throw new Value(le, exclabel);
    }

    let returnlabelmodel = this.labeler.ReturnLabeler;
    let returnlabel = returnlabelmodel.Labeler.Label(modelstate);
    let labeledvalue = relabel(result, returnlabelmodel.ValueLabeler, modelstate);

    monitor.policy.PopModelState();
    //@ts-ignore TODO: change types of relabel to better match
    return new Value(labeledvalue, returnlabel);
  }

  HasInstance(V: any) {
    return HasInstance.call(this, V);
  }
}


// --------------------------------------------------------------------------
// --- relabelPropertyDescriptor :: NativeValue -> EntityObject
// --------------------------------------------------------------------------

export function relabelPropertyDescriptor(
  desc: PropertyDescriptor,
  descriptorLabeler: DescriptorLabeler,
  modelstate: ModelState): LabeledPropertyDescriptor {

  let jsfdesc: LabeledPropertyDescriptor = {
    label: descriptorLabeler.Labeler.Label(modelstate)
  }

  let boolProperties = ['configurable', 'enumerable', 'writable'];
  for (let key of boolProperties) {
    if (desc[key] !== undefined) {
      jsfdesc[key] = desc[key];
    }
  }

  if (IsAccessorDescriptor(desc)) {
    if (desc.get) {
      let Get = new EntityFunction(desc.get, descriptorLabeler.GetterLabeler, modelstate);
      jsfdesc.get = function () {
        return Get.Call(new Value(this, bot), []);
      };
      // @ts-ignore
      jsfdesc.get.actualFunction = Get;
    }

    if (desc.set) {
      let Set = new EntityFunction(desc.set, descriptorLabeler.SetterLabeler, modelstate);
      jsfdesc.set = function (v) { return Set.Call(new Value(this, bot), [v]); };
      // @ts-ignore
      jsfdesc.set.actualFunction = Set;
    }

  } else
    if (IsDataDescriptor(desc)) {
      jsfdesc.value = relabel(desc.value, descriptorLabeler.ValueLabeler, modelstate);
    } else {
      monitor.Throw(
        "Error",
        'Entity.relabelPropertyDescriptor: got something that is not a descriptor!',
        bot
      );
    }

  return jsfdesc;
}



// ---

function MkValue(value, valueLabeler: ValueLabeler, modelstate: ModelState) {
  let label = valueLabeler.Labeler.Label(modelstate);
  let labeledvalue = relabel(value, valueLabeler.ValueLabeler, modelstate);
  return new Value(labeledvalue, label);
}

// --------------------------------------------------------------------------
// --- relabel :: NativeValue -> EntityObject
// --------------------------------------------------------------------------

// relabel could get a proxied jsflow object - we need a way to id
// maybe a __is_jsflow_ob

// We don't want to return a value, since relabel is used in, e.g., descriptors
export function relabel(
  value: object | PrimitiveType,
  labeler: IObjectLabeler | IFunctionLabeler | undefined,
  modelstate: ModelState
): EntityObject | EntityFunction | PrimitiveType | null {

  if (typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'undefined' ||
    typeof value === 'boolean' ||
    typeof value === 'symbol') {
    return value;
  }
  if (value === null) {
    return null;
  }

  // we must map prototype right otherwise HasInstance stoppes working, and thus instanceof too
  if (value === Object.prototype) {
    //@ts-ignore
    return monitor.instances.ObjectPrototype;
  }

  if (value === Array.prototype) {
    //@ts-ignore
    return monitor.instances.ArrayPrototype;
  }

  if (value === SyntaxError.prototype) { 
    //@ts-ignore
    return monitor.instances.SyntaxErrorPrototype;
  }

  // TEST: shortcut wrapping
  let jsflowobject = undefined;
  try {
    //@ts-ignore
    jsflowobject = value.__get_jsflow_object;
  } catch (e) {
    monitor.warn('[JSFlow WARNING] trying to probe for proxy caused an exception:', e.message);
  }
  if (jsflowobject !== undefined) {
    return jsflowobject;
  }

  if (monitor.entitymap.has(value)) {
    //@ts-ignore TYPES
    return monitor.entitymap.get(value);
  }

  let res: EntityObject | EntityFunction;
  
  if (typeof value === "function" || value instanceof Function) {
    res = new EntityFunction(value, <IFunctionLabeler>labeler, modelstate);
  } else {
    res = new EntityObject(value, <IObjectLabeler>labeler, modelstate);
  }

  try {
    monitor.entitymap.set(value, res);
  }
  catch (e) {
    monitor.warn('Cannot map ', value.toString());
  }
  return res;
}

// --------------------------------------------------------------------------
// --- unlabelPropertyDescriptor :: EntityObject -> NativeValue
// --------------------------------------------------------------------------
export function unlabelPropertyDescriptor(
  jsflowdesc: LabeledPropertyDescriptor | undefined,
  unlabelmodel: DescriptorUnlabeler,
  modelstate: ModelState
): PropertyDescriptor | undefined {
  if (jsflowdesc === undefined) {
    return undefined;
  }

  let boolProperties = ['configurable', 'enumerable', 'writable'];
  let desc: PropertyDescriptor = {};
  for (let key of boolProperties) {
    if (jsflowdesc[key] !== undefined) {
      desc[key] = jsflowdesc[key];
    }
  }

  // TODO: this should not be done via a ValueUnlabeler
  unlabelmodel.Unlabeler.Unlabel(new Value(null, jsflowdesc.label), modelstate);

  if (IsAccessorDescriptor(jsflowdesc)) {
    if (jsflowdesc.get) {
      //@ts-ignore DESC HELL
      desc.get = unlabel(jsflowdesc.get.actualFunction, unlabelmodel.GetterUnlabeler, modelstate);
    }

    if (jsflowdesc.set) {
      //@ts-ignore DESC HELL
      desc.set = unlabel(jsflowdesc.set.actualFunction, unlabelmodel.SetterUnlabeler, modelstate);
    }
  } else
    if (IsDataDescriptor(jsflowdesc)) {
        desc.value = unlabel(jsflowdesc.value, unlabelmodel.ValueUnlabeler, modelstate);
    } else {
      monitor.Throw(
        "Error",
        'Entity.unlabelPropertyDescriptor: got something that is not a descriptor!',
        bot
      );
    }

  return desc;
}


// ---



// --------------------------------------------------------------------------
// --- unlabel :: EntityObject -> Policy -> NativeValue
// --------------------------------------------------------------------------
// TODO: how to handle non-standard interactions (Object.X, Reflect.X, __protot__, instanceof)

function handler(jsflowobject: EcmaObject, abstractname: AbstractName): ProxyHandler<any> {

  if (abstractname === undefined) {
    monitor.fatal('exec.js, handler, undefined abstract name')
  }

  if (typeof abstractname !== 'string') {
    monitor.fatal('unlabel handler, abstract name is not a string but' + abstractname);
  }

  return {

    // ---
    // Object.getPrototypeOf(), Reflect.getPrototypeOf(), __proto__, Object.prototype.isPrototypeOf(), instanceof

    getPrototypeOf: function (target) {
     // console.log('getPrototypeOf', jsflowobject);
      let modelstate = monitor.policy.CurrentModelState;
      let unlabeler = modelstate.GetModel(abstractname);

      let prototypeUnlabeler = unlabeler.PrototypeUnlabeler;
      let prototype = prototypeUnlabeler.Unlabeler.Unlabel(jsflowobject.Prototype, modelstate);

      let descLabeler = prototypeUnlabeler.ReadUnlabeler;

      let jsprototype = unlabel(prototype, descLabeler.ValueUnlabeler, modelstate);
      return jsprototype;
    },

    // ---
    // Object.setPrototypeOf(), Reflect.setPrototypeOf()

    setPrototypeOf: function (target, prototype): boolean {
     // console.log('setPrototypeOf', jsflowobject);

      let modelstate = monitor.policy.CurrentModelState;
      let unlabeler = modelstate.GetModel(abstractname);

      // TODO: fix
      let labeler = new ObjectLabeler(undefined, 'fake');

      let labeled = relabel(prototype, labeler, modelstate);
      //@ts-ignore
      jsflowobject.Prototype = new Value(labeled, bot);
      return true;
      monitor.error(labeled);

      monitor.warn("Entity.ts:Proxy handler:Proxy.setPrototypeOf: setPrototypeOf is ES6 standard. Needs implementation.")
      monitor.Throw(
        "Error",
        'Proxy.setPrototypeOf: setPrototypeOf is ES6 standard.',
        bot
      );

      return false;
    },

    // ---
    // Object.isExtensible(), Reflect.isExtensible() 

    isExtensible: function (target): boolean {
      let modelstate = monitor.policy.CurrentModelState;
      let unlabeler = modelstate.GetModel(abstractname);

      let targetValue = new Value(jsflowobject, bot);
      //@ts-ignore TYPES
      let isExtensible: Value<boolean> = monitor.instances.ObjectConstructor.properties.isExtensible.Call(jsflowobject, [targetValue]);

      let jsIsExtensible = unlabeler.Unlabeler.Unlabel(isExtensible, modelstate);
      return jsIsExtensible;
    },

    // ---
    // Object.preventExtensions(), Reflect.preventExtensions()

    preventExtensions: function (target) {
      let modelstate = monitor.policy.CurrentModelState;
      let model = modelstate.GetModel(abstractname);

      // TODO: unlabel model here; write context
      let targetValue = new Value(jsflowobject, bot);
      //@ts-ignore TYPES
      monitor.instances.ObjectConstructor.properties.preventExtensions.Call(jsflowobject, [targetValue]);
      return true;
    },

    // ---
    // Object.getOwnPropertyDescriptor(), Reflect.getOwnPropertyDescriptor()

    getOwnPropertyDescriptor: function (target, prop): PropertyDescriptor | undefined {
      // console.log('getOwnPropertyDescriptor', jsflowobject, prop);

      if (typeof prop === 'symbol') {
        monitor.warn("handler.getOwnPropertyDescriptor, forwarding " + prop.toString() + " to prototype");
        return target.__proto__[prop];
      }

      let modelstate = monitor.policy.CurrentModelState;
      let unlabeler = modelstate.GetModel(abstractname);

      let propertyUnlabeler = unlabeler.GetPropertyUnlabeler(prop);

      let labeledResult = jsflowobject.GetOwnProperty(new Value(prop, bot));
      let result = propertyUnlabeler.Unlabeler.Unlabel(labeledResult, modelstate);

      let jsresult = unlabelPropertyDescriptor(result, propertyUnlabeler.ReadUnlabeler, modelstate);
      return jsresult;
    },

    // ---
    // Object.defineProperty, Reflect.defineProperty()

    defineProperty: function (target, prop, jsdesc) {
     //  console.log('defineProperty', jsflowobject, prop);

      if (typeof prop === 'symbol') {
        throw new TypeError('handler.defineProperty, defining symbol properties not supported ' + prop.toString());
      }

      let modelstate = monitor.policy.CurrentModelState;
      let unlabeler = modelstate.GetModel(abstractname);

      let propertyUnlabeler = unlabeler.GetPropertyUnlabeler(prop);

      // TODO: we should get a write context from the unlabeler, or the propertyUnlabeler
      let contextLabel = bot;

      let desc = relabelPropertyDescriptor(jsdesc, propertyUnlabeler.WriteLabeler, modelstate);

      monitor.context.pushPC(contextLabel);
      //@ts-ignore DESC HELL
      let x = jsflowobject.DefineOwnProperty(new Value(prop, bot), desc, true);
      monitor.context.popPC();
      // TODO: should share model with set

      return true;
    },

    // ---
    // the in operator

    has: function (target, prop): boolean {
    //  console.log('has', jsflowobject, prop);

      if (typeof prop === 'symbol') {
        // TODO: should never get symbols?
        throw new TypeError('handler.has,  symbol properties not supported ' + prop.toString());
      }

      let modelstate = monitor.policy.CurrentModelState;
      let unlabeler = modelstate.GetModel(abstractname);

      let propertyUnlabeler = unlabeler.GetPropertyUnlabeler(prop);

      // TODO: where should we get the label for the prop? and where should we store the label for the in?
      // must be on the object
      let result: Value<boolean> = jsflowobject.HasProperty(new Value(prop, bot));
      return result.value;
    },

    // ---
    //

    get: function (target, prop, receiver) {
    //  console.log('get', jsflowobject, prop);

      if (prop === '__get_jsflow_object') {
        return jsflowobject;
      }

      if (typeof prop === 'symbol') {
        monitor.warn("handler.get, forwarding " + prop.toString() + " to prototype");
        return target.__proto__[prop];
      }

      let modelstate = monitor.policy.CurrentModelState;
      let unlabeler = modelstate.GetModel(abstractname);

      let propertyUnlabeler = unlabeler.GetPropertyUnlabeler(prop);
      let descUnlabeler = propertyUnlabeler.ReadUnlabeler;

      let jsfresult = jsflowobject.Get(new Value(prop, bot));
      let result = descUnlabeler.Unlabeler.Unlabel(jsfresult, modelstate);

      return unlabel(result, descUnlabeler.ValueUnlabeler, modelstate);
    },

    // --
    // 

    set: function (target, prop, value, receiver) {
     // console.log('set', jsflowobject, prop);

      if (typeof prop === 'symbol') {
        throw new TypeError('handler.set, setting symbol properties not supported ' + prop.toString());
      }

      let modelstate = monitor.policy.CurrentModelState;
      let unlabeler = modelstate.GetModel(abstractname);

      let propertyUnlabeler = unlabeler.GetPropertyUnlabeler(prop);
      let descLabeler = propertyUnlabeler.WriteLabeler;

      let jsfvalue = relabel(value, descLabeler.ValueLabeler, modelstate);
      let valueLabel = descLabeler.ValueLabeler.Labeler.Label(modelstate);

      // TODO: we should re-add context at some point.
      let contextLabel = bot;
      monitor.context.pushPC(contextLabel);
      //@ts-ignore TYPES
      jsflowobject.Put(new Value(prop, bot), new Value(jsfvalue, valueLabel));
      monitor.context.popPC();
      // NOTE: encodes that set always works.
      return true;
    },

    // --
    // TODO: lacks label model connection

    deleteProperty: function (target, prop) {
      if (typeof prop === 'symbol') {
        throw new TypeError('handler.deleteProperty, deleting symbol properties not supported ' + prop.toString());
      }
      let result = jsflowobject.Delete(new Value(prop, bot));
      return result.value;
    },

    // --
    // TODO: unfinnished!

    ownKeys: function (target) {
     // console.log('ownKeys', jsflowobject);

      //@ts-ignore TYPES
      let keys = monitor.instances.ObjectConstructor.properties.getOwnPropertyNames.Call(new Value(jsflowobject, bot), [new Value(jsflowobject, bot)]);
      return Object.getOwnPropertyNames(target); //unlabel(keys);
    },

    // --
    //

    apply: function (target, thisArg, args) {
     // console.log('apply');

      let modelstate = monitor.policy.CurrentModelState;
      if (abstractname[0] === '@' || modelstate === undefined) {
        // event listener model indicated by @ 
        // or execution in the empty model state stack inidicating call initialted from library
        // the assumption is that event listeners are only called
        modelstate = monitor.policy.eventmodelstate;
      }
      // TODO: Cast - should add check!
      let unlabeler: FunctionUnlabeler = <FunctionUnlabeler>modelstate.GetModel(abstractname);

      let labeledThis = MkValue(thisArg, unlabeler.SelfLabeler, modelstate);

      let labeledArgs: Value<PrimitiveType | EntityObject | EntityFunction>[] = [];
      let argslabelmodels = unlabeler.ArgumentsLabeler;

      for (let i = 0, j = 0; i < args.length; i++ , j++) {
        while (!argslabelmodels.GetLabeler(j).ModelFor(args[i])) {
          j++;
        }

        labeledArgs[i] = MkValue(args[i], argslabelmodels.GetLabeler(j), modelstate);
      }

      try {
        
        //@ts-ignore TYPEs
        if (jsflowobject.Code !== undefined && jsflowobject.Code !== null) { 
          monitor.info("--------------------------------------------------------------------------------");
          //@ts-ignore TYPEs
          monitor.info(`Calling ${pretty(jsflowobject.Code).slice(0,76)} ...`);
        }
        //@ts-ignore TYPES
        let result = jsflowobject.Call(labeledThis, labeledArgs);
        
        //@ts-ignore TYPEs
        if (jsflowobject.Code !== undefined && jsflowobject.Code !== null) { 
          monitor.info("Done.");
          monitor.info("--------------------------------------------------------------------------------");
        }

        return unlabelValue(result, unlabeler.ReturnUnlabeler, modelstate);
      } catch (e) {

        if (isJSFlowError(e)) {
          throw e;
        }

        // temporary fix; we should translate errors properly
        let fakePolicy = new ValueUnlabeler(undefined, 'fake');
        let unlabeled = unlabelValue(e, fakePolicy, modelstate);
        if (unlabeled === undefined) {
          monitor.warn('---->', jsflowobject.toString(), jsflowobject);
          monitor.warn(e);
        }
        
        monitor.warn(e.value.toString());
        throw unlabeled;
      }
    },

    // ---
    //

    construct: function (target, args, receiver) {
      let modelstate = monitor.policy.CurrentModelState;
      let unlabeler: FunctionUnlabeler = <FunctionUnlabeler>modelstate.GetModel(abstractname);

      let labeledArgs: Value<PrimitiveType | EntityObject | EntityFunction>[] = [];
      let argslabelmodels = unlabeler.ArgumentsLabeler;

      for (let i = 0, j = 0; i < args.length; i++ , j++) {
        while (!argslabelmodels.GetLabeler(j).ModelFor(args[i])) {
          j++;
        }

        labeledArgs[i] = MkValue(args[i], argslabelmodels.GetLabeler(j), modelstate);
      }

      //@ts-ignore TYPES
      let result = jsflowobject.Construct(labeledArgs);

      return unlabelValue(result, unlabeler.ReturnUnlabeler, modelstate);

    }
  }
}


// ---

export function unlabelValue(
  labeledValue: Value<any>,
  valueUnlabeler: ValueUnlabeler,
  modelstate: ModelState
): any {
  let value = valueUnlabeler.Unlabeler.Unlabel(labeledValue, modelstate);
  let jsvalue = unlabel(value, valueUnlabeler.AbstractName, modelstate);
  return jsvalue;
}

// ---
// unlabel
// --- ----------------------------------------------------------------------

export function unlabel(
  value: any,
  abstractname: AbstractName,
  modelstate: ModelState) {

  if (value === null) {
    return null;
  }

  let valType = typeof value;
  if (
    valType === 'string' ||
    valType === 'number' ||
    valType === 'boolean' ||
    valType === 'undefined' ||
    valType === 'symbol'
  ) {
    return value;
  }

  // BiFo, EntityFunction, EntityObject, all Prototypes and Constructors
  if (value.host !== undefined) {
    return value.host;
  }

  // JSON.stringify checks 'internal slots' to identify string; we cannot proxy StringObjects - they will not be recognized as strings
  // This, on the other hand is problematic, since any changes to the String objects or prototypes will not be reflected.
  // TODO: fix label handling
  //if (value.Class === 'String') {
  //  return value.PrimitiveValue;
  //}


  // to be callable, the proxied object must be a function
  // thus, we copy the properties to a function
  // those properties are not used, but they must be present.
  // the handler interacts with the original object 

  if (typeof value === "function" || value instanceof FunctionObject) {
    let fun = function () { };

    for (let key of Object.getOwnPropertyNames(value.properties)) {
      // We cannot copy the arguments, since its not writable or configurable on function objects
      if (key !== 'arguments') {
        // guaranteed to be present
        let desc = <PropertyDescriptor>Object.getOwnPropertyDescriptor(value.properties, key);
        Object.defineProperty(fun, key, desc);
      }
    }

    return new Proxy(fun, handler(value, abstractname));
  }

  return new Proxy(value.properties, handler(value, abstractname));
}

