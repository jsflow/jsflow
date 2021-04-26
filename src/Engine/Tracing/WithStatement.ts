import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { Task } from "../Task";
import { GetValue } from "../../GetValue";
import { ToObject } from "../../Conversion/ToObject";
import { NewObjectEnvironment } from "../../ObjectEnvironmentRecord";
import { Value } from "../../Value";
import { LexicalEnvironment } from "../../LexicalEnvironment";

import * as estree from 'estree';

declare var monitor: MonitorBase;
// 12.10 ---------------------------------------------------------------------

export function withStatement(
    node: estree.WithStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let ip = wl.top();

    ip.then(node.object);
    ip.then(new WithStatementBody(node));
}

// ---

class WithStatementBody extends Task {
    node: estree.WithStatement;

    constructor(node: estree.WithStatement) {
        super();
        this.node = node;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let ip = wl.top();
        let c = monitor.context;

        //@ts-ignore STACK
        let val = GetValue(vs.pop());
        let obj = ToObject(val);

        let oldEnv = c.lexicalEnv;
        let newEnv = NewObjectEnvironment(obj, oldEnv);
        newEnv.provideThis();

        c.lexicalEnv = new Value(newEnv, obj.label);

        ip.then(this.node.body);
        ip.then(new WithStatementEnd(oldEnv));
    }
}

// withStatementEnd

class WithStatementEnd extends Task {
    lexicalEnv: Value<LexicalEnvironment>;

    constructor(lexicalEnv: Value<LexicalEnvironment>) {
        super(Task.runfor_continue_break);
        this.lexicalEnv = lexicalEnv;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        monitor.context.lexicalEnv = this.lexicalEnv;
    }
}