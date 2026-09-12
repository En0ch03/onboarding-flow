import { act, cleanup, fireEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Keyboard, Platform, StyleSheet } from 'react-native';

import { strings } from '@/constants/strings';
import { useOnboardingStore, type AnswersUpdate, type DraftAnswers } from '@/state/onboardingStore';
import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes, withAlpha } from '@/theme';

import { PhoneStep } from './phone.step';
import { MAX_INPUT_LENGTH } from './phoneNumber';

afterEach(cleanup);

/** Son cevaplarin okunabildigi, disaridan doldurulan kutu. */
type Seen = { answers: DraftAnswers };

function Harness({ onAnswers }: { onAnswers: (answers: DraftAnswers) => void }) {
  const [answers, setAnswers] = useState<DraftAnswers>({});

  const onChange = (update: AnswersUpdate) =>
    setAnswers((current) => {
      const next = { ...current, ...(typeof update === 'function' ? update(current) : update) };
      onAnswers(next);
      return next;
    });

  return <PhoneStep values={answers} onChange={onChange} options={{}} />;
}

async function renderStep() {
  const seen: Seen = { answers: {} };
  const view = await renderWithTheme(
    <Harness
      onAnswers={(answers) => {
        seen.answers = answers;
      }}
    />,
  );
  return { view, seen };
}

/** Alan, oneki de tasiyan etiketiyle bulunuyor. */
const fieldLabel = `${strings.steps.phoneLabel}, ${strings.steps.phonePrefix}`;

describe('PhoneStep', () => {
  it('ulke kodu ekranda sabit duruyor', async () => {
    const { view } = await renderStep();

    // Kullanici `+90` yazmiyor: yazmasi gerektigini sanirsa numara on haneyi
    // asar ve gecersiz olur.
    //
    // Sorgu gizli ogeleri de kapsiyor cunku onek ekran okuyucudan bilerek
    // gizli: ayni bilgi alanin etiketinde zaten var ve iki kez okunmamali.
    expect(view.getByText(strings.steps.phonePrefix, { includeHiddenElements: true })).toBeTruthy();
  });

  it('ekran okuyucu alani ulke koduyla birlikte okuyor', async () => {
    const { view } = await renderStep();

    // Onek ayri bir dugum; etikete katilmasaydi ya baglamsiz okunurdu ya da
    // hic duyulmazdi.
    expect(view.getByLabelText(fieldLabel)).toBeTruthy();
  });

  it('ulke kodu ekran okuyucuya ikinci kez okunmuyor', async () => {
    const { view } = await renderStep();

    // Ayni bilgi alanin etiketinde zaten var. Gizlenmezse ekran okuyucu once
    // baglamsiz bir "+90", sonra alanin etiketini okur.
    expect(view.queryByText(strings.steps.phonePrefix)).toBeNull();
  });

  it('ulke koduna dokunmak alani odakliyor: onek bir hedef degil', async () => {
    const { view } = await renderStep();

    const prefix = view.getByText(strings.steps.phonePrefix, { includeHiddenElements: true });
    expect(prefix.parent?.props.pointerEvents).toBe('none');
  });

  it('sayi klavyesi aciliyor', async () => {
    const { view } = await renderStep();

    // Harf klavyesi bu alanda yalnizca yer kaplar; numara rakamdan ibaret.
    expect(view.getByLabelText(fieldLabel).props.keyboardType).toBe('phone-pad');
  });

  it('alan kendi cam yuzeyini tasiyor, kartsiz ekranin opak zeminini degil', async () => {
    const { view } = await renderStep();

    const style = StyleSheet.flatten(view.getByLabelText(fieldLabel).props.style) as Record<
      string,
      unknown
    >;
    // `field` yuzeyi cam kipi kapaliyken "Simdilik gec" ile ayni murekkep
    // dolgusunu kullaniyor; varsayilan `solid` zemininden (surface, %92) ayri.
    expect(style.backgroundColor).toBe(withAlpha(palettes.dark.ink, 0.08));
  });

  it('yapistirilan uzun yazim alana sigiyor', async () => {
    const { view } = await renderStep();

    // Dar bir sinir, temizligin hic gormedigi bir metin birakir ve on haneli
    // ama yanlis bir numara uretir.
    expect(view.getByLabelText(fieldLabel).props.maxLength).toBe(MAX_INPUT_LENGTH);
  });

  it('kaldigi yerden donen kullanici numarasini alanda buluyor', async () => {
    // Taslaktaki cevap alana yazilmazsa kullanici -- kapat-ac sonrasi veya
    // "Profilimi duzenle" ile -- bos bir alan gorur ve numarayi kaydedilmemis
    // sanip yeniden yazar. Cevabi almak yetmiyor, geri gostermek de gerekiyor.
    const view = await renderWithTheme(
      <PhoneStep values={{ phone: '5551234567' }} onChange={() => {}} options={{}} />,
    );

    expect(view.getByLabelText(fieldLabel).props.value).toBe('5551234567');
  });

  it('yazilan numara taslaga giriyor', async () => {
    const { view, seen } = await renderStep();

    await act(async () => {
      fireEvent.changeText(view.getByLabelText(fieldLabel), '5551234567');
    });

    expect(seen.answers.phone).toBe('5551234567');
  });

  it('yapistirilan ulke kodlu numara temizleniyor', async () => {
    const { view, seen } = await renderStep();

    await act(async () => {
      fireEvent.changeText(view.getByLabelText(fieldLabel), '+90 555 123 45 67');
    });

    // Temizlik yazarken yapiliyor: alanda duran sey, saklanan seyle ayni
    // olmali, yoksa kullanici neyin kaydedildigini goremez.
    expect(seen.answers.phone).toBe('5551234567');
  });

  it('bastaki sifir taslaga girmiyor', async () => {
    const { view, seen } = await renderStep();

    await act(async () => {
      fireEvent.changeText(view.getByLabelText(fieldLabel), '05551234567');
    });

    expect(seen.answers.phone).toBe('5551234567');
  });
});

/** Platformu gecici olarak degistirir; test bitince eski tanimi geri koyar. */
function onPlatform(os: 'ios' | 'android') {
  const original = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
  return () => {
    if (original) Object.defineProperty(Platform, 'OS', original);
  };
}

describe('klavyeyi kapatan serit', () => {
  it("iOS'ta alanin ustunde Turkce bir bitirme dugmesi var", async () => {
    const restore = onPlatform('ios');
    try {
      const { view } = await renderStep();

      // Once agacin cizildigi: bos bir agacta asagidaki iddia da patlardi.
      expect(view.getByLabelText(fieldLabel)).toBeTruthy();

      const dismiss = view.getByLabelText(strings.common.dismissKeyboard);
      expect(dismiss.props.accessibilityRole).toBe('button');
      expect(view.getByText(strings.common.dismissKeyboard)).toBeTruthy();

      // Seridin cizilmis olmasi yetmiyor: alanin onu kendi klavyesine
      // baglamasi gerekiyor, yoksa serit hicbir klavyenin ustunde cikmaz.
      expect(view.getByLabelText(fieldLabel).props.inputAccessoryViewID).toBeTruthy();
    } finally {
      restore();
    }
  });

  it('dugmeye dokunmak klavyeyi kapatiyor', async () => {
    const restore = onPlatform('ios');
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
    try {
      const { view } = await renderStep();

      await act(async () => {
        fireEvent.press(view.getByLabelText(strings.common.dismissKeyboard));
      });

      expect(dismiss).toHaveBeenCalled();
    } finally {
      dismiss.mockRestore();
      restore();
    }
  });

  it("Android'de serit cizilmiyor: klavyenin kendi onay tusu var", async () => {
    const restore = onPlatform('android');
    try {
      const { view } = await renderStep();

      // Baglantinin kendisi sinaniyor: seridin gorunmedigini iddia etmek
      // yetmez, cunku platform bu bileseni zaten kendisi cizmiyor.
      expect(view.getByLabelText(fieldLabel).props.inputAccessoryViewID).toBeUndefined();
      expect(view.queryByLabelText(strings.common.dismissKeyboard)).toBeNull();
    } finally {
      restore();
    }
  });
});

describe('taslak alani', () => {
  it('numara depoya yazilip geri okunuyor', () => {
    useOnboardingStore.getState().setAnswers({ phone: '5551234567' });
    expect(useOnboardingStore.getState().answers.phone).toBe('5551234567');
  });
});
