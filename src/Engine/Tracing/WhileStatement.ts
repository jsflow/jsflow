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

interface LabeledWhileStatement extends estree.WhileStatement {
    labelset?: Set<string>;
}

interface LabeledDoWhileStatement extends estree.DoWhileStatement {
    labelset?: Set<string>;
}
let MySet = Set;

// ------------------------------------------------------------

export function whileStatement(
    node: LabeledWhileStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let c = monitor.context;
    let ip = wl.top();

    let lmap = c.labels.labelmap;

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

    ip.then(new WhileStatementShared(node, outerEmptyLabelData));
}

// ------------------------------------------------------------

export function doWhileStatement(
    node: LabeledDoWhileStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let c = monitor.context;
    let ip = wl.top();

    let lmap = c.labels.labelmap;

    if (!node.labelset) {
        node.labelset = new MySet([]);
    }
    node.labelset.add(emptyLabel);

    let outerEmptyLabelData = lmap[emptyLabel];
    lmap[emptyLabel] = {
        label: c.effectivePC,
        pcmarker: c.pcStack.marker()
    };

    // used for both statement label security labels and control security label
    let contextLabel = lmap[emptyLabel].label;
    c.pushPC(contextLabel);

    ip.then(node.body);
    ip.then(new WhileStatementShared(node, outerEmptyLabelData));
}

// ------------------------------------------------------------

class WhileStatementShared extends Task {
    node: LabeledWhileStatement | LabeledDoWhileStatement;
    outerEmptyLabelData: { label: Label, pcmarker: StackMarker };

    choser : WhileStatementSharedChoose;

    constructor(
        node: LabeledWhileStatement | LabeledDoWhileStatement,
        outerEmptyLabelData: { label: Label, pcmarker: StackMarker }
    ) {
        super(Task.runfor_continue_break);
        this.node = node;
        this.outerEmptyLabelData = outerEmptyLabelData;

        this.choser = new WhileStatementSharedChoose(this);
    }

    Execute(wl: WorkList, vs: ValueStack): void {

        let ip = wl.top();

        let c = monitor.context;
        let result = c.result;

        if (result.type === 'break' && this.node.labelset!.has(result.target)) {
            result.type = 'normal';
            result.target = null;
            c.labels.labelmap[emptyLabel] = this.outerEmptyLabelData;
            c.popPC(); // contextLabel
            return;
        }

        if (result.type !== 'continue' || !this.node.labelset!.has(result.target)) {
            if (result.type !== 'normal') {
                return;
            }
        }

        // continue gets us here
        result.type = 'normal';
        result.target = null;

        ip.then(this.node.test);
        ip.then(this.choser);

    }
}

// ---

class WhileStatementSharedChoose extends Task {
    controller : WhileStatementShared;

    constructor(controller : WhileStatementShared) {
        super(Task.runfor_continue);
        this.controller = controller;
    }

    Execute(wl: WorkList, vs: ValueStack): void {

        let c = monitor.context;

        //@ts-ignore STACK
        let cond = GetValue(vs.pop());
        let condb = ToBoolean(cond);

        c.labels.pc = lub(c.labels.pc, condb.label);
        if (condb.value) {
            let ip = wl.top();

            ip.then(this.controller.node.body);
            ip.then(this.controller);

        } else {
            c.labels.labelmap[emptyLabel] = this.controller.outerEmptyLabelData;
            c.popPC(); // contextLabel
        }
    }
}