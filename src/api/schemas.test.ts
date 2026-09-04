import {
  ApiErrorBodySchema,
  AuthSessionSchema,
  CompletionResponseSchema,
  OptionGroupsSchema,
  ProfileSchema,
  RefreshResponseSchema,
} from './schemas';

describe('auth schemas', () => {
  it('accepts the session body both auth endpoints return', () => {
    const parsed = AuthSessionSchema.parse({
      user_id: 'u_1',
      access_token: 'a',
      refresh_token: 'r',
      onboarding_complete: false,
    });

    expect(parsed.onboarding_complete).toBe(false);
  });

  it('rejects a session that is missing the refresh token', () => {
    expect(() =>
      AuthSessionSchema.parse({ user_id: 'u_1', access_token: 'a', onboarding_complete: false }),
    ).toThrow();
  });

  it('accepts a refresh response that carries only an access token', () => {
    expect(RefreshResponseSchema.parse({ access_token: 'a' }).access_token).toBe('a');
  });
});

describe('profile schema', () => {
  const base = {
    user_id: 'u_1',
    display_name: null,
    avatar_url: null,
    preferences: {},
    onboarding_complete: false,
  };

  it('accepts null for the nullable fields', () => {
    expect(ProfileSchema.parse(base).display_name).toBeNull();
  });

  it('rejects a missing nullable field, because absent is not the same as null', () => {
    const { display_name: _omitted, ...withoutName } = base;
    expect(() => ProfileSchema.parse(withoutName)).toThrow();
  });

  it('tolerates preference keys it does not know', () => {
    const parsed = ProfileSchema.parse({
      ...base,
      preferences: { intent: ['long_term'], something_new: 42 },
    });

    expect(parsed.preferences.something_new).toBe(42);
  });

  it('tolerates a new top-level field added by the server', () => {
    expect(() => ProfileSchema.parse({ ...base, locale: 'tr-TR' })).not.toThrow();
  });

  it('rejects a wrong type on a known field', () => {
    expect(() => ProfileSchema.parse({ ...base, onboarding_complete: 'yes' })).toThrow();
  });
});

describe('completion schema', () => {
  it('accepts only a true completion flag', () => {
    expect(CompletionResponseSchema.parse({ onboarding_complete: true }).onboarding_complete).toBe(
      true,
    );
    expect(() => CompletionResponseSchema.parse({ onboarding_complete: false })).toThrow();
  });
});

describe('error body schema', () => {
  it('parses a validation failure with its per-field map', () => {
    const parsed = ApiErrorBodySchema.parse({
      error: 'validation_failed',
      fields: { password: 'too_short' },
    });

    expect(parsed.fields?.password).toBe('too_short');
  });

  it('parses an error code the contract never listed', () => {
    expect(ApiErrorBodySchema.parse({ error: 'rate_limited' }).error).toBe('rate_limited');
  });
});

describe('option groups schema', () => {
  it('parses the grouped option payload', () => {
    const parsed = OptionGroupsSchema.parse({
      intent: {
        key: 'intent',
        multiSelect: true,
        maxSelection: 2,
        required: true,
        options: [{ id: 'long_term', label: 'Uzun soluklu bir ilişki', hint: 'Ciddi' }],
      },
    });

    expect(parsed.intent?.maxSelection).toBe(2);
  });

  it('rejects a group whose selection cap is missing rather than explicitly null', () => {
    expect(() =>
      OptionGroupsSchema.parse({
        gender: { key: 'gender', multiSelect: false, required: true, options: [] },
      }),
    ).toThrow();
  });
});
