import { act, cleanup, fireEvent, type RenderResult } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';
import { TextInput } from 'react-native';

import { strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';

import { CredentialsFields } from './CredentialsFields';
import type { CredentialsForm } from './credentialsForm';

const submit = jest.fn();

beforeEach(() => submit.mockReset());

function Harness({ mode = 'register' }: { mode?: 'register' | 'login' }) {
  const form = useForm<CredentialsForm>({ defaultValues: { email: '', password: '' } });
  return <CredentialsFields control={form.control} mode={mode} onSubmit={submit} />;
}

afterEach(cleanup);

async function mount() {
  return renderWithTheme(<Harness />);
}

const email = (view: RenderResult) => view.getByLabelText(strings.auth.emailLabel);
const password = (view: RenderResult) => view.getByLabelText(strings.auth.passwordLabel);

describe('CredentialsFields', () => {
  it('e-postadaki bitirme tusu klavyeyi kapatmiyor, siradaki alani isaret ediyor', async () => {
    const view = await mount();
    expect(email(view).props.returnKeyType).toBe('next');
    // Klavye kapanirsa odak devri gorunmez oluyor; alan bunu bilerek reddediyor.
    expect(email(view).props.submitBehavior).toBe('submit');
  });

  it('e-postada bitirmek odagi sifre alanina veriyor', async () => {
    // Odak devri yerel bir cagri; testte gorulebilecek yeri o cagrinin
    // kendisi. Odagin gorsel sonucu cihazda sinaniyor.
    const focus = jest.spyOn(TextInput.prototype, 'focus').mockImplementation(() => {});
    const view = await mount();

    await act(async () => {
      fireEvent(email(view), 'submitEditing');
    });

    expect(focus).toHaveBeenCalled();
    focus.mockRestore();
  });

  it('kayit yeni bir sifre istiyor', async () => {
    const view = await mount();
    expect(password(view).props.autoComplete).toBe('new-password');
    expect(password(view).props.textContentType).toBe('newPassword');
  });

  it('giris kayitli sifreyi istiyor', async () => {
    const view = await renderWithTheme(<Harness mode="login" />);
    expect(password(view).props.autoComplete).toBe('current-password');
    expect(password(view).props.textContentType).toBe('password');
  });

  it('odak halkasi alandan cikinca sonuyor', async () => {
    const view = await mount();
    const before = email(view).props.style;

    await act(async () => {
      fireEvent(email(view), 'focus');
    });
    const focused = email(view).props.style;
    expect(focused.borderColor).not.toBe(before.borderColor);

    // Form kutuphanesinin kendi `onBlur`'u bizimkini ezerse halka hic sonmez
    // ve iki alan birden odakli gorunur.
    await act(async () => {
      fireEvent(email(view), 'blur');
    });
    expect(email(view).props.style.borderColor).toBe(before.borderColor);
  });

  it('sifre varsayilan olarak gizli', async () => {
    const view = await mount();
    expect(password(view).props.secureTextEntry).toBe(true);
  });

  it('goz isareti sifreyi gosterip gizliyor', async () => {
    const view = await mount();

    await act(async () => {
      fireEvent.press(view.getByLabelText(strings.auth.showPassword));
    });
    expect(password(view).props.secureTextEntry).toBe(false);

    await act(async () => {
      fireEvent.press(view.getByLabelText(strings.auth.hidePassword));
    });
    expect(password(view).props.secureTextEntry).toBe(true);
  });

  it('anahtar yazi degil, isaret: metin etiketi kalmadi', async () => {
    const view = await mount();
    // Once agacin gercekten cizildigi kanitlaniyor: bos render eden bir test
    // "metin yok" der ve sessizce gecerdi.
    expect(view.getByLabelText(strings.auth.showPassword)).toBeTruthy();
    expect(view.queryByText('Göster')).toBeNull();
    expect(view.queryByText('Gizle')).toBeNull();
  });

  it('sifredeki bitirme tusu formu gonderiyor', async () => {
    const view = await mount();
    expect(password(view).props.returnKeyType).toBe('done');
    await act(async () => {
      fireEvent(password(view), 'submitEditing');
    });
    expect(submit).toHaveBeenCalled();
  });
});
