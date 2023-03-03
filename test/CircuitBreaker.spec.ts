import { CircuitBreaker } from "../lib"

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

const unstableBreaker = new CircuitBreaker({action: unstableRequest, fallback: stableRequest});
const stableBreaker = new CircuitBreaker({action: stableRequest, fallback: stableRequest});

describe('CircuitBreaker', () => {

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

  it('should call fallback on failed calls', async () => {
    const response = await unstableBreaker.fire();
    expect(response).toEqual({data: "Success"});
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
});