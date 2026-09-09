import { act, cleanup, fireEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { strings } from '@/constants/strings';
import { useOnboardingStore, type AnswersUpdate, type DraftAnswers } from '@/state/onboardingStore';
import { renderWithTheme } from '@/test/renderWithTheme';

import { PhoneStep } from './phone.step';

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

describe('taslak alani', () => {
  it('numara depoya yazilip geri okunuyor', () => {
    useOnboardingStore.getState().setAnswers({ phone: '5551234567' });
    expect(useOnboardingStore.getState().answers.phone).toBe('5551234567');
  });
});
