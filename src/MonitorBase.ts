/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Label, le, bot } from './Label';
import { Value } from "./Value";
import { Context } from './Context';
import { Options } from './Options';
import { Stack } from './Stack';

import { Instances } from './Instances';
import { ErrorObject } from './Objects/ErrorObject';
import { EvalErrorObject } from './Objects/EvalErrorObject';
import { RangeErrorObject } from './Objects/RangeErrorObject';
import { ReferenceErrorObject } from './Objects/ReferenceErrorObject';
import { SyntaxErrorObject } from './Objects/SyntaxErrorObject';
import { TypeErrorObject } from './Objects/TypeErrorObject';
import { URIErrorObject } from './Objects/URIErrorObject';
import { GlobalObject } from './Objects/GlobalObject';
import { ThrowType, ValueTypes } from './Interfaces';
import { LexicalEnvironment } from './LexicalEnvironment';

import * as estree from 'estree';
import { StackTrace } from './StackTrace';
import { running, executeGlobalCode, resume } from './Engine/Execute';
import { FatalError, SecurityError, isJSFlowError } from './Error';

import * as beautify from "js-beautify";

declare var monitor: MonitorBase;

// --------------------------------------------------------------------------

export class ExecutionInfo {

  steps : number;
  time : number;
  delta = 100000;

  constructor () {
    this.steps = 0;
    this.time = Date.now();
  }

  step() {
    this.steps++;
    if (this.steps % this.delta === 0) {
      this.report();
    }
  }

  report() : void {
    if (!monitor.options.get('monitor.progress')) {
      return;
    }

    let currentTime = Date.now();
    let elapsed = (currentTime - this.time)/1000;
    monitor.info(`Executed a total of ${this.steps} steps in ${elapsed} seconds at an average rate of ${Math.floor(this.steps/elapsed)} steps/second`);
  }
  
}

//

export abstract class MonitorBase {

  options: Options;
  debug: { active: boolean }
  contextStack: Stack<Context> = new Stack();
  executionInfo : ExecutionInfo;

  code?: string; // set by executeGlobalCode
  ast?: estree.Program; // set by executeGlobalCode
  offendingTrace? : StackTrace; // set byt throwStatementEnd

  abstract instances: Instances;
  abstract GlobalObject: GlobalObject;
  abstract GlobalEnvironment: LexicalEnvironment;

  print: (...rest: any[]) => void;
  log: (...rest: any[]) => void;
  info: (...rest: any[]) => void;
  warn: (...rest: any[]) => void;
  error: (...rest: any[]) => void;

  // ---
  // constructor

  constructor(
    global: any,
    print: (...rest: any[]) => void,
    log: (...rest: any[]) => void,
    info: (...rest: any[]) => void,
    warn: (...rest: any[]) => void,
    error: (...rest: any[]) => void
  ) {
    global.monitor = this;
    global.JSFLOW_STACK_CHECK = true;

    this.print = print ? print : console.log;
    this.log = log ? log : console.log;
    this.warn = warn ? warn : console.warn;
    this.info = info ? info : console.info;
    this.error = error ? error : console.error;

    this.options = new Options();

    /*
    * taintMode disables the context computation by overriding exc, ret, pc, and effectivePC 
    * forcing them to return bot
    */
    this.options.declare('monitor.taintMode', 'boolean', false, 'taint mode');
    /*
    * testMode supresses label printing in output and security errors
    * to make jsflow compatible with the test harness set by the spiderflow and nodeflow commands
    */
    this.options.declare('monitor.testMode', 'boolean', false, 'test mode');
    /* observableMode supresses stop-on-security-error allowing execution to continue with
    * a printed warning message.
    */
    this.options.declare('monitor.observableMode', 'boolean', false, 'observable mode');
    /* progress causes jsflow to regularly report its execution progress.
    */
    this.options.declare('monitor.progress', 'boolean', false, 'progress mode');
    /* crawler turns on crawler specific gathering code that documents different aspects of the execution.
    */
    this.options.declare('monitor.crawler', 'boolean', false, 'crawler');


    this.debug = { active: false };

    //@ts-ignore
    let context = new Context(null, null, null);
    this.contextStack.push(context);

    this.executionInfo = new ExecutionInfo();
  }

  // ---

  get context(): Context {
    return this.contextStack.peek();
  }

  // ---

  running() {
    return running();
  };

  // ---

  // ---
  // throws:
  //  Value<ValueType> or
  //  JSFlowError, when security error or fatal error

  Execute(code: string, origin: string) : Value<ValueTypes> {
    var result = executeGlobalCode(code, origin);

    if (result.type === 'throw') {
      throw result.value;
    }

    return result.value;
  }

  // ---
  // throws:
  //  Value<ValueType> or
  //  JSFlowError, when security error or fatal error

  abstract ExecuteModule(path : string) : void;

  // ---
  // code transformation support

  transform(code : string) : string {
    return code;
  }

  // ---

  beautify(code : string) : string {
    return beautify.js(code);
  }
  
  // ---


  // ---

  resume() {
    this.debug.active = false;
    return resume();
  }

  // ---

  step() {
    return resume();
  }

  // ---

  printWorkList() {
    this.log('context owner: ' + this.context.owner);
    this.log(String(this.context.workList));
  }

  // ---

  // TODO: fix proper printing
  fatal(msg : string, ...args): never {
    var exc = new FatalError(msg + args.map(x => JSON.stringify(x)).join(' '));
    throw exc;
  }

  // ---

  stop(msg) {
    var exc = new Error(msg);
    //@ts-ignore TYPES
    exc.type = 'Stop';
    throw exc;
  }

  // ---

  Throw(error: ThrowType, msg: string, lbl: Label): never {

    this.assert(
      le(this.context.effectivePC, this.context.labels.exc),
      'throw: effective pc ' + this.context.effectivePC +
      ' not below exception label ' + this.context.labels.exc
    );

    let msgValue = new Value(msg, lbl);
    this.offendingTrace = this.stackTrace();

    switch (error) {
      case "Error": throw new Value(new ErrorObject(msgValue), bot);
      case "EvalError": throw new Value(new EvalErrorObject(msgValue), bot);
      case "RangeError": throw new Value(new RangeErrorObject(msgValue), bot);
      case "ReferenceError": throw new Value(new ReferenceErrorObject(msgValue), bot);
      case "SyntaxError": throw new Value(new SyntaxErrorObject(msgValue), bot);
      case "TypeError": throw new Value(new TypeErrorObject(msgValue), bot);
      case "URIError": throw new Value(new URIErrorObject(msgValue), bot);
    }

    this.fatal("Throw: Don't know how to deal with " + error);
  }

  // ---

  stackTrace() {
    return new StackTrace(this.contextStack.toArray());
  }

  // ---

  securityError(message: string): void {
    if (this.options.get('monitor.testMode')) {
      return;
    }
    if (this.options.get('monitor.taintMode') || this.options.get('monitor.observableMode')) {
      this.warn("[JSFlow NORMAL] Security violation:", message);

    } else {
      var exc = new SecurityError(message);
      throw exc;
    }
  }

  // ---

  assert(b : boolean, msg : string) {
    if (!b) this.securityError(msg);
  }

  // lifts exceptions that 
  // 1. are not JSFlow internal exceptions 
  // 2. have a a JSFlow modeled counterpart
  // otherwise returns

  tryRethrow(e , Throw? : boolean) {

    if ((typeof e !== 'object' && typeof e !== 'function') || e === null) {
      return false;
    }

    if (isJSFlowError(e)) {
      throw e;
    }

    if (e instanceof Value) {
      throw e;
    }

    let isNative = e.name == "Error" ||
      e.name === "EvalError" ||
      e.name === "RangeError" ||
      e.name === "ReferenceError" ||
      e.name === "SyntaxError" ||
      e.name === "TypeError" ||
      e.name === "URIError";

    if (Throw && isNative) {
      this.Throw(e.name, e.stack, bot);
    }

  }
}

