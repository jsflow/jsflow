import { bot } from '../../Label';
import { relabelPropertyDescriptor, relabel } from '../Entity';
import { Value } from "../../Value";
import { DefineFFF } from '../../Define';
import { NodeJSMonitor } from './NodeJSMonitor';
import { BuiltinMethodObject } from "../../Objects/BuiltinMethodObject";
import { ToString } from '../../Conversion/ToString';
import { GlobalObject } from '../../Objects/GlobalObject';
import { ModelState } from '../Policy';
import { LabeledPropertyDescriptor } from '../../PropertyDescriptor';

declare var monitor: NodeJSMonitor;

/* We need to be very careful when interacting with the global object, since
 * JSFlow itself uses the global object.
 * Thus, the parts of the global object that belongs to ECMA-262 v5 and are 
 * defined by JSFlow are isolated from the global object.
 */

export class NodeGlobalObject extends GlobalObject {

  cached: { [key: string]: boolean };
  modelstate: ModelState;

  constructor(host: object) {
    super(host);

    this.cached = {};

    this.modelstate = monitor.policy.globalmodelstate;
    monitor.entitymap.set(host, this);
  }

  GetOwnProperty(p: Value<string>): Value<LabeledPropertyDescriptor | undefined> {

    // predefined properties are isolated
    // a predefined property is a property that is present, but have not been lift in from the 
    // host object

    if (this.properties.hasOwnProperty(p.value) && !this.cached.hasOwnProperty(p.value)) {
      return super.GetOwnProperty(p);
    }

    if (p.value === "Symbol"|| p.value === "WeakMap" || p.value === "Set" || p.value === "Map" || p.value === "ArrayBuffer") {
      return super.GetOwnProperty(p);
    }
    
    if (this.host.hasOwnProperty(p.value)) {

      // the property exists on the host, but has yet to be labeled

      // TODO:
      let propertyLabeler = monitor.policy.global.GetPropertyLabeler(p.value);
      let label = propertyLabeler.Labeler.Label(this.modelstate);

      if (!this.labels.hasOwnProperty(p.value)) {
        this.labels[p.value] = {
          value: label,
          existence: p.label
        };
      }

      let desc = relabelPropertyDescriptor(
        // @ts-ignore we know it exists based on the above check
        Object.getOwnPropertyDescriptor(this.host, p.value),
        propertyLabeler.ReadLabeler,
        this.modelstate
      );

      Object.defineProperty(this.properties, p.value, desc);
      this.cached[p.value] = true;

    }

    return super.GetOwnProperty(p);
  }
  
}
