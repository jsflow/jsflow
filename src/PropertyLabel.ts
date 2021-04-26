import { Label } from "./Label";

export class PropertyLabel {
  public value: Label;
  public existence: Label;
  
  constructor(value: Label, existence: Label) {
    this.value = value;
    this.existence = existence;
  }
}
