import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';

import { useAsyncAction, type AsyncState } from './useAsyncAction';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('useAsyncAction', () => {
  it('starts idle', async () => {
    const { result } = await renderHook(() => useAsyncAction(async () => 'ok'));
    expect(result.current.state).toEqual({ status: 'idle' });
  });

  it('passes through loading before success', async () => {
    const gate = deferred<string>();
    const { result } = await renderHook(() => useAsyncAction(() => gate.promise));

    await act(async () => {
      void result.current.run();
    });
    expect(result.current.state.status).toBe('loading');

    await act(async () => {
      gate.resolve('done');
      await gate.promise;
    });

    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 'done' }));
  });

  it('normalises whatever the action throws', async () => {
    const failure = new AxiosError('nope');
    failure.response = {
      status: 409,
      data: { error: 'email_taken' },
      statusText: '',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    };

    const { result } = await renderHook(() =>
      useAsyncAction(async () => {
        throw failure;
      }),
    );

    await act(async () => {
      await result.current.run();
    });

    expect(result.current.state).toEqual({ status: 'error', error: { kind: 'email_taken' } });
  });

  it('returns to idle on reset', async () => {
    const { result } = await renderHook(() => useAsyncAction(async () => 'ok'));

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.state.status).toBe('success');

    await act(async () => {
      result.current.reset();
    });
    expect(result.current.state).toEqual({ status: 'idle' });
  });

  it('ignores an earlier call that resolves after a later one', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const calls = [first, second];
    let index = 0;

    const { result } = await renderHook(() => useAsyncAction(() => calls[index++]!.promise));

    await act(async () => {
      void result.current.run();
      void result.current.run();
    });

    await act(async () => {
      second.resolve('second');
      first.resolve('first');
      await Promise.all([first.promise, second.promise]);
    });

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'success', data: 'second' }),
    );
  });

  it('does not write state after the component is gone', async () => {
    const gate = deferred<string>();
    const reported = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result, unmount } = await renderHook(() => useAsyncAction(() => gate.promise));

    await act(async () => {
      void result.current.run();
    });
    await unmount();

    await act(async () => {
      gate.resolve('late');
      await gate.promise;
    });

    const leaks = reported.mock.calls.filter((call) => String(call[0]).includes('unmounted'));
    expect(leaks).toHaveLength(0);
    reported.mockRestore();
  });
});

describe('the state type', () => {
  it('does not expose data while loading', () => {
    const state: AsyncState<string> = { status: 'loading' };

    if (state.status === 'loading') {
      // @ts-expect-error - data is unreachable until the action succeeds, and
      // the type system is what enforces it rather than a convention.
      const unreachable = state.data;
      expect(unreachable).toBeUndefined();
    }

    expect(state.status).toBe('loading');
  });

  it('does not expose an error on success', () => {
    const state: AsyncState<string> = { status: 'success', data: 'ok' };

    if (state.status === 'success') {
      // @ts-expect-error - there is no error to read on the success branch.
      const unreachable = state.error;
      expect(unreachable).toBeUndefined();
    }

    expect(state.data).toBe('ok');
  });
});
