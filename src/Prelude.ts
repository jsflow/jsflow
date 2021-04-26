/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


  
 export function inherits(tgt,src) {
    for (var x in src.prototype) {
      if (src.prototype.hasOwnProperty(x) &&
        !tgt.prototype.hasOwnProperty(x)) {
        tgt.prototype[x] = src.prototype[x];
      }
    }
  }

 export function copy(src,tgt) {
    for (var x in src) {
      if (src.hasOwnProperty(x)) {
        tgt[x] = src[x];
      }
    }
  }
