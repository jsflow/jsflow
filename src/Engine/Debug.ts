import { WorkList, ValueStack } from "../Context";

export class JSFlowDebugError extends Error {
    constructor(...args: any[]) {
        super(...args);
    }
}

export function AssertValueStackSize(expectedSize: number, vs: ValueStack): void {
    if (vs.size() !== expectedSize) {
        throw new JSFlowDebugError(`Expected size of value stack to be ${expectedSize} but it is ${vs.size()}`);
    }
}

export function CheckValueStackSize(expectedSize: number, msg?: string): (wl: WorkList, vs: ValueStack) => void {
    let exc = new JSFlowDebugError();
    return function (wl: WorkList, vs: ValueStack): void {
        if (vs.size() !== expectedSize) {
            exc.message = `Expected size of value stack to be ${expectedSize} but it is ${vs.size()}`;
            throw exc;
        }
    }
}

export type Canary = { token : number, owner : string, vssize : number };

function IsCanary(x : any) : x is Canary {
    return typeof x === 'object' && x !== null && x.token !== undefined && x.vssize !== undefined;
}

export function PushCanary(vs : ValueStack, owner : string) {
    let canary = { token : Math.floor(Math.random() * Number.MAX_SAFE_INTEGER), owner : owner, vssize : vs.size() };
    //@ts-ignore CANARY
    vs.push(canary);
    return canary;
}

export function AssertValidCanary(vs : ValueStack, expected : Canary) {
    let x = vs.pop();
    if (!IsCanary(x) || x.token !== expected.token) {
        vs.push(x);
        console.log('[JSFlow FATAL] Canary verification failed:', Error().stack);
        throw new JSFlowDebugError(`Cannot verify canary`);
    }
}