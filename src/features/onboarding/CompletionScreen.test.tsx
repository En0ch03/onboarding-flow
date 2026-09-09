import { cleanup, fireEvent, waitFor } from '@testing-library/react-native';
import { BackHandler } from 'react-native';

import type { OptionGroups } from '@/api/schemas';
import { presentError } from '@/constants/errorMessages';
import { strings } from '@/constants/strings';
import { useOnboardingStore, type DraftAnswers } from '@/state/onboardingStore';
import { renderWithTheme } from '@/test/renderWithTheme';

import { completeOnboarding } from '@/api/endpoints';

import { CompletionScreen } from './CompletionScreen';
import { saveStep } from './saveStep';

/** Sahte modulun tipi cagri tarafindan okunmuyor; testte yeniden baglaniyor. */
function asMock<T extends (...args: never[]) => unknown>(fn: T) {
  return fn as unknown as jest.Mock;
}

jest.mock('@/api/endpoints', () => ({ completeOnboarding: jest.fn(async () => {}) }));
jest.mock('./saveStep', () => ({ saveStep: jest.fn(async () => {}) }));

const options: OptionGroups = {
  audience: {
    key: 'audience',
    multiSelect: true,
    maxSelection: 3,
    required: true,
    options: [{ id: 'everyone', label: 'Herkes' }],
  },
  intent: {
    key: 'intent',
    multiSelect: true,
    maxSelection: 2,
    required: true,
    options: [
      { id: 'long_term', label: 'Uzun soluklu bir ilişki' },
      { id: 'friendship', label: 'Arkadaşlık', unlocks: 'interests_friendship' },
    ],
  },
  interests: {
    key: 'interests',
    multiSelect: true,
    maxSelection: 8,
    required: false,
    options: [{ id: 'books', label: 'Kitap' }],
  },
  interests_friendship: {
    key: 'interests_friendship',
    multiSelect: true,
    maxSelection: 8,
    required: false,
    options: [{ id: 'board_games', label: 'Kutu oyunları' }],
  },
};

const answers: DraftAnswers = {
  phone: '5551234567',
  name: 'Deniz',
  birthDate: { day: '14', month: '3', year: '1996' },
  audience: ['everyone'],
  intent: ['long_term'],
  interests: ['books'],
  photos: [{ id: 'p1', url: 'http://example.test/p1' }],
};

afterEach(cleanup);
afterEach(() => jest.restoreAllMocks());

// Sahte modul testler arasinda basarili haline donuyor: bir testin kurdugu
// hata, sirasi degistiginde baska bir testi dusurmemeli.
beforeEach(() => {
  // Yalnizca cagri gecmisi siliniyor. `clearAllMocks` uygulamayi da
  // siliyor ve sahte modul cagirilamaz hale geliyor.
  asMock(completeOnboarding).mockClear();
  asMock(saveStep).mockClear();

  asMock(completeOnboarding).mockImplementation(async () => ({ onboarding_complete: true }));
  asMock(saveStep).mockImplementation(async () => {});
});

type Handlers = {
  onEnterApp?: () => void;
  onEditProfile?: () => void;
  onFixProfile?: () => void;
};

async function mount(draft: DraftAnswers, handlers: Handlers = {}, unsynced: string[] = []) {
  useOnboardingStore.setState({ answers: draft, unsyncedStepIds: unsynced });

  return renderWithTheme(
    <CompletionScreen
      options={options}
      onEnterApp={handlers.onEnterApp ?? (() => {})}
      onEditProfile={handlers.onEditProfile ?? (() => {})}
      onFixProfile={handlers.onFixProfile ?? (() => {})}
    />,
  );
}

describe('CompletionScreen', () => {
  it('cevaplari sayiyla degil kendi kelimeleriyle geri okuyor', async () => {
    const view = await mount(answers);

    expect(view.getByText('Herkes')).toBeTruthy();
    expect(view.getByText('Uzun soluklu bir ilişki')).toBeTruthy();
    expect(view.getByText('Kitap')).toBeTruthy();
    // "Ilgi alanlari 1" kullaniciya ne sectigini hatirlatmiyordu; ham kimlik
    // de hatirlatmaz.
    expect(view.queryByText('books')).toBeNull();
    expect(view.queryByText('1')).toBeNull();
  });

  it('fotograf sayisini rakam olarak birakmiyor', async () => {
    const view = await mount(answers);
    expect(view.getByText('1 fotoğraf')).toBeTruthy();
  });

  it('adi ve yasi birlikte gosteriyor', async () => {
    const view = await mount(answers);
    expect(view.getByText(/^Deniz, \d+$/)).toBeTruthy();
  });

  it('yarim bir dogum tarihinde yas gostermiyor', async () => {
    const view = await mount({ ...answers, birthDate: { day: '14', month: '', year: '' } });
    expect(view.getByText('Deniz')).toBeTruthy();
  });

  it('ilgi alanlarini kullanicinin gordugu listeye karsi cozuyor', async () => {
    // Arkadaslik cevabi baska bir etiket setini aciyor; ozet o setten okumali.
    const view = await mount({
      ...answers,
      intent: ['friendship'],
      interests: ['board_games'],
    });
    expect(view.getByText('Kutu oyunları')).toBeTruthy();
  });

  it('atlanan ilgi alanlarinda kullaniciyi suclamiyor', async () => {
    const view = await mount({ ...answers, interests: [] });
    expect(view.getByText(strings.completion.recapEmpty)).toBeTruthy();
  });

  it('fotograf yoksa adin ilk harfini gosteriyor', async () => {
    const view = await mount({ ...answers, photos: [] });
    // Isaret ekran okuyucudan gizli oldugu icin sorgu gizli ogeleri de kapsiyor.
    expect(view.getByText('D', { includeHiddenElements: true })).toBeTruthy();
  });

  it('cozulemeyen bir cevabi ham kimlik olarak gostermiyor', async () => {
    // Kullanici arkadaslik secip bir etiket isaretledikten sonra niyetini
    // degistirirse cevabi artik gosterilmeyen bir listeye ait kaliyordu ve
    // ozete "board_games" diye dusuyordu.
    const view = await mount({ ...answers, intent: ['long_term'], interests: ['board_games'] });

    expect(view.queryByText('board_games')).toBeNull();
    expect(view.getByText(strings.completion.recapEmpty)).toBeTruthy();
  });

  it('telefon numarasini ulke koduyla geri okuyor', async () => {
    // Ozet, cevaplari kullanicinin verdigi haliyle geri okuyor; numara da bir
    // cevap ve kullanici onu `+90` ile taniyor.
    const view = await mount(answers);
    expect(view.getByLabelText(`${strings.completion.recapPhone}: +90 5551234567`)).toBeTruthy();
  });

  it('etiket ve degeri ekran okuyucuya tek parca veriyor', async () => {
    const view = await mount(answers);
    expect(view.getByLabelText(`${strings.completion.recapAudience}: Herkes`)).toBeTruthy();
  });

  it('sunucu onaylayinca uygulamaya giriyor', async () => {
    asMock(completeOnboarding).mockImplementation(async () => ({ onboarding_complete: true }));
    const onEnterApp = jest.fn();
    const view = await mount(answers, { onEnterApp });

    fireEvent.press(await view.findByText(strings.completion.primary));

    await waitFor(() => expect(onEnterApp).toHaveBeenCalled());
  });

  it('sunucu profili eksik bulduysa uygulamaya sokmuyor', async () => {
    // Kullanici buraya bir navigasyon hatasiyla da gelebiliyordu; ekrani
    // gormek profilin tamamlandigi anlamina gelmemeli.
    asMock(completeOnboarding).mockImplementation(async () => {
      throw { kind: 'validation_failed', fields: { gender: 'required' } };
    });
    const onEnterApp = jest.fn();
    const view = await mount(answers, { onEnterApp });

    // Bant belirdiyse sunucu cevabi islenmis demektir.
    const banner = new RegExp(strings.completion.incomplete);
    await view.findByText(banner);
    fireEvent.press(view.getByText(strings.completion.primary));
    await view.findByText(banner);

    expect(onEnterApp).not.toHaveBeenCalled();
  });

  it('eksik profilde cikis yolu tekrar denemek degil cevaplara donmek', async () => {
    asMock(completeOnboarding).mockImplementation(async () => {
      throw { kind: 'validation_failed', fields: { gender: 'required' } };
    });
    const onFixProfile = jest.fn();
    const view = await mount(answers, { onFixProfile });

    expect(await view.findByText(new RegExp(strings.completion.incomplete))).toBeTruthy();

    fireEvent.press(view.getByText(strings.completion.incompleteAction));

    // Hangi alanin reddedildigi cagiran tarafa gidiyor: donulecek adim
    // sunucunun soyledigi alandan cozuluyor.
    await waitFor(() => expect(onFixProfile).toHaveBeenCalledWith(['gender']));
  });

  it('sunucunun reddettigi alanin sebebini soyluyor', async () => {
    // "Bir sey eksik" tek basina kullaniciyi ayni ekrana geri gonderiyordu.
    // Alanin adi da yetmiyor: bir fotografi olan kullaniciya "Fotograflar"
    // demek, bos olmayan bir alani bos gostermek olurdu. Sebep soyleniyor.
    asMock(completeOnboarding).mockImplementation(async () => {
      throw { kind: 'validation_failed', fields: { photos: 'required' } };
    });
    const view = await mount(answers);

    expect(
      await view.findByText(`${strings.completion.incomplete} ${strings.steps.photosHint}`),
    ).toBeTruthy();
  });

  it('tanimadigi bir alan adinda genel cumleye dusuyor', async () => {
    asMock(completeOnboarding).mockImplementation(async () => {
      throw { kind: 'validation_failed', fields: {} };
    });
    const view = await mount(answers);

    expect(await view.findByText(strings.completion.incomplete)).toBeTruthy();
  });

  it('yazilamamis adimi tamamlamadan once gonderiyor', async () => {
    // Sunucu, henuz ulasmamis bir cevaba gore karar veremesin.
    const order: string[] = [];
    asMock(saveStep).mockImplementation(async () => {
      order.push('saveStep');
    });
    asMock(completeOnboarding).mockImplementation(async () => {
      order.push('complete');
      return { onboarding_complete: true };
    });

    await mount(answers, {}, ['interests']);

    await waitFor(() => expect(order).toEqual(['saveStep', 'complete']));
  });

  it('gonderilen adimi bekleyenler listesinden dusuruyor', async () => {
    // Isaret dusurulmezse ayni adim bir sonraki denemede yeniden gonderilir:
    // kapanis basarisiz olup tekrar denendiginde ayni govde iki kez gidiyor.
    await mount(answers, {}, ['interests']);

    await waitFor(() => expect(useOnboardingStore.getState().unsyncedStepIds).toEqual([]));
    expect(asMock(saveStep)).toHaveBeenCalledTimes(1);
  });

  it('bekleyen adimlarin hepsini gonderiyor, yalnizca ilkini degil', async () => {
    // Baglanti gidince ardisik adimlar birlikte kuyruga giriyor. Yalnizca
    // biri gonderilirse sunucu eksik bir profili "tamamlandi" damgalar.
    // Kimlik yetmiyor, govde de sinaniyor: bos bir govde gonderilirse
    // atlanmis sayilan adim sunucuda gercekten bosaltilir.
    const sent: { stepId: string; name: string | undefined }[] = [];
    asMock(saveStep).mockImplementation(async (stepId: string, draft: DraftAnswers) => {
      sent.push({ stepId, name: draft.name });
    });

    await mount(answers, {}, ['intent', 'interests']);

    await waitFor(() =>
      expect(sent).toEqual([
        { stepId: 'intent', name: 'Deniz' },
        { stepId: 'interests', name: 'Deniz' },
      ]),
    );
    expect(useOnboardingStore.getState().unsyncedStepIds).toEqual([]);
  });

  it('gonderilemeyen adimi bekleyenlerde birakiyor', async () => {
    // Isaret gonderimden once dusurulurse, basarisiz bir gonderim "yapildi"
    // sayilir ve cevap bir daha hic denenmez.
    asMock(saveStep).mockImplementation(async () => {
      throw { kind: 'network' };
    });

    const view = await mount(answers, {}, ['interests']);
    await view.findByText(presentError({ kind: 'network' }).message);

    expect(useOnboardingStore.getState().unsyncedStepIds).toEqual(['interests']);
  });

  it('bekleyen adim gonderilemezse tamamlamayi hic denemiyor', async () => {
    asMock(saveStep).mockImplementation(async () => {
      throw { kind: 'network' };
    });

    const onEnterApp = jest.fn();
    const view = await mount(answers, { onEnterApp }, ['interests']);

    await view.findByText(presentError({ kind: 'network' }).message);

    expect(asMock(completeOnboarding)).not.toHaveBeenCalled();

    fireEvent.press(view.getByText(strings.completion.primary));
    expect(onEnterApp).not.toHaveBeenCalled();
  });

  it('sunucu 200 donup tamamlanmadi derse iceri almiyor ve sebebini soyluyor', async () => {
    // Karari sunucu veriyorsa cevabinin govdesi de okunmali. Sessizce
    // reddetmek kullaniciyi aciklamasiz, olu bir butonla birakiyordu.
    asMock(completeOnboarding).mockImplementation(async () => ({ onboarding_complete: false }));

    const onEnterApp = jest.fn();
    const view = await mount(answers, { onEnterApp });

    await view.findByText(presentError({ kind: 'unexpected_response', detail: '' }).message);

    fireEvent.press(view.getByText(strings.completion.primary));
    expect(onEnterApp).not.toHaveBeenCalled();
  });

  it('istek ucustayken donanimsal geri tusu ekrandan cikarmiyor', async () => {
    // Cikis engellenmezse istek devam ediyor ve profil sunucuda
    // "tamamlandi" damgasini aliyor; kullanici ise duzeltme yaptigini
    // saniyor.
    const handlers: (() => boolean)[] = [];
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((
      _event: string,
      handler: () => boolean,
    ) => {
      handlers.push(handler);
      return {
        remove: () => {
          const index = handlers.indexOf(handler);
          if (index >= 0) handlers.splice(index, 1);
        },
      };
    }) as unknown as typeof BackHandler.addEventListener);

    let release = (): void => {};
    asMock(completeOnboarding).mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ onboarding_complete: true });
        }),
    );

    const view = await mount(answers);
    await view.findByText(strings.completion.primary);

    // Kayitli isleyici `true` donuyorsa geri tusu yutuluyor demektir.
    expect(handlers).toHaveLength(1);
    expect(handlers[0]?.()).toBe(true);

    release();
    await waitFor(() => expect(handlers).toHaveLength(0));
  });
});
