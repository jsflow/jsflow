import { WorkList, ValueStack } from "../../Context";

import * as estree from 'estree';

export function blockStatement(
    node: estree.BlockStatement,
    wl: WorkList,
    vs: ValueStack
): void {
    wl.prepend(node.body);
}