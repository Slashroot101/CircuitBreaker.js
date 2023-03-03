 type CircuitBreakerOptions = {
  state: CircuitBreakerState | null;
  action: Function;
  fallback: Function;
  failureThreshold: number | null;
  successThreshold: number | null;
  timeout: number | null;
}

export interface ICircuitBreakerOptions extends Partial<CircuitBreakerOptions>{
  action: Function;
  fallback: Function;
}

export enum CircuitBreakerState {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  HALF_OPEN = 'HALF_OPEN'
}