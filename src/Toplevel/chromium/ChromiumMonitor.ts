import { PolicyMonitorBase } from '../PolicyMonitorBase';
import { SecurityPolicy, ValueUnlabeler } from '../Policy';
import * as path from 'path';
import * as fs from 'fs';
import { Instances } from '../../Instances';
import { GlobalObject } from '../../Objects/GlobalObject';
import { WindowObject } from './WindowObject';
import { Value } from "../../Value";
import { bot } from '../../Label';
import { LexicalEnvironment } from '../../LexicalEnvironment';
import { NewObjectEnvironment } from '../../ObjectEnvironmentRecord';
import { executeGlobalCode } from '../../Engine/Execute';
import { unlabelValue, unlabel } from '../Entity';
import { isJSFlowError } from "../../Error";
import { Stack } from '../../Stack';
import { Context } from '../../Context';
import { monitorEventLoopDelay } from 'perf_hooks';

export class ChromiumMonitor extends PolicyMonitorBase {

  policy: SecurityPolicy;

  instances: Instances;
  GlobalObject: GlobalObject;
  GlobalEnvironment: LexicalEnvironment;

  url : string;

  constructor(global, print, log, info, warn, error) {
    super(global, print, log, info, warn, error);

    let policies = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../policies/chrome-policy.json'), 'utf8'));
    this.policy = new SecurityPolicy(policies);

    this.instances = new Instances(global);
    this.instances.Setup();

    this.GlobalObject = new WindowObject(global);

    this.GlobalEnvironment = NewObjectEnvironment(new Value(this.GlobalObject, bot), new Value(null, bot));
    this.context.thisValue = new Value(this.GlobalObject, bot);
    this.context.variableEnv = new Value(this.GlobalEnvironment, bot);
    this.context.lexicalEnv = new Value(this.GlobalEnvironment, bot);

    // Set options for the exeuction
    this.options.set('monitor.observableMode', true);
    this.options.set('monitor.babel', true);

    this.url = 'none';
  }

  
  // executes code, and 
  // unlabels result and excpetions
  executeAndUnlabelResult(code: string, url: string | null | undefined, preventTranspile : boolean): any {

    // script addition may interleave executions - save old context stack and old url - and reset it before returning (in the finally below)
    let savedContextStack = this.contextStack;
    this.contextStack = new Stack();
    let context = new Context(new Value(this.GlobalObject, bot), new Value(this.GlobalEnvironment, bot), new Value(this.GlobalEnvironment, bot));
    this.contextStack.push(context);

    let savedUrl = this.url;
    let savedCode = this.code;

    // suppress reporting from runtime bundles (preventTranspile)
    let babel = this.options.get('monitor.babel');
    let progress = this.options.get('monitor.progress');
    let info = this.info;
    let taintMode = this.options.get('monitor.taintMode');
    let log = this.log;

    if (preventTranspile) {
      this.info("Executing runtime bundle (or other source with transpile prevented). Logging and transpiling suppressed. Taint mode temporarilly activated.");
      this.options.set('monitor.babel', false);
      this.options.set('monitor.progress', false);
      this.options.set('monitor.taintMode', true);
      this.info = () => {};
      this.log = () => {};
    }

    // we use an undefined value unlabel model for now, if we want to accumulate the stripped labels, we need to change this
    let unlabeler = new ValueUnlabeler(undefined, url);

    if (url !== null && url !== undefined && url !== "") {
      this.url = url;
    } else {
      this.url = 'unknown_script_source';
    }

    this.info('Executing', this.url);
    this.info("Script source: -----------------------------------------------------------------");
    this.info(`${code.slice(0,76)} ...`);
    this.info("--------------------------------------------------------------------------------");

    // save stack markers in the event of a toplevel exception; then we must reset state for future executions to work
    let pcmarker = this.context.pcStack.marker();
    let vsmarker = this.context.valueStack.marker();

    try {
      let result = executeGlobalCode(code, url);

      switch (result.type) {
        case "break":
        case "continue":
        case "return":
          // should not occur - should have given syntax error if break, continue or return on top level
          // we be handled appropriately by catch below
          this.fatal(`${result.type} should not reach the top level`);
          break;
        
        // it seems that instructions that leave an undefined value on normal execution do not always lift this
        // to a Value
        case "normal":
          if (result.value instanceof Value) {
            return unlabelValue(result.value, unlabeler, this.policy.globalmodelstate);
          }

          return result.value;

        case "throw":
          this.error('[JSFlow NORMAL] Exception \n', result.value.toString());
      }

    } catch (e) {
      /* : SecurityError | FatalError | ErrorObject | any */

      // if an exception propagates to the top level we must reset the state
      this.context.pcStack.reset(pcmarker);
      this.context.valueStack.reset(vsmarker);

      if (isJSFlowError(e)) {
        switch (e.type) {
          case "SecurityError":
            this.error('[JSFlow NORMAL] Security Error:', e);
            break;
          case "FatalError":
            this.error('[JSFlow FATAL] JSFlow caused:', e);
            break;
        }
      }

      // JSFlow caused an exception - pass it on to get the right stack trace.
      if (e instanceof Error) {
        throw e;
      }

      this.error('[JSFlow FATAL] JSFlow caused', e);
    }
    finally {
      this.contextStack = savedContextStack;

      this.info(`Done executing ${this.url}, restoring to ${savedUrl}`);
      if (savedCode !== undefined) {
        this.info("Script source: -----------------------------------------------------------------");
        this.info(`${savedCode.slice(0,76)} ...`);
        this.info("--------------------------------------------------------------------------------");
      }

      this.url = savedUrl;
      this.code = savedCode;

      // restore reporting
      if (preventTranspile) {
        this.options.set('monitor.babel', babel);
        this.options.set('monitor.progress', progress);
        this.options.set('monitor.taintMode', taintMode);
        this.log = log;
        this.info = info;
        this.info("Execution of runtime bundle (or other source with transpile prevented) done. Logging and transpiling restored. ")
      }
    }
  }

  // ---

  securityError(message: string): void {
    // supress all security errors
  }

  // ---


  ExecuteModule(path: string): void {
    throw new Error("Modules not supported by ChromiumMonitor");
  }

}
