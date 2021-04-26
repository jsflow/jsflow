import { isJSFlowError } from '../Error';
import { Value } from '../Value';
import { ErrorObject } from '../Objects/ErrorObject';
import { NativeErrorObject } from '../Objects/NativeErrorObject';

export function ReportException(e: any) {
    if (isJSFlowError(e)) {
      switch (e.type) {
        case "FatalError":
          // a fatal error is caused by an error in jsflow - terminate
          throw e;
  
        case "SecurityError":
          console.error(String(e));
      }
    }

  
    if (e instanceof Value) {
      if (e.value instanceof ErrorObject || e.value instanceof NativeErrorObject) {
        console.error(String(e.value));
        return;
      }
  
      console.log(`Error: ${e}`);
    }

    throw e;
  }