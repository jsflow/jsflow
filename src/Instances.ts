
import { FunctionPrototype } from './Prototypes/FunctionPrototype';
import { FunctionConstructor } from './Constructors/FunctionConstructor';
import { ObjectConstructor } from './Constructors/ObjectConstructor';
import { ObjectPrototype } from './Prototypes/ObjectPrototype';

import { ErrorPrototype } from './Prototypes/ErrorPrototype';
import { ErrorConstructor } from './Constructors/ErrorConstructor';

import { EvalErrorPrototype } from './Prototypes/EvalErrorPrototype';
import { EvalErrorConstructor } from './Constructors/EvalErrorConstructor';

import { RangeErrorPrototype } from './Prototypes/RangeErrorPrototype';
import { RangeErrorConstructor } from './Constructors/RangeErrorConstructor';

import { ReferenceErrorPrototype } from './Prototypes/ReferenceErrorPrototype';
import { ReferenceErrorConstructor } from './Constructors/ReferenceErrorConstructor';

import { SyntaxErrorPrototype } from './Prototypes/SyntaxErrorPrototype';
import { SyntaxErrorConstructor } from './Constructors/SyntaxErrorConstructor';

import { TypeErrorPrototype } from './Prototypes/TypeErrorPrototype';
import { TypeErrorConstructor } from './Constructors/TypeErrorConstructor';

import { URIErrorPrototype } from './Prototypes/URIErrorPrototype';
import { URIErrorConstructor } from './Constructors/URIErrorConstructor';

import { BooleanConstructor } from './Constructors/BooleanConstructor';
import { BooleanPrototype } from './Prototypes/BooleanPrototype';
import { ArrayPrototype } from './Prototypes/ArrayPrototype';
import { ArrayConstructor } from './Constructors/ArrayConstructor';

import { NumberPrototype } from './Prototypes/NumberPrototype';
import { NumberConstructor } from './Constructors/NumberConstructor';

import { StringPrototype } from './Prototypes/StringPrototype';
import { StringConstructor } from './Constructors/StringConstructor';

import { RegExpPrototype } from './Prototypes/RegExpPrototype';
import { RegExpConstructor } from './Constructors/RegExpConstructor';

import { DatePrototype } from './Prototypes/DatePrototype';
import { DateConstructor } from './Constructors/DateConstructor';

import { MathObject } from './Objects/MathObject';
import { JSONObject } from './Objects/JSONObject';


export class Instances {

    FunctionConstructor : FunctionConstructor;
    FunctionPrototype : FunctionPrototype;
  
    ObjectConstructor : ObjectConstructor;
    ObjectPrototype : ObjectPrototype;
  
    ErrorConstructor : ErrorConstructor;
    ErrorPrototype : ErrorPrototype;
  
    EvalErrorConstructor : EvalErrorConstructor;
    EvalErrorPrototype : EvalErrorPrototype;
  
    RangeErrorConstructor : RangeErrorConstructor;
    RangeErrorPrototype : RangeErrorPrototype;
  
    ReferenceErrorConstructor : ReferenceErrorConstructor;
    ReferenceErrorPrototype : ReferenceErrorPrototype;
  
    SyntaxErrorConstructor : SyntaxErrorConstructor;
    SyntaxErrorPrototype : SyntaxErrorPrototype;
  
    TypeErrorConstructor : TypeErrorConstructor;
    TypeErrorPrototype : TypeErrorPrototype;
  
    URIErrorConstructor : URIErrorConstructor;
    URIErrorPrototype : URIErrorPrototype;
  
    BooleanConstructor : BooleanConstructor;
    BooleanPrototype : BooleanPrototype;
  
    ArrayConstructor : ArrayConstructor;
    ArrayPrototype : ArrayPrototype;

    NumberConstructor : NumberConstructor;
    NumberPrototype : NumberPrototype;
  
    StringConstructor : StringConstructor;
    StringPrototype : StringPrototype;
  
    RegExpConstructor : RegExpConstructor;
    RegExpPrototype : RegExpPrototype;

    DateConstructor : DateConstructor;
    DatePrototype : DatePrototype;

    MathObject : MathObject;
    JSONObject : JSONObject;
  
    constructor(global) {
      // pre-allocates instances, without setting them up due to circularity
      this.FunctionConstructor = new FunctionConstructor(global.Function);
      this.FunctionPrototype = new FunctionPrototype(global.Function.prototype);
  
      this.ObjectConstructor = new ObjectConstructor(global.Object);
      this.ObjectPrototype = new ObjectPrototype(global.Object.prototype);
  
      this.ErrorConstructor = new ErrorConstructor(global.Error);
      this.ErrorPrototype  = new ErrorPrototype(global.Error.prototype);
  
      this.EvalErrorConstructor = new EvalErrorConstructor(global.EvalError);
      this.EvalErrorPrototype  = new EvalErrorPrototype(global.EvalError.prototype);
  
      this.RangeErrorConstructor = new RangeErrorConstructor(global.RangeError);
      this.RangeErrorPrototype  = new RangeErrorPrototype(global.RangeError.prototype);
  
      this.ReferenceErrorConstructor = new ReferenceErrorConstructor(global.ReferenceError);
      this.ReferenceErrorPrototype  = new ReferenceErrorPrototype(global.ReferenceError.prototype);
  
      this.SyntaxErrorConstructor = new SyntaxErrorConstructor(global.SyntaxError);
      this.SyntaxErrorPrototype  = new SyntaxErrorPrototype(global.SyntaxError.prototype);
  
      this.TypeErrorConstructor = new TypeErrorConstructor(global.TypeError);
      this.TypeErrorPrototype  = new TypeErrorPrototype(global.TypeError.prototype);
      
      this.URIErrorConstructor = new URIErrorConstructor(global.URIError);
      this.URIErrorPrototype  = new URIErrorPrototype(global.URIError.prototype);
  
      this.BooleanConstructor = new BooleanConstructor(global.Boolean);
      this.BooleanPrototype = new BooleanPrototype(global.Boolean.prototype);
      
      this.ArrayConstructor = new ArrayConstructor(global.Array);
      this.ArrayPrototype = new ArrayPrototype(global.Array.prototype);
  
      this.NumberConstructor = new NumberConstructor(global.Number);
      this.NumberPrototype = new NumberPrototype(global.Number.prototype);

      this.StringConstructor = new StringConstructor(global.String);
      this.StringPrototype = new StringPrototype(global.String.prototype);

      this.RegExpConstructor = new RegExpConstructor(global.RegExp);
      this.RegExpPrototype = new RegExpPrototype(global.RegExp.prototype);

      this.DateConstructor = new DateConstructor(global.Date);
      this.DatePrototype = new DatePrototype(global.Date.prototype);

      this.MathObject = new MathObject(global.Math);
      this.JSONObject = new JSONObject(global.JSON);
    }
  
    Setup() {
    this.FunctionConstructor.Setup();
    this.FunctionPrototype.Setup(); 
  
    this.ObjectConstructor.Setup();
    this.ObjectPrototype.Setup();

    this.ErrorConstructor.Setup();
    this.ErrorPrototype.Setup();

    this.EvalErrorConstructor.Setup();
    this.EvalErrorPrototype.Setup();

    this.RangeErrorConstructor.Setup();
    this.RangeErrorPrototype.Setup();

    this.ReferenceErrorConstructor.Setup();
    this.ReferenceErrorPrototype.Setup();

    this.SyntaxErrorConstructor.Setup();
    this.SyntaxErrorPrototype.Setup();

    this.TypeErrorConstructor.Setup();
    this.TypeErrorPrototype.Setup();

    this.URIErrorConstructor.Setup();
    this.URIErrorPrototype.Setup();
  
    this.BooleanConstructor.Setup();
    this.BooleanPrototype.Setup();
  
    this.ArrayConstructor.Setup();
    this.ArrayPrototype.Setup();
  
    this.NumberConstructor.Setup();
    this.NumberPrototype.Setup();
  
    this.StringConstructor.Setup();
    this.StringPrototype.Setup();

    this.RegExpConstructor.Setup();
    this.RegExpPrototype.Setup();

    this.DateConstructor.Setup();
    this.DatePrototype.Setup();

    this.MathObject.Setup();
    this.JSONObject.Setup();
    }
  }