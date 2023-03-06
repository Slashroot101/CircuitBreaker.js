import { CircuitBreaker } from "../lib"
import { DependencyManager } from "../lib/Dependencymanager";

//simulate unstable request
const unstableRequest = (shouldError: boolean = true) =>{
  return new Promise((resolve, reject) => {
      if (!shouldError) {
        resolve({data: "Success"});
      } else {
        reject({data: "Failed"});
      }
  })
};

const stableRequest = () => {
  return new Promise((resolve, reject) => {
    resolve({data: "Success"})
  });
};

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

let dependencyManager = new DependencyManager(1000)
                                  .register(dependency)
                                  .register(dependency2)
                                  .register(dependency3);

let unstableBreaker = new CircuitBreaker({action: unstableRequest, dependencies: dependencyManager});
let stableBreaker = new CircuitBreaker({action: stableRequest, dependencies: dependencyManager});

describe('CircuitBreaker', () => {
  beforeEach(() => {

    dependencyManager = new DependencyManager(1000)
      .register(dependency)
      .register(dependency2)
      .register(dependency3);

    unstableBreaker = new CircuitBreaker({action: unstableRequest, dependencies: dependencyManager});
    stableBreaker = new CircuitBreaker({action: stableRequest, dependencies: dependencyManager});

  });
  it('should stay closed on succesfull calls ', () => {
    for (let i = 0; i < 10; i++) {
      stableBreaker.fire();
    }
    expect(stableBreaker.state).toEqual("CLOSED");
  });


  it('should open on failed calls', async () => {
    for (let i = 0; i < 10; i++) {
      if(i < 3) {
        await unstableBreaker.fire(false);
      } else {
        await unstableBreaker.fire();
      }
    }
    expect(unstableBreaker.state).toEqual("OPEN");
  });

  it('should open during failure and re-open after timeout', async () => {
    jest.useFakeTimers();
    for (let i = 0; i < 10; i++) {
      if(i < 3) {
        await unstableBreaker.fire(false);
      } else {
        await unstableBreaker.fire();
        if(i > 2){
          expect(unstableBreaker.state).toEqual("OPEN");
        }
      }
    }
    
    setTimeout(async () => {
      for(let i = 0; i < 10; i++){
        await unstableBreaker.fire(false);
      }
      expect(stableBreaker.state).toEqual("CLOSED");
    }, 2500);

    jest.runAllTimers();
  });

  it('should fail if no endpoints are healthy', () => {

  });
});