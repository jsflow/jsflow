import { bot } from "./Label";
import { Reference } from "./Reference";
import { Value } from "./Value";
import { MonitorBase } from "./MonitorBase";
import { LexicalEnvironment } from "./LexicalEnvironment";

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// GetIdentifierReference, 10.2.2.1

export function GetIdentifierReference(p : Value<LexicalEnvironment>, x : string) : Reference {

    if (!p) {
      monitor.fatal('GetIdentifierReference: p undefined or null for ' + x);
    }
  
    if (p.value == null) {
      return new Reference(new Value(undefined, p.label),
        new Value(x, bot));
    }
  
    var erp = new Value(p.value.EnvironmentRecord, p.label);
  
    var b = erp.HasBinding(new Value(x, bot));
    if (b.value) {
      erp.label = b.label;
      return new Reference(erp, new Value(x, bot));
    }
    else {
      var res = GetIdentifierReference(p.value.OuterLexicalEnvironment, x);
      res.base.raise(b.label);
      return res;
    }
  }
  