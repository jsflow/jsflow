import { MonitorBase } from "../MonitorBase";
import { EcmaObject } from "./EcmaObject";
import { Value } from "../Value";
import { bot } from "../Label";

declare var monitor: MonitorBase;


export class ArgumentsObject extends EcmaObject {
    constructor(F, args) {
      super();
  
      this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);
      this.Class = 'Arguments';
      this.Extensible = true;
  
      var formalParams = F.FormalParameters;
      var args = args || [];
  
      for (var i = 0; i < args.length; i++) {
        this.Put(new Value(i, bot), args[i], false);
      }
  
      for (var i = 0; i < formalParams.length; i++) {
        var id = formalParams[i];
  
        if (id.type !== 'Identifier') {
          monitor.fatal(id.type + ' is not supported in ArgumentsObject');
        }
  
        if (args[i]) {
          this.Put(new Value(id.name, bot), args[i], false);
        }
      }
  
      this.Put(new Value('length', bot), new Value(args.length, bot), false);
      this.Put(new Value('callee', bot), new Value(F, bot), false);
    }
  
  }

  // ------------------------------------------------------------
// Create Arguments Object, 10.6

export function CreateArgumentsObject(env, F, args) {
    return new Value(
      new ArgumentsObject(F, args),
      bot
    );
  
  }