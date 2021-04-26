import { JSFlowMonitor } from './JSFlowMonitor';
import * as sms from 'source-map-support';


let sms = require('source-map-support');
sms.install();
//@ts-ignore TYPES
jsflow.monitor = new JSFlowMonitor(window);
