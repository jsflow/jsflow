import { WorkList, ValueStack } from "../../Context";

import * as estree from 'estree';

export function emptyStatement(
    node: estree.EmptyStatement,
    wl: WorkList,
    vs: ValueStack
): void {
}