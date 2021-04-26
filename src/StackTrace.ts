import * as escodegen from 'escodegen';
import { Context } from './Context';

// --------------------------------------------------------------------------- 

export class StackTrace {

    // TODO: fix
    trace : any[];

    constructor(stack : Context[]) {
        this.trace = [];
        for (let i = 0, len = stack.length; i < len; i++) {
            let context = stack[i];

            let stmt = context.codeStack.size() > 0 ? context.codeStack.peek() : undefined;
            if (stmt === undefined) {
                break;
            }
            let loc = stmt.loc;
            let source = loc.source;
            this.trace.push({ owner: context.owner, source: source, loc: loc.start, stmt: stmt });
        }
    }

    toString() {

        if (this.trace.length === 0) {
            return '';
        }

        let result : string;

        let len = this.trace.length;
        // last entry contains offending command
        let last = this.trace[len - 1];

        result = last.source + ':' + last.loc.line + ':' + last.loc.column + '\n';
        result = result + '    ' + escodegen.generate(last.stmt) + '\n\n';

        for (let i = len - 2; i >= 0; i--) {
            let tr = this.trace[i];
            if (tr.owner) {
                result = result + 'at ' + tr.owner + ' ';
            }
            result = result + '(' + tr.source + ':' + tr.loc.line + ':' + tr.loc.column + ')\n';
        }
        return result;
    }
}
