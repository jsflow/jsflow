import { MonitorBase } from "../../MonitorBase";
import { WorkList, ValueStack } from "../../Context";

import * as estree from 'estree';

declare var monitor: MonitorBase;
// ------------------------------------------------------------

export function debuggerStatement(
    node: estree.DebuggerStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    monitor.debug.active = true;
}