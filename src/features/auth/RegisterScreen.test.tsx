import { act, cleanup, fireEvent, waitFor, type RenderResult } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';

import { renderWithTheme } from '@/test/renderWithTheme';

import { RegisterScreen } from './RegisterScreen';

jest.mock('@/api/endpoints', () => ({ register: jest.fn() }));
const { register } = jest.requireMock('@/api/endpoints');

function failure(status: number, data: unknown) {
  const error = new AxiosError('failed');
  error.response = {
    status,
    data,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

const handlers = {
  onBack: jest.fn(),
  onRegistered: jest.fn(),
  onSignInInstead: jest.fn(),
};

/** Her etkilesim act icinde bekletiliyor; aksi halde bir sonraki testin
 *  render'i onceki testin yarim kalan guncellemesine denk geliyor. */
async function press(view: RenderResult, label: string) {
  await act(async () => {
    fireEvent.press(view.getByText(label));
  });
}

async function fillIn(view: RenderResult, email: string, password: string) {
  await act(async () => {
    fireEvent.changeText(view.getByLabelText('E-posta'), email);
    fireEvent.changeText(view.getByLabelText('Şifre'), password);
  });
}

beforeEach(() => {
  // Yalnizca kendi taklidimiz sifirlaniyor: `clearAllMocks` yerel modul
  // taklitlerinin de donuslerini siliyor ve ekran bos render ediliyor.
  register.mockReset();
  handlers.onBack.mockReset();
  handlers.onRegistered.mockReset();
  handlers.onSignInInstead.mockReset();
});

afterEach(async () => {
  await cleanup();
});

describe('RegisterScreen', () => {
  it('says what is wrong with a short password instead of refusing silently', async () => {
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);

    await fillIn(view, 'deniz@ornek.com', 'kisa');
    await press(view, 'Hesap oluştur');

    expect(await view.findByText(/en az 8 karakter/i)).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });

  it('names the field rather than showing a generic message for a bad address', async () => {
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);

    await fillIn(view, 'deniz-at-ornek', 'agirates2026');
    await press(view, 'Hesap oluştur');

    expect(await view.findByText(/e-posta adresi geçerli görünmüyor/i)).toBeTruthy();
  });

  it('offers a way forward when the address already has an account', async () => {
    register.mockRejectedValue(failure(409, { error: 'email_taken' }));
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);

    await fillIn(view, 'deniz@ornek.com', 'agirates2026');
    await press(view, 'Hesap oluştur');

    await view.findByText('Bu e-postayla giriş yap');
    await press(view, 'Bu e-postayla giriş yap');

    expect(handlers.onSignInInstead).toHaveBeenCalledWith('deniz@ornek.com');
  });

  it('drops a field-level failure from the server under its own field', async () => {
    register.mockRejectedValue(
      failure(422, { error: 'validation_failed', fields: { password: 'too_short' } }),
    );
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);

    await fillIn(view, 'deniz@ornek.com', 'agirates2026');
    await press(view, 'Hesap oluştur');

    expect(await view.findByText(/Şifren çok kısa/i)).toBeTruthy();
  });

  it('shows the button as busy while the request is in flight', async () => {
    let release: () => void = () => {};
    register.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              user_id: 'u',
              access_token: 'a',
              refresh_token: 'r',
              onboarding_complete: false,
            });
        }),
    );

    const view = await renderWithTheme(<RegisterScreen {...handlers} />);
    await fillIn(view, 'deniz@ornek.com', 'agirates2026');
    await press(view, 'Hesap oluştur');

    await waitFor(() => {
      expect(
        view.getByRole('button', { name: 'Hesap oluştur' }).props.accessibilityState.busy,
      ).toBe(true);
    });

    release();
  });

  it('explains a server failure in plain language', async () => {
    register.mockRejectedValue(failure(500, { error: 'internal_error' }));
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);

    await fillIn(view, 'deniz@ornek.com', 'agirates2026');
    await press(view, 'Hesap oluştur');

    expect(await view.findByText(/bizim tarafta bir şeyler ters gitti/i)).toBeTruthy();
  });

  it('gecici bir arizada metnin soyledigi yeri de gosteriyor', async () => {
    // Bant "tekrar dene" diyordu ama tekrar denenecek bir dugme yoktu; ayni
    // hataya kardes ekran (giris) dugmeyi veriyordu.
    register.mockRejectedValue(failure(500, { error: 'internal_error' }));
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);

    await fillIn(view, 'deniz@ornek.com', 'agirates2026');
    await press(view, 'Hesap oluştur');
    await view.findByText(/bizim tarafta bir şeyler ters gitti/i);

    register.mockResolvedValue({
      user_id: 'u',
      access_token: 'a',
      refresh_token: 'r',
      onboarding_complete: false,
    });
    await press(view, 'Tekrar dene');

    await waitFor(() => expect(handlers.onRegistered).toHaveBeenCalled());
  });
});
