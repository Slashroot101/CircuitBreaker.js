import { DependencyManager } from "../lib/Dependencymanager";

describe('DependencyManager', () => {
  it('should succeed with no dependencies registered', () => {
    const dependencyManager = new DependencyManager(1000);
    expect(dependencyManager.ticker).toBeDefined();
  });

  it('should register a dependency', () => {
    const dependencyManager = new DependencyManager(1000);
    const dependency = {
      dependencyName: 'test',
      healthCheck: () => Promise.resolve({dependencyName: 'test', healthy: true}),
      tolerance: 0.5,
      fallback: () => Promise.resolve(),
      priority: 1
    }
    dependencyManager.register(dependency);
    expect(dependencyManager.get(dependency.dependencyName)).toEqual(dependency);
    dependencyManager.close();
  });

  it('should call the health check on the dependency', async () => {
    const dependencyManager = new DependencyManager(1000);
    const dependency = {
      dependencyName: 'test',
      healthCheck: () => Promise.resolve({dependencyName: 'test', healthy: true}),
      tolerance: 0.5,
      fallback: () => Promise.resolve(),
      priority: 1
    }
    const spy = jest.spyOn(dependency, 'healthCheck');
    dependencyManager.register(dependency);

    await dependencyManager.evaluateDependencies();

    expect(spy).toHaveBeenCalled();
    dependencyManager.close();
  });

  it('getNextBestDependency should return a healthy depdendency with the highest priority', async () => {
    const dependencyManager = new DependencyManager(1000);
    const dependency = {
      dependencyName: 'test',
      healthCheck: () => Promise.resolve({dependencyName: 'test', healthy: true}),
      tolerance: 0.5,
      fallback: () => Promise.resolve(),
      priority: 1
    }
    const dependency2 = {
      dependencyName: 'test2',
      healthCheck: () => Promise.resolve({dependencyName: 'test2', healthy: false}),
      tolerance: 0.5,
      fallback: () => Promise.resolve(),
      priority: 2
    }
    const dependency3 = {
      dependencyName: 'test2',
      healthCheck: () => Promise.resolve({dependencyName: 'test2', healthy: false}),
      tolerance: 0.5,
      fallback: () => Promise.resolve(),
      priority: 2
    }
    dependencyManager.register(dependency);
    dependencyManager.register(dependency2);
    dependencyManager.register(dependency3);
    await dependencyManager.evaluateDependencies();
    expect(dependencyManager.getNextBestDependency(0)).toEqual(dependency);
    dependencyManager.close();
  });
  
  it('getNextBestDependency should return a healthy depdendency with the highest priority v2', async () => {
    const dependencyManager = new DependencyManager(1000);
    const dependency = {
      dependencyName: 'test',
      healthCheck: () => Promise.resolve({dependencyName: 'test', healthy: false}),
      tolerance: 0.5,
      fallback: () => Promise.resolve(),
      priority: 1
    }
    const dependency2 = {
      dependencyName: 'test2',
      healthCheck: () => Promise.resolve({dependencyName: 'test2', healthy: true}),
      tolerance: 0.5,
      fallback: () => Promise.resolve(),
      priority: 2
    }
    const dependency3 = {
      dependencyName: 'test2',
      healthCheck: () => Promise.resolve({dependencyName: 'test2', healthy: false}),
      tolerance: 0.5,
      fallback: () => Promise.resolve(),
      priority: 2
    }
    dependencyManager.register(dependency);
    dependencyManager.register(dependency2);
    dependencyManager.register(dependency3);
    await dependencyManager.evaluateDependencies();
    expect(dependencyManager.getNextBestDependency(0)).toEqual(dependency2);
    dependencyManager.close();
  });
});