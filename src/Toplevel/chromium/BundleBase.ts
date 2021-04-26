import { ChromiumMonitor } from './ChromiumMonitor';
import * as sms from 'source-map-support';


let global = (function() { 
    //@ts-ignore; implicit any type of this
    return this; 
})();

let sms = require('source-map-support');
sms.install();
//@ts-ignore TYPES
global.jsflow = new ChromiumMonitor(global, console.log, () => {}, console.info , console.warn,  console.error);
