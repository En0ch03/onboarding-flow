import {
  act,
  cleanup,
  fireEvent,
  waitFor,
  within,
  type RenderResult,
} from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';

import { fieldErrorMessage } from '@/constants/errorMessages';
import { strings } from '@/constants/strings';
import { GLASS_VIEW_TEST_ID } from '@/test/glassEffectMock';
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

async function fillIn(
  view: RenderResult,
  email: string,
  password: string,
  confirmPassword: string = password,
) {
  await act(async () => {
    fireEvent.changeText(view.getByLabelText(strings.auth.emailLabel), email);
    fireEvent.changeText(view.getByLabelText(strings.auth.passwordLabel), password);
    fireEvent.changeText(view.getByLabelText(strings.auth.confirmPasswordLabel), confirmPassword);
  });
}

const session = {
  user_id: 'u',
  access_token: 'a',
  refresh_token: 'r',
  onboarding_complete: false,
};

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

  it('sunucunun bilmedigi bir alan adini forma dagitmiyor', async () => {
    // Dogrulama alani istemcide yasiyor: sunucu ayni sifreyi iki kez almiyor,
    // dolayisiyla o alan hakkinda soyleyecegi bir sey de yok. Sunucudan gelen
    // alan adlari koru korune yerlestirilseydi, kullanici hicbir zaman
    // gonderilmemis bir alanin altinda bir hata gorurdu.
    register.mockRejectedValue(
      failure(422, {
        error: 'validation_failed',
        fields: { password: 'too_short', confirmPassword: 'too_short' },
      }),
    );
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);

    await fillIn(view, 'deniz@ornek.com', 'agirates2026');
    await press(view, 'Hesap oluştur');

    expect(await view.findByText(/Şifren çok kısa/i)).toBeTruthy();
    expect(view.queryByText(fieldErrorMessage('confirmPassword', 'too_short'))).toBeNull();
  });

  it('shows the button as busy while the request is in flight', async () => {
    let release: () => void = () => {};
    register.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(session);
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

  it('sends only the address and the password to the server', async () => {
    // Dogrulama alani formun isi; sozlesmeye girerse sunucu ayni sifreyi iki
    // kez almaya baslar ve iki kopyanin hangisinin dogru oldugu bir soru olur.
    register.mockResolvedValue(session);
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);

    await fillIn(view, 'deniz@ornek.com', 'agirates2026');
    await press(view, 'Hesap oluştur');

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        email: 'deniz@ornek.com',
        password: 'agirates2026',
      }),
    );
  });

  it('stops a mistyped password before it reaches the server', async () => {
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);

    await fillIn(view, 'deniz@ornek.com', 'agirates2026', 'agirates2027');
    await press(view, 'Hesap oluştur');

    expect(await view.findByText(strings.auth.passwordMismatch)).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
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

    register.mockResolvedValue(session);
    await press(view, 'Tekrar dene');

    await waitFor(() => expect(handlers.onRegistered).toHaveBeenCalled());
  });
});

describe('RegisterScreen cam kart', () => {
  it('basligi, hata bandini ve alanlari kartin icine aliyor', async () => {
    register.mockRejectedValue(failure(500, { error: 'internal_error' }));
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);

    await fillIn(view, 'deniz@ornek.com', 'agirates2026');
    await press(view, 'Hesap oluştur');
    await view.findByText(/bizim tarafta bir şeyler ters gitti/i);

    const panel = within(view.getByTestId('glass-panel'));
    expect(panel.getByText(strings.auth.registerTitle)).toBeTruthy();
    expect(panel.getByText(/bizim tarafta bir şeyler ters gitti/i)).toBeTruthy();
    expect(panel.getByLabelText(strings.auth.emailLabel)).toBeTruthy();
    expect(panel.getByLabelText(strings.auth.passwordLabel)).toBeTruthy();
    expect(panel.getByLabelText(strings.auth.confirmPasswordLabel)).toBeTruthy();
  });

  it('kartin arkasina bir de perde cekmiyor', async () => {
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);
    expect(view.getByText(strings.auth.registerTitle)).toBeTruthy();

    // Perde olculmeden cizilmiyor; olcum olayi olmadan "yok" iddiasi hicbir
    // sey olcmez.
    await act(async () => {
      fireEvent(view.getByTestId('content-block', { includeHiddenElements: true }), 'layout', {
        nativeEvent: { layout: { width: 342, height: 320, x: 0, y: 0 } },
      });
    });

    // Metnin zeminini kart tasiyor: ikinci bir karartma katmani gorseli iki
    // kez karartirdi.
    expect(view.queryByTestId('content-veil', { includeHiddenElements: true })).toBeNull();
    // Ust serit kartin disinda; onun perdesi yerinde kaliyor.
    expect(view.getByTestId('header-veil', { includeHiddenElements: true })).toBeTruthy();
  });

  it('kartin altindan seridin gecmesine izin veriyor', async () => {
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);
    // Once agacin cizildigi: bos bir agacta perde sorgusu da patlardi.
    expect(view.getByText(strings.auth.registerTitle)).toBeTruthy();

    // Tam karartma kartin bolgesini neredeyse siyaha indiriyor ve saydam
    // yuzeyin kiracak bir goruntusu kalmiyor; kart o zaman duz bir panel.
    expect(
      view.getByTestId('journey-veil', { includeHiddenElements: true }).props.locations,
    ).toEqual([0.55, 1]);
  });

  it('butonu ve yasal satiri kartin disinda birakiyor', async () => {
    const view = await renderWithTheme(<RegisterScreen {...handlers} />);

    // Buton kartin degil sayfanin dibine ait: klavye acildiginda kartla
    // birlikte yukari cikan bir buton, hedefi elin altinda oynatiyor.
    expect(view.getByText(strings.auth.registerSubmit)).toBeTruthy();
    const panel = within(view.getByTestId('glass-panel'));
    expect(panel.queryByText(strings.auth.registerSubmit)).toBeNull();
    expect(panel.queryByText(strings.auth.legal)).toBeNull();
  });

  describe('cam kipi', () => {
    const { isLiquidGlassAvailable } = jest.requireMock('expo-glass-effect');

    /** Arka katmanlar ekran okuyucudan gizli; sorgular gizli ogeleri de kapsiyor. */
    const hidden = { includeHiddenElements: true } as const;

    afterEach(() => {
      isLiquidGlassAvailable.mockReturnValue(false);
    });

    it('kart saydam materyali kullaniyor, kucuk kontroller uyum yapani', async () => {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(<RegisterScreen {...handlers} />);
      // Once agacin gercekten cizildigi: bos bir agacta asagidaki sorgular da
      // "yok" derdi ve kural silinse bile test yesil kalirdi.
      expect(view.getByText(strings.auth.registerSubmit)).toBeTruthy();

      // Kartin arkasinda akisin gorseli duruyor; uyum yapan materyal onu bir
      // ton katmaninin altinda birakiyordu.
      expect(view.getByTestId(GLASS_VIEW_TEST_ID, hidden).props.glassEffectStyle).toBe('clear');

      // Kucuk bir kontrolun uzerindeki isaret, saydam materyalde arkasindaki
      // her sey degistikce okunamaz hale geliyor: seritteki geri dairesi uyum
      // yapan materyalde kaliyor. (Bu ekranda gecme kapsulu yok.)
      expect(view.getByTestId('glass-back', hidden).props.glassEffectStyle).toBe('regular');
    });
  });
});
