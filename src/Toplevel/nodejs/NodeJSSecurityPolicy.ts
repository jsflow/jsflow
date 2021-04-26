import { Policy, SecurityPolicy, PolicyLabelModel, Labeler, TranformerFactory, UnknownLabeler } from "../Policy";

export interface NodeJSPolicy extends Policy {
    modules : { [key: string] : PolicyLabelModel }
}

export class NodeJSSecurityPolicy extends SecurityPolicy {

    modules : { [key: string] : Labeler } = {};

    constructor(policy : NodeJSPolicy) {
        super(policy);

        for (let name in policy.modules) {
            this.modules[name] = TranformerFactory.MakeObjectLabeler(policy.labelmodels[name], name);
        }
    }

    GetModuleLabeler(name : string) : Labeler {
        if (this.modules[name] === undefined) {
            this.modules[name] = new UnknownLabeler(name);
        }
        return this.modules[name];
    }

}