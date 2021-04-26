import { Value } from "../Value";
import { EcmaObject } from '../Objects/EcmaObject';
import * as constants from '../Constants';
import { BuiltinFunctionObject } from "../Objects/BuiltinFunctionObject";
import { ToString } from '../Conversion/ToString';
import { DefineTFT } from '../Define';
import { bot } from '../Label';
import { MonitorBase } from '../MonitorBase';

import { ErrorConstructor } from '../Constructors/ErrorConstructor';
import { ValueTypes } from "../Interfaces";

// ------------------------------------------------------------

declare var monitor: MonitorBase;

// ------------------------------------------------------------
// 15.11.4 The Error Prototype

export class ErrorPrototype extends EcmaObject {

    host: Error;

    constructor(host: Error) {
        super();
        this.Class = 'Error';
        this.host = host;
    }

    Setup(): void {
        this.SetupBase(monitor.instances.ErrorConstructor, 'Error');
    }

    SetupBase(constructor: ErrorConstructor, name: string): void {
        this.Prototype = new Value(monitor.instances.ObjectPrototype, bot);

        DefineTFT(this, constants.constructor, constructor);
        DefineTFT(this, constants.name, name);
        DefineTFT(this, constants.message, '');

        DefineTFT(this, constants.toString, new BuiltinFunctionObject(tostring, 0, undefined));
    }
}


// ------------------------------------------------------------

function tostring(thisArg: Value<ValueTypes>, args: Value<ValueTypes>[]): Value<ValueTypes>  {
    var c = monitor.context;

    if (thisArg.value === null || typeof thisArg.value !== 'object') {
        c.pushPC(thisArg.label);
        monitor.Throw(
            "TypeError",
            'Error object expected',
            bot
        );
    }

    var name = thisArg.Get(constants.name);

    if (name.value === undefined) {
        name.value = 'Error';
    } else {
        c.pushPC(name.label);
        name = ToString(name);
        c.popPC();
    }

    var msg = thisArg.Get(constants.message);

    if (msg.value === undefined) {
        msg.value = '';
    } else {
        c.pushPC(msg.label);
        msg = ToString(msg);
        c.popPC();
    }

    if (name.value === '') {
        msg.raise(name.label);
        return msg;
    }

    if (msg.value === '') {
        name.raise(msg.label);
        return name;
    }

    name.value += ': ' + msg.value;
    name.raise(msg.label);
    return name;
}