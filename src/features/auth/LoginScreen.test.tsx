import { act, cleanup, fireEvent, waitFor, type RenderResult } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';

import { presentError } from '@/constants/errorMessages';
import { strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';

import { LoginScreen } from './LoginScreen';

jest.mock('@/api/endpoints', () => ({ login: jest.fn() }));
const { login } = jest.requireMock('@/api/endpoints');

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

const handlers = { onBack: jest.fn(), onSignedIn: jest.fn() };

async function signIn(view: RenderResult, email: string, password: string) {
  await act(async () => {
    fireEvent.changeText(view.getByLabelText(strings.auth.emailLabel), email);
    fireEvent.changeText(view.getByLabelText(strings.auth.passwordLabel), password);
  });
  await act(async () => {
    fireEvent.press(view.getByText(strings.auth.loginSubmit));
  });
}

beforeEach(() => {
  login.mockReset();
  handlers.onBack.mockReset();
  handlers.onSignedIn.mockReset();
});

afterEach(async () => {
  await cleanup();
});

describe('LoginScreen', () => {
  it('eslesmeyen sifrede yazilani silmiyor', async () => {
    // Cikis yolu formun kendisi: kullanici genellikle tek bir karakteri
    // duzeltecek, hepsini yeniden yazmayacak.
    login.mockRejectedValue(failure(401, { error: 'invalid_credentials' }));

    const view = await renderWithTheme(<LoginScreen {...handlers} />);
    await signIn(view, 'deniz@example.test', 'yanlisparola');

    expect(view.getByText(presentError({ kind: 'invalid_credentials' }).message)).toBeTruthy();
    expect(view.getByLabelText(strings.auth.emailLabel).props.value).toBe('deniz@example.test');
    expect(view.getByLabelText(strings.auth.passwordLabel).props.value).toBe('yanlisparola');
  });

  it('eslesmeyen sifrede goturecegi yer olmayan bir baglanti gostermiyor', async () => {
    // Sozlesmede sifirlama ucu yok; bir yere goturmeyen cikis yolu, cikis
    // yolu olmamasindan kotu.
    login.mockRejectedValue(failure(401, { error: 'invalid_credentials' }));

    const view = await renderWithTheme(<LoginScreen {...handlers} />);
    await signIn(view, 'deniz@example.test', 'yanlisparola');

    // Ekran seviyesinde bakiliyor: sozluge bakan bir iddia, bandin ne
    // gosterdigini degil sozlugun ne yazdigini sinar.
    expect(view.queryByText(strings.common.retry)).toBeNull();

    // Ekranda uc dugme var: geri, sifreyi goster ve "Giris yap". Bant bir
    // cikis yolu gosterseydi dorduncusunu cizerdi.
    expect(view.queryAllByRole('button')).toHaveLength(3);
  });

  it('ag hatasinda tekrar deneme yolu sunuyor', async () => {
    login.mockRejectedValue(new AxiosError('offline'));

    const view = await renderWithTheme(<LoginScreen {...handlers} />);
    await signIn(view, 'deniz@example.test', 'parolaparola');

    expect(view.getByText(strings.common.retry)).toBeTruthy();
  });

  it('kayittan gelen adresi tasiyor', async () => {
    const view = await renderWithTheme(
      <LoginScreen {...handlers} initialEmail="deniz@example.test" />,
    );

    expect(view.getByLabelText(strings.auth.emailLabel).props.value).toBe('deniz@example.test');
  });

  // Sunucunun soyledigi isaret oldugu gibi tasinmali. Kok gecisi bu
  // isareti "ya da sunucudaki profil tamamlanmis" ile birlikte okuyor;
  // burada sabit bir `true` gecilseydi, akisi yarim birakmis bir kullanici
  // dogrudan uygulamaya dusurdu ve gecis testleri bunu goremezdi.
  it('sunucu akis yarim diyorsa yarim isaretini geciriyor', async () => {
    login.mockResolvedValue({
      user_id: 'u_1',
      access_token: 'a',
      refresh_token: 'r',
      onboarding_complete: false,
    });

    const view = await renderWithTheme(<LoginScreen {...handlers} />);
    await signIn(view, 'deniz@example.test', 'parolaparola');

    await waitFor(() => expect(handlers.onSignedIn).toHaveBeenCalledWith(false));
    expect(handlers.onSignedIn).toHaveBeenCalledTimes(1);
  });

  it('sunucu akis tamam diyorsa tamam isaretini geciriyor', async () => {
    login.mockResolvedValue({
      user_id: 'u_1',
      access_token: 'a',
      refresh_token: 'r',
      onboarding_complete: true,
    });

    const view = await renderWithTheme(<LoginScreen {...handlers} />);
    await signIn(view, 'deniz@example.test', 'parolaparola');

    await waitFor(() => expect(handlers.onSignedIn).toHaveBeenCalledWith(true));
    expect(handlers.onSignedIn).toHaveBeenCalledTimes(1);
  });
});
