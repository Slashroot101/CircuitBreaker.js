import { DependencyManager } from "./Dependencymanager";
import { ICircuitBreakerOptions, CircuitBreakerState } from "./types";

export class CircuitBreaker {
  public state: CircuitBreakerState;
  private action: Function;
  private failureThreshold: number;
  private failureCount: number;
  private successThreshold: number;
  private successCount: number;
  private timeout: number;
  private nextAttempt: Date;
  private dependencies: DependencyManager;

  constructor(options: ICircuitBreakerOptions){
    this.state = options.state || CircuitBreakerState.CLOSED;
    this.action = options.action;
    this.failureThreshold = options.failureThreshold || 3;
    this.failureCount = 0;
    this.successThreshold = options.successThreshold  || 2;
    this.successCount = 0;
    this.timeout = options.timeout || 1000;
    this.nextAttempt = new Date();
    this.dependencies = options.dependencies;
  }

  status(action: string) {
    console.table({
      Action: action,
      Timestamp: Date.now(),
      Successes: this.successCount,
      Failures: this.failureCount,
      State: this.state
    })
  }

  //logic that will be executed when the circuit breaker is in the OPEN state
  async fire(...args: any[]){
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.nextAttempt <= new Date()) {
        this.state = CircuitBreakerState.HALF_OPEN;
      }
    }

    try {
      const response = await this.action(args);
      return this.success(response);
    } catch (err: any) {
      console.log('failed')
      return this.fail(args);
    }
  }

  //handle fallback, if no dependencies are available, return an error
  async tryFallback(index: number, dependencies: DependencyManager, ...args: any[]): Promise<any>{
    const dependency = this.dependencies?.getNextBestDependency(index);
    if(!dependency){
      return new Error("No dependencies available");
    }
    try {
      const resp = await dependency.fallback(args);
      await this.dependencies.reportRequest(dependency.dependencyName, true);
      return resp;
    } catch (err: any) {
      await this.dependencies.reportRequest(dependency.dependencyName, false);
      return this.tryFallback(index + 1, dependencies, args);
    }
  }

  //logic that handles succesful requests
  success(response: any){
    if(this.state === CircuitBreakerState.HALF_OPEN){
      this.successCount++;

      if(this.successCount > this.successThreshold){
        this.successCount = 0;
        this.state = CircuitBreakerState.CLOSED;
      }
    }
    this.status("Success");
    this.failureCount = 0;
    return response;
  }

  //logic that handles failed requests
  fail(...args: any[]): any {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttempt = new Date(Date.now() + this.timeout);
    }
    this.status("Failure");
    return this.tryFallback(0, this.dependencies, args);
  }
}