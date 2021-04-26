import { MonitorBase } from "./MonitorBase";
import { IsCrawler } from "./Toplevel/crawler/CrawlerUtil";

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// -------------------------------------------------------------------------- 

// #CRAWLER

let include = {
  'global.AudioContext.destination.channelCount': true,
  'global.AudioContext.destination.channelCountMode': true,
  'global.AudioContext.destination.channelInterpretation': true,
  'global.AudioContext.destination.maxChannelCount': true,
  'global.AudioContext.destination.numberOfInputs': true,
  'global.AudioContext.destination.numberOfOutputs': true,
  'global.AudioContext.sampleRate': true,
  'global.HTMLFormElement.addBehavior': true,
  'global.HTMLFormElement.clientHeight': true,
  'global.HTMLFormElement.clientWidth': true,
  'global.HTMLFormElement.offsetHeight': true,
  'global.HTMLFormElement.offsetWidth': true,
  'global.Int8Array.reduce': true,
  'global.Int8Array.slice.reduce': true,
  'global.Intl.DateTimeFormat.resolvedOptions.timeZone': true,
  'global.OfflineAudioContext.oncomplete[0][0].renderedBuffer.getChannelData.reduce': true,
  'global.OfflineAudioContext.oncomplete[0][0].renderedBuffer.getChannelData.slice': true,
  'global.Plugin.description': true,
  'global.Plugin.length': true,
  'global.Plugin.name': true,
  'global.PluginArray.length': true,
  'global.RTCPeerConnection.onicecandidate[0][0].candidate.candidate': true,
  'global.WebGLRenderingContext': true,
  'global.XMLHttpRequest.readyState': true,
  'global.XMLHttpRequest.responseText': true,
  'global.XMLHttpRequest.status': true,
  'global.addBehavior': true,
  'global.devicePixelRatio': true,
  'global.doNotTrack': true,
  'global.document.appendChild': true,
  'global.document.body.addBehavior': true,
  'global.document.createElement.clientHeight': true,
  'global.document.createElement.clientWidth': true,
  'global.document.createElement.getContext.canvas': true,
  'global.document.createElement.getContext.getContextAttributes.antialias': true,
  'global.document.createElement.getContext.getExtension': true,
  'global.document.createElement.getContext.getParameter': true,
  'global.document.createElement.getContext.getParameter.0': true,
  'global.document.createElement.getContext.getParameter.1': true,
  'global.document.createElement.getContext.getShaderPrecisionFormat.precision': true,
  'global.document.createElement.getContext.getShaderPrecisionFormat.rangeMax': true,
  'global.document.createElement.getContext.getShaderPrecisionFormat.rangeMin': true,
  'global.document.createElement.getContext.getSupportedExtensions': true,
  'global.document.createElement.getContext.getSupportedExtensions.0': true,
  'global.document.createElement.getContext.getSupportedExtensions.1': true,
  'global.document.createElement.getContext.getSupportedExtensions.10': true,
  'global.document.createElement.getContext.getSupportedExtensions.11': true,
  'global.document.createElement.getContext.getSupportedExtensions.12': true,
  'global.document.createElement.getContext.getSupportedExtensions.13': true,
  'global.document.createElement.getContext.getSupportedExtensions.14': true,
  'global.document.createElement.getContext.getSupportedExtensions.15': true,
  'global.document.createElement.getContext.getSupportedExtensions.16': true,
  'global.document.createElement.getContext.getSupportedExtensions.17': true,
  'global.document.createElement.getContext.getSupportedExtensions.18': true,
  'global.document.createElement.getContext.getSupportedExtensions.19': true,
  'global.document.createElement.getContext.getSupportedExtensions.2': true,
  'global.document.createElement.getContext.getSupportedExtensions.20': true,
  'global.document.createElement.getContext.getSupportedExtensions.21': true,
  'global.document.createElement.getContext.getSupportedExtensions.22': true,
  'global.document.createElement.getContext.getSupportedExtensions.23': true,
  'global.document.createElement.getContext.getSupportedExtensions.24': true,
  'global.document.createElement.getContext.getSupportedExtensions.25': true,
  'global.document.createElement.getContext.getSupportedExtensions.3': true,
  'global.document.createElement.getContext.getSupportedExtensions.4': true,
  'global.document.createElement.getContext.getSupportedExtensions.5': true,
  'global.document.createElement.getContext.getSupportedExtensions.6': true,
  'global.document.createElement.getContext.getSupportedExtensions.7': true,
  'global.document.createElement.getContext.getSupportedExtensions.8': true,
  'global.document.createElement.getContext.getSupportedExtensions.9': true,
  'global.document.createElement.getContext.getSupportedExtensions.join': true,
  'global.document.createElement.getContext.getSupportedExtensions.length': true,
  'global.document.createElement.getContext.isPointInPath': true,
  'global.document.createElement.offsetHeight': true,
  'global.document.createElement.offsetWidth': true,
  'global.document.createElement.toDataURL': true,
  'global.document.createEvent': true,
  'global.document.getElementById': true,
  'global.document.getElementsByClassName': true,
  'global.document.getElementsByClassName.0': true,
  'global.document.getElementsByTagName': true,
  'global.document.getElementsByTagName.0.appendChild': true,
  'global.document.getElementsByTagName.0.offsetHeight': true,
  'global.document.getElementsByTagName.0.offsetWidth': true,
  'global.document.getElementsByTagName.appendChild': true,
  'global.document.getElementsByTagName.offsetHeight': true,
  'global.document.getElementsByTagName.offsetWidth': true,
  'global.indexedDB': true,
  'global.localStorage': true,
  'global.navigator.cookieEnabled': true,
  'global.navigator.cpuClass': true,
  'global.navigator.deviceMemory': true,
  'global.navigator.doNotTrack': true,
  'global.navigator.hardwareConcurrency': true,
  'global.navigator.language': true,
  'global.navigator.maxTouchPoints': true,
  'global.navigator.mediaDevices': true,
  'global.navigator.msDoNotTrack': true,
  'global.navigator.platform': true,
  'global.navigator.plugins': true,
  'global.navigator.plugins.0.0.suffixes': true,
  'global.navigator.plugins.0.0.type': true,
  'global.navigator.plugins.0.description': true,
  'global.navigator.plugins.0.forEach': true,
  'global.navigator.plugins.0.length': true,
  'global.navigator.plugins.0.name': true,
  'global.navigator.plugins.1.0.suffixes': true,
  'global.navigator.plugins.1.0.type': true,
  'global.navigator.plugins.1.description': true,
  'global.navigator.plugins.1.forEach': true,
  'global.navigator.plugins.1.length': true,
  'global.navigator.plugins.1.name': true,
  'global.navigator.plugins.2.0.suffixes': true,
  'global.navigator.plugins.2.0.type': true,
  'global.navigator.plugins.2.1.suffixes': true,
  'global.navigator.plugins.2.1.type': true,
  'global.navigator.plugins.2.description': true,
  'global.navigator.plugins.2.forEach': true,
  'global.navigator.plugins.2.length': true,
  'global.navigator.plugins.2.name': true,
  'global.navigator.plugins.description': true,
  'global.navigator.plugins.forEach': true,
  'global.navigator.plugins.length': true,
  'global.navigator.plugins.name': true,
  'global.navigator.plugins.suffixes': true,
  'global.navigator.plugins.type': true,
  'global.navigator.systemLanguage': true,
  'global.navigator.userAgent': true,
  'global.navigator.webdriver': true,
  'global.ontouchstart': true,
  'global.openDatabase': true,
  'global.screen.availHeight': true,
  'global.screen.availWidth': true,
  'global.screen.colorDepth': true,
  'global.screen.deviceXDPI': true,
  'global.screen.deviceYDPI': true,
  'global.screen.height': true,
  'global.screen.width': true,
  'global.sessionStorage': true,
  'global.swfobject': true
}

// 

enum Top { Top };

let MySet = Set;

declare var monitor: MonitorBase;

export class Label {

  principals: Set<string> | Top;

  constructor(p?: Top | string | string[], ...rest: string[]) {

    if (p === Top.Top) {
      this.principals = Top.Top;
      return;
    }

    this.principals = new MySet(rest);

    if (typeof p === "string") {
      // #CRAWLER - if not in the interesting label set, become bot
      if (!include[p]) {
        return;
      }
      this.principals.add(p);
      return;
    }

    if (typeof p !== 'undefined') {
      for (let x of p) {
        // #CRAWLER - if not in the interesting label set don't add
        if (include[x]) {
          this.principals.add(x);
        }
      }
    }
  }

  // -------------------------------------------------------------------------- 

  static fromString(l: string): Label {
    return new Label(l.split(','));
  }

  // -------------------------------------------------------------------------- 

  static fromURL(l: string): Label {
    var re = new RegExp('http://[^/]*/');
    var res = re.exec(l);
    if (res === null) {
      return new Label(l.split(','));
    } else {
      return new Label([res[0]]);
    }
  }

  // -------------------------------------------------------------------------- 

  equals(l: Label): boolean {

    let A = this.principals;
    let B = l.principals;

    if (A === Top.Top || B === Top.Top) {
      return A === B;
    }

    for (let p of A) {
      if (!B.has(p)) {
        return false;
      }
    }

    for (let p of B) {
      if (!A.has(p)) {
        return false;
      }
    }

    return true;
  }

  // -------------------------------------------------------------------------- 

  le(l: Label): boolean {

    let A = this.principals;
    let B = l.principals;

    if (B === Top.Top) {
      return true;
    }

    if (A === Top.Top) {
      return false;
    }

    for (let p of A) {
      if (!B.has(p)) {
        return false;
      }
    }

    return true;
  }

  // -------------------------------------------------------------------------- 

  toString(): string {
    let str = 'T';
    if (this.principals !== Top.Top) {
      str = Array.from(this.principals).join(', ');
    }
    return "<" + str + ">";
  }

  // ---

  ToArray() : Array<string> {
    if (this.principals === Top.Top) {
      return ["T"];
    }
    return Array.from(this.principals).sort();
  }
}

// -------------------------------------------------------------------------- 

export var top = new Label(Top.Top);
export var bot = new Label();

// -------------------------------------------------------------------------- 

export function le(l1 : Label, l2 : Label) {
  return (l1.le(l2));
}

export function ge(l1 : Label, l2 : Label) {
  return !l1.le(l2) || l1.equals(l2);
}

export function lub(...args : Label[]) {
  if(args.length === 0) {
    return bot;
  }

  let combinedPrincipals: Set<string> = new MySet();
  for(let l of args) {
    if(l.principals === Top.Top) {
      return top;
    }

    for(let p of l.principals) {
      combinedPrincipals.add(p);
    }
  }

  let ret = new Label();
  ret.principals = combinedPrincipals;

  // #CRAWLER
  if (IsCrawler(monitor)) {
    monitor.CrawlerData.AddGenerated(ret);
  }

  return ret;
}

export function glb(...args : Label[]) {
  if(args.length === 0) {
    return bot;
  }

  let intersectedPrincipals: Set<string> = new MySet();
  let allIsTop = true;
  for(let l of args) {
    if(l.principals !== Top.Top) {
      intersectedPrincipals = l.principals;
      allIsTop = false;
      break;
    }
  }

  if(allIsTop) {
    // All is Top!
    return top;
  }

  for(let l of args) {
    if(l.principals === Top.Top) {
      continue;
    }

    for(let p of intersectedPrincipals) {
      if(!l.principals.has(p)) {
        intersectedPrincipals.delete(p);
      }
    }
  }

  let ret = new Label();
  ret.principals = intersectedPrincipals;
  return ret;
}
