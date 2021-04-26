import { Value } from "../Value";
import * as constants from '../Constants';
import { HasInstance } from '../HasInstance';
import { ToString } from '../Conversion/ToString';
import { MonitorBase } from '../MonitorBase';

import { bot, lub } from '../Label';
import { RegExpObject, IsRegExpObject } from '../Objects/RegExpObject';
import { DefineFFF } from '../Define';
import { EcmaObject } from "../Objects/EcmaObject";
import { ValueTypes } from "../Interfaces";

declare var monitor: MonitorBase;


// ------------------------------------------------------------
// The RegExp Constructor, 15.10.5

export class RegExpConstructor extends EcmaObject {

    host: any;

    constructor(host: RegExp) {
        super();
        this.Class = 'Function';
        // not mandated by standard
        this.Extensible = true;
        this.host = host;
    }

    Setup(): void {
        this.Prototype = new Value(monitor.instances.FunctionPrototype, bot);

        DefineFFF(this, constants.length, 2);
        DefineFFF(this, constants.prototype, monitor.instances.RegExpPrototype);
    }


    HasInstance(V: Value<ValueTypes>): Value<boolean> {
        return HasInstance.call(this, V);
    }


    // 15.10.3.1
    Call(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<RegExpObject> {
        var pattern = args[0] || new Value(undefined, bot);
        var flags = args[1] || new Value(undefined, bot);

        if (IsRegExpObject(pattern) && flags.value === undefined) {
            return pattern;
        }

        return this.Construct(args);
    }

    // 15.10.4.1
    Construct(args: Value<ValueTypes>[]): Value<RegExpObject> {
        var c = monitor.context;

        var pattern = args[0] || new Value(undefined, bot);
        var flags = args[1] || new Value(undefined, bot);

        var P = "";
        var F = "";

        var l = lub(pattern.label, flags.label);
        c.pushPC(l);

        if (IsRegExpObject(pattern)) {
            if (flags.value === undefined) {
                var rx = pattern.value.PrimitiveValue;
                P = rx.source;
                F = (rx.global ? 'g' : '') + (rx.ignoreCase ? 'i' : '') + (rx.multiline ? 'm' : '');
            }
            else {
                monitor.Throw(
                    "TypeError",
                    '',
                    bot
                );
            }
        } else {
            var _P = pattern.value === undefined ? new Value("", l) : ToString(pattern);
            var _F = flags.value === undefined ? new Value("", l) : ToString(flags);

            l = lub(l, _P.label, _F.label);
            P = _P.value;
            F = _F.value;
        }

        var res ;
        try {
          res = new RegExpObject(new RegExp(P, F), l);
        }
        catch (e) {
            monitor.tryRethrow(e,true);
            monitor.fatal(`RegExp.Construct, unable to lift ${e} of type ${typeof e} for RegExp(${P}, ${F})`);
        }
        c.popPC();
        return new Value(res, bot);
    }
}
