import { DependencyManager } from "../Dependencymanager";

 type CircuitBreakerOptions = {
  state: CircuitBreakerState | null;
  action: Function;
  failureThreshold: number | null;
  successThreshold: number | null;
  timeout: number | null;
  dependencies: DependencyManager;
}

export interface ICircuitBreakerOptions extends Partial<CircuitBreakerOptions>{
  action: Function;
  dependencies: DependencyManager;
}

export enum CircuitBreakerState {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  HALF_OPEN = 'HALF_OPEN'
}

export type DependencyConfiguration = {
  dependencyName: string;
  healthCheck: HealthCheckFunction;
  //tolerance expressed as a percentage of requests that can fail before we fall over
  tolerance: number;
  priority: number;
}

type HealthCheckFunction = (dependency: DependencyConfiguration) => Promise<{dependencyName: string, healthy: boolean}>;