import { ResultType } from "../Result";
import { WorkList, ValueStack } from "../Context";
import { Canary, PushCanary, AssertValidCanary } from "./Debug";
import { MonitorBase } from "../MonitorBase";


declare var monitor: MonitorBase;
declare var JSFLOW_STACK_CHECK: boolean;

export type RunFor = { [key in ResultType]?: boolean }

export abstract class Task {

    runfor: RunFor;

    static runfor_all = { 'throw': true, 'continue': true, 'break': true, 'return' : true };
    static runfor_throw = { 'throw': true };
    static runfor_continue = { 'continue': true };
    static runfor_break = { 'break': true };
    static runfor_continue_break = { 'break': true, 'continue': true };

    constructor(runfor?: RunFor) {
        this.runfor = runfor || {};
    }

    RunFor(x: ResultType): boolean {
        return x in this.runfor;
    }

    abstract Execute(wl: WorkList, vs: ValueStack): void;

}

// ---

function CheckCanary(
    this: void,
    wl: WorkList,
    vs: ValueStack,
    canary: Canary
) {
    AssertValidCanary(vs, canary);
}