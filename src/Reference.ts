import { Value } from "./Value";
import { EcmaObject } from './Objects/EcmaObject';
import { DeclarativeEnvironmentRecord } from "./DeclarativeEnvironmentRecord";
import { ObjectEnvironmentRecord } from "./ObjectEnvironmentRecord";

export type ReferenceType = undefined | boolean | string | number | EcmaObject | DeclarativeEnvironmentRecord | ObjectEnvironmentRecord;

export class Reference {

    base: Value<ReferenceType>;
    propertyName: Value<string>;

    constructor(base : Value<ReferenceType>, propertyName : Value<string>) {
        this.base = base;
        this.propertyName = propertyName;
    }

    GetBase(): Value<ReferenceType> {
        return this.base;
    }

    GetReferencedName(): Value<string> {
        return this.propertyName;
    }

    HasPrimitiveBase(): boolean {
        return (
            typeof this.base.value === 'boolean' ||
            typeof this.base.value === 'string' ||
            typeof this.base.value === 'number'
        );
    }

    IsPropertyReference(): boolean {
        return (
            typeof this.base.value === 'boolean' ||
            typeof this.base.value === 'string' ||
            typeof this.base.value === 'number' ||
            this.base.value !== undefined && "Class" in this.base.value
        );
    }

    IsUnresolvableReference(): boolean {
        return (this.base.value === undefined);
    }

    toString(): string {
        return ('@(' + this.base + ',' + this.propertyName + ')');
    }
}
