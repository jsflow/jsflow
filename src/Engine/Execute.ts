import { Result } from "../Result";
import { Value } from "../Value";
import { bot, le, lub } from "../Label";
import { SyntaxErrorObject } from "../Objects/SyntaxErrorObject";
import { isGuardedFunction, isClosure, WorkList, ValueStack } from "../Context";
import { expressiontbl } from "./Expression";
import { statementtbl } from "./Statement";
import { MonitorBase } from "../MonitorBase";

import * as esprima from 'esprima';
import * as estree from 'estree';
import { HoistFunctions, HoistVariables, DeclarationBindingInstantiation } from "./Binding";
import { DeclarativeEnvironmentRecord } from "../DeclarativeEnvironmentRecord";
import { ObjectEnvironmentRecord } from "../ObjectEnvironmentRecord";
import { Task } from "./Task";
import { Program } from "estree";
import { IsCrawler } from "../Toplevel/crawler/CrawlerUtil";


declare var monitor: MonitorBase;
declare var JSFLOW_STACK_CHECK: boolean;

// ------------------------------------------------------------

export function running() {
    return !monitor.context.workList.empty();
}

// ------------------------------------------------------------

export function execute(
    ast: estree.Program | estree.Statement | estree.Expression,
    debugEnabled?: boolean
): Result {

    monitor.context.workList.push(ast);
    monitor.context.result = new Result();

    if (debugEnabled === undefined) {
        debugEnabled = true;
    }

    let cont = true;

    do {
        if (debugEnabled && monitor.debug.active) {
            return monitor.context.result;
        }
        cont = step();
        monitor.executionInfo.step();
       
    } while (cont);

    // #CRAWLER
    if (IsCrawler(monitor)) {
        monitor.CrawlerData.DumpToCrawler();
    }

    return monitor.context.result;
}


// ------------------------------------------------------------

export function resume(): Result {

    let cont = true;
    do {
        cont = step();
        if (monitor.debug.active) {
            return monitor.context.result;
        }
    } while (cont);

    return monitor.context.result;
}
// ------------------------------------------------------------

export function executeGlobalCode(code: string, origin: string, options?: { debugEnabled?: boolean }): Result {

    try {
        /* convert code to es5, using sourceType 'unambigious', meaning it will be
         * interpreted as script in a browser and _not_ add "use strict", and
         * either a script or module in nodejs (and add "use strict" if it is a
         * module) */

        const transformed = monitor.transform(code);
        monitor.code = code;
        monitor.ast = esprima.parse(transformed, { loc: true, range: true, tolerant: true });

    } catch (e) {
        let msg = new Value(`${e.description} in ${origin} : ${e.lineNumber} : ${e.column}`, bot);

        let obj = new SyntaxErrorObject(msg);
        let result = new Result();
        result.type = 'throw';
        result.value = new Value(obj, bot);
        return result;
    }

    let debugEnabled = true;
    if (options && typeof options.debugEnabled !== 'undefined') {
        debugEnabled = options.debugEnabled;
    }

    enterGlobalCode(monitor.ast);
    let result = execute(monitor.ast, debugEnabled);
    monitor.executionInfo.report();
    
    return result;
}

// ------------------------------------------------------------
//   contains the declaration binding (10.5) of global code

export function enterGlobalCode(ast: estree.Program): void {

    let c = monitor.context;

    // 10.5 - hoisting
    HoistFunctions(c.variableEnv, ast, false, bot);
    HoistVariables(c.variableEnv, ast, false, bot);

}



// ---

export function enterEvalCode(code: Program, _eval) {
    var c = monitor.context;

    // 15.1.2.1.1, is direct call
    var isDirect;

    //@ts-ignore TYPES
    isDirect = c.currentCall.reference.base.value instanceof ObjectEnvironmentRecord ||
        //@ts-ignore TYPES
        c.currentCall.reference.base.value instanceof DeclarativeEnvironmentRecord;

    //@ts-ignore TYPES
    isDirect = isDirect && c.currentCall.reference.propertyName.value === 'eval';
    //@ts-ignore TYPES
    isDirect = isDirect && c.currentCall.target.actualFunction === _eval;

    var context = c.clone();

    // 10.4.2 - no calling context or not direct call
    if (!isDirect) {
        var global = monitor.GlobalObject;
        var globalEnv = monitor.GlobalEnvironment;

        context.thisValue = new Value(global, bot);
        context.lexicalEnv = new Value(globalEnv, bot);
        context.variableEnv = new Value(globalEnv, bot);
    }

    //@ts-ignore TYPES
    DeclarationBindingInstantiation(context, code);

    // for stack trace 
    context.owner = 'eval';

    return context;
}


// -------------------------------------------------------------


function step(): boolean {

    //@ts-ignore .LAST
    if (monitor.last === undefined) monitor.last = [];

    let c = monitor.context;
    let wl = c.workList;
    let vs = c.valueStack;

    let result = c.result;

    if (wl.empty()) {
        return false;
    }

    let task = wl.pop();
    //@ts-ignore .LAST
    if (monitor.last.length > 100) {
        //@ts-ignore .LAST
        monitor.last.shift();
    }
    //@ts-ignore .LAST
    monitor.last.push(task);

    try {

        // throw, continue, or break state

        if (result.type !== 'normal') {

            while (true) {

                if (task instanceof Task && task.RunFor(result.type)) {
                    task.Execute(wl, vs);
                    return true;
                }

                if (isGuardedFunction(task) && task.runfor !== undefined && result.type in task.runfor) {
                    //console.log(task.name);
                    task(wl, vs);
                    return true;
                }


                if (isClosure(task) && task.func.runfor !== undefined && result.type in task.func.runfor) {
                    //console.log(task.func.name);


                    task.func.call(task.data, wl, vs);
                    return true;
                }

                if (wl.empty()) {
                    break;
                }
                //      console.log('skipping', task);

                task = wl.pop();
                //@ts-ignore .LAST
                if (monitor.last.length > 100) {
                    //@ts-ignore .LAST
                    monitor.last.shift();
                }
                //@ts-ignore .LAST
                monitor.last.push(task);
            }

            return false;
        }

        if (task instanceof Task) {
            task.Execute(wl, vs);
            return true;
        }

        // function?
        if (typeof task === 'function') {
            //console.log(task.name);

            task(wl, vs);
            return true;
        }

        // closure?

        if ('func' in task && 'data' in task) {
            //console.log(task.func.name);

            task.func.call(task.data, wl, vs);
            return true;
        }


        // otherwise, syntax
        let node = task;



        // expressions
        if (node.type in expressiontbl) {
            //console.log('expression', node.type);
            expressiontbl[node.type](node, wl, vs);
            return true;
        }

        // statement 

        // for stack trace
        c.codeStack.push(node);
        wl.top().then(PopCodeStack.Instance);

        if (node.type in statementtbl) {
            //   console.log('statement', node.type);
            statementtbl[node.type](node, wl, vs);
            return true;
        }

        monitor.fatal(node.type + ' not implemented');

    } catch (e) {

        if (e instanceof Value) {

            // Verfiy that the exception is allowed 
            monitor.assert(le(c.effectivePC, c.labels.exc),
                "exception in " + c.effectivePC + " not allowed with exception label " + c.labels.exc);

            // For observable flows
            c.labels.exc = lub(c.labels.exc, c.effectivePC);

            result.type = 'throw';
            result.value = e;
            return true;
        }

        throw e;
    }
    return true;
}


class PopCodeStack extends Task {
    static Instance = new PopCodeStack();
    constructor() {
        super(Task.runfor_all);
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        monitor.context.codeStack.pop();
    }
}