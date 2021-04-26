/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { bot, Label } from './Label';

import { IEcmaObject, ValueTypes } from './Interfaces';
import { Value } from './Value';


// ------------------------------------------------------------

interface LabelOptions {
  label?: Label,
  existence?: Label
}

interface DefineOptions extends LabelOptions {
  enumerable?: boolean,
  configurable?: boolean,
  writable?: boolean
}

// TODO: label of name not used; only Value to be compatible with constants - reasonable?
export function Define(_this: IEcmaObject, name: Value<string>, v: ValueTypes, opts?: DefineOptions): void {
  opts = opts || {};

  var pd: PropertyDescriptor =
  {
    value: v,
    writable: opts.writable === true,
    enumerable: opts.enumerable === true,
    configurable: opts.configurable === true
  }

  Object.defineProperty(_this.properties, name.value, pd);
  _this.labels[name.value] = { value: opts.label || bot, existence: opts.existence || bot };
}

// ---

export function DefineFFT(_this: IEcmaObject, name: Value<string>, v: ValueTypes, opts?: LabelOptions): void {
  opts = opts || {};
  Object.defineProperty(_this.properties, name.value,
    {
      value: v,
      configurable: true
    }
  );
  _this.labels[name.value] = { value: opts.label || bot, existence: opts.existence || bot };
}

// ---

export function DefineFFF(_this: IEcmaObject, name: Value<string>, v: ValueTypes, opts?: LabelOptions): void {
  opts = opts || {};
  Object.defineProperty(_this.properties, name.value, { value: v });
  _this.labels[name.value] = { value: opts.label || bot, existence: opts.existence || bot };
}

// ---

export function DefineTFF(_this: IEcmaObject, name: Value<string>, v: ValueTypes, opts?: LabelOptions): void {
  opts = opts || {};
  Object.defineProperty(_this.properties, name.value,
    {
      value: v,
      writable: true
    }
  );
  _this.labels[name.value] = { value: opts.label || bot, existence: opts.existence || bot };
}

// ---

export function DefineTFT(_this: IEcmaObject, name: Value<string>, v: ValueTypes, opts?: LabelOptions): void {
  opts = opts || {};
  Object.defineProperty(_this.properties, name.value,
    {
      value: v,
      writable: true,
      configurable: true
    }
  );
  _this.labels[name.value] = { value: opts.label || bot, existence: opts.existence || bot };
}

// ------------------------------------------------------------
