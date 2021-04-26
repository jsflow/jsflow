/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Label, lub, bot } from "./Label";
import { Stack, StackMarker } from "./Stack";
import { pretty } from "./PP";
import { Value } from "./Value";
import { EcmaObject } from './Objects/EcmaObject';
import { MonitorBase } from "./MonitorBase";
import { LexicalEnvironment } from "./LexicalEnvironment";
import { Result } from "./Result";
import * as estree from 'estree';
import { ValueTypes, IEcmaFunction, IEcmaObject } from "./Interfaces";
import { Reference } from "./Reference";
import { ArrayObject } from "./Objects/ArrayObject";
import { ObjectObject } from "./Objects/ObjectObject";
import { Task } from "./Engine/Task";
import { Node } from "estree";

// --- -----------------------------------------------------------------------

declare var monitor: MonitorBase;

// --- -----------------------------------------------------------------------

class Bucket<T> {
  element: T;
  next: Bucket<T> | null;
  prev: Bucket<T> | null;

  constructor(element : T, prev : Bucket<T> | null, next : Bucket<T> | null) {
    this.element = element;
    this.next = next || null;
    this.prev = prev || null;
  }
}

// --- -----------------------------------------------------------------------

export interface FunctionGuard {
  throw?: boolean,
  continue?: boolean,
  break?: boolean
}

export interface GuardedFunction extends Function {
  runfor?: FunctionGuard;
}

export type ArrayExpressionClosureData = { array : Value<ArrayObject>, index : number };
export type ObjectExpressionClosureData = { properties: estree.Property[], object: Value<ObjectObject>, index: number };
export type SequenceExpressionClosureData = { length : number };
export type ConditionalExpressionChoiceData = { node : estree.ConditionalExpression };
export type ConditionalExpressionClosureData = { test : Value<ValueTypes> }; 
export type CallExpressionExecuteClosureData = { length : number, node : estree.CallExpression };
export type CallExpressionClosureData = { label : Label };
export type MemberExpressionClosureData = { node : estree.MemberExpression };
export type IfStatementChoiceData = { node : estree.IfStatement };
export type IfStatementClosureData = { label : Label };
export type SwitchStatementClosureData = { node : estree.SwitchStatement, outerEmptyLabelData : { label : Label, pcmarker :StackMarker}, defaultCaseIndex : number | null, nextCase : number };
export type LabeledStatementClosureData = { name : string, outerlabel : Label, pcmarker :StackMarker, vsmarker: StackMarker };
export type WithStatementBodyClosureData = { node : estree.WithStatement };
export type WithStatementClosureData = { lexicalEnv : Value<LexicalEnvironment> };
export type TryStatementCatchClosureData = { handler : estree.CatchClause, pcmarker :StackMarker, vsmarker: StackMarker, exc : Label };
export type TryStatementFinallyClosureData = { body : estree.BlockStatement | null | undefined, pcmarker :StackMarker, vsmarker: StackMarker, lexicalEnv : Value<LexicalEnvironment> };
export type TryStatementClosureData = { result : Result };
export type WhileStatementClosureData = { node : estree.WhileStatement | estree.DoWhileStatement, outerEmptyLabelData : { label : Label, pcmarker : StackMarker }};
export type ForStatementMainClosureData = { node : estree.ForStatement };
export type ForStatementClosureData = { outerEmptyLabelData : { label : Label, pcmarker : StackMarker }};
export type ForInStatementSetupClosureData = { node : estree.ForInStatement, left : estree.Pattern};
export type ForInExecuteClosureData = { node : estree.ForInStatement, left : estree.Pattern, properties:  Value<string>[], outerEmptyLabelData : { label : Label, pcmarker : StackMarker }};
export type VariableDeclarationClosureData = { lhs : Reference };
export type AsyncConstructClosureData = { object: EcmaObject };

type ClosureData = 
    ArrayExpressionClosureData
  | ObjectExpressionClosureData
  | SequenceExpressionClosureData
  | ConditionalExpressionChoiceData 
  | ConditionalExpressionClosureData
  | CallExpressionExecuteClosureData
  | CallExpressionClosureData
  | MemberExpressionClosureData
  | IfStatementChoiceData
  | IfStatementClosureData
  | SwitchStatementClosureData
  | LabeledStatementClosureData
  | WithStatementBodyClosureData
  | WithStatementClosureData
  | TryStatementCatchClosureData 
  | TryStatementFinallyClosureData
  | TryStatementClosureData
  | WhileStatementClosureData
  | ForStatementMainClosureData
  | ForStatementClosureData
  | ForInStatementSetupClosureData
  | ForInExecuteClosureData
  | VariableDeclarationClosureData
  | AsyncConstructClosureData;


export type ValueStack = Stack<Value<ValueTypes> | Reference | Result>;

export interface Closure {
  func: GuardedFunction /*| estree.Statement | estree.Expression*/, data: ClosureData
}

type WorkListSourceType = 
    estree.Program 
  | estree.Statement 
  | estree.Expression 
  | estree.SpreadElement 
  | estree.ObjectPattern
  | estree.ArrayPattern
  | estree.RestElement
  | estree.AssignmentPattern
  | estree.Super
  ;

export type WorkListElementType =
    GuardedFunction 
  | Closure
  | WorkListSourceType
  | Task
  ;

export function isGuardedFunction(el: WorkListElementType): el is GuardedFunction {
  return (<GuardedFunction>el).runfor !== undefined;
}

export function isClosure(el: WorkListElementType): el is Closure {
  return (<Closure>el).func !== undefined;
}

export class WorkList {

  length: number = 0;
  head: Bucket<WorkListElementType> | null = null;
  thenloc: Bucket<WorkListElementType> | null = null;

  constructor() {
  }

  // ---

  toString(): string {
    var pos = this.head;
    var str = 'worklist:';
    var cnt = 1;
    while (pos) {
      var element = pos.element;
      var line;
      if (typeof element === 'function') {
        line = cnt + ': ' + String(element);
      } else if ('func' in element && 'data' in element) {
        line = cnt + ': ' + String(element.func);
      } else {
        //@ts-ignore TYPES
        line = cnt + ': ' + element.type + ' ' + pretty(element);
      }

      let ix = line.indexOf('\n');
      if (ix > 0) {
        line = line.slice(0, ix);
      }

      str = str + '\n' + line;
      pos = pos.next;
      cnt++;
    }
    return str;
  }

  // ---

  push(element: WorkListElementType): void {
    this.head = new Bucket(element, null, this.head);

    if (this.head.next !== null) {
      this.head.next.prev = this.head;
    }

    this.length++;
  }

  // ---

  prepend(elements: WorkListElementType[]) {
    for (var i = elements.length - 1; i >= 0; i--) {
      this.push(elements[i]);
    }
  }

  // ---

  peek(): WorkListElementType {
    if (this.head === null) {
      return monitor.fatal("WorkList.peek() empty work list");
    }
    return this.head.element;
  }

  // ---

  pop(): WorkListElementType {
    if (this.head === null) {
      return monitor.fatal("WorkList.pop() empty work list");
    }
    let element = this.head.element;
    this.head = this.head.next;
    this.length--;
    return element;
  }

  // ---

  empty(): boolean {
    return (this.head === null);
  }

  // ---

  top(): WorkListPtr {
    return new WorkListPtr(this, null);
  }

  // ---

  first(element?: WorkListElementType): void {
    if (element) {
      this.push(element);
      this.thenloc = this.head;
    } else {
      // if no element given, reset thenloc to force next called 'then'
      // to be a 'first'
      this.thenloc = null;
    }
  }

  // ---

  then(element: WorkListElementType): void {
    if (!this.thenloc) {

      this.first(element);

    } else {

      let before = this.thenloc;
      let after = this.thenloc.next;

      let bucket = new Bucket<WorkListElementType>(element, before, after);

      before.next = bucket;
      this.thenloc = before.next;

      if (after) {
        after.prev = before.next;
      }

      this.length++;
    }
  }

}
// -------------------------------------------------------------

export class WorkListPtr {

  worklist: WorkList;
  pos: Bucket<WorkListElementType> | null;

  constructor(worklist: WorkList, pos: Bucket<Function> | null) {
    this.worklist = worklist;
    this.pos = pos;
  }

  then(element: WorkListElementType, data?: ClosureData) : WorkListPtr {

    if (!element) {
      throw Error();
    }

    let thing: WorkListElementType = element;
    if (typeof element === 'function' && data) {
      thing = { func: element, data: data };
    }

    if (this.pos) {
      let before = this.pos;
      let after = this.pos.next;

      let bucket = new Bucket<WorkListElementType>(thing, before, after);

      before.next = bucket;
      this.pos = before.next;

      if (after) {
        after.prev = before.next;
      }

      this.worklist.length++;

    } else {

      this.worklist.push(thing);
      this.pos = this.worklist.head;

    }

    return this;
  }
}

// -------------------------------------------------------------
// The Execution Context


export class Context {

  thisValue: Value<IEcmaObject>;
  variableEnv: Value<LexicalEnvironment>;
  lexicalEnv: Value<LexicalEnvironment>;

  pcStack: Stack<Label>;

  // for stack trace
  owner?: string;

  codeStack : Stack<Node>;

  // why both?
  currentCall? : { 
    reference : Value<ValueTypes> | Reference,
    target : IEcmaFunction,
    source : estree.CallExpression
  }

  // why both?
  call? : {
    ref : Value<ValueTypes> | Reference,
    func : Value<IEcmaFunction>
  }

  labels = new class {

    private excLbl: Label = bot;
    private retLbl: Label = bot;

    labelmap: { [key: string]: { label : Label, pcmarker : StackMarker} } = {};

    outer: Context;

    constructor(outer: Context) {
      this.outer = outer;
    }

    get exc(): Label {
      if (monitor.options.get('monitor.taintMode')) {
        return bot;
      }

      return this.excLbl;
    }

    set exc(l: Label) {
      this.excLbl = l;
    }

    get ret(): Label {
      if (monitor.options.get('monitor.taintMode')) {
        return bot;
      }

      return this.retLbl;
    }

    set ret(l: Label) {
      this.retLbl = l;
    }

    get pc(): Label {
      if (monitor.options.get('monitor.taintMode')) {
        return bot;
      }

      return this.outer.pcStack.peek();
    }

    set pc(l: Label) {
      this.outer.pcStack.pop();
      this.outer.pcStack.push(l);
    }
  }(this);


  workList: WorkList;
  // TODO: make any more precise
  result: Result;
  valueStack: Stack<Value<ValueTypes> | Reference | Result>;


  constructor(thisValue: Value<IEcmaObject>, variableEnv: Value<LexicalEnvironment>, lexicalEnv: Value<LexicalEnvironment>) {

    this.thisValue = thisValue;
    this.variableEnv = variableEnv;
    this.lexicalEnv = lexicalEnv;

    this.pcStack = new Stack();
    this.pcStack.push(bot);

    this.workList = new WorkList();
    this.result = new Result();
    this.valueStack = new Stack();

    this.codeStack = new Stack();
  }

  // ---

  get effectivePC(): Label {
    if (monitor.options.get('monitor.taintMode')) {
      return bot;
    }

    return lub(this.labels.pc, this.labels.exc, this.labels.ret);
  }

  // ---

  clone(thisValue?: Value<IEcmaObject>, variableEnv?: Value<LexicalEnvironment>, lexicalEnv?: Value<LexicalEnvironment>) {

    let tV = thisValue || this.thisValue;
    let lE = lexicalEnv || this.lexicalEnv;
    let vE = variableEnv || this.variableEnv;

    let newCtx = new Context(tV, vE, lE);
    newCtx.labels.pc = this.effectivePC;
    newCtx.labels.exc = this.labels.exc;
    newCtx.labels.ret = this.labels.ret;
    return newCtx;
  }

  // ---

  pushPC(l: Label): void {
    this.pcStack.push(lub(l, this.labels.pc));
  }

  // ---

  raisePC(l: Label): void {
    this.labels.pc = lub(this.labels.pc, l);
  }

  // ---

  popPC(): Label {
    return this.pcStack.pop();
  }

}