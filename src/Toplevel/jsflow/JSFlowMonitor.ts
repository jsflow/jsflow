import { MonitorBase } from "../../MonitorBase";
import { GlobalObject } from "../../Objects/GlobalObject";
import { Instances } from "../../Instances";
import { Value } from "../../Value";
import { bot, Label } from "../../Label";
import { NewObjectEnvironment } from "../../ObjectEnvironmentRecord";
import { LexicalEnvironment } from "../../LexicalEnvironment";
import { CommonJSModule } from "../../Module/CommonJS/Module";

// --------------------------------------------------------------------------

export class JSFlowMonitor extends MonitorBase {

    instances: Instances;
    GlobalObject: GlobalObject;
    GlobalEnvironment: LexicalEnvironment;

    module : CommonJSModule;

    labelBot: Label;

    constructor(
        global: any,
        print: (...rest: any[]) => void,
        log: (...rest: any[]) => void,
        info: (...rest: any[]) => void,
        warn: (...rest: any[]) => void,
        error: (...rest: any[]) => void
    ) {
        super(global, print, log, info, warn, error);

        this.instances = new Instances(global);
        this.instances.Setup();

        this.GlobalObject = new GlobalObject(global);

        this.GlobalEnvironment = NewObjectEnvironment(new Value(this.GlobalObject, bot), new Value(null, bot));
        this.context.thisValue = new Value(this.GlobalObject, bot);
        this.context.variableEnv = new Value(this.GlobalEnvironment, bot);
        this.context.lexicalEnv = new Value(this.GlobalEnvironment, bot);

        this.module = new CommonJSModule();
        this.GlobalObject.Put(new Value('module', bot), new Value(this.module, bot), false);
        this.GlobalObject.Put(new Value('require', bot), new Value(this.module.require, bot), false);

        this.labelBot = bot;
    }

    ExecuteModule(path : string): void {
        CommonJSModule.LoadModule(new Value(path, bot));
    }

}