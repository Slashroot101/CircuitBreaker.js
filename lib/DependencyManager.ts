import { DependencyConfiguration } from "./types";
import {RingBuffer} from 'ring-buffer-ts'

export class DependencyManager {
  private dependencies: DependencyConfiguration[];
  private dependencyStatus: Map<string, {healthy: boolean, requestBuffer: RingBuffer<{occurence: Date, success: boolean}>}> = new Map();
  public readonly ticker;
  constructor(intervalTime: number) {
    this.dependencies = [];
    this.ticker = setInterval(async () => {
      await this.evaluateDependencies();
    }, intervalTime);
    return this;
  }

  public async evaluateDependencies() {
    const healthChecks = await Promise.allSettled(this.dependencies.map(async (dependency) => dependency.healthCheck(dependency)));

    healthChecks.forEach(x => {
      if(x.status === 'fulfilled'){
        this.dependencyStatus.set(x.value.dependencyName, {healthy: x.value.healthy, requestBuffer: new RingBuffer(100)});
      }
    });
  }

  public getNumberOfDependencies() {
    return this.dependencies.length;
  }

  public reportRequest(name: string, success: boolean) {
    const dependencyStatus = this.dependencyStatus.get(name);
    if(!dependencyStatus) {throw new Error('Dependency not found')};
    dependencyStatus.requestBuffer?.add({occurence: new Date(), success});

    const isHealthy = this.isDependencyHealthy(name);

    if(!isHealthy){
      this.dependencyStatus.set(name, {healthy: isHealthy, requestBuffer: new RingBuffer(100)});
    }
  }

  public isDependencyHealthy(name: string) {
    const dependency = this.dependencies.filter(x => x.dependencyName === name)[0];
    const dependencyStatus = this.dependencyStatus.get(name);
    if(!dependency || !dependencyStatus) {throw new Error('Dependency not found')};
    const tolerance = dependency.tolerance;

    const requests = this.dependencyStatus.get(dependency.dependencyName)?.requestBuffer?.toArray();

    const failures = requests?.filter(x => x.success === false).length || 0;

    if(!requests){
      return dependencyStatus.healthy;
    }

    if(failures / requests.length > tolerance * .01){
      return false;
    }

    return dependencyStatus.healthy;
  }
  

  public getNextBestDependency(index: number){
    const healthyDependencies = this.dependencies.filter(x => this.dependencyStatus.get(x.dependencyName)?.healthy === true);
    if(!healthyDependencies.length){
      return null;
    }
    healthyDependencies.sort((a, b) => a.priority - b.priority);
    if(index > healthyDependencies.length){
      return healthyDependencies[healthyDependencies.length - 1];
    }
    return healthyDependencies[index];
  }

  public close(){
    clearInterval(this.ticker);
  }

  public register(dependency: DependencyConfiguration): DependencyManager {
    const existingDependency = this.dependencies.filter(x=> x.dependencyName === dependency.dependencyName);

    if(existingDependency.length){
      return this;
    }

    this.dependencies.push(dependency);
    return this;
  }

  public get(name: string) {
    return this.dependencies.filter( x=> x.dependencyName === name)[0];
  }
}