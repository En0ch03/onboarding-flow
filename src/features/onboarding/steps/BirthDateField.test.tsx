import { act, cleanup, fireEvent, type RenderResult } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { strings } from '@/constants/strings';
import { PICKER_TEST_ID } from '@/test/dateTimePickerMock';
import { renderWithTheme } from '@/test/renderWithTheme';

import { BirthDateField } from './BirthDateField';
import type { PartialDate } from './dateParts';

const today = new Date(2026, 8, 4);
const empty: PartialDate = { day: null, month: null, year: null };

afterEach(cleanup);

/** Platformu gecici olarak degistirir; test bitince eski tanimi geri koyar. */
function onPlatform(os: 'ios' | 'android') {
  const original = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
  return () => {
    if (original) Object.defineProperty(Platform, 'OS', original);
  };
}

async function mount(value: PartialDate) {
  const onChange = jest.fn();
  const view = await renderWithTheme(
    <BirthDateField value={value} onChange={onChange} today={today} />,
  );
  return { view, onChange };
}

async function press(element: Parameters<typeof fireEvent.press>[0]) {
  await act(async () => {
    fireEvent.press(element);
  });
}

/** Alanin kendisi; dokununca cark aciliyor. */
function field(view: RenderResult) {
  return view.getByLabelText(strings.steps.birthDateLabel);
}

function picker(view: RenderResult) {
  return view.getByTestId(PICKER_TEST_ID);
}

type Node = { type?: unknown; children?: unknown } | string | null;

/** Agacta yazilabilir bir alan var mi: klavyeyi acacak tek sey o. */
function hasTextInput(node: Node | Node[]): boolean {
  if (node === null || typeof node === 'string') return false;
  if (Array.isArray(node)) return node.some(hasTextInput);
  if (node.type === 'TextInput') return true;
  return hasTextInput((node.children ?? []) as Node[]);
}

/** Carkin kendi olayi: kullanici carki cevirdi. */
async function spin(view: RenderResult, date: Date) {
  await act(async () => {
    picker(view).props.onChange({ type: 'set' }, date);
  });
}

describe('BirthDateField', () => {
  it('tek alan sunuyor ve bos haldeyken gun ay yil yaziyor', async () => {
    const { view } = await mount(empty);

    // Agac gercekten cizildi: alan yerinde ve bir dugme.
    expect(field(view).props.accessibilityRole).toBe('button');
    expect(view.getByText('Gün Ay Yıl')).toBeTruthy();
  });

  it('secili tarihi ay adiyla yaziyor', async () => {
    const { view } = await mount({ day: 14, month: 3, year: 1998 });

    expect(view.getByText('14 Mart 1998')).toBeTruthy();
  });

  it('klavye acacak bir sey yok: alan bir dugme', async () => {
    const { view } = await mount(empty);

    // Klavye acan tek sey bir TextInput olurdu; alan dugme.
    expect(field(view).props.accessibilityRole).toBe('button');
    expect(hasTextInput(view.toJSON())).toBe(false);
  });

  it('dokunulmadan cark ekranda degil', async () => {
    const { view } = await mount(empty);

    // Yokluk iddiasi once varligi kanitliyor: bos render eden bir bilesen de
    // "cark yok" derdi ve test sessizce gecerdi.
    expect(view.getByText('Gün Ay Yıl')).toBeTruthy();
    expect(view.queryByTestId(PICKER_TEST_ID)).toBeNull();
  });

  it('bos alan ekran okuyucuya da bekledigi uc parcayi soyluyor', async () => {
    const { view } = await mount(empty);

    // Soluk yazi yalnizca gozle okunuyordu; deger olarak da duyulmali.
    expect(field(view).props.accessibilityValue).toEqual({ text: 'Gün Ay Yıl' });
  });

  it('dolu alan degerini secili tarihle bildiriyor', async () => {
    const { view } = await mount({ day: 14, month: 3, year: 1998 });

    expect(field(view).props.accessibilityValue).toEqual({ text: '14 Mart 1998' });
  });

  it('iOS: dokununca cark aciliyor ve taslaktaki tarihte duruyor', async () => {
    const restore = onPlatform('ios');
    try {
      const { view } = await mount({ day: 14, month: 3, year: 1998 });
      await press(field(view));

      expect(picker(view).props.value).toEqual(new Date(1998, 2, 14, 12));
    } finally {
      restore();
    }
  });

  it('iOS: bos taslakta cark bugunden on sekiz yil once aciliyor', async () => {
    const restore = onPlatform('ios');
    try {
      const { view, onChange } = await mount(empty);
      await press(field(view));

      expect(picker(view).props.value).toEqual(new Date(2008, 8, 4, 12));
      // Acilis konumu bir varsayim, secim degil: taslaga hicbir sey yazilmadi.
      expect(onChange).not.toHaveBeenCalled();
    } finally {
      restore();
    }
  });

  it('iOS: cark bugunden ilerisini ve 1900 oncesini sunmuyor', async () => {
    const restore = onPlatform('ios');
    try {
      const { view } = await mount(empty);
      await press(field(view));

      expect(picker(view).props.maximumDate).toEqual(today);
      expect(picker(view).props.minimumDate).toEqual(new Date(1900, 0, 1, 12));
    } finally {
      restore();
    }
  });

  it('iOS: cark temanin varyantini aliyor', async () => {
    const restore = onPlatform('ios');
    try {
      const { view } = await mount(empty);
      await press(field(view));

      // Uygulama koyu temada aciliyor; cark da acik zeminli gelmemeli.
      expect(picker(view).props.themeVariant).toBe('dark');
    } finally {
      restore();
    }
  });

  it('iOS: yas kapisi gorunur kaliyor, on sekiz altindaki tarih secilebiliyor', async () => {
    const restore = onPlatform('ios');
    try {
      const { view, onChange } = await mount(empty);
      await press(field(view));
      await spin(view, new Date(2020, 0, 5));
      await press(view.getByText(strings.birthDate.confirm));

      // Cark 18 altini kesseydi kapi sessiz bir engele donerdi; deger geciyor
      // ve dogrulama gorunur hatayi kendisi uretiyor.
      expect(onChange).toHaveBeenCalledWith({ day: 5, month: 1, year: 2020 });
    } finally {
      restore();
    }
  });

  it('iOS: cevrilen deger ancak Sec ile isleniyor', async () => {
    const restore = onPlatform('ios');
    try {
      const { view, onChange } = await mount(empty);
      await press(field(view));
      await spin(view, new Date(1998, 2, 14));

      // Cark cevrildi ama onaylanmadi: taslak henuz degismedi.
      expect(onChange).not.toHaveBeenCalled();

      await press(view.getByText(strings.birthDate.confirm));
      expect(onChange).toHaveBeenCalledWith({ day: 14, month: 3, year: 1998 });
    } finally {
      restore();
    }
  });

  it('iOS: perdeyle kapatmak degeri degistirmiyor', async () => {
    const restore = onPlatform('ios');
    try {
      const { view, onChange } = await mount(empty);
      await press(field(view));
      await spin(view, new Date(1998, 2, 14));
      await press(view.getByLabelText(strings.common.close));

      expect(onChange).not.toHaveBeenCalled();

      // Onaylanmamis donus atiliyor: sayfa yeniden acildiginda cark, taslagin
      // acilis yerinde duruyor, birakildigi yerde degil.
      await press(field(view));
      expect(picker(view).props.value).toEqual(new Date(2008, 8, 4, 12));
    } finally {
      restore();
    }
  });

  it('Android: sistem diyalogu bir tarih verirse deger isleniyor', async () => {
    const restore = onPlatform('android');
    try {
      const { view, onChange } = await mount(empty);
      await press(field(view));

      // Android'de ayri bir onay yok: sistem diyalogunun kendi dugmesi var.
      expect(view.queryByText(strings.birthDate.confirm)).toBeNull();

      await act(async () => {
        picker(view).props.onChange({ type: 'set' }, new Date(1998, 2, 14));
      });

      expect(onChange).toHaveBeenCalledWith({ day: 14, month: 3, year: 1998 });
    } finally {
      restore();
    }
  });

  it('Android: diyalog kapatilirsa deger degismiyor', async () => {
    const restore = onPlatform('android');
    try {
      const { view, onChange } = await mount({ day: 14, month: 3, year: 1998 });
      await press(field(view));

      await act(async () => {
        picker(view).props.onChange({ type: 'dismissed' }, new Date(2001, 0, 1));
      });

      expect(onChange).not.toHaveBeenCalled();
      expect(view.queryByTestId(PICKER_TEST_ID)).toBeNull();
      // Alan eski cevabini koruyor.
      expect(view.getByText('14 Mart 1998')).toBeTruthy();
    } finally {
      restore();
    }
  });

  it('Android: diyalog acilamazsa alan kilitlenmiyor', async () => {
    const restore = onPlatform('android');
    try {
      const { view, onChange } = await mount(empty);
      await press(field(view));

      await act(async () => {
        picker(view).props.onError(new Error('picker unavailable'));
      });

      // Hata sessizce yutulup istek acik kalsaydi alan bir daha hicbir sey
      // acmazdi: kullanici adimda mahsur kalirdi.
      expect(view.queryByTestId(PICKER_TEST_ID)).toBeNull();
      expect(onChange).not.toHaveBeenCalled();

      await press(field(view));
      expect(picker(view)).toBeTruthy();
    } finally {
      restore();
    }
  });

  it('Android: cark kipinde aciliyor', async () => {
    const restore = onPlatform('android');
    try {
      const { view } = await mount(empty);
      await press(field(view));

      expect(picker(view).props.display).toBe('spinner');
      expect(picker(view).props.mode).toBe('date');
    } finally {
      restore();
    }
  });
});
