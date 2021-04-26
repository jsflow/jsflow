import * as path from 'path';
import * as fs from 'fs';
import { bot } from '../../Label';
import { Value } from "../../Value";
import { NodeJSSecurityPolicy } from './NodeJSSecurityPolicy';
import { Instances } from '../../Instances';
import { NodeGlobalObject } from './NodeJSGlobalObject';
import { LexicalEnvironment } from '../../LexicalEnvironment';
import { NewObjectEnvironment } from '../../ObjectEnvironmentRecord';
import { NodeJSModule } from '../../Module/Node/Module';
import { PolicyMonitorBase } from '../PolicyMonitorBase';

export class NodeJSMonitor extends PolicyMonitorBase {

  policy: NodeJSSecurityPolicy;
  instances: Instances;
  GlobalObject: NodeGlobalObject;
  GlobalEnvironment: LexicalEnvironment;

  module?: NodeJSModule;

  constructor(
    global: any,
    print: (...rest: any[]) => void,
    log: (...rest: any[]) => void,
    info: (...rest: any[]) => void,
    warn: (...rest: any[]) => void,
    error: (...rest: any[]) => void
  ) {
    super(global, print, log, info, warn, error);

    let policies = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../policies/nodejs-policy.json'), 'utf8'));
    this.policy = new NodeJSSecurityPolicy(policies);

    this.instances = new Instances(global);
    this.instances.Setup();

    this.GlobalObject = new NodeGlobalObject(global);

    this.GlobalEnvironment = NewObjectEnvironment(new Value(this.GlobalObject, bot), new Value(null, bot));
    this.context.thisValue = new Value(this.GlobalObject, bot);
    this.context.variableEnv = new Value(this.GlobalEnvironment, bot);
    this.context.lexicalEnv = new Value(this.GlobalEnvironment, bot);
  }

  // ---

  SetupInteractive() {
    this.module = new NodeJSModule();
    this.GlobalObject.Put(new Value('module', bot), new Value(this.module, bot), false);
    this.GlobalObject.Put(new Value('require', bot), new Value(this.module.require, bot), false);
  }

  // ---

  ExecuteModule(path: string): void {
    NodeJSModule.LoadModule(new Value(path, bot));
  }


  Execute(code: string, origin: string, preventTranspile?: boolean) {
    if (this.module === undefined) {
      this.SetupInteractive();
    }
    return super.Execute(code, origin, preventTranspile);
  }

}
