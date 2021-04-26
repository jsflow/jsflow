import { EcmaObject } from '../Objects/EcmaObject';
import { SecurityPolicy } from './Policy';
import { BabelMonitorBase } from '../BabelMonitorBase';

export abstract class PolicyMonitorBase extends BabelMonitorBase  {

    abstract policy : SecurityPolicy;
    entitymap : WeakMap<object, EcmaObject >;

    constructor(global, print, log, info, warn, error) {
      super(global, print, log, info, warn, error);

      this.entitymap = new WeakMap();

    }

  }

  