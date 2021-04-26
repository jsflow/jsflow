import { WorkList, ValueStack } from "../Context";
import { Value } from "../Value";
import { ValueTypes } from "../Interfaces";
import { lub } from "../Label";
import { ToNumber } from "../Conversion/ToNumber";
import { ToPrimitive } from "../Conversion/ToPrimitive";
import { ToUInt32 } from "../Conversion/ToUInt32";
import { ToInt32 } from "../Conversion/ToInt32";
import { ToString } from "../Conversion/ToString";
import { MonitorBase } from "../MonitorBase";
import { GetValue } from "../GetValue";
import { ToBoolean } from "../Conversion/ToBoolean";


declare var monitor: MonitorBase;

// -------------------------------------------------------------
// Equality Operators, 11.9

function binaryEqs(op: "==" | "!=", wl: WorkList, vs: ValueStack): void {
    // @ts-ignore
    let rval: Value<ValueTypes> = vs.pop();
    // @ts-ignore
    let lval: Value<ValueTypes> = vs.pop();
  
    let res: Value<boolean>;
  
    while (true) {
      let lt: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "null" = typeof lval.value;
      let rt: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "null" = typeof rval.value;
  
      lt = lval.value === undefined ? 'undefined' : lt;
      rt = rval.value === undefined ? 'undefined' : rt;
  
      lt = lval.value === null ? 'null' : lt;
      rt = rval.value === null ? 'null' : rt;
  
      // must use strict in order not to trigger conversion
      //   but then null and undefined must be handled separately
      if (lt === rt) {
        res = new Value(lval.value === rval.value,
          lub(lval.label, rval.label));
        break;
      }
  
      if ((lval.value === null && rval.value === undefined) ||
        (lval.value === undefined && rval.value === null)) {
        res = new Value(true, lub(lval.label, rval.label));
        break;
      }
  
      if (lt === 'number' && rt === 'string') {
        rval = ToNumber(rval);
        continue;
      }
  
      if (lt === 'string' && rt === 'number') {
        lval = ToNumber(lval);
        continue;
      }
  
      if (lt === 'boolean') {
        lval = ToNumber(lval);
        continue;
      }
  
      if (rt === 'boolean') {
        rval = ToNumber(rval);
        continue;
      }
  
      if ((lt === 'string' || lt === 'number') &&
        rt === 'object') {
        rval = ToPrimitive(rval);
        continue;
      }
  
      if (lt === 'object' &&
        (rt === 'string' || rt === 'number')) {
        lval = ToPrimitive(lval);
        continue;
      }
      res = new Value(false, lub(lval.label, rval.label));
      break;
    }
  
    if (op === '!=') {
      res.value = !res.value;
    }
  
    vs.push(res);
  }
  
  // -------------------------------------------------------------
  // Strict Equality Operators, 11.9.4, 11.9.5
  
  export function binaryStrictEqs(op: "===" | "!==", wl: WorkList, vs: ValueStack): void {
    // @ts-ignore
    let rval: Value<ValueTypes> = vs.pop();
    // @ts-ignore
    let lval: Value<ValueTypes> = vs.pop();
  
    let res = new Value(lval.value === rval.value,
      lub(lval.label, rval.label));
  
    if (op === '!==') {
      res.value = !res.value;
    }
  
    vs.push(res);
  }
  
  // -------------------------------------------------------------
  // Relational Operators, 11.8
  //  The evaluation order is important, 11.8.5
  
  function binaryOrds(
    op: "<" | ">" | "<=" | ">=" | "instanceof" | "in",
    wl: WorkList,
    vs: ValueStack
  ): void {
    // @ts-ignore
    let rval: Value<ValueTypes> = vs.pop();
    // @ts-ignore
    let lval: Value<ValueTypes> = vs.pop();

    let lprim, rprim;
    if (op.charAt(0) === '<' || op.charAt(0) === '>') {
      lprim = ToPrimitive(lval, 'number');
      rprim = ToPrimitive(rval, 'number');
    } else {
      lprim = ToPrimitive(lval);
      rprim = ToPrimitive(rval);
    }


    let res: Value<boolean>;

    if (typeof lprim.value !== 'string' &&
      typeof rprim.value !== 'string') {
      let lnum = ToNumber(lprim);
      let rnum = ToNumber(rprim);
      let val = eval('lnum.value ' + op + ' rnum.value');
      res = new Value(val, lub(lnum.label, rnum.label));
    } else {
      let val = eval('lprim.value ' + op + ' rprim.value');
      res = new Value(val, lub(lprim.label, rprim.label));
    }

    vs.push(res);
  }
  
  // -------------------------------------------------------------
  // Bitwise Shift Operators, 11.7
  
  function binaryShifts(
    op: "<<" | ">>" | ">>>",
    wl: WorkList,
    vs: ValueStack
  ): void {
    // @ts-ignore
    let rval: Value<ValueTypes> = vs.pop();
    // @ts-ignore
    let lval: Value<ValueTypes> = vs.pop();
  
    let lnum = (op === '>>>') ? ToUInt32(lval) : ToInt32(lval);
    let rnum = ToUInt32(rval);
    let val = eval('lnum.value ' + op + ' rnum.value');
  
    vs.push(new Value(val, lub(lnum.label, rnum.label)));
  }
  
  // -------------------------------------------------------------
  // Binary Bitwise Operators, 11.10
  
  function binaryBitwiseOps(
    op: "&" | "^" | "|",
    wl: WorkList,
    vs: ValueStack
  ): void {
    // @ts-ignore
    let rval: Value<ValueTypes> = vs.pop();
    // @ts-ignore
    let lval: Value<ValueTypes> = vs.pop();
  
    let lnum = ToInt32(lval);
    let rnum = ToInt32(rval);
    let val = eval('lnum.value ' + op + ' rnum.value');
  
    vs.push(new Value(val, lub(lnum.label, rnum.label)));
  }
  
  // -------------------------------------------------------------
  // Plus, 11.6
  
  function binaryPlus(
    wl: WorkList,
    vs: ValueStack
  ): void {
    // @ts-ignore
    let rval: Value<ValueTypes> = vs.pop();
    // @ts-ignore
    let lval: Value<ValueTypes> = vs.pop();
  
    let lprim = ToPrimitive(lval);
    let rprim = ToPrimitive(rval);
    let res: Value<number | string>;
  
    if ((typeof lprim.value) === 'string' ||
      (typeof rprim.value) === 'string') {
      let lstr = ToString(lprim);
      let rstr = ToString(rprim);
      res = new Value(lstr.value + rstr.value,
        lub(lprim.label, rprim.label));
    } else {
      let lnum = ToNumber(lprim);
      let rnum = ToNumber(rprim);
      res = new Value(lnum.value + rnum.value,
        lub(lnum.label, rnum.label));
    }
  
    vs.push(res);
  }
  
  // -------------------------------------------------------------
  // Multiplicative operators, 11.5, and minus, 11.6
  
  function binaryArithmeticOps(
    op: "-" | "*" | "/" | "%",
    wl: WorkList,
    vs: ValueStack
  ): void {
    // @ts-ignore
    let rval: Value<ValueTypes> = vs.pop();
    // @ts-ignore
    let lval: Value<ValueTypes> = vs.pop();
  
    let leftNum = ToNumber(lval);
    let rightNum = ToNumber(rval);
    let val = eval('leftNum.value ' + op + ' rightNum.value');
  
    vs.push(new Value(val, lub(leftNum.label, rightNum.label)));
  }
  
  // -------------------------------------------------------------
  // The in operator, 11.8.7
  
  function binaryIn(
    wl: WorkList,
    vs: ValueStack
  ): void {
    // @ts-ignore
    let rval: Value<ValueTypes> = vs.pop();
    // @ts-ignore
    let lval: Value<ValueTypes> = vs.pop();
  
    if (typeof rval.value !== 'object') {
      if (false) { // SILENT ERROR
        vs.push(new Value(false, lub(lval.label, rval.label)));
        return;
      }
  
      monitor.Throw(
        "TypeError",
        "invalid 'in' parameter",
        rval.label
      );
    }
    vs.push(rval.HasProperty(ToString(lval)));
  }
  
  // -------------------------------------------------------------
  // The instanceof operator, 11.8.6
  
  function binaryInstanceof(
    wl: WorkList,
    vs: ValueStack
  ): void {
    // @ts-ignore
    let rval: Value<ValueTypes> = vs.pop();
    // @ts-ignore
    let lval: Value<ValueTypes> = vs.pop();
  
    if (rval.value === null || typeof rval.value !== 'object') {
      if (false) { // SILENT ERROR
        vs.push(new Value(false, lub(lval.label, rval.label)));
      }
  
      monitor.Throw(
        "TypeError",
        "invalid 'instanceof' parameter",
        rval.label
      );
  
      throw 'TypeScript';
    }
  
    if (!('HasInstance' in rval.value)) {
      if (false) { // SILENT ERROR
        vs.push(new Value(false, lub(lval.label, rval.label)));
      }
  
      monitor.Throw(
        "TypeError",
        "invalid 'instanceof' parameter",
        rval.label
      );
    }
  
    vs.push(rval.HasInstance(lval));
  }
  
  // -------------------------------------------------------------
  
  export var binarytbl = {
    '==': binaryEqs.bind(null, '=='),
    '!=': binaryEqs.bind(null, '!='),
    '===': binaryStrictEqs.bind(null, '==='),
    '!==': binaryStrictEqs.bind(null, '!=='),
    '<': binaryOrds.bind(null, '<'),
    '<=': binaryOrds.bind(null, '<='),
    '>': binaryOrds.bind(null, '>'),
    '>=': binaryOrds.bind(null, '>='),
    '<<': binaryShifts.bind(null, '<<'),
    '>>': binaryShifts.bind(null, '>>'),
    '>>>': binaryShifts.bind(null, '>>>'),
    '+': binaryPlus,
    '-': binaryArithmeticOps.bind(null, '-'),
    '*': binaryArithmeticOps.bind(null, '*'),
    '/': binaryArithmeticOps.bind(null, '/'),
    '%': binaryArithmeticOps.bind(null, '%'),
    '|': binaryBitwiseOps.bind(null, '|'),
    '&': binaryBitwiseOps.bind(null, '&'),
    '^': binaryBitwiseOps.bind(null, '^'),
    'in': binaryIn,
    'instanceof': binaryInstanceof
  };



// -------------------------------------------------------------
// Binary Logical ||, 11.11

function binaryLogicalOr(
    wl: WorkList,
    vs: ValueStack
  ): void {
  
    //@ts-ignore STACK
    let lval = GetValue(vs.pop());
    vs.push(lval);
  
    let lb = ToBoolean(lval);
    let right = wl.pop();
  
    if (lb.value) {
      return;
    }
  
    monitor.context.pushPC(lb.label);
  
    let ip = wl.top();
    ip.then(right);
    ip.then(binaryLogicalOr_end);
  }
  
  // ---
  
  function binaryLogicalOr_end(
    wl: WorkList,
    vs: ValueStack
  ): void {
    //@ts-ignore STACK
    let rval = GetValue(vs.pop());
    //@ts-ignore
    let lval: Value<ValueTypes> = vs.pop();
  
    monitor.context.popPC();
  
    vs.push(new Value(rval.value, lub(rval.label, lval.label)));
  }
  
  // -------------------------------------------------------------
  // Binary Logical &&, 11.11
  
  function binaryLogicalAnd(
    wl: WorkList,
    vs: ValueStack
  ): void {
    //@ts-ignore STACK
    let lval = GetValue(vs.pop());
    vs.push(lval);
    let lb = ToBoolean(lval);
    let right = wl.pop();
  
    if (!lb.value) {
      return;
    }
  
    monitor.context.pushPC(lb.label);
  
    let ip = wl.top();
    ip.then(right);
    ip.then(binaryLogicalAnd_end);
  }
  
  // ---
  
  function binaryLogicalAnd_end(
    wl: WorkList,
    vs: ValueStack
  ): void {
    //@ts-ignore STACK
    let rval = GetValue(vs.pop());
    //@ts-ignore STACK
    let lval: Value<ValueTypes> = vs.pop();
  
    monitor.context.popPC();
  
    vs.push(new Value(rval.value, lub(rval.label, lval.label)));
  }
  
  // -------------------------------------------------------------
  
  export var logicaltbl = {
    '||': binaryLogicalOr,
    '&&': binaryLogicalAnd
  };
  
  // -------------------------------------------------------------
  
  function assignmentOps(
    op: "+" | "-" | "*" | "/" | "%" | ">>" | "<<" | ">>>" | "|" | "&" | "^" | null,
    wl: WorkList,
    vs: ValueStack
  ): void {
    //@ts-ignore STACK
    let rval = GetValue(vs.pop());
    let lref = vs.pop();
  
    if (op !== null) {
      vs.push(lref);
      //@ts-ignore STACK
      vs.push(GetValue(lref));
      vs.push(rval);
      binarytbl[op](wl, vs);
    } else {
      vs.push(lref);
      vs.push(rval);
    }
  }
  
  export var assignmenttbl = {
    '=': assignmentOps.bind(null, null),
    '+=': assignmentOps.bind(null, '+'),
    '-=': assignmentOps.bind(null, '-'),
    '*=': assignmentOps.bind(null, '*'),
    '/=': assignmentOps.bind(null, '/'),
    '%=': assignmentOps.bind(null, '%'),
    '>>=': assignmentOps.bind(null, '>>'),
    '<<=': assignmentOps.bind(null, '<<'),
    '>>>=': assignmentOps.bind(null, '>>>'),
    '|=': assignmentOps.bind(null, '|'),
    '&=': assignmentOps.bind(null, '&'),
    '^=': assignmentOps.bind(null, '^')
  };