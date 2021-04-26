import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { Task } from "../Task";
import { Label } from "../../Label";
import { GetValue } from "../../GetValue";
import { ToBoolean } from "../../Conversion/ToBoolean";

import * as estree from 'estree';

declare var monitor: MonitorBase;

// ------------------------------------------------------------

export function ifStatement(
    this: void,
    node: estree.IfStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let ip = wl.top();

    ip.then(node.test);
    ip.then(new IfStatementChoose(node));
}

// ---

class IfStatementChoose extends Task {
    node: estree.IfStatement;

    constructor(node: estree.IfStatement) {
        super();
        this.node = node;
    }

    Execute(wl: WorkList, vs: ValueStack): void {

        let ip = wl.top();

        //@ts-ignore STACK
        let cond = GetValue(vs.pop());
        cond = ToBoolean(cond);

        monitor.context.pushPC(cond.label);

        if (cond.value) {
            ip.then(this.node.consequent);
        } else {
            this.node.alternate && ip.then(this.node.alternate);
        }

        ip.then(new IfStatementEnd(cond.label));
    }
}

// ---

class IfStatementEnd extends Task {
    label : Label;
    constructor(label : Label) {
        super(Task.runfor_continue_break);
        this.label = label;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;
        c.popPC();
        if (c.result.value) {
            c.result.value.raise(this.label);
        }
    }
}