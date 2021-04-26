/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


export type StackMarker = { length : number };

 export class Stack<T> {

  content : T[];

  constructor() {
    this.content = [];
  }

  push(v : T) : void {

    this.content.push(v);
  }

  pop() : T {
    if (this.content.length === 0) {
      throw new Error('Empty Stack');
    }

    //@ts-ignore
    return this.content.pop();
  }

  peek() {
    if (this.content.length === 0) {
      throw new Error('Empty Stack');
    }
    return this.content[this.content.length - 1];
  }

  dup() {
    this.push(this.peek());
  }

  marker() : StackMarker {
    return { length: this.content.length };
  }

  reset(m : StackMarker) : void {
    this.content.length = m.length;
  }

  iter(f: (x: T) => void ): void {
    for (var i = 0, len = this.content.length; i < len; i++) {
      f(this.content[i]);
    }
  }

  map(f: (x : T) => T, m : StackMarker) : void {
    for (var i = m.length, len = this.content.length; i < len; i++) {
      this.content[i] = f(this.content[i]);
    }
  }

  size() : number {
    return this.content.length;
  }

  empty() : boolean {
    return this.content.length === 0;
  }

  toArray() : T[] {
    return this.content.slice(0);
  }
}
