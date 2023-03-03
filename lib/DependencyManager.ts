import { DependencyConfiguration } from "./types";

export class DependencyManager {
  private dependencies: DependencyConfiguration[];
  private dependencyStatus: Map<string, boolean> = new Map();
  public readonly ticker;
  constructor(intervalTime: number) {
    this.dependencies = [];
    this.ticker = setInterval(async () => {
      await this.evaluateDependencies();
    }, intervalTime);
  }

  public async evaluateDependencies() {
    const healthChecks = await Promise.all(this.dependencies.map(async (dependency) => dependency.healthCheck(dependency)));

    healthChecks.forEach(x => {
      this.dependencyStatus.set(x.dependencyName, x.healthy);
    });
  }

  public getNumberOfDependencies() {
    return this.dependencies.length;
  }

  public getNextBestDependency(index: number){
    const healthyDependencies = this.dependencies.filter(x => this.dependencyStatus.get(x.dependencyName) === true);
    if(!healthyDependencies.length){
      return null;
    }
    healthyDependencies.sort((a, b) => a.priority - b.priority);
    return healthyDependencies[index];
  }

  public close(){
    clearInterval(this.ticker);
  }

  public register(dependency: DependencyConfiguration) {
    const existingDependency = this.dependencies.filter(x=> x.dependencyName === dependency.dependencyName);

    if(existingDependency.length){
      return existingDependency[0];
    }

    this.dependencies.push(dependency);
    return this;
  }

  public get(name: string) {
    return this.dependencies.filter( x=> x.dependencyName === name)[0];
  }
}