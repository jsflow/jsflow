import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { Task } from "../Task";
import { Label, lub, bot } from "../../Label";

import { StackMarker } from "../../Stack";

import * as estree from 'estree';
import { Value } from "../../Value";
import { NewDeclarativeEnvironment } from "../../DeclarativeEnvironmentRecord";
import { Result } from "../../Result";
import { LexicalEnvironment } from "../../LexicalEnvironment";

declare var monitor: MonitorBase;


//---------------------------------------------------------------------------- 

export function tryStatement(
    node: estree.TryStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let ip = wl.top();
    let c = monitor.context;

    ip.then(node.block);
    // Expression evaluation might cause exceptions; if so the state of
    // the context might need some cleaning up.
    // The result stack and the worklist are not affected by expression so their
    // states are fine.
    // The ret label cannot be affected by exceptions.

    // The stacks needs to be reset. 
    let pcmarker = c.pcStack.marker();
    let vsmarker = c.valueStack.marker();

    let exc = c.labels.exc;

    // esprima seems to generate a list of handlers --- standard only supports one
    //@ts-ignore SYNTAX
    ip.then(new TryStatementCatch(node.handlers[0], pcmarker, vsmarker, exc));

    // The finalizer 
    let lexicalEnv = c.lexicalEnv;
    ip.then(new TryStatementFinally(node.finalizer, pcmarker, vsmarker, lexicalEnv));
}

// ---

class TryStatementCatch extends Task {
    handler: estree.CatchClause;
    pcmarker: StackMarker;
    vsmarker: StackMarker;
    exc: Label;

    constructor(
        handler: estree.CatchClause,
        pcmarker: StackMarker,
        vsmarker: StackMarker,
        exc: Label
    ) {
        super(Task.runfor_throw);
        this.handler = handler;
        this.pcmarker = pcmarker;
        this.vsmarker = vsmarker;
        this.exc = exc;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;
        let result = c.result;

        // We are in charge of resetting the exc label, the finally does the rest 
        // of the cleaning.

        // The pc of the catch block is pc + exc of body
        let handlerPC = lub(c.labels.pc, c.labels.exc);

        // The exc of the catch block is the exc of _catch, that resets the exc
        c.labels.exc = this.exc;

        // if there is no handler or no exception was thrown, there's nothing more to do
        if (!this.handler || result.type !== 'throw') {
            return;
        }

        c.pcStack.reset(this.pcmarker);
        c.valueStack.reset(this.vsmarker);

        c.pcStack.push(handlerPC);

        let catchEnv = NewDeclarativeEnvironment(c.lexicalEnv);

        // ECMA-262 allows only idenfifiers, but the parser allows patterns;
        if (this.handler.param.type !== 'Identifier') {
            monitor.fatal('Pattern in catch not supported');
        }

        //@ts-ignore SYNTAX
        let identifier = new Value(this.handler.param.name, bot);
        catchEnv.CreateMutableBinding(identifier);
        catchEnv.SetMutableBinding(identifier, result.value);

        c.lexicalEnv = new Value(catchEnv, c.effectivePC);

        result.type = 'normal';
        result.value = null;

        wl.push(this.handler.body);
    }
}


// ---

class TryStatementFinally extends Task {
    body: estree.BlockStatement | null | undefined;
    pcmarker: StackMarker;
    vsmarker: StackMarker;
    lexicalEnv: Value<LexicalEnvironment>;

    constructor(
        body: estree.BlockStatement | null | undefined,
        pcmarker: StackMarker,
        vsmarker: StackMarker,
        lexicalEnv: Value<LexicalEnvironment>
    ) {
        super(Task.runfor_all);
        this.body = body;
        this.pcmarker = pcmarker;
        this.vsmarker = vsmarker;
        this.lexicalEnv = lexicalEnv;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;

        // The pc of the finally is the pc of the try.
        // The exc of the finally is the exc of the _catch, which is either
        // the exc of theee try, unless it was raised by a handler, in which
        // case it escapes the try, and should affect the finally too.

        // We are in charge of resetting the pcStack, and the lexicalEnv 
        c.pcStack.reset(this.pcmarker);
        c.valueStack.reset(this.vsmarker);
        c.lexicalEnv = this.lexicalEnv;


        // if there is no finally block, we're done
        if (!this.body) {
            return;
        }

        // Allocate a new result --- _finally env choses between the result
        // of the body/handler, and the result of the finally
        let result = c.result;
        c.result = new Result();

        let ip = c.workList.top();

        ip.then(this.body);
        ip.then(new TryStatementFinallyEnd(result));
    }
}

// ---

class TryStatementFinallyEnd extends Task {
    result: Result;

    constructor(result: Result) {
        super(Task.runfor_all); // TODO; really all?
        this.result = result;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;

        if (c.result.type === 'normal') {
            c.result = this.result;
        }
    }
}


