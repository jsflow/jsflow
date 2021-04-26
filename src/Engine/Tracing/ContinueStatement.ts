import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { lub, le } from "../../Label";

import * as estree from 'estree';

declare var monitor: MonitorBase;

let emptyLabel = 'default'; // default is a reserved word so no actual label can be named default 

// 12.7 ----------------------------------------------------------------------

export function continueStatement(
    node: estree.ContinueStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let c = monitor.context;
    let result = monitor.context.result;

    let name = node.label ? node.label.name : emptyLabel;
    let lblcontext = c.labels.labelmap[name].label;

    let displayName = node.label ? '(' + name + ')' : '';
    monitor.assert(le(c.effectivePC, lblcontext),
        'write context ' + c.effectivePC + ' not below ' +
        'label context ' + lblcontext + displayName
    );

    // For observable flows
    c.labels.labelmap[name].label = lub(lblcontext, c.effectivePC);

    result.type = 'continue';
    result.target = name;
}