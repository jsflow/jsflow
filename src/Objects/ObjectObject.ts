import { bot } from '../Label';
import { Value } from "../Value";
import { EcmaObject } from '../Objects/EcmaObject';
import { MonitorBase } from '../MonitorBase';


// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// Object objects, 15.2.2.1

export class ObjectObject extends EcmaObject {
    constructor() {
      super();
  
      this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);
      this.Class = 'Object';
      this.Extensible = true;
  
      // this.host      = {};
    }
  }
  
  // ---
  
  ObjectObject.prototype.toString = function () {
    let properties : string[] = [];
    for (let x in this.properties) {
      if (this.properties.hasOwnProperty(x)) {
        properties.push(x + ': ' + this.properties[x]);
      }
    }
    return '{' + properties.join(', ') + '}';
  };
  // ------------------------------------------------------------
  