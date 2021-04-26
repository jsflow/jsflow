import { Value } from "../Value";
import { Label, lub, bot } from '../Label';

import { PolicyMonitorBase } from './PolicyMonitorBase';
import { IsCrawler } from "./crawler/CrawlerUtil";

var full_access_path = true;
// ---

export function has_own_property(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

declare var monitor: PolicyMonitorBase;


// --- ----------------------------------------------------------------------

export type PolicyLabelModel = ObjectLabelModel | FunctionLabelModel | ArrayLabelModel | NamedLabelModel;
export type PolicyUnlabelModel = ObjectUnlabelModel | FunctionUnlabelModel | ArrayUnlabelModel | NamedUnlabelModel;

export interface Policy {
  labelmodels: { [key: string]: PolicyLabelModel };
  unlabelmodels: { [key: string]: PolicyUnlabelModel };
  events: { [key: string]: PolicyUnlabelModel }
  global: ObjectLabelModel;
  pathmodels: { [key: string]: string };
}

// ---

export class SecurityPolicy {

  labelmodelmap: { [key: string]: Labeler } = {};
  unlabelmodelmap: { [key: string]: Unlabeler } = {};

  modelstatestack: ModelState[];

  global: ObjectLabeler;

  pathmodelmap: { [key: string]: string }

  globalmodelstate: ModelState;
  eventmodelstate: ModelState;

  constructor(policy: Policy) {

    // model state stack - sometimes jsflow causes unlabeling without calling a labeled  export function
    // e.g., this occurs if checking instanceof on a wrapped jsflow object
    // for now we let those spill into a top-level model-state

    this.modelstatestack = [new ToplevelModelState(null)];

    for (let name in policy.labelmodels) {
      this.labelmodelmap[name] = TranformerFactory.MakeObjectLabeler(policy.labelmodels[name], name);
    }

    for (let name in policy.unlabelmodels) {
      this.unlabelmodelmap[name] = TranformerFactory.MakeObjectUnlabeler(policy.unlabelmodels[name], name);
    }

    this.global = new ObjectLabeler(policy.global, "global");

    this.pathmodelmap = {};
    for (let name in policy.pathmodels) {
      this.pathmodelmap[name] = policy.pathmodels[name];
    }

    // model states
    this.globalmodelstate = new ModelState(null);

    // event model state
    this.eventmodelstate = new ModelState(null);

    for (let name in policy.events) {
      this.eventmodelstate.SetModel(name, TranformerFactory.MakeObjectUnlabeler(policy.events[name], name));
    }
  }

  // --- 
  // model state stack handling

  PushModelState(modelstate: ModelState): void {
    this.modelstatestack.unshift(modelstate);
  }

  PopModelState(): ModelState {
    if (this.modelstatestack.length === 1) {
      monitor.fatal("Trying to pop toplevel modelstate");
    }
    return <ModelState>this.modelstatestack.shift();
  }

  get CurrentModelState(): ModelState {
    return this.modelstatestack[0];
  }

  // ---
  // export class name to models

  GetLabeler(name: string): Labeler {
    if (!this.labelmodelmap[name]) {
      monitor.fatal('No label model for ' + name);
    }

    return this.labelmodelmap[name];
  }

  GetUnlabeler(name: string): Unlabeler {
    if (!this.unlabelmodelmap[name]) {
      monitor.fatal('No unlabel model for ' + name);
    }
    return this.unlabelmodelmap[name];
  }

}

// ---

export class TranformerFactory {

  static MakeObjectLabeler(
    model: ObjectLabelModel | FunctionLabelModel | ArrayLabelModel | undefined,
    path: string
  ): ObjectLabeler | FunctionLabeler | ArrayLabeler | UnknownLabeler {

    if (model === undefined) {
      return new UnknownLabeler(path);
    }

    switch (model.kind) {
      case 'ObjectLabelModel': return new ObjectLabeler(model, path);
      case 'FunctionLabelModel': return new FunctionLabeler(model, path);
      case 'ArrayLabelModel': return new ArrayLabeler(model, path);
    }

    if (isNamedLabelModel(model)) {
      return monitor.policy.GetLabeler(model.name);
    }

    return monitor.fatal('Unknown label model type ' + model.kind);
  }

  static MakeObjectUnlabeler(
    model: ObjectUnlabelModel | FunctionUnlabelModel | ArrayUnlabelModel | undefined,
    path: string
  ): ObjectUnlabeler | FunctionUnlabeler | ArrayUnlabeler | UnknownUnlabeler {

    if (model === undefined) {
      return new UnknownUnlabeler(path);
    }

    switch (model.kind) {
      case 'ObjectUnlabelModel': return new ObjectUnlabeler(model, path);
      case 'FunctionUnlabelModel': return new FunctionUnlabeler(model, path);
      case 'ArrayUnlabelModel': return new ArrayUnlabeler(model, path);
    }

    if (isNamedUnlabelModel(model)) {
      return monitor.policy.GetUnlabeler(model.name);
    }

    return monitor.fatal('Unknown unlabel model type ' + model.kind);
  }
}
// --- ----------------------------------------------------------------------

export class ModelState {

  labelState: { [key: string]: Label };
  // TODO: should include effects
  modelState: { [key: string]: Unlabeler };
  parent: ModelState | null;

  constructor(parent: ModelState | null) {
    this.labelState = {};
    this.modelState = {};
    this.parent = parent;
  }

  /* expects
   * label description (string, [string])
   * if beginning with @ then label variable 
   * else label string
   * 
   * returns lub of descriptions
   */

  label(labelmodels: string | string[] | undefined): Label {

    if (labelmodels === undefined || labelmodels === "") {
      return bot;
    }

    if (typeof labelmodels === 'string') {
      labelmodels = [labelmodels];
    }

    var label = new Label();

    for (let labelmodel of labelmodels) {
      if (labelmodel[0] === '@') {
        label = lub(label, this.get(labelmodel));
      } else {
        label = lub(label, new Label(labelmodel));
      }
    }

    return label;
  }

  // ---
  // label var handling

  get(labelvar: string): Label {
    if (labelvar in this.labelState) {
      return this.labelState[labelvar];
    }

    if (this.parent !== null) {
      return this.parent.get(labelvar);
    }

    return monitor.fatal(`ModelState: label variable ${labelvar} not found`);
  }

  set(labelvar: string, label: Label) {
    this.labelState[labelvar] = label;
  }

  // abstract name mapping; should not traverse model state hierarchy

  GetModel(abstractname: string): Unlabeler {

    if (typeof abstractname !== 'string') {
      monitor.fatal('GetModel abstract name is not a string but' + abstractname);
    }

    if (!has_own_property(this.labelState, abstractname)) {
      monitor.log('no unlabel model for', abstractname);
      this.modelState[abstractname] = new UnknownUnlabeler(abstractname);
    }

    return this.modelState[abstractname];
  }

  SetModel(abstractname: string, model: Unlabeler): void {
    if (typeof abstractname !== 'string') {
      monitor.fatal('SetModel abstract name is not a string but' + abstractname);
    }

    this.modelState[abstractname] = model;
  }

}

// --- ----------------------------------------------------------------------

export class ToplevelModelState extends ModelState {
  constructor(parent: ModelState | null) {
    super(parent);
  }

  label(labelmodels) {
    monitor.log('ToplevelModelState, out-of-context label of', labelmodels, 'triggered');
    return super.label(labelmodels);
  }

  get(labelvar) {
    monitor.log('ToplevelModelState, out-of-context get of', labelvar, 'triggered');
    return super.get(labelvar);
  }

  set(labelvar, label) {
    monitor.log('ToplevelModelState, out-of-context set of', labelvar, 'triggered');
    return super.set(labelvar, label);
  }

  GetModel(abstractname) {
    monitor.log('ToplevelModelState, out-of-context GetModel of', abstractname, 'triggered');
    return super.GetModel(abstractname);
  }

  SetModel(abstractname, model) {
    monitor.log('ToplevelModelState, out-of-context SetModel of', abstractname, 'triggered');
    return super.SetModel(abstractname, model);
  }

}

// --- ----------------------------------------------------------------------
// models

export type AbstractName = string
type PrimitiveLabelModel = string | string[];

export type PrimitiveUnlabelModel = string; // string beginning with @

// ---

export type LabelModel = ObjectLabelModel | FunctionLabelModel | ArrayLabelModel | undefined;
export type UnlabelModel = ObjectUnlabelModel | FunctionUnlabelModel | ArrayUnlabelModel | undefined;

// ---

export interface ValueLabelModel {
  label?: PrimitiveLabelModel;
  model?: LabelModel;
}

export interface ValueUnlabelModel {
  label?: PrimitiveUnlabelModel;
  model?: AbstractName;
}

// ---

export interface ArgumentLabelModel extends ValueLabelModel {
  optional?: string;
}

export interface ArgumentUnlabelModel extends ValueUnlabelModel {
  optional?: string;
}

// ---

export interface DescriptorLabelModel {
  label?: PrimitiveLabelModel;
  value?: LabelModel;
  getter?: FunctionLabelModel;
  setter?: FunctionLabelModel;
}

export interface DescriptorUnlabelModel {
  label?: PrimitiveUnlabelModel;
  value?: AbstractName;
  getter?: AbstractName;
  setter?: AbstractName;
}

export interface PropertyLabelModel {
  label?: PrimitiveLabelModel;
  read?: DescriptorLabelModel;
  write?: DescriptorUnlabelModel;
}

export interface PropertyUnlabelModel {
  label?: PrimitiveUnlabelModel;
  read?: DescriptorUnlabelModel;
  write?: DescriptorLabelModel;
}

// ---

type LabelModelKind = 'ObjectLabelModel' | 'FunctionLabelModel' | 'ArrayLabelModel' | 'NamedLabelModel';
type UnlabelModelKind = 'ObjectUnlabelModel' | 'FunctionUnlabelModel' | 'ArrayUnlabelModel' | 'NamedUnlabelModel';

export interface ObjectLabelModel {
  kind: LabelModelKind;
  prototype?: PropertyLabelModel;
  properties?: { [key: string]: PropertyLabelModel };
  label?: PrimitiveLabelModel;
}

export function isObjectLabelModel(model): model is ObjectLabelModel {
  return model.kind === 'ObjectLabelModel';
}

export interface ObjectUnlabelModel {
  kind: UnlabelModelKind;
  prototype?: PropertyUnlabelModel;
  properties?: { [key: string]: PropertyUnlabelModel };
  label?: PrimitiveUnlabelModel
}

export function isObjectUnlabelModel(model): model is ObjectUnlabelModel {
  return model.kind === 'ObjectUnlabelModel';
}

// ---

export interface NamedLabelModel {
  kind: LabelModelKind;
  name: string;
}

export function isNamedLabelModel(model): model is NamedLabelModel {
  return model.kind === 'NamedLabelModel';
}

export interface NamedUnlabelModel {
  kind: UnlabelModelKind;
  name: string;
}

export function isNamedUnlabelModel(model): model is NamedUnlabelModel {
  return model.kind === 'NamedUnlabelModel';
}

// ---

export interface FunctionLabelModel extends ObjectLabelModel {
  self?: ValueUnlabelModel;
  args?: ArgumentUnlabelModel[];
  ret?: ValueLabelModel;

  // TODO: effects
  // effects : { [key; string] : effect } 
}

export interface FunctionUnlabelModel extends ObjectUnlabelModel {
  self?: ValueLabelModel;
  args?: ArgumentLabelModel[];
  ret?: ValueUnlabelModel;
}

// ---

export interface ArrayLabelModel extends ObjectLabelModel {
  element?: PropertyLabelModel
}

export interface ArrayUnlabelModel extends ObjectUnlabelModel {
  element?: PropertyUnlabelModel
}

// ---   


// --- ----------------------------------------------------------------------
// export interfaces

export type Labeler = ObjectLabeler | FunctionLabeler | ArrayLabeler | UnknownLabeler;
export type Unlabeler = ObjectUnlabeler | FunctionUnlabeler | ArrayUnlabeler | UnknownUnlabeler;

// ---

export interface IValueLabeler {
  Labeler: PrimitiveLabeler;
  ValueLabeler: Labeler;
}

export interface IValueUnlabeler {
  Unlabeler: PrimitiveUnlabeler;
  AbstractName: AbstractName;
}

// ---

export interface IArgumentLabeler extends IValueLabeler {
  ModelFor(value: any): boolean;
}

export interface IArgumentUnlabeler extends IValueUnlabeler {
  ModelFor(value: Value<any>): boolean;
}

// ---

export interface IPropertyLabeler {
  Labeler: PrimitiveLabeler;
  ReadLabeler: DescriptorLabeler;
  WriteUnlabeler: DescriptorUnlabeler
}

export interface IPropertyUnlabeler {
  Unlabeler: PrimitiveUnlabeler;
  ReadUnlabeler: DescriptorUnlabeler;
  WriteLabeler: DescriptorLabeler;
}

// ---

export interface IObjectLabeler {
  Labeler: PrimitiveLabeler;
  PrototypeLabeler: PropertyLabeler;
  GetPropertyLabeler(name: string | number): PropertyLabeler;
}

export interface IObjectUnlabeler {
  Unlabeler: PrimitiveUnlabeler;
  PrototypeUnlabeler: PropertyUnlabeler;
  GetPropertyUnlabeler(name: string | number): PropertyUnlabeler;
}

// ---

export interface IFunctionLabeler extends IObjectLabeler {
  ArgumentsUnlabeler: ArgumentsUnlabeler;
  SelfUnlabeler: ValueUnlabeler;
  ReturnLabeler: ValueLabeler;
}

export interface IFunctionUnlabeler extends IObjectUnlabeler {
  ArgumentsLabeler: ArgumentsLabeler;
  SelfLabeler: ValueLabeler;
  ReturnUnlabeler: ValueUnlabeler;
}

// --- ----------------------------------------------------------------------
// Labelers

export class PrimitiveLabeler implements PrimitiveLabeler {

  labelmodel?: PrimitiveLabelModel;

  constructor(labelmodel?: PrimitiveLabelModel) {
    this.labelmodel = labelmodel;
  }

  Label(modelstate: ModelState): Label {
    return modelstate.label(this.labelmodel);
  }

  Extract() {
    return this.labelmodel;
  }
}

// --- ----------------------------------------------------------------------

export class ValueLabeler implements IValueLabeler {

  labelmodel: ValueLabelModel;
  path: string;

  label?: PrimitiveLabeler;
  value?: Labeler;

  constructor(labelmodel: ValueLabelModel | undefined, path: string) {
    if (labelmodel === undefined) {
      monitor.log('undefined value label model for', path);
    }

    let label = path.replace(/\.prototype/g, '');

    this.labelmodel = labelmodel || { label: label, model: undefined };
    this.path = path;
  }

  get Labeler(): PrimitiveLabeler {
    if (this.label === undefined) {
      this.label = new PrimitiveLabeler(this.labelmodel.label);
    }
    return this.label;
  }

  get ValueLabeler(): Labeler {
    if (this.value === undefined) {
      this.value = TranformerFactory.MakeObjectLabeler(this.labelmodel.model, this.path);
    }
    return this.value;
  }
}

// --- ----------------------------------------------------------------------


export class ArgumentLabeler extends ValueLabeler implements IArgumentLabeler {

  // @ts-ignore initialized by super call
  labelmodel: ArgumentLabelModel;
  optional: string | undefined;

  constructor(labelmodel: ArgumentLabelModel | undefined, path: string) {
    if (labelmodel === undefined) {
      monitor.log('undefined argument label model for', path);
    }

    super(labelmodel, path);
    // @ts-ignore initialized by super call
    this.optional = this.labelmodel.optional;
  }

  ModelFor(value: any): boolean {
    if (this.labelmodel.optional === undefined) {
      return true;
    }

    return typeof value === this.labelmodel.optional;
  }

}

// ---

export class ArgumentsLabeler {

  labelmodel: ArgumentLabelModel[];
  path: string;
  argslabelmodels: ArgumentLabeler[];

  constructor(labelmodel: ArgumentLabelModel[] | undefined, path: string) {
    if (labelmodel !== undefined && !(labelmodel instanceof Array)) {
      monitor.fatal('ArgumentsLabelModel, expected undefined or array, for ' + path + ' but got ' + labelmodel)
    }

    this.labelmodel = labelmodel || [];
    this.path = path;

    this.argslabelmodels = [];
  }

  GetLabeler(i: number): ArgumentLabeler {
    if (!has_own_property(this.argslabelmodels, i)) {
      this.argslabelmodels[i] = new ArgumentLabeler(this.labelmodel[i], `${this.path}[${i}]`)
    }

    return this.argslabelmodels[i];
  }

}

// --- ----------------------------------------------------------------------

export class DescriptorLabeler {

  labelmodel: DescriptorLabelModel;
  path: string;

  label?: PrimitiveLabeler;
  value?: Labeler;
  getter?: FunctionLabeler;
  setter?: FunctionLabeler;

  constructor(labelmodel: DescriptorLabelModel | undefined, path: string) {
    let label = path.replace(/\.prototype/g, '');

    this.labelmodel = labelmodel || { label: label };
    this.path = path;
  }

  get Labeler(): PrimitiveLabeler {
    if (this.label === undefined) {
      this.label = new PrimitiveLabeler(this.labelmodel.label);
    }
    return this.label;
  }

  get ValueLabeler(): Labeler {
    if (this.value === undefined) {
      this.value = TranformerFactory.MakeObjectLabeler(this.labelmodel.value, this.path);
    }
    return this.value;
  }

  get GetterLabeler(): FunctionLabeler {
    if (this.getter === undefined) {
      this.getter = new FunctionLabeler(this.labelmodel.getter, this.path);
    }
    return this.getter;
  }

  get SetterLabeler(): FunctionLabeler {
    if (this.setter === undefined) {
      this.setter = new FunctionLabeler(this.labelmodel.setter, this.path);
    }
    return this.setter;
  }
}

// ---

export class DescriptorUnlabeler {

  unlabelmodel: DescriptorUnlabelModel;
  path: string;

  label?: PrimitiveUnlabeler;
  value?: AbstractName;
  getter?: AbstractName;
  setter?: AbstractName;

  constructor(unlabelmodel: DescriptorUnlabelModel | undefined, path: string) {

    this.unlabelmodel = unlabelmodel || {};
    this.path = path;
  }


  get Unlabeler(): PrimitiveUnlabeler {
    if (this.label === undefined) {
      this.label = new PathedPrimitiveUnlabeler(this.path, this.unlabelmodel.label);
    }
    return this.label;
  }

  get ValueUnlabeler(): AbstractName {
    if (this.value === undefined) {
      this.value = this.unlabelmodel.value || this.path;
    }

    return this.value;
  }

  get GetterUnlabeler(): AbstractName {
    if (this.getter === undefined) {
      this.getter = this.unlabelmodel.getter || this.path;
    }
    return this.getter;
  }

  get SetterUnlabeler(): AbstractName {
    if (this.setter === undefined) {
      this.setter = this.unlabelmodel.setter || this.path;
    }
    return this.setter;
  }

}




// ---

export class PropertyLabeler implements IPropertyLabeler {

  labelmodel: PropertyLabelModel;
  path: string;

  label?: PrimitiveLabeler;
  read?: DescriptorLabeler;
  write?: DescriptorUnlabeler;

  constructor(labelmodel: PropertyLabelModel | undefined, path: string) {

    if (labelmodel === undefined) {
      let label = path.replace(/\.prototype/g, '');
      if (label !== undefined) {
        monitor.log(`autolabeling "${path}" : "${label}"`);
        labelmodel = { label: label };
      } else {
        monitor.log('undefined property label model for', path);
      }
    }

    this.labelmodel = labelmodel || {};
    this.path = path;
  }

  get Labeler(): PrimitiveLabeler {
    if (this.label === undefined) {
      this.label = new PrimitiveLabeler(this.labelmodel.label);
    }
    return this.label;
  }

  get ReadLabeler(): DescriptorLabeler {
    if (this.read === undefined) {
      this.read = new DescriptorLabeler(this.labelmodel.read, this.path);
    }
    return this.read;
  }

  get WriteUnlabeler(): DescriptorUnlabeler {
    if (this.write === undefined) {
      this.write = new DescriptorUnlabeler(this.labelmodel.write, this.path);
    }
    return this.write;
  }

}

// --- ----------------------------------------------------------------------

export class ObjectLabeler implements IObjectLabeler {

  labelmodel: ObjectLabelModel;
  path: string;

  prototype?: PropertyLabeler;
  properties: { [key: string]: PropertyLabeler };
  label?: PrimitiveLabeler;

  constructor(labelmodel: ObjectLabelModel | undefined, path: string) {
    if (labelmodel === undefined) {
      monitor.log('undefined object label model for', path);
    }
    let label = path.replace(/\.prototype/g, '');

    this.labelmodel = labelmodel || { label: label, kind: 'ObjectLabelModel' };
    this.path = path;
    this.properties = {};
  }

  get PrototypeLabeler(): PropertyLabeler {
    if (this.prototype === undefined) {
      this.prototype = new PropertyLabeler(this.labelmodel.prototype, this.path + '.prototype');
    }

    return this.prototype;
  }

  GetPropertyLabeler(propertyname: string | number): PropertyLabeler {
    if (!has_own_property(this.properties, propertyname)) {
      let propertyModel = this.labelmodel.properties && this.labelmodel.properties[propertyname];
      this.properties[propertyname] = new PropertyLabeler(
        propertyModel,
        this.path + '.' + propertyname
      );
    }

    return this.properties[propertyname];
  }

  get Labeler(): PrimitiveLabeler {
    if (this.label === undefined) {
      this.label = new PrimitiveLabeler(this.labelmodel.label);
    }
    return this.label;
  }
}

// --- ----------------------------------------------------------------------
// TODO: effects

export class FunctionLabeler extends ObjectLabeler implements IFunctionLabeler {
  // @ts-ignore initialized by super call
  labelmodel: FunctionLabelModel;

  self?: ValueUnlabeler;
  args?: ArgumentsUnlabeler;
  ret?: ValueLabeler;

  constructor(labelmodel: FunctionLabelModel | undefined, path: string) {
    if (labelmodel === undefined) {
      monitor.log('undefined export function label model for', path);
    }

    // @ts-ignore initialized by super call
    super(labelmodel, path);
  }

  get ArgumentsUnlabeler(): ArgumentsUnlabeler {
    if (this.args === undefined) {
      this.args = new ArgumentsUnlabeler(this.labelmodel.args, this.path);
    }
    return this.args;
  }

  get SelfUnlabeler(): ValueUnlabeler {
    if (this.self === undefined) {
      if (full_access_path) monitor.log(this.path + '[Call]');

      this.self = new ValueUnlabeler(this.labelmodel.self, this.path, false);
    }
    return this.self;
  }

  get ReturnLabeler(): ValueLabeler {
    if (this.ret === undefined) {
      if (full_access_path) monitor.log(this.path + '[ReturnValue]');

      this.ret = new ValueLabeler(this.labelmodel.ret, this.path);
    }
    return this.ret;
  }

  // TODO: Issue #35, https://bitbucket.org/chalmerslbs/jsflow/issues/35/support-for-exceptions
  GetExceptionLabelModel(name) {
    return new UnknownLabeler(name)
  }

  // TODO: Issue #35, https://bitbucket.org/chalmerslbs/jsflow/issues/35/support-for-exceptions
  GetExceptionLabel(name) {
    return bot;
  }

  /* TODO:
  get Effects() {
    if (this.effects === undefined) {
      this.effects = {};
      for (var abstractname in labelmodel.effects) {
        this.effects[abstractname] = new Effect(this.labelmodel.effects[abstractname]);
      }
    }
    return this.effects;
  }
  */

}

// --- ----------------------------------------------------------------------
// TODO: arrays should fall back on objects

export class ArrayLabeler extends ObjectLabeler implements IObjectLabeler {

  // @ts-ignore initialized by super call
  labelmodel: ArrayLabelModel;

  element?: PropertyLabeler;

  constructor(labelmodel: ArrayLabelModel | undefined, path: string) {
    if (labelmodel === undefined) {
      monitor.log('undefined array label model for', path);
    }
    // @ts-ignore initialized by super call
    super(labelmodel, path);
  }

  GetPropertyLabelModel(propertyname: string | number): PropertyLabeler {
    if (this.element === undefined) {
      // TODO: create the right type
      this.element = new PropertyLabeler(this.labelmodel.element, this.path + '.' + propertyname);
    }

    return this.element;
  }

}

// --- ----------------------------------------------------------------------
// Merge between all other models. TODO: Add export function and constructor support.

export class UnknownLabeler implements IPropertyLabeler, IObjectLabeler, IFunctionLabeler {

  path: string;

  constructor(path: string) {
    this.path = path;
    this.properties = {};
  }

  // object support

  properties: { [key: string]: PropertyLabeler };
  prototype?: PropertyLabeler;

  get PrototypeLabeler(): PropertyLabeler {
    if (this.prototype === undefined) {
      this.prototype = new PropertyLabeler(undefined, this.path + '.prototype');
    }
    return this.prototype;
  }

  GetPropertyLabeler(propertyname: string | number): PropertyLabeler {
    if (!has_own_property(this.properties, propertyname)) {
      this.properties[propertyname] = new PropertyLabeler(undefined, this.path + '.' + propertyname);
    }

    return this.properties[propertyname];
  }

  GetStructLabel(modelstate: ModelState): Label {
    return bot;
  }

  // exception support

  // TODO: Issue #35, https://bitbucket.org/chalmerslbs/jsflow/issues/35/support-for-exceptions
  GetExceptionLabelModel(name) {
    return new UnknownLabeler(name)
  }

  // TODO: Issue #35, https://bitbucket.org/chalmerslbs/jsflow/issues/35/support-for-exceptions
  GetExceptionLabel(name) {
    return bot;
  }

  // export function support

  args?: ArgumentsUnlabeler;
  self?: ValueUnlabeler;
  ret?: ValueLabeler;

  get ArgumentsUnlabeler(): ArgumentsUnlabeler {
    if (this.args === undefined) {
      if (full_access_path) monitor.log(this.path + '[args]');

      this.args = new ArgumentsUnlabeler(undefined, this.path);
    }

    return this.args;
  }

  get SelfUnlabeler(): ValueUnlabeler {
    if (this.self === undefined) {
      if (full_access_path) monitor.log(this.path + '[this]');

      this.self = new ValueUnlabeler(undefined, this.path, false);
    }

    return this.self;
  }

  get ReturnLabeler(): ValueLabeler {
    if (this.ret === undefined) {
      if (full_access_path) monitor.log(this.path + '[ret]');

      this.ret = new ValueLabeler(undefined, this.path);
    }

    return this.ret;
  }

  get Effects() {
    return [];
  }

  // accessor support

  label?: PrimitiveLabeler;
  read?: DescriptorLabeler;
  write?: DescriptorUnlabeler;

  get Labeler(): PrimitiveLabeler {
    if (this.label === undefined) {
      this.label = new PrimitiveLabeler(undefined);
    }
    return this.label;
  }

  // for reading
  get ReadLabeler(): DescriptorLabeler {
    if (this.read === undefined) {
      this.read = new DescriptorLabeler(undefined, this.path);
    }
    return this.read;
  }

  // for writing
  get WriteUnlabeler(): DescriptorUnlabeler {
    if (this.write === undefined) {
      this.write = new DescriptorUnlabeler(undefined, this.path);
    }
    return this.write;
  }

}


// --- -----------------------------------------------------------------------------------------------------
// unlabel models

export class PrimitiveUnlabeler {

  variable: string | undefined;

  constructor(labelvar: string | undefined) {
    this.variable = labelvar;

    if (labelvar !== undefined && typeof labelvar !== 'string') {
      monitor.fatal('PrimitiveUnlabelModel, expecting label variable, got ' + labelvar);
    }
  }

  /* expects
   *  Value
   */

  Unlabel<T>(value: Value<T>, modelstate: ModelState): T {
    if (this.variable !== undefined) {
      modelstate.set(this.variable, value.label);
    }

    return value.value;
  }

}

// ---

export class PathedPrimitiveUnlabeler extends PrimitiveUnlabeler {

  path: string;

  constructor(path: string, labelvar: string | undefined) {
    super(labelvar);
    this.path = path;
  }

  Unlabel<T>(value: Value<T>, modelstate: ModelState): T {
      if (IsCrawler(monitor)) {
        monitor.CrawlerData.AddEscaping(this.path, value.label);
      }
      monitor.log("unlabeling", value.label.toString(),"into", this.path);

      return super.Unlabel(value, modelstate);
  }
}


// --- -----------------------------------------------------------------------------------------------------

export class ValueUnlabeler implements IValueUnlabeler {

  unlabelmodel: ValueUnlabelModel;
  path: string;

  unlabeler?: PrimitiveUnlabeler;
  abstractname?: AbstractName;
  recordEscaping : boolean;

  constructor(unlabelmodel: ValueUnlabelModel | undefined, path: string, recordEscaping? : boolean) {
    if (unlabelmodel === undefined) {
      monitor.log('undefined value unlabel model for', path);
    }

    this.unlabelmodel = unlabelmodel || {};
    this.path = path;
    this.recordEscaping = recordEscaping !== undefined ? recordEscaping : false;
  }

  get Unlabeler(): PrimitiveUnlabeler {
    if (this.unlabeler === undefined) {
      if (this.recordEscaping) {
        this.unlabeler = new PathedPrimitiveUnlabeler(this.path, this.unlabelmodel.label);
      } else {
        this.unlabeler = new PrimitiveUnlabeler(this.unlabelmodel.label);
      }
    }
    return this.unlabeler;
  }

  // undefined or abstract name
  get AbstractName(): AbstractName {
    if (this.abstractname === undefined) {
      this.abstractname = this.unlabelmodel.model || this.path;
    }
    return this.abstractname;
  }

}


// --- -----------------------------------------------------------------------------------------------------

export class ArgumentUnlabeler extends ValueUnlabeler implements IArgumentUnlabeler {
  // @ts-ignore initialized by super call
  unlabelmodel: ArgumentUnlabelModel;

  optional?: string;

  // ---

  constructor(unlabelmodel: ArgumentUnlabelModel | undefined, path: string) {

    if (unlabelmodel === undefined) {
      monitor.log('undefined argument unlabel model for', path);
    }

    super(unlabelmodel, path, true);
    // @ts-ignore initialized by super call
    this.optional = this.unlabelmodel.optional;
  }

  // ---

  ModelFor(labeledvalue: Value<any>): boolean {
    if (this.optional === undefined) {
      return true;
    }

    switch (typeof labeledvalue.value) {
      case 'undefined': return this.optional === 'undefined';
      case 'boolean': return this.optional === 'boolean';
      case 'number': return this.optional === 'number';
      case 'string': return this.optional === 'string';
    }

    if (labeledvalue.value === null) {
      this.optional === 'null';
    }

    // labeledvalue.value must a JSFlow object - use the Class property

    switch (labeledvalue.value.Class) {
      case 'Object': return this.optional === 'object';
      case 'Function': return this.optional === 'export function';
    }


    return monitor.fatal("ArgumentUnlabelModel:ModelFor: don't know how to handle" + labeledvalue.value);
  }


}

// --- -----------------------------------------------------------------------------------------------------

export class ArgumentsUnlabeler {

  unlabelmodel: ArgumentUnlabelModel[];
  path: string;

  args: ArgumentUnlabeler[];

  constructor(unlabelmodel: ArgumentUnlabelModel[] | undefined, path: string) {
    if (unlabelmodel !== undefined && !(unlabelmodel instanceof Array)) {
      monitor.fatal('ArgumentsUnlabelModel, expecting undefined or array, got' + unlabelmodel);
    }

    this.unlabelmodel = unlabelmodel || [];
    this.path = path;

    this.args = [];
  }

  GetArgumentUnlabeler(i: number): ArgumentUnlabeler {
    if (!has_own_property(this.args, i)) {
      this.args[i] = new ArgumentUnlabeler(this.unlabelmodel[i], `${this.path}[${i}]`)
    }

    return this.args[i];
  }

}


// --- -----------------------------------------------------------------------------------------------------

export class PropertyUnlabeler implements IPropertyUnlabeler {

  unlabelmodel: PropertyUnlabelModel;
  path: string;

  label?: PrimitiveUnlabeler;
  read?: DescriptorUnlabeler;
  write?: DescriptorLabeler;

  constructor(unlabelmodel: PropertyUnlabelModel | undefined, path: string) {
    if (unlabelmodel === undefined) {
      monitor.log('undefined property unlabel model for', path);
    }

    this.unlabelmodel = unlabelmodel || {};
    this.path = path;
  }

  get Unlabeler(): PrimitiveUnlabeler {
    if (this.label === undefined) {
      this.label = new PathedPrimitiveUnlabeler(this.path, this.unlabelmodel.label);
    }
    return this.label;
  }

  get ReadUnlabeler(): DescriptorUnlabeler {
    if (this.read === undefined) {
      this.read = new DescriptorUnlabeler(this.unlabelmodel.read, this.path);
    }
    return this.read;
  }

  get WriteLabeler(): DescriptorLabeler {
    if (this.write === undefined) {
      this.write = new DescriptorLabeler(this.unlabelmodel.write, this.path);
    }
    return this.write;
  }

}

// --- -----------------------------------------------------------------------------------------------------
// TODO: handling of struct, isExstensible and other traps

export class ObjectUnlabeler implements IObjectUnlabeler {

  unlabelmodel: ObjectUnlabelModel;
  path: string;

  label?: PrimitiveUnlabeler;
  prototype?: PropertyUnlabeler;
  properties: { [key: string]: PropertyUnlabeler };

  constructor(unlabelmodel: ObjectUnlabelModel | undefined, path: string) {
    if (unlabelmodel === undefined) {
      monitor.log('undefined object unlabel model for', path);
    }

    this.unlabelmodel = unlabelmodel || { kind: 'ObjectUnlabelModel' };
    this.path = path;

    this.properties = {};
  }

  get Unlabeler(): PrimitiveUnlabeler {
    if (this.label === undefined) {
      this.label = new PathedPrimitiveUnlabeler(this.path, this.unlabelmodel.label);
    }

    return this.label;
  }

  get PrototypeUnlabeler(): PropertyUnlabeler {
    if (this.prototype === undefined) {
      this.prototype = new PropertyUnlabeler(this.unlabelmodel.prototype, this.path + '.prototype');
    }

    return this.prototype;
  }

  GetPropertyUnlabeler(propertyname: string | number): PropertyUnlabeler {
    if (!has_own_property(this.properties, propertyname)) {
      let propertyUnlabelModel = this.unlabelmodel.properties && this.unlabelmodel.properties[propertyname];
      this.properties[propertyname] = new PropertyUnlabeler(
        propertyUnlabelModel,
        this.path + '.' + propertyname
      )
    }

    return this.properties[propertyname];
  }

}


// --- -----------------------------------------------------------------------------------------------------

export class FunctionUnlabeler extends ObjectUnlabeler implements IFunctionUnlabeler {

  // @ts-ignore initialized by super call
  unlabelmodel: FunctionUnlabelModel;

  self?: ValueLabeler;
  args?: ArgumentsLabeler;
  ret?: ValueUnlabeler;

  constructor(unlabelmodel: FunctionUnlabelModel | undefined, path: string) {
    if (unlabelmodel === undefined) {
      monitor.log('undefined export function unlabel model for', path);
    }
    // @ts-ignore initialized by super call
    super(unlabelmodel, path);
  }

  get ArgumentsLabeler(): ArgumentsLabeler {
    if (this.args === undefined) {
      this.args = new ArgumentsLabeler(this.unlabelmodel.args, this.path);
    }
    return this.args;
  }

  get SelfLabeler(): ValueLabeler {
    if (this.self === undefined) {
      if (full_access_path) monitor.log(this.path + '[Call]');

      this.self = new ValueLabeler(this.unlabelmodel.self, this.path);
    }
    return this.self;
  }

  get ReturnUnlabeler(): ValueUnlabeler {
    if (this.ret == undefined) {
      if (full_access_path) monitor.log(this.path + '[ReturnValue]');

      this.ret = new ValueUnlabeler(this.unlabelmodel.ret, this.path, true);
    }
    return this.ret;
  }

  /*
  // TODO
  get IsEventListener() {
    return this.unlabelmodel.type === 'eventlistener';
  }
  */

}

// ---
// TODO: This array label model does not take into account that arrays are objects.
//    Should inherit ObjectUnlabelModel in the same whay FunctionUnlabelModel does?
// TODO: unlabeling of the struct label
// ---

export class ArrayUnlabeler extends ObjectUnlabeler {
  // @ts-ignore initialized by super call
  unlabelmodel: ArrayUnlabelModel;

  element?: PropertyUnlabeler;

  constructor(unlabelmodel: ArrayUnlabelModel | undefined, path: string) {
    if (unlabelmodel === undefined) {
      monitor.log('undefined array unlabel model for', path);
    }
    // @ts-ignore initialized by super call
    super(unlabelmodel, path);
  }

  GetPropertyUnlabeler(propertyname: string | number): PropertyUnlabeler {
    if (this.element === undefined) {
      this.element = new PropertyUnlabeler(this.unlabelmodel.element, this.path + '.' + propertyname);
    }
    return this.element;
  }
}

// --- -----------------------------------------------------------------------------------------------------

// TODO: Object | Function | (TODO) Array ...

export class UnknownUnlabeler implements IPropertyUnlabeler, IObjectUnlabeler, IFunctionUnlabeler {

  path: string;

  constructor(path: string) {
    this.path = path;
    this.properties = {};
  }

  // object

  properties: { [key: string]: PropertyUnlabeler };
  prototype?: PropertyUnlabeler;

  get PrototypeUnlabeler() {
    if (this.prototype === undefined) {
      this.prototype = new PropertyUnlabeler(undefined, this.path + '.prototype');
    }
    return this.prototype;
  }

  GetPropertyUnlabeler(propertyname: string | number) {
    // sidestep taken names
    propertyname = '_' + propertyname;
    if (!has_own_property(this.properties, propertyname)) {
      this.properties[propertyname] = new PropertyUnlabeler(undefined, this.path + '.' + propertyname);
    }

    return this.properties[propertyname];
  }

  // export function

  args?: ArgumentsLabeler;
  self?: ValueLabeler;
  ret?: ValueUnlabeler;

  get ArgumentsLabeler() {
    if (this.args === undefined) {
      if (full_access_path) monitor.log(this.path + '[args]');

      this.args = new ArgumentsLabeler(undefined, this.path);
    }
    return this.args;
  }

  get SelfLabeler() {
    if (this.self === undefined) {
      if (full_access_path) monitor.log(this.path + '[self]');

      this.self = new ValueLabeler(undefined, this.path);
    }
    return this.self;
  }

  get ReturnUnlabeler() {
    if (this.ret === undefined) {
      if (full_access_path) monitor.log(this.path + '[ret]');

      this.ret = new ValueUnlabeler(undefined, this.path, true);
    }
    return this.ret;
  }

  // property

  value?: PrimitiveUnlabeler;

  get Unlabeler(): PrimitiveUnlabeler {
    if (this.value === undefined) {
      this.value = new PathedPrimitiveUnlabeler(this.path, undefined);
    }
    return this.value;
  }

  read?: DescriptorUnlabeler;
  write?: DescriptorLabeler;

  get ReadUnlabeler(): DescriptorUnlabeler {
    if (this.read === undefined) {
      this.read = new DescriptorUnlabeler(undefined, this.path);
    }
    return this.read;
  }

  get WriteLabeler(): DescriptorLabeler {
    if (this.write === undefined) {
      this.write = new DescriptorLabeler(undefined, this.path);
    }
    return this.write;
  }

}
