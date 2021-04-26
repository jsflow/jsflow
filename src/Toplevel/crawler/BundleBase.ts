import * as sms from 'source-map-support';
import { CrawlerMonitor } from './CrawlerMonitor';


let global = (function() { 
    //@ts-ignore; implicit any type of this
    return this; 
})();

let sms = require('source-map-support');
sms.install();
global.jsflow = new CrawlerMonitor(global, console.log, () => {}, console.info, console.warn, console.error);
