import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { Task } from "../Task";
import { GetValue } from "../../GetValue";
import { le, lub } from "../../Label";
import { Reference } from "../../Reference";

import * as estree from 'estree';

declare var monitor: MonitorBase;

//---------------------------------------------------------------------------- 

export function throwStatement(
    this: void,
    node: estree.ThrowStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let ip = wl.top();

    ip.then(node.argument);
    ip.then(ThrowStatementEnd.Instance);
}

// ---

class ThrowStatementEnd extends Task {

    static Instance = new ThrowStatementEnd();

    constructor() {
        super();
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;
        let result = c.result;
        //@ts-ignore
        let exprRef : Reference= vs.pop();

        // Verfiy that the exception is allowed 
        monitor.assert(le(c.effectivePC, c.labels.exc),
            "exception in " + c.effectivePC + " not allowed with exception label " + c.labels.exc);

        // For observable flows
        c.labels.exc = lub(c.labels.exc, c.effectivePC);

        result.type = 'throw';
        result.value = GetValue(exprRef);
        monitor.offendingTrace = monitor.stackTrace();
    }
}