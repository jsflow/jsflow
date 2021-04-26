// --------------------------------------------------------------------------

type JSFlowErrorType = 'SecurityError' | 'FatalError';

// JSFlowError are errors that cannot be caught, and causes termination of the execution

export interface JSFlowError extends Error {
  type: JSFlowErrorType;
}

export function isJSFlowError(e: any): e is JSFlowError {
  return e !== undefined && e !== null && e.type !== undefined;
}

// --------------------------------------------------------------------------

export class SecurityError extends Error implements JSFlowError {
  type: JSFlowErrorType;

  constructor(msg: string) {
    super(msg);
    this.type = 'SecurityError';
  }
}

// --------------------------------------------------------------------------

export class FatalError extends Error implements JSFlowError {
  type: JSFlowErrorType;

  constructor(msg: string) {
    super(msg);
    this.type = 'FatalError';
  }
}