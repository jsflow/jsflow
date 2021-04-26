import { lub, bot } from '../Label';
import { Value } from "../Value";
import { DefineFFF, DefineTFT, DefineTFF, DefineFFT } from '../Define';
import { EcmaObject } from '../Objects/EcmaObject';

import * as constants from '../Constants';
import { MonitorBase } from '../MonitorBase';

import { ObjectObject } from '../Objects/ObjectObject';
import { HasInstance } from '../HasInstance';

import * as estree from 'estree';
import { LexicalEnvironment } from '../LexicalEnvironment';
import { ValueTypes, IsIEcmaObject } from '../Interfaces';
import { WorkListPtr, AsyncConstructClosureData } from '../Context';
import { pretty } from '../PP';
import { execute } from '../Engine/Execute';
import { ToObject } from '../Conversion/ToObject';
import { NewDeclarativeEnvironment } from '../DeclarativeEnvironmentRecord';
import { DeclarationBindingInstantiation } from '../Engine/Binding';

// ------------------------------------------------------------

declare var monitor: MonitorBase;


// ------------------------------------------------------------
// 10.4.3
function enterFunctionCode(F: FunctionObject, thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]) {
  let c = monitor.context;

  let thisBinding: Value<EcmaObject>;

  if (thisArg.value === null || thisArg.value === undefined) {
    thisBinding = new Value(monitor.GlobalObject, thisArg.label);
  } else if (typeof thisArg.value !== 'object' && typeof thisArg.value !== 'function') {
    thisBinding = ToObject(thisArg);
  } else {
    //@ts-ignore TypeScript doesn't narrow generic types
    thisBinding = thisArg;
  }

  var localEnv = new Value(NewDeclarativeEnvironment(F.Scope),
    c.effectivePC);

  var newContext = c.clone(thisBinding, localEnv, localEnv);
  newContext.labels.ret = lub(newContext.labels.ret, newContext.labels.pc);
  newContext.owner = F.Name;
  DeclarationBindingInstantiation(newContext, F, args);

  return newContext;
}

// ------------------------------------------------------------
// Function objects, 13.2

export class FunctionObject extends EcmaObject {

  Source?: estree.Function;
  Name?: string;

  Scope: Value<LexicalEnvironment>;
  FormalParameters: estree.Pattern[];
  Code: estree.BlockStatement | estree.Expression;

  constructor(parms: estree.Pattern[], code: estree.BlockStatement | estree.Expression, scope: Value<LexicalEnvironment>) {
    super();

    this.Class = 'Function';
    this.Prototype = new Value(monitor.instances.FunctionPrototype, bot);

    this.Scope = scope;
    this.FormalParameters = parms ? parms : [];
    this.Code = code;

    this.Extensible = true;

    DefineFFT(this, constants.length, this.FormalParameters.length);
    // NOTE: will be updated when called and since we piggyback properties on native properties
    // defining as FFF will cause future updates to fail. Thus we define it as TFT even though
    // this violates the standard.
    DefineFFF(this, constants.arguments, null);
    DefineFFF(this, constants.caller, null);


    let proto = new ObjectObject();
    DefineTFT(proto, constants.constructor, this);

    DefineTFF(this, constants.prototype, proto);
  }

  // ---

  AsyncCall(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): void {
    // step 1, as in 10.4.3 embodied in enterFunctionCode
    let funcCtx = enterFunctionCode(this, thisArg, args);

    // for stack trace
    funcCtx.owner = this.Name;

    monitor.contextStack.push(funcCtx);
    let ip = funcCtx.workList.top();

    if (this.Code) {
      ip.then(this.Code);
      ip.then(AsyncCallEnd);
    } else {
      ip.then(AsyncCallEnd);
    }

  }

  // ---

  // 13.2.1 
  Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes> {

    // step 1, as in 10.4.3 embodied in enterFunctionCode
    let funcCtx = enterFunctionCode(this, thisArg, args);

    // for stack trace
    funcCtx.owner = this.Name;

    let res;
    monitor.contextStack.push(funcCtx);


    if (this.Code) {
      res = execute(this.Code, false);
    }


    if (funcCtx.result.value) {
      funcCtx.result.value.raise(funcCtx.labels.ret);
    }

    monitor.contextStack.pop();

    // copy out the inner exception level
    monitor.context.labels.exc = lub(monitor.context.labels.exc, funcCtx.labels.exc);

    if (res !== undefined) {
      switch (res.type) {
        case 'throw':
          throw res.value;

        case 'return':
          // TODO: should be fixed by making Result a tagged union
          if (res.value === null) {
            monitor.fatal('Call: malformed result');
            throw 'TypeScript';
          }
          return res.value;
      }
    }

    return new Value(undefined, funcCtx.labels.ret);
  }

  // ---

  AsyncConstruct(args: Value<ValueTypes>[]): WorkListPtr {
    let obj = new EcmaObject();
    obj.Class = 'Object';
    obj.Extensible = true;

    let proto = this.Get(constants.prototype);
    if (!IsIEcmaObject(proto)) {
      proto = new Value(monitor.instances.ObjectPrototype, bot);
    }

    // @ts-ignore, we know proto is Value<EcmaObject>
    obj.Prototype = proto;

    let ip = monitor.context.workList.top();

    this.AsyncCall(new Value(obj, bot), args);
    // TODO: it seems that the closure data is not used
    ip.then(AsyncConstructEnd, { object: obj });

    return ip;
  }

  // ---


  // ---
  // 13.2.2
  Construct(args: Value<ValueTypes>[]): Value<EcmaObject> {
    let obj = new EcmaObject();
    obj.Class = 'Object';
    obj.Extensible = true;

    let proto = this.Get(constants.prototype);
    if (!IsIEcmaObject(proto)) {
      proto = new Value(monitor.instances.ObjectPrototype, bot);
    }

    // @ts-ignore, we know proto is Value<EcmaObject>
    obj.Prototype = proto;

    let result = this.Call(new Value(obj, bot), args);

    if (!IsIEcmaObject(result)) {
      result = new Value(obj, bot);
    }

    // @ts-ignore, we know result is Value<EcmaObject>
    return result;
  }

  HasInstance(V: any) {
    return HasInstance.call(this, V);
  }


  toString() {
    return pretty(this.Source);
  }
}

// ---


export function AsyncCallEnd(): void {
  let callContext = monitor.context;
  monitor.contextStack.pop();
  let callerContext = monitor.context;

  let result = callContext.result;
  let retlabel = callContext.labels.ret;

  if (result.type !== 'normal' && result.value) {
    result.value.raise(retlabel);
  } else {
    result.value = new Value(undefined, retlabel);
  }

  // copy out the inner exception level
  callerContext.labels.exc = lub(callerContext.labels.exc, callContext.labels.exc);
  callerContext.valueStack.push(result);
}
AsyncCallEnd.runfor = { 'return': true, 'throw': true };



export function AsyncConstructEnd(
  this: AsyncConstructClosureData
) {
  // @ts-ignore
  let retval: Result = monitor.context.valueStack.peek();
  
  // TODO: what about throw?
  // TODO: this is not a correct way of checking if returned object is an ecmaobject
  
  if (typeof retval.value.value !== 'object') {
    retval.value = new Value(this.object, bot);
  }

}
AsyncConstructEnd.runfor = { 'return': true, 'throw': true };


