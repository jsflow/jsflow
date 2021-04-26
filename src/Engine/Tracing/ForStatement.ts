import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { Task } from "../Task";
import { Label, lub } from "../../Label";
import { GetValue } from "../../GetValue";
import { ToBoolean } from "../../Conversion/ToBoolean";

import * as estree from 'estree';
import { StackMarker } from "../../Stack";

declare var monitor: MonitorBase;

let emptyLabel = 'default'; // default is a reserved word so no actual label can be named default 

interface LabeledForStatement extends estree.ForStatement {
    labelset?: Set<string>;
}


class ResetValueStack extends Task {

    targetSize : number

    constructor(targetSize: number) {
        super();
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        while(vs.size() > this.targetSize) {
            vs.pop();
        }
    }
}

let MySet = Set;

// ------------------------------------------------------------

export function forStatement(
    node: LabeledForStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let c = monitor.context;
    let ip = wl.top();

    let lmap = c.labels.labelmap;

    if (node.init) {
        ip.then(node.init);
        ip.then(new ResetValueStack(vs.size()));
    }

    if (!node.labelset) {
        node.labelset = new MySet([]);
    }
    node.labelset.add(emptyLabel);

    let outerEmptyLabelData = lmap[emptyLabel];
    lmap[emptyLabel] = {
        label: c.effectivePC,
        pcmarker: c.pcStack.marker()
    };

    let contextLabel = lmap[emptyLabel].label;
    c.pushPC(contextLabel);

    ip.then(new ForStatementMain(node));
    ip.then(new ForStatementEnd(outerEmptyLabelData));
}

// ---

class ForStatementMain extends Task {

    node: LabeledForStatement;
    choose: ForStatementChoose;
    execute: ForStatementExecute;
    update: ForStatementUpdate;

    constructor(node: LabeledForStatement) {
        super(Task.runfor_continue_break);
        this.node = node;
        this.execute = new ForStatementExecute(node, this);
        this.choose = new ForStatementChoose(node, this);
        this.update = new ForStatementUpdate(node);
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;
        let ip = wl.top();


        let result = c.result;

        if (result.type === 'break' && this.node.labelset!.has(result.target)) {
            result.type = 'normal';
            result.target = null;
            return;
        }

        if (result.type !== 'continue' || !this.node.labelset!.has(result.target)) {
            if (result.type !== 'normal') {
                return;
            }
        }

        result.type = 'normal';
        result.target = null;

        if (this.node.test) {
            ip.then(this.node.test);
            ip.then(this.choose);
        } else {
            ip.then(this.execute);
        }

    }
}

// ---
class ForStatementChoose extends Task {
    node: LabeledForStatement;
    main: ForStatementMain;

    constructor(node: LabeledForStatement, main: ForStatementMain) {
        super(Task.runfor_continue);
        this.node = node;
        this.main = main;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let ip = wl.top();
        let c = monitor.context;
        let result = c.result;

        //@ts-ignore STACK
        let cond = GetValue(vs.pop());
        let condb = ToBoolean(cond);

        c.labels.pc = lub(c.labels.pc, condb.label);
        if (!condb.value) {
            result.type = 'normal';
            result.target = null;
            return;
        }
        ip.then(this.main.execute);
    }
}

class ForStatementExecute extends Task {
    node: LabeledForStatement;
    main: ForStatementMain;

    constructor(node: LabeledForStatement, main: ForStatementMain) {
        super();
        this.node = node;
        this.main = main;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let ip = wl.top();

        ip.then(this.node.body);
        ip.then(this.main.update);
        ip.then(this.main);
    }
}

class ForStatementUpdate extends Task {
    node: LabeledForStatement;

    constructor(node: LabeledForStatement) {
        super(Task.runfor_continue);
        this.node = node;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let ip = wl.top();

        let c = monitor.context;
        let result = c.result;

        if (result.type !== 'continue' || !this.node.labelset!.has(result.target)) {
            if (result.type !== 'normal') {
                return;
            }
        }

        result.type = 'normal';
        result.target = null;

        if (this.node.update) {
            ip.then(this.node.update);
            ip.then(new ResetValueStack(vs.size()));
        }
    }
}


// forStatementeEnd
class ForStatementEnd extends Task {
    outerEmptyLabelData: { label: Label, pcmarker: StackMarker };

    constructor(outerEmptyLabelData: { label: Label, pcmarker: StackMarker }) {
        super();
        this.outerEmptyLabelData = outerEmptyLabelData;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;
        c.labels.labelmap[emptyLabel] = this.outerEmptyLabelData;
        c.popPC();
    }
}