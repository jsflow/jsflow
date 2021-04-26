import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";
import { Task } from "../Task";
import { Label } from "../../Label";
import { GetValue } from "../../GetValue";
import { ToObject } from "../../Conversion/ToObject";
import { PutValue } from "../../PutValue";
import { StackMarker } from "../../Stack";

import * as estree from 'estree';
import { Value } from "../../Value";
import { EcmaObject } from "../../Objects/EcmaObject";

declare var monitor: MonitorBase;

let emptyLabel = 'default'; // default is a reserved word so no actual label can be named default 

interface LabeledForInStatement extends estree.ForInStatement {
    labelset?: Set<string>;
}

let MySet = Set;

// ------------------------------------------------------------

export function forInStatement(
    node: LabeledForInStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    let ip = wl.top();

    let left: estree.Pattern;
    if (node.left.type === 'VariableDeclaration') {
        ip.then(node.left);

        // the standard only allows for one declaration, get the name
        left = node.left.declarations[0].id;
    } else {
        left = node.left;
    }

    ip.then(node.right);
    ip.then(new ForInStatementSetup(node, left));
}

// ---

class ForInStatementSetup extends Task {
    node: LabeledForInStatement;
    left: estree.Pattern;

    constructor(node: LabeledForInStatement, left: estree.Pattern) {
        super();
        this.node = node;
        this.left = left;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let c = monitor.context;
        let ip = wl.top();
        let lmap = c.labels.labelmap;

        let node = this.node;

        if (!node.labelset) {
            node.labelset = new MySet();
        }
        node.labelset.add(emptyLabel);

        let outerEmptyLabelData = lmap[emptyLabel];
        lmap[emptyLabel] = {
            label: c.effectivePC,
            pcmarker: c.pcStack.marker()
        };

        let contextLabel = lmap[emptyLabel].label;
        c.pushPC(contextLabel);

        //@ts-ignore STACK
        let val = GetValue(vs.pop());
        if (val.value === null || val.value === undefined) {
            return;
        }

        let obj = ToObject(val);
        let maxProperty = obj.value.getEnumerablePropertyNames(obj.label).length;

        // monitor.context.pushPC(obj.label);

        ip.then(new ForInExecute(node, this.left, obj, maxProperty, outerEmptyLabelData));
    }
}

// ---

class ForInExecute extends Task {
    node: LabeledForInStatement;
    left: estree.Pattern;
    obj: Value<EcmaObject>;
    nextProperty: number;
    maxProperty: number;
    outerEmptyLabelData: { label: Label, pcmarker: StackMarker };

    update: ForInUpdate;

    constructor(
        node: LabeledForInStatement,
        left: estree.Pattern,
        obj: Value<EcmaObject>,
        maxProperty: number,
        outerEmptyLabelData: { label: Label, pcmarker: StackMarker }
    ) {
        super(Task.runfor_continue_break);
        this.node = node;
        this.left = left;
        this.obj = obj;
        this.maxProperty = maxProperty;
        this.outerEmptyLabelData = outerEmptyLabelData;

        this.nextProperty = 0;
        this.update = new ForInUpdate(node, this);
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

        let properties = this.obj.value.getEnumerablePropertyNames(this.obj.label);

        if (this.nextProperty >= properties.length || this.nextProperty >= this.maxProperty) {
            c.labels.labelmap[emptyLabel] = this.outerEmptyLabelData;
            c.popPC(); // contextLabel
            return;
        }

        let propName = properties[this.nextProperty];
        this.nextProperty++;

        vs.push(propName);
        ip.then(this.left);
        ip.then(this.update);
    }
}

// ---

class ForInUpdate extends Task {
    node: LabeledForInStatement;
    execute: ForInExecute;

    constructor(node: LabeledForInStatement, execute: ForInExecute) {
        super();
        this.node = node;
        this.execute = execute;
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        let ip = wl.top();

        // @ts-ignore
        let lhs: Reference = vs.pop();
        // @ts-ignore
        let propName: Value<ValueTypes> = vs.pop();

        PutValue(lhs, propName);

        monitor.context.pushPC(propName.label);

        ip.then(this.node.body);
        ip.then(ForInSecurityContextEnd.Instance);
        ip.then(this.execute);
    }
}

// ---

class ForInSecurityContextEnd extends Task {
    static Instance = new ForInSecurityContextEnd();

    constructor() {
        super();
    }

    Execute(wl: WorkList, vs: ValueStack): void {
        monitor.context.popPC();
    }
}