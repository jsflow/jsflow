import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { Task } from "../Task";
import { Label, bot, lub } from "../../Label";
import { StackMarker } from "../../Stack";

import * as estree from 'estree';

declare var monitor: MonitorBase;
let MySet = Set;

// 12.12 ---------------------------------------------------------------------

export function labeledStatement(
    node: estree.LabeledStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let ip = wl.top();
    let c = monitor.context;

    let pcmarker = c.pcStack.marker();
    let vsmarker = c.valueStack.marker();

    //@ts-ignore LABELSET
    if (!node.body.labelset) {
        //@ts-ignore LABELSET
        node.body.labelset = new MySet([node.label.name]);

        //@ts-ignore LABELSET
        if (node.labelset) {
            //@ts-ignore LABELSET
            node.body.labelset.union(node.labelset);
        }
    }

    let name = node.label.name;
    let outerlabel = setupStatementLabel(name);

    let labeldata = c.labels.labelmap[name];
    labeldata.pcmarker = c.pcStack.marker();

    c.pushPC(labeldata.label);

    ip.then(node.body);
    ip.then(new LabeledStatementEnd(name, labeldata.label, pcmarker, vsmarker));
}

// labeledStatementEnd

class LabeledStatementEnd extends Task {
    name: string;
    outerlabel: Label;
    pcmarker: StackMarker;
    vsmarker: StackMarker;

    constructor(
        name: string,
        outerlabel: Label,
        pcmarker: StackMarker,
        vsmarker: StackMarker,
    ) {
        super(Task.runfor_continue_break);
        this.name = name;
        this.outerlabel = outerlabel;
        this.pcmarker = pcmarker;
        this.vsmarker = vsmarker;
    }


    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;
        let result = c.result;

        // reset the outer label - no need to reset pcmarker since
        // statement labels with the same name cannot be nested
        c.labels.labelmap[this.name].label = this.outerlabel;

        c.pcStack.reset(this.pcmarker);
        c.valueStack.reset(this.vsmarker);

        if (result.type === 'break' && result.target === this.name) {
            result = c.result;
            result.type = 'normal';
            result.target = null;
        }
    }
}

function setupStatementLabel(name: string): Label {
    let c = monitor.context;
    let lmap = c.labels.labelmap;
    if (!lmap[name]) {
        lmap[name] = { label: bot, pcmarker: undefined };
    }

    let labeldata = lmap[name];
    let outerlabel = labeldata.label;

    // raise to effective pc
    labeldata.label = lub(labeldata.label, c.effectivePC);

    return outerlabel;
}
