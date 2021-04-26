import { IEnvironmentRecord, ValueTypes, IEcmaObject } from "./Interfaces";
import { ObjectEnvironmentRecord } from "./ObjectEnvironmentRecord";
import { DeclarativeEnvironmentRecord } from "./DeclarativeEnvironmentRecord";
import { Value } from "./Value";
import { MonitorBase } from "./MonitorBase";

declare var monitor: MonitorBase;

// ---

export class LexicalEnvironment implements IEnvironmentRecord {

  EnvironmentRecord: ObjectEnvironmentRecord | DeclarativeEnvironmentRecord;
  OuterLexicalEnvironment: Value<LexicalEnvironment>;

  constructor(er: ObjectEnvironmentRecord | DeclarativeEnvironmentRecord, le: Value<LexicalEnvironment>) {
    this.EnvironmentRecord = er;
    this.OuterLexicalEnvironment = le;
  }

  provideThis(): void {
    if (this.EnvironmentRecord instanceof ObjectEnvironmentRecord) {
      this.EnvironmentRecord.provideThis = true;
    }
  }

  HasBinding(s: Value<string>): Value<boolean> {
    return this.EnvironmentRecord.HasBinding(s);
  }

  CreateMutableBinding(p: Value<string>, d?: boolean): void {
    return this.EnvironmentRecord.CreateMutableBinding(p, d);
  }

  SetMutableBinding(p: Value<string>, v: Value<ValueTypes>, s?: boolean): void {
    return this.EnvironmentRecord.SetMutableBinding(p, v, s);
  }

  GetBindingValue(p: Value<string>, s?: boolean): Value<ValueTypes> {
    return this.EnvironmentRecord.GetBindingValue(p, s);
  }

  DeleteBinding(p: Value<string>): Value<boolean> {
    return this.EnvironmentRecord.DeleteBinding(p);
  }

  ImplicitThisValue(): Value<IEcmaObject | undefined> {
    return this.EnvironmentRecord.ImplicitThisValue();
  }

  // TODO: fix
  // Only meaningful if the underlying environment record is 
  //  a declarative environment record
  CreateImmutableBinding(p: Value<string>, s?: boolean): void {
    //@ts-ignore TYPES
    this.EnvironmentRecord.CreateImmutableBinding(p);
  }

  InitializeImmutableBinding(p : Value<string>, v : Value<ValueTypes>) : void  {
    //@ts-ignore TYPES
    this.EnvironmentRecord.InitializeImmutableBinding(p, v);
  }

}