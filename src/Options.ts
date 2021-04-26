/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MonitorBase } from "./MonitorBase";

 // --- -----------------------------------------------------------------------

declare var monitor: MonitorBase;

// --- -----------------------------------------------------------------------


export type OptionType = 'string' | 'boolean' | 'number';

 class Option {

  type : OptionType;
  def : string | boolean | number;
  value : string | boolean | number;
  description : string;


  constructor(type : OptionType, val : string | boolean | number, desc : string) {

    this.type = type;
    this.set(val);
    this.def = this.value;

    this.description = desc;
  }

  set(val : string | boolean | number) : void {

    var v = String(val);

    if (this.type === 'string') {

      this.value = v;

    } else if (this.type === 'boolean') {

      this.value = v === 'true' || v === '1';

    } else if (this.type === 'number') {

      this.value = Number(v);

    }
  }

  getDefault() : string | boolean | number {
    return this.def;
  }

  valueOf() : string | boolean | number {
    return this.value;
  }

  toString() : string {
    return String(this.value);
  }
}

// -------------------------------------------------------------
// Options

export class Options {

  options : {
    [key:string] : Option | undefined
  }

  constructor() {
    this.options = {};
  }

  declare(name : string, type : OptionType, def : string | boolean | number, desc : string) {
    var description = desc ? desc : name;
    this.options[name] = new Option(type, def, description);
  }

  has(name : string) : boolean {
    return this.options[name] !== undefined;
  }

  get(name : string) : string | boolean | number {
    return this.options[name].valueOf();
  }

  getOption(name : string) : Option {
    return this.options[name];
  }

  set(name : string, value : string | boolean | number) {
    this.options[name].set(value);
  }

  keys() : Array<string> {
    var res = [];

    for (var x in this.options) {
      if (this.options.hasOwnProperty(x)) {
        res.push(x);
      }
    }
    return res;
  }

  report() : void {
    for (let name in this.options) {
      monitor.info(`${name} : ${this.options[name].toString()}`);
    }
  }
}
