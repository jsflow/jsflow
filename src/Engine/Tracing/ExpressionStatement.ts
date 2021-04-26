import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { GetValue } from "../../GetValue";
import { Task } from "../Task";

import * as estree from 'estree';

declare var monitor: MonitorBase;
export function expressionStatement(
    this: void,
    node: estree.ExpressionStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let ip = wl.top();

    ip.then(node.expression);
    ip.then(ExpressionStatementEnd.Instance);
}

class ExpressionStatementEnd extends Task {

    static Instance = new ExpressionStatementEnd(); 

    constructor() {
        super();
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;

        // @ts-ignore
        let val: Value < ValueTypes > = vs.pop();
        c.result.value = GetValue(val);
    }
}