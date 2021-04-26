import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { GetValue } from "../../GetValue";
import { PutValue } from "../../PutValue";
import { GetIdentifierReference } from "../../GetIdentifierReference";
import { Reference } from "../../Reference";

import * as estree from 'estree';
import { Task } from "../Task";

declare var monitor: MonitorBase;

export function variableDeclaration(
    this: void,
    node: estree.VariableDeclaration,
    wl: WorkList,
    vs: ValueStack
): void {
    let ip = wl.top();

    for (let i = 0, len = node.declarations.length; i < len; i++) {
        let vd = node.declarations[i];
        if (vd.init) {

            if (vd.id.type !== 'Identifier') {
                monitor.fatal(vd.id.type + ' not supported in variable declarations');
            }

            //@ts-ignore SYNTAX
            let lhs = GetIdentifierReference(monitor.context.lexicalEnv, vd.id.name);
            ip.then(vd.init);
            ip.then(new VariableDeclarationUpdate(lhs));
        }
    }
}

// ---

class VariableDeclarationUpdate extends Task {
    lhs: Reference;

    constructor(lhs: Reference) {
        super();
        this.lhs = lhs;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        //@ts-ignore STACK
        let rhs = GetValue(vs.pop());
        PutValue(this.lhs, rhs);
    }
}