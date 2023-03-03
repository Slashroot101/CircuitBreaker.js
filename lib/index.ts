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
  private fallback: Function;

  constructor(options: ICircuitBreakerOptions){
    this.state = options.state || CircuitBreakerState.CLOSED;
    this.action = options.action;
    this.fallback = options.fallback;
    this.failureThreshold = options.failureThreshold || 3;
    this.failureCount = 0;
    this.successThreshold = options.successThreshold  || 2;
    this.successCount = 0;
    this.timeout = options.timeout || 1000;
    this.nextAttempt = new Date();
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

  async tryFallback(...args: any[]){
    try {
      return await this.fallback(args);
    } catch (err: any) {
      return err;
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
    return this.tryFallback(args);
  }
}