
import { MonitorBase } from "../MonitorBase";

import { switchStatement } from "./Tracing/SwitchStatement";
import { blockStatement } from "./Tracing/BlockStatement";
import { emptyStatement } from "./Tracing/EmptyStatement";
import { expressionStatement } from "./Tracing/ExpressionStatement";
import { ifStatement } from "./Tracing/IfStatement";
import { labeledStatement } from "./Tracing/LabeledStatement";
import { breakStatement } from "./Tracing/BreakStatement";
import { continueStatement } from "./Tracing/ContinueStatement";
import { withStatement } from "./Tracing/WithStatement";
import { returnStatement } from "./Tracing/ReturnStatement";
import { throwStatement } from "./Tracing/ThrowStatement";
import { whileStatement, doWhileStatement } from "./Tracing/WhileStatement";
import { forStatement } from "./Tracing/ForStatement";
import { forInStatement } from "./Tracing/ForInStatement";
import { variableDeclaration } from "./Tracing/VariableDeclaration";
import { debuggerStatement } from "./Tracing/DebuggerStatement";
import { tryStatement } from "./Tracing/TryCatchStatement";

import * as estree from "estree";
import { WorkList, ValueStack } from "../Context";

declare var monitor: MonitorBase;

// ------------------------------------------------------------

export function ExecuteStatement(statement: estree.Statement, wl: WorkList, vs: ValueStack): void {

    switch (statement.type) {
        case "BlockStatement":
            blockStatement(statement, wl, vs);
            break;

        case "BreakStatement":
            breakStatement(statement, wl, vs);
            break;

        case "ClassDeclaration": throw "TODO";

        case "ContinueStatement":
            continueStatement(statement, wl, vs);
            break;

        case "DebuggerStatement":
            debuggerStatement(statement, wl, vs);
            break;

        case "DoWhileStatement":
            doWhileStatement(statement, wl, vs);
            break;

        case "EmptyStatement":
            emptyStatement(statement, wl, vs);
            break;

        case 'ExpressionStatement':
            expressionStatement(statement, wl, vs);
            break;

        case "ForInStatement":
            forInStatement(statement, wl, vs);
            break;

        case "ForOfStatement": throw "TODO";

        case "ForStatement":
            forStatement(statement, wl, vs);
            break;

        case "FunctionDeclaration":
            // handled via function hoisting
            break;

        case "IfStatement":
            ifStatement(statement, wl, vs);
            break;

        case "LabeledStatement":
            labeledStatement(statement, wl, vs);
            break;

        case "ReturnStatement":
            returnStatement(statement, wl, vs);
            break;

        case "SwitchStatement":
            switchStatement(statement, wl, vs);
            break;

        case "ThrowStatement":
            throwStatement(statement, wl, vs);
            break;

        case "TryStatement":
            tryStatement(statement, wl, vs);
            break;

        case "VariableDeclaration":
            variableDeclaration(statement, wl, vs);
            break;

        case "WhileStatement":
            whileStatement(statement, wl, vs);
            break;

        case "WithStatement":
            withStatement(statement, wl, vs);
            break;
    }

    monitor.fatal(statement.type + ' not implemented');
}


// statement handler functions

export var statementtbl = {
    'Program': blockStatement,
    'BlockStatement': blockStatement,
    'EmptyStatement': emptyStatement,
    'ExpressionStatement': expressionStatement,
    'IfStatement': ifStatement,
    'SwitchStatement': switchStatement,
    'LabeledStatement': labeledStatement,
    'BreakStatement': breakStatement,
    'ContinueStatement': continueStatement,
    'WithStatement': withStatement,
    'ReturnStatement': returnStatement,
    'ThrowStatement': throwStatement,
    'TryStatement': tryStatement,
    'WhileStatement': whileStatement,
    'DoWhileStatement': doWhileStatement,
    'ForStatement': forStatement,
    'ForInStatement': forInStatement,

    'VariableDeclaration': variableDeclaration,
    'FunctionDeclaration': emptyStatement,
    'DebuggerStatement': debuggerStatement
};

let emptyLabel = 'default'; // default is a reserved word so no actual label can be named default 



