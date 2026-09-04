import { createRefreshQueue } from './refresh';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createRefreshQueue', () => {
  it('runs a single refresh for callers that arrive together', async () => {
    const gate = deferred<string>();
    let started = 0;

    const queue = createRefreshQueue(() => {
      started += 1;
      return gate.promise;
    });

    const waiting = [queue.refresh(), queue.refresh(), queue.refresh()];
    gate.resolve('access_2');

    expect(await Promise.all(waiting)).toEqual(['access_2', 'access_2', 'access_2']);
    expect(started).toBe(1);
  });

  it('starts a new refresh once the previous one has settled', async () => {
    let started = 0;
    const queue = createRefreshQueue(async () => {
      started += 1;
      return `access_${started}`;
    });

    expect(await queue.refresh()).toBe('access_1');
    expect(await queue.refresh()).toBe('access_2');
    expect(started).toBe(2);
  });

  it('rejects every waiting caller with the same failure', async () => {
    const gate = deferred<string>();
    const queue = createRefreshQueue(() => gate.promise);

    const waiting = Promise.allSettled([queue.refresh(), queue.refresh()]);
    const failure = new Error('refresh expired');
    gate.reject(failure);

    const outcomes = await waiting;
    expect(outcomes.every((outcome) => outcome.status === 'rejected')).toBe(true);
    for (const outcome of outcomes) {
      if (outcome.status === 'rejected') expect(outcome.reason).toBe(failure);
    }
  });

  it('lets a later caller try again after a failure', async () => {
    let started = 0;
    const queue = createRefreshQueue(async () => {
      started += 1;
      if (started === 1) throw new Error('first attempt failed');
      return 'access_2';
    });

    await expect(queue.refresh()).rejects.toThrow('first attempt failed');
    expect(await queue.refresh()).toBe('access_2');
  });
});
