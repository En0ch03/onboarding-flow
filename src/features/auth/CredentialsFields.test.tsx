import { act, cleanup, fireEvent, type RenderResult } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';

import { strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';

import { CredentialsFields } from './CredentialsFields';
import type { CredentialsForm } from './credentialsForm';

const submit = jest.fn();

function Harness() {
  const form = useForm<CredentialsForm>({ defaultValues: { email: '', password: '' } });
  return <CredentialsFields control={form.control} mode="register" onSubmit={submit} />;
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

  it('e-postada bitirmek bir sonraki alani cagiriyor', async () => {
    const view = await mount();
    expect(email(view).props.onSubmitEditing).toBeInstanceOf(Function);

    // Odak devri yerel bir cagri: burada yalnizca cagrinin kurulu oldugu ve
    // patlamadigi gorulebiliyor. Odagin gercekten gectigi cihazda sinaniyor.
    await act(async () => {
      fireEvent(email(view), 'submitEditing');
    });
    expect(password(view)).toBeTruthy();
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
