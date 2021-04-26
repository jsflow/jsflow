import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { Task } from "../Task";
import { GetValue } from "../../GetValue";
import { Value } from "../../Value";
import { le, lub, bot } from "../../Label";

import * as estree from 'estree';
import { pretty } from "../../PP";

declare var monitor: MonitorBase;
//---------------------------------------------------------------------------- 

export function returnStatement(
    this: void,
    node: estree.ReturnStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let c = monitor.context;
    let ip = wl.top();

    monitor.assert(le(c.effectivePC, c.labels.ret),
        'write context ' + c.effectivePC + ' not below ' +
        'return context ' + c.labels.ret
    );

    // This is for the new mode of operation, for observable flows
    c.labels.ret = lub(c.labels.ret, c.effectivePC);

    if (node.argument) {
        ip.then(node.argument);
    } else {
        c.valueStack.push(new Value(undefined, bot));
    }
    ip.then(ReturnStatementEnd.Instance);

}

// returnStatementEnd

class ReturnStatementEnd extends Task {

    static Instance = new ReturnStatementEnd();

    constructor() {
        super();
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let result = monitor.context.result;

        result.type = 'return';
        //@ts-ignore STACK
        result.value = GetValue(vs.pop());
        result.target = null;
    }
}