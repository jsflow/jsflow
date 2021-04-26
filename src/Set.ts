/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 // DEPRECATED; use built in Set instead
  
 /*
  export function Set() {

    this.data = {};

    var toAdd = arguments; 

    if (arguments.length === 1) {
      var arg = arguments[0];

      if (arg instanceof Array) {
        //@ts-ignore TYPES
        toAdd = arg;
      }
    }
    
    for (var i = 0, len = toAdd.length; i < len; i++) {
      var x = toAdd[i];
      if (x instanceof Set) {
        this.union(x);
      } else {
        this.add(x);
      }
    }
  }

  // -------------------------------------------------------------------------- 

  Set.prototype.iter = function(f) {
    for (var e in this.data) {
      if (this.data.hasOwnProperty(e)) {
        f(e);
      }
    }
  };

  // -------------------------------------------------------------------------- 

  Set.prototype.equals = function(x) {
    return (this.isSubset(x) && x.isSubset(this));
  };

  // -------------------------------------------------------------------------- 

  Set.prototype.add = function(x) {
    this.data[x] = true;
  };
  
  // -------------------------------------------------------------------------- 
  
  Set.prototype.union = function(x) {
    for (var e in x.data) {
      if (x.data.hasOwnProperty(e)) {
        this.data[e] = true;
      }
    }
  };

  // -------------------------------------------------------------------------- 

  Set.prototype.del = function(x) {
    delete this.data[x];
  };

  // -------------------------------------------------------------------------- 

  Set.prototype.intersect = function(x) {
    for (var e in this.data) {
      if (this.data.hasOwnProperty(e) && !x.data.hasOwnProperty(e)) {
        this.del(e);
      }
    }
  };

  // -------------------------------------------------------------------------- 

  Set.prototype.isSubset = function(x) {
    for (var e in x.data) {
      if (x.data.hasOwnProperty(e) && !this.data.hasOwnProperty(e)) {
        return false;
      }
    }

    return true;
  };

  // -------------------------------------------------------------------------- 

  Set.prototype.contains = function(x) {
    return this.data.hasOwnProperty(x);
  };
 
  // -------------------------------------------------------------------------- 

  Set.prototype.toString = function() {
    var acc = [];
    for (var x in this.data) {
      if (this.data.hasOwnProperty(x)) {
        acc.push(x);
      }
    }

    if (acc.length === 0) {
      return '';
    }

    var str = acc[0];
    for (var i = 1, len = acc.length; i < len; i++) {
      str += ',' + acc[i];
    }

    return str;
  };

*/