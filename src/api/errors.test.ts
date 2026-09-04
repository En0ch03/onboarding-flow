import { AxiosError, AxiosHeaders } from 'axios';
import { z } from 'zod';

import { fieldErrorMessage, presentError } from '@/constants/errorMessages';

import { normalizeApiError, type ApiErrorKind } from './errors';

function axiosFailure(status: number, data: unknown): AxiosError {
  const error = new AxiosError('request failed');
  error.response = {
    status,
    data,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('normalizeApiError', () => {
  it('reads a taken email out of a 409', () => {
    expect(normalizeApiError(axiosFailure(409, { error: 'email_taken' })).kind).toBe('email_taken');
  });

  it('keeps the per-field map from a 422', () => {
    const result = normalizeApiError(
      axiosFailure(422, { error: 'validation_failed', fields: { password: 'too_short' } }),
    );

    expect(result).toEqual({ kind: 'validation_failed', fields: { password: 'too_short' } });
  });

  it('survives a 422 that arrives without a field map', () => {
    const result = normalizeApiError(axiosFailure(422, { error: 'validation_failed' }));
    expect(result).toEqual({ kind: 'validation_failed', fields: {} });
  });

  it('separates bad credentials from an ended session', () => {
    expect(normalizeApiError(axiosFailure(401, { error: 'invalid_credentials' })).kind).toBe(
      'invalid_credentials',
    );
    expect(normalizeApiError(axiosFailure(401, { error: 'refresh_expired' })).kind).toBe(
      'refresh_expired',
    );
  });

  it('treats any 500 as a server failure', () => {
    expect(normalizeApiError(axiosFailure(503, { error: 'whatever' })).kind).toBe('server_error');
  });

  it('treats a request that never got a response as a network failure', () => {
    expect(normalizeApiError(new AxiosError('timeout of 10000ms exceeded')).kind).toBe('network');
  });

  it('turns a schema mismatch into its own kind rather than a crash', () => {
    const parsed = z.object({ user_id: z.string() }).safeParse({ user_id: 42 });
    expect(parsed.success).toBe(false);

    const result = normalizeApiError(parsed.error);
    expect(result.kind).toBe('unexpected_response');
  });

  it('flags a status the contract never described', () => {
    expect(normalizeApiError(axiosFailure(418, {})).kind).toBe('unexpected_response');
  });

  it('passes an already-normalised error through untouched', () => {
    const already = { kind: 'network' } as const;
    expect(normalizeApiError(already)).toBe(already);
  });

  it('normalises a value that is not an error at all', () => {
    expect(normalizeApiError('boom').kind).toBe('unexpected_response');
  });
});

describe('error presentation', () => {
  const kinds: ApiErrorKind[] = [
    'email_taken',
    'validation_failed',
    'invalid_credentials',
    'refresh_expired',
    'server_error',
    'network',
    'unexpected_response',
  ];

  it('has a message for every kind', () => {
    for (const kind of kinds) {
      const presented = presentError(
        kind === 'validation_failed'
          ? { kind, fields: {} }
          : kind === 'unexpected_response'
            ? { kind, detail: '' }
            : { kind },
      );

      expect(presented.message.length).toBeGreaterThan(0);
    }
  });

  it('offers a way out of the errors that have one', () => {
    expect(presentError({ kind: 'email_taken' }).action).not.toBeNull();
    expect(presentError({ kind: 'network' }).action).not.toBeNull();
    expect(presentError({ kind: 'refresh_expired' }).action).not.toBeNull();
  });
});

describe('field messages', () => {
  it('states the actual rule where the field has one', () => {
    expect(fieldErrorMessage('password', 'too_short')).toContain('8');
  });

  it('still names the field when the reason code is unknown', () => {
    expect(fieldErrorMessage('email', 'unheard_of')).toContain('E-posta');
  });

  it('stays readable when the field itself is unknown', () => {
    const message = fieldErrorMessage('some_new_field', 'unheard_of');
    expect(message).not.toContain('some_new_field');
    expect(message.length).toBeGreaterThan(0);
  });
});
