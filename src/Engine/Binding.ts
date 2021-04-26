import { MonitorBase } from "../MonitorBase";
import { FunctionObject } from "../Objects/FunctionObject";
import { CreateArgumentsObject } from "../Objects/ArgumentsObject";
import { Value } from "../Value";
import { bot } from "../Label";

import * as constants from "../Constants";
import * as estraverse from "estraverse";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// 10.5 - strict ignored

export function DeclarationBindingInstantiation(context, F, args) {

    var isFunctionCode, isEvalCode, code;
    if (F instanceof FunctionObject) {
      isFunctionCode = true;
      isEvalCode = false;
      code = F.Code;
    } else {
      isFunctionCode = false;
      isEvalCode = true;
      code = F;
    }
  
    var env = context.variableEnv;
    var configurableBindings = isEvalCode;
  
    if (isFunctionCode) {
      BindArguments(env, F.FormalParameters, args);
    }
  
    var pc = context.effectivePC;
  
    HoistFunctions(env, code, configurableBindings, pc);
  
    var argumentsAlreadyDeclared = env.HasBinding(constants['arguments']);
  
    if (isFunctionCode && !argumentsAlreadyDeclared.value) {
      // make sure it returns a Value
      var argsObj = CreateArgumentsObject(env, F, args);
  
      // Should no longer be supported
      // F.DefineOwnProperty(constants['arguments'], argsObj, false);
  
      env.CreateMutableBinding(constants['arguments']);
      env.SetMutableBinding(constants['arguments'], argsObj, false);
    }
  
    HoistVariables(env, code, configurableBindings, pc);
  }
  
  // ------------------------------------------------------------
  // Function hoisting, part of 10.5
  
  export function HoistFunctions(env, script, configurableBinding, pc) {
  
    if (!script.functionDeclarations) {
      // 
      script.functionDeclarations = [];
  
      var visitor = {};
      //@ts-ignore SYNTAX
      visitor.leave = function () { };
      //@ts-ignore SYNTAX
      visitor.enter = function (
        this : {
            skip () : void
          },
          node
        ) {
  
        if (node.type === 'FunctionDeclaration') {
          script.functionDeclarations.push(node);
        }
  
        // Do not hoist inside functions
        if (node.type === 'FunctionDeclaration' ||
          node.type === 'FunctionExpression') {
          this.skip();
        }
      };
  
      estraverse.traverse(script, visitor);
    }
  
    var ds = script.functionDeclarations;
    var i;
  
    var len = ds.length;
    for (i = 0; i < len; i++) {
  
      var fn = new Value(ds[i].id.name, bot);
      var fo = new FunctionObject(ds[i].params, ds[i].body, env);
  
      fo.Name = ds[i].id.name;
      fo.Source = ds[i];
  
      var funcAlreadyDeclared = env.HasBinding(fn);
      if (!funcAlreadyDeclared.value) {
        env.CreateMutableBinding(fn, configurableBinding);
      }
  
      env.SetMutableBinding(fn, new Value(fo, pc));
    }
  }
  
  // ------------------------------------------------------------
  // Variable hoisting, part of 10.5
  
  export function HoistVariables(env, script, configurableBindings, pc) {
  
    if (!script.variableDeclarations) {
  
      script.variableDeclarations = [];
  
      var visitor = {};
      //@ts-ignore SYNTAX
      visitor.leave = function () { };
      //@ts-ignore SYNTAX
      visitor.enter = function (
        this : { 
            skip():void
          },
          node
        ) {
  
        // Do not hoist inside functions
        if (node.type === 'FunctionDeclaration' ||
          node.type === 'FunctionExpression') {
          this.skip();
        }
  
        if (node.type === 'VariableDeclaration') {
          for (var i = 0, len = node.declarations.length; i < len; i++) {
            var declarator = node.declarations[i];
            var pattern = declarator.id;
            script.variableDeclarations.push(pattern);
          }
        }
      };
  
      estraverse.traverse(script, visitor);
    }
  
    var ds = script.variableDeclarations;
    var i;
  
    var len = ds.length;
    for (i = 0; i < len; i++) {
  
      if (ds[i].type !== 'Identifier') {
        monitor.fatal('Patters is variable declarations not supported');
      }
      // declarations are indentifiers, not general patterns
      var dn = new Value(ds[i].name, bot);
  
      var varAlreadyDeclared = env.HasBinding(dn);
      if (!varAlreadyDeclared.value) {
        env.CreateMutableBinding(dn, configurableBindings);
        env.SetMutableBinding(dn, new Value(undefined, pc));
      }
    }
  }

// ------------------------------------------------------------
// Bind Arguments, 
export function BindArguments(env, names, args) {
    if (args == undefined) return;
  
    var argCount = args.length;
    var nameCount = names.length;
  
    monitor.context.pushPC(bot);
    for (var n = 0; n < nameCount; n++) {
      var v;
      if (n >= argCount)
        v = new Value(undefined, bot);
      else
        v = args[n];
  
      var id = names[n];
      if (id.type !== 'Identifier') {
        monitor.fatal(id.type + ' is not supported in BindArguments');
      }
  
      var argName = new Value(id.name, bot);
      var argAlreadyDeclared = env.HasBinding(argName);
  
      monitor.context.raisePC(argAlreadyDeclared.label);
      if (!argAlreadyDeclared.value) {
        env.CreateMutableBinding(argName);
      }
  
      env.SetMutableBinding(argName, v);
    }
    monitor.context.popPC();
  }