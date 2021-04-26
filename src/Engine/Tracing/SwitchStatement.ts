import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { Task } from "../Task";
import { lub, Label } from "../../Label";
import { binaryStrictEqs } from "../BinaryOperators";
import { StackMarker, Stack } from "../../Stack";
import { GetValue } from "../../GetValue";

import * as estree from 'estree';

declare var monitor: MonitorBase;

function _GetValue(): void {
    let vs = monitor.context.valueStack;
    // @ts-ignore
    let val: Value<ValueTypes> = vs.pop();

    vs.push(GetValue(val));
}

let emptyLabel = 'default'; // default is a reserved word so no actual label can be named default 
let MySet = Set;

// 12.11 ---------------------------------------------------------------------
type SwitchState = { defaultCaseIndex: number | null, nextCase: number };

interface LabeledSwitchStatement extends estree.SwitchStatement {
    labelset? : Set<string>;
}

export function switchStatement(
    this: void,
    node: LabeledSwitchStatement,
    wl: WorkList,
    vs: ValueStack
): void {
  
    let c = monitor.context;
    let lmap = monitor.context.labels.labelmap;

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

    let switchState: SwitchState = {
        defaultCaseIndex: null,
        nextCase: 0
    };

    if (node.cases) {
        for (let i = 0; i < node.cases.length; i++) {
            if (node.cases[i].test === null) {
                switchState.defaultCaseIndex = i;
                break;
            }
        }
    }

    let ip = wl.top();

    // Store the discriminant value on the value stack.
    // It is later popped by switchStatementEnd.
    ip.then(node.discriminant);
    ip.then(_GetValue);

    // Set up statement labels
    ip.then(new SwitchStatementUpgradeLabels(node));

    // Kick off the first case
    ip.then(new SwitchStatementCase(node, switchState));

    // Clean up and handle breaks
    ip.then(new SwitchStatementEnd(node, outerEmptyLabelData));
}

// ---

class SwitchStatementUpgradeLabels extends Task {
    node: LabeledSwitchStatement;

    constructor(node: LabeledSwitchStatement) {
        super();
        this.node = node;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;
        //@ts-ignore STACK
        let discriminantLabel = vs.peek().label;
        let lblmap = c.labels.labelmap;
    
        c.labels.pc = lub(c.labels.pc, discriminantLabel);
    
        for (let name in this.node.labelset) {
            lblmap[name].label = lub(lblmap[name].label, discriminantLabel);
        }
    }
}

// ---

class SwitchStatementCase extends Task {

    node: LabeledSwitchStatement;
    switchState: SwitchState;

    constructor(node: LabeledSwitchStatement, switchState: SwitchState) {
        super();
        this.node = node;
        this.switchState = switchState;
    }

    Execute(wl: WorkList, vs: ValueStack): void {

        let ip = wl.top();
        let idx = this.switchState.nextCase;

        if (this.node.cases === undefined || idx >= this.node.cases.length) {
            // No more cases to try, schedule the default 
            // case if there is one
            if (this.switchState.defaultCaseIndex !== null) {
                for (let i = this.switchState.defaultCaseIndex; i < this.node.cases.length; i++) {
                    for (let j = 0; j < this.node.cases[i].consequent.length; j++) {
                        ip.then(this.node.cases[i].consequent[j]);
                    }
                }
            }
            return;
        }

        if (idx === this.switchState.defaultCaseIndex) {
            // Skip the default case during matching
            this.switchState.nextCase += 1;
            ip.then(new SwitchStatementCase(this.node, this.switchState));
            return;
        }

        vs.dup(); // Duplicate the discriminant value

        // Push the test value
        ip.then(this.node.cases[idx].test);
        ip.then(_GetValue);

        // Test for equality and decide what to do next
        ip.then(new SwitchStatementTest(this.node, this.switchState));
    }
}

// ---

class SwitchStatementTest extends Task {
    node: LabeledSwitchStatement;
    switchState: SwitchState;

    constructor(node: LabeledSwitchStatement, switchState: SwitchState) {
        super();
        this.node = node;
        this.switchState = switchState;
    }

    Execute(wl: WorkList, vs: ValueStack): void {

        let ip = wl.top();

        binaryStrictEqs('===', wl, vs);

        // @ts-ignore
        let bresult: Value<ValueTypes> = vs.pop();

        monitor.context.labels.pc = lub(monitor.context.labels.pc, bresult.label);

        if (bresult.value) {
            // Found a match, schedule all statements from here down
            for (let i = this.switchState.nextCase; i < this.node.cases.length; i++) {
                for (let j = 0; j < this.node.cases[i].consequent.length; j++) {
                    ip.then(this.node.cases[i].consequent[j]);
                }
            }
        } else {
            this.switchState.nextCase += 1;
            ip.then(new SwitchStatementCase(this.node, this.switchState));
        }
    }
}

// ---

class SwitchStatementEnd extends Task {

    node: LabeledSwitchStatement;
    outerEmptyLabelData : { label : Label, pcmarker : StackMarker };

    constructor(node: LabeledSwitchStatement, outerEmptyLabelData : { label : Label, pcmarker : StackMarker }) {
        super(Task.runfor_break);
        this.node = node;
        this.outerEmptyLabelData = outerEmptyLabelData;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;

        vs.pop(); // pop the discriminant value
        c.popPC(); // pop the labelContext

        if (c.result.type === 'break' && this.node.labelset!.has(c.result.target)) {
            c.result.type = 'normal';
            c.result.target = null;
            c.labels.labelmap['empty'] = this.outerEmptyLabelData;
        }
    }
}