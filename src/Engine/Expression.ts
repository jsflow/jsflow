import { WorkList, ValueStack } from "../Context";
import { Value } from "../Value";
import { ValueTypes } from "../Interfaces";
import { Reference, ReferenceType } from "../Reference";
import { ArrayObject } from "../Objects/ArrayObject";
import { bot, lub, le, Label } from "../Label";
import { GetValue } from "../GetValue";
import { ObjectObject } from "../Objects/ObjectObject";
import { JSFPropertyDescriptor, IsDataDescriptor, IsAccessorDescriptor } from "../PropertyDescriptor";
import { FunctionObject } from "../Objects/FunctionObject";
import { NewDeclarativeEnvironment } from "../DeclarativeEnvironmentRecord";
import { unarytbl, prefixtbl, postfixtbl } from "./UnaryOperators";
import { binarytbl, logicaltbl, assignmenttbl } from "./BinaryOperators";
import { PutValue } from "../PutValue";
import { ToBoolean } from "../Conversion/ToBoolean";
import { IsCallable } from "../Utility/IsCallable";
import { CheckObjectCoercible } from "../Utility/CheckObjectCoercible";
import { ToString } from "../Conversion/ToString";
import { GetIdentifierReference } from "../GetIdentifierReference";
import { RegExpObject } from "../Objects/RegExpObject";
import { MonitorBase } from "../MonitorBase";

import * as pp from '../PP';
import * as estree from 'estree';
import * as constants from '../Constants';
import { Canary, PushCanary, AssertValidCanary } from "./Debug";

declare var monitor: MonitorBase;
declare var JSFLOW_STACK_CHECK: boolean;

// -------------------------------------------------------------

function _GetValue(): void {
  let vs = monitor.context.valueStack;
  // @ts-ignore
  let val: Value<ValueTypes> = vs.pop();

  vs.push(GetValue(val));
}

// expression handler functions 

export var expressiontbl = {
  'ThisExpression': thisExpression,
  'ArrayExpression': arrayExpression,
  'ObjectExpression': objectExpression,
  'FunctionExpression': functionExpression,
  'SequenceExpression': sequenceExpression,
  'UnaryExpression': unaryExpression,
  'BinaryExpression': binaryExpression,
  'UpdateExpression': updateExpression,
  'LogicalExpression': logicalExpression,
  'AssignmentExpression': assignmentExpression,
  'ConditionalExpression': conditionalExpression,
  'NewExpression': newExpression,
  'CallExpression': callExpression,
  'MemberExpression': memberExpression,
  'Identifier': identifierExpression,
  'Literal': literalExpression
};


function CheckCanary(
  this: void,
  wl: WorkList,
  vs: ValueStack,
  canary: Canary
) {
  let result = vs.pop();
  AssertValidCanary(vs, canary);
  vs.push(result);
}

// This, 11.1.1 -------------------------------------------- 

function thisExpression(
  this: void,
  node: estree.ThisExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let c = monitor.context;
  vs.push(c.thisValue.clone());
}

// Array Initializer, 11.1.4 -------------------------------

function arrayExpression(
  this: void,
  node: estree.ArrayExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `arrayExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();

  let arr = new Value(new ArrayObject(), bot);
  let es = node.elements;
  let len = es.length;

  arr.Put(constants.length, new Value(len, bot));
  vs.push(arr);

  for (let i = 0; i < len; i++) {
    if (es[i]) {
      ip.then(es[i]);
      ip.then((wl: WorkList, vs: ValueStack) => arrayExpressionUpdate(arr, i, wl, vs));
    }
  }

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// ---

function arrayExpressionUpdate(
  this: void,
  array: Value<ArrayObject>,
  index: number,
  wl: WorkList,
  vs: ValueStack
): void {
  //@ts-ignore STACK
  let initValue = GetValue(vs.pop());
  array.Put(new Value(index, bot), initValue);
}

// Object Initializer, 11.1.5 ------------------------------

function objectExpression(
  this: void,
  node: estree.ObjectExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `objectExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();

  let obj = new Value(new ObjectObject(), bot);
  vs.push(obj);

  let ps = node.properties;

  for (let i = 0, len = ps.length; i < len; i++) {
    ip.then(ps[i].value);
    ip.then((wl: WorkList, vs: ValueStack) => objectExpressionUpdate(ps, obj, i, wl, vs));
  }

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// ---

function objectExpressionUpdate(
  this: void,
  properties: estree.Property[],
  object: Value<ObjectObject>,
  index: number,
  wl: WorkList,
  vs: ValueStack
): void {

  let prop = properties[index];
  let propName: Value<string | number>;

  switch (prop.key.type) {
    case 'Identifier':
      propName = new Value(prop.key.name, bot);
      break;

    case 'Literal':
      // can only be string or number; conversion will occur once assigned to the object
      // TODO: fix
      //@ts-ignore SYNTAX
      propName = new Value(prop.key.value, bot);
      break;
  }

  //@ts-ignore STACK
  let propValue = GetValue(vs.pop());
  let propDesc: JSFPropertyDescriptor = { enumerable: true, configurable: true, label: bot };

  switch (prop.kind) {

    case 'init':
      propDesc.value = propValue.value;
      propDesc.label = propValue.label;
      propDesc.writable = true;
      break;

    case 'get':
      // TODO: fix 
      //@ts-ignore DESC HELL
      propDesc.get = propValue.value;
      propDesc.label = propValue.label;
      break;

    case 'set':
      // TODO: fix 
      //@ts-ignore DESC HELL
      propDesc.set = propValue.value;
      propDesc.label = propValue.label;
      break;

  }

  let previous = object.GetOwnProperty(propName);

  monitor.context.pushPC(previous.label);
  if (previous.value !== undefined) {
    if ((IsDataDescriptor(previous) && IsAccessorDescriptor(propDesc)) ||
      (IsAccessorDescriptor(previous) && IsDataDescriptor(propDesc)) ||
      (IsAccessorDescriptor(previous) && IsAccessorDescriptor(propDesc) &&
        //@ts-ignore DESC HELL
        ((previous.get && propDesc.get) || (previous.set && propDesc.set))
      )
    ) {
      monitor.Throw(
        "SyntaxError",
        'Object initializer: illegal redefine of property',
        bot
      );
    }
  }
  monitor.context.popPC();
  let obj = object;
  //@ts-ignore TYPES
  obj.DefineOwnProperty(propName, propDesc);
}

// Function Definition, 13 ----------------------------------------------

function functionExpression(
  this: void,
  node: estree.FunctionExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let fun: FunctionObject;

  if (node.id) {
    let funcEnv = NewDeclarativeEnvironment(monitor.context.lexicalEnv);
    let identifier = new Value(node.id.name, bot);
    funcEnv.CreateImmutableBinding(identifier);

    fun = new FunctionObject(node.params, node.body, new Value(funcEnv, bot));
    fun.Name = node.id.name;
    fun.Source = node;

    funcEnv.InitializeImmutableBinding(identifier, new Value(fun, bot));
  } else {
    fun = new FunctionObject(node.params, node.body, monitor.context.lexicalEnv);
    fun.Source = node;
  }

  vs.push(new Value(fun, bot));
}

// Comma Operator, 11.14 ------------------------------------------------

function sequenceExpression(
  this: void,
  node: estree.SequenceExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `sequenceExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();
  let es = node.expressions;
  let len = es.length;

  let i = 0;
  for (; i < len - 1; i++) {
    ip.then(es[i]);
  }

  if (i < len) {
    ip.then(es[i]);
    ip.then((wl: WorkList, vs: ValueStack) => sequenceExpressionEnd(len, wl, vs));
  }

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// ---

function sequenceExpressionEnd(
  this: void,
  length: number,
  wl: WorkList,
  vs: ValueStack
): void {
  let result = vs.pop();

  // Pop all but last and execute GetValue on result for eventual side effects.
  for (let i = 0; i < length - 1; i++) {
    //@ts-ignore STACK
    GetValue(vs.pop());
  }

  vs.push(result);
}

// Unary Operators, 11.4 ------------------------------------------------

function unaryExpression(
  this: void,
  node: estree.UnaryExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `unaryExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();
  ip.then(node.argument);
  ip.then(unarytbl[node.operator]);

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// Binary Operators, 11.5-11.9 -----------------------------------

function binaryExpression(
  this: void,
  node: estree.BinaryExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `binaryExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();
  ip.then(node.left);
  ip.then(_GetValue);
  ip.then(node.right);
  ip.then(_GetValue);
  ip.then(binarytbl[node.operator]);

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// Prefix, and Postfix Expressions, 11.3, 11.4.4, 11.4.5 -----------------

function updateExpression(
  this: void,
  node: estree.UpdateExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `updateExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();
  ip.then(node.argument);
  if (node.prefix) {
    ip.then(prefixtbl[node.operator]);
  } else {
    ip.then(postfixtbl[node.operator]);
  }

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// Binary Operators, 11.5-11.9 -----------------------------------

function logicalExpression(
  this: void,
  node: estree.LogicalExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `logicalExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();
  ip.then(node.left);
  ip.then(logicaltbl[node.operator]);
  ip.then(node.right);

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// Assignment, 11.13 -----------------------------------------------------

function assignmentExpression(
  this: void,
  node: estree.AssignmentExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `assignmentExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();
  ip.then(node.left);
  ip.then(node.right);
  ip.then(assignmenttbl[node.operator]);
  ip.then(assignmentExpressionEnd);

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// ---

function assignmentExpressionEnd(
  this: void,
  wl: WorkList,
  vs: ValueStack
): void {
  //@ts-ignore
  let rval: Value<ValueTypes> = vs.pop();
  //@ts-ignore
  let lref: Reference = vs.pop();
  PutValue(lref, rval);

  vs.push(rval);
}

// Conditional Operator, 11.12 ------------------------------------------

function conditionalExpression(
  this: void,
  node: estree.ConditionalExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `conditionalExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();
  ip.then(node.test);
  ip.then((wl: WorkList, vs: ValueStack) => conditionalExpressionChoose(node, wl, vs));

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// ---

function conditionalExpressionChoose(
  this: void,
  node: estree.ConditionalExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let ip = wl.top();
  //@ts-ignore STACK
  let lval = GetValue(vs.pop());
  let lb = ToBoolean(lval);

  monitor.context.pushPC(lb.label);

  if (lb.value) {
    ip.then(node.consequent);
  }
  else {
    ip.then(node.alternate);
  }

  ip.then((wl: WorkList, vs: ValueStack) => conditionalExpressionEnd(lval, wl, vs));
}

// ---

function conditionalExpressionEnd(
  this: void,
  test: Value<ValueTypes>,
  wl: WorkList,
  vs: ValueStack
): void {
  //@ts-ignore STACK
  let val = GetValue(vs.pop());

  monitor.context.popPC();
  vs.push(new Value(val.value, lub(val.label, test.label)));
}

// The new Operator, 11.2.2 ---------------------------------------------

function newExpression(
  this: void,
  node: estree.NewExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `newExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();
  ip.then(node.callee);

  let as = node.arguments;
  let len = as.length;

  for (let i = 0; i < len; i++) {
    ip.then(as[i]);
  }

  ip.then((wl: WorkList, vs: ValueStack) => newExpressionExecute(len, wl, vs, pp.pretty(node)));

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// ---

function newExpressionExecute(
  this: void,
  length: number,
  wl: WorkList,
  vs: ValueStack,
  data : string
): void {
  let c = monitor.context;
  let ip = wl.top();

  let argList: Value<ValueTypes>[] = [];
  for (let i = length - 1; i >= 0; i--) {
    //@ts-ignore STACK
    argList[i] = GetValue(vs.pop());
  }

  //@ts-ignore STACK
  let constructor = GetValue(vs.pop());

  if (constructor.value === null || typeof constructor.value !== 'object') {
    if (false) { // SILENT ERROR
      let v = new Value(undefined, constructor.label);
      return;
    }
    monitor.Throw(
      "TypeError",
      "invalid 'new' parameter: not a constructor",
      constructor.label
    );

    throw 'TypeScript';
  }

  if (!('Construct' in constructor.value)) {
    if (false) { // SILENT ERROR
      let v = new Value(undefined, constructor.label);
      return;
    }
    monitor.Throw(
      "TypeError",
      "invalid 'new' parameter: not a constructor",
      constructor.label
    );

    throw 'TypeScript';
  }

  if (constructor.value.AsyncConstruct) {
    c.pushPC(constructor.label);

    ip = constructor.value.AsyncConstruct(argList);

    ip.then((wl: WorkList, vs: ValueStack) => callExpressionEnd(constructor.label, wl, vs, data));

  } else {
    try {
      let retval = constructor.Construct(argList);
      retval.raise(constructor.label);
      vs.push(retval);
    } catch (e) {

      if (!(e instanceof Value)) {
        throw e;
      }

      let result = c.result;

      // Verfiy that the exception is allowed 
      monitor.assert(le(c.effectivePC, c.labels.exc),
        "exception in " + c.effectivePC + " not allowed with exception label " + c.labels.exc);

      // For observable flows
      c.labels.exc = lub(c.labels.exc, c.effectivePC);

      result.type = 'throw';
      result.value = e;
    }
  }
}

// Function Calls, 11.2.3 -----------------------------------------------

function callExpression(
  this: void,
  node: estree.CallExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `callExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();

  let as = node.arguments;
  let len = as.length;

  ip.then(node.callee);

  for (let i = 0; i < len; i++) {
    ip.then(as[i]);
  }

  ip.then((wl: WorkList, vs: ValueStack) => callExpressionExecute(len, node, wl, vs, pp.pretty(node)));

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// callExpressionExecute

function callExpressionExecute(
  this: void,
  length: number,
  node: estree.CallExpression,
  wl: WorkList,
  vs: ValueStack,
  data : string
): void {
  let c = monitor.context;
  let ip = wl.top();

  let argList: Value<ValueTypes>[] = [];
  for (let i = length - 1; i >= 0; i--) {
    let arg = vs.pop();
    //@ts-ignore STACK
    argList[i] = GetValue(arg);
  }

  let ref = vs.pop();
  //@ts-ignore STACK
  let func = GetValue(ref);

  if (!IsCallable(func)) {
    if (false) { // SILENT ERRORS
      let v = new Value(undefined, func.label);
      return;
    }
    monitor.Throw(
      "TypeError",
      'Invalid call target; ' + pp.pretty(node.callee) + ' evaluates to ' + func.value + ' in ' + pp.pretty(node),
      func.label
    );

    throw 'TypeScript';
  }

  // used to decide if eval is a direct call in function.enterEvalCode
  //@ts-ignore TYPES
  c.currentCall = { reference: ref, target: func.value, source: node };

  // for eval
  //@ts-ignore TYPES
  c.call = { ref: ref, func: func };

  let thisValue: Value<ReferenceType>;
  if (ref instanceof Reference) {
    if (ref.IsPropertyReference()) {
      thisValue = ref.base;
    } else {
      //@ts-ignore TYPES
      thisValue = ref.base.ImplicitThisValue();
    }
  } else {
    //@ts-ignore TYPES
    thisValue = new Value(undefined, ref.label);
  }

  if (func.value.AsyncCall) {

    monitor.context.pushPC(func.label);

    func.value.AsyncCall(thisValue, argList);
    ip.then((wl: WorkList, vs: ValueStack) => callExpressionEnd(func.label, wl, vs, data));

  } else {

    try {
      let retval = func.Call(thisValue, argList);
      retval.raise(func.label);
      vs.push(retval);

    } catch (e) {

      if (!(e instanceof Value)) {
        throw e;
      }

      let result = c.result;

      // Verfiy that the exception is allowed 
      monitor.assert(le(c.effectivePC, c.labels.exc),
        "exception in " + c.effectivePC + " not allowed with exception label " + c.labels.exc);

      // For observable flows
      c.labels.exc = lub(c.labels.exc, c.effectivePC);

      result.type = 'throw';
      result.value = e;
    }
  }
}

// callExpressionEnd 

function callExpressionEnd(
  this: void,
  label: Label,
  wl: WorkList,
  vs: ValueStack,
  data : string
): void {
  // @ts-ignore
  let callResult: Result = vs.pop();
  let c = monitor.context;
  let result = c.result;

  if (callResult === undefined || callResult.value === undefined) {
    monitor.error(data);
    monitor.error(callResult);
  }

  callResult.value.raise(label);

  if (callResult.type === 'throw') {
    result.type = 'throw';
    result.value = callResult.value;
    return;
  }

  c.popPC();
  vs.push(callResult.value);
}

// Property Accessors, 11.2.1 -------------------------------------------

function memberExpression(
  this : void,
  node: estree.MemberExpression,
  wl: WorkList,
  vs: ValueStack
): void {
  let canary: Canary;
  if (JSFLOW_STACK_CHECK) {
    canary = PushCanary(vs, `memberExpression : ${pp.pretty(node)}`);
  }

  let ip = wl.top();

  ip.then(node.object);
  ip.then(_GetValue);

  if (node.computed) {
    ip.then(node.property);
    ip.then(_GetValue);
  }

  ip.then((wl: WorkList, vs: ValueStack) => memberExpressionExecute(node, wl, vs));

  if (JSFLOW_STACK_CHECK) {
    ip.then((wl: WorkList, vs: ValueStack) => CheckCanary(wl, vs, canary));
  }
}

// ---

function memberExpressionExecute(
  this: void,
  node : estree.MemberExpression,
  wl: WorkList,
  vs: ValueStack
): void {

  let propertyNameValue;

  if (node.computed) {
    propertyNameValue = vs.pop();
  } else {
    //@ts-ignore TYPES
    propertyNameValue = new Value(node.property.name, bot);
  }

  // @ts-ignore
  let baseValue: Value<ValueTypes> = vs.pop();

  /*
  if (baseValue.value === undefined || baseValue.value === null) {
    monitor.warn(pp.pretty(node.object) + ' evaluates to ' + String(baseValue.value) + ' in ' + pp.pretty(node), node);
  }
  */
  

  CheckObjectCoercible(baseValue);
  //@ts-ignore TYPES
  vs.push(new Reference(baseValue, ToString(propertyNameValue)));
}

// Identifier, 11.1.2 -> 10.3.1 -----------------------------------------

function identifierExpression(
  node: estree.Identifier,
  wl: WorkList,
  vs: ValueStack
): void {
  vs.push(GetIdentifierReference(monitor.context.lexicalEnv, node.name));
}

// Literals, 11.1.3 -> 7.8 ----------------------------------------------

function literalExpression(
  node: estree.Literal,
  wl: WorkList,
  vs: ValueStack
): void {
  // @ts-ignore
  let res: Value<ValueTypes> = new Value(node.value, bot);

  if (node.value instanceof RegExp) {
    res.value = new RegExpObject(node.value, bot);
  }

  vs.push(res);
}