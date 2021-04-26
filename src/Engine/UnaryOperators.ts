import { WorkList, ValueStack } from "../Context";
import { Value } from "../Value";
import { ValueTypes } from "../Interfaces";
import { Reference } from "../Reference";
import { ToNumber } from "../Conversion/ToNumber";
import { GetValue } from "../GetValue";
import { ToBoolean } from "../Conversion/ToBoolean";
import { ToInt32 } from "../Conversion/ToInt32";
import { bot } from "../Label";
import { ToObject } from "../Conversion/ToObject";
import { PutValue } from "../PutValue";

// -------------------------------------------------------------
// Unary operators

// -------------------------------------------------------------
// Unary -, 11.4.7

function unaryMinus(wl: WorkList, vs: ValueStack): void {
    let ref = vs.pop();
    //@ts-ignore STACK
    let n = ToNumber(GetValue(ref));
    n.value = -n.value;
    vs.push(n);
  }
  
  // -------------------------------------------------------------
  // Unary +, 11.4.6
  
  function unaryPlus(wl: WorkList, vs: ValueStack): void {
    let ref = vs.pop();
    //@ts-ignore STACK
    let n = ToNumber(GetValue(ref));
    vs.push(n);
  }
  
  // -------------------------------------------------------------
  // Logical NOT, 11.4.9
  
  function unaryLogicalNot(wl: WorkList, vs: ValueStack): void {
    let ref = vs.pop();
    //@ts-ignore STACK
    let b = ToBoolean(GetValue(ref));
    b.value = !b.value;
    vs.push(b);
  }
  
  // -------------------------------------------------------------
  // Bitwise NOT, 11.4.8
  
  function unaryBitwiseNot(wl: WorkList, vs: ValueStack): void {
    let ref = vs.pop();
    //@ts-ignore STACK
    let n = ToInt32(GetValue(ref));
    n.value = ~n.value;
    vs.push(n);
  }
  
  // -------------------------------------------------------------
  // The typeof Operator, 11.4.3
  
  function unaryTypeof(wl: WorkList, vs: ValueStack): void {
    let ref = vs.pop();
  
    if (ref instanceof Reference && ref.IsUnresolvableReference()) {
      vs.push(new Value('undefined', ref.base.label));
    } else {
  
      let val: Value<ValueTypes>;
  
      if (ref instanceof Reference) {
        val = GetValue(ref);
      } else {
        //@ts-ignore TYPES
        val = ref;
      }
  
      if (val.value === null) {
        vs.push(new Value('object', val.label));
        return;
      }
  
      if (typeof val.value === 'object') {
  
        // TODO: use type predicate
        if ('Call' in val.value) {
          vs.push(new Value('function', val.label));
        } else {
          vs.push(new Value('object', val.label));
        }
  
      } else {
        vs.push(new Value(typeof val.value, val.label));
      }
    }
  
  }
  
  // -------------------------------------------------------------
  // The void Operator, 11.4.2
  
  function unaryVoid(wl: WorkList, vs: ValueStack): void {
    let ref = vs.pop();
    //@ts-ignore STACK
    let _ignore = GetValue(ref);
    vs.push(new Value(undefined, bot));
  }
  
  // -------------------------------------------------------------
  // The delete Operator, 11.4.1
  
  function unaryDelete(wl: WorkList, vs: ValueStack): void {
    let ref = vs.pop();
  
    if (ref instanceof Reference) {
  
      if (ref.IsUnresolvableReference()) {
        vs.push(new Value(true, ref.base.label));
      } else {
  
        if (ref.IsPropertyReference()) {
          let object = ToObject(ref.base);
          vs.push(object.Delete(ref.propertyName));
        } else {
          vs.push(ref.base.DeleteBinding(ref.propertyName));
        }
      }
  
    } else {
      //@ts-ignore TYPES
      vs.push(new Value(true, ref.label));
    }
  }
  
  // -------------------------------------------------------------
  
  export var unarytbl = {
    '-': unaryMinus,
    '+': unaryPlus,
    '!': unaryLogicalNot,
    '~': unaryBitwiseNot,
    'typeof': unaryTypeof,
    'void': unaryVoid,
    'delete': unaryDelete
  };


// ------------------------------------------------------------- 
// Prefix, and Postfix Expressions, 11.3, 11.4.4, 11.4.5

function prefixOps(
    op: "++" | "--",
    wl: WorkList,
    vs: ValueStack
  ): void {
    //@ts-ignore
    let ref: Reference = vs.pop();
    let oldValue = ToNumber(GetValue(ref));
    let val = op === '++' ? oldValue.value + 1 : oldValue.value - 1;
    let newValue = new Value(val, oldValue.label);
    PutValue(ref, newValue);
  
    vs.push(newValue);
  }
  
  function postfixOps(
    op: "++" | "--",
    wl: WorkList,
    vs: ValueStack
  ): void {
    //@ts-ignore
    let ref: Reference = vs.pop();
    let oldValue = ToNumber(GetValue(ref));
    let val = op === '++' ? oldValue.value + 1 : oldValue.value - 1;
    let newValue = new Value(val, oldValue.label);
    PutValue(ref, newValue);
  
    vs.push(oldValue);
  }
  
  // -------------------------------------------------------------
  
  export var prefixtbl = {
    '++': prefixOps.bind(null, '++'),
    '--': prefixOps.bind(null, '--')
  };
  
  export var postfixtbl = {
    '++': postfixOps.bind(null, '++'),
    '--': postfixOps.bind(null, '--')
  };