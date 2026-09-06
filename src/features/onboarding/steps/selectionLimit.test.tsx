import { act, cleanup, fireEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';

import type { OptionGroup, OptionGroups } from '@/api/schemas';
import { selectionLimit, selectionLimitReached, strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes } from '@/theme/palette';

import { AudienceStep } from './audience.step';
import { IntentStep } from './intent.step';
import { InterestsStep } from './interests.step';

const withLimit = (max: number | null): OptionGroup => ({
  key: 'interests',
  multiSelect: true,
  maxSelection: max,
  required: false,
  options: [
    { id: 'books', label: 'Kitap', order: 1 },
    { id: 'coffee', label: 'Kahve', order: 2 },
    { id: 'cinema', label: 'Sinema', order: 3 },
  ],
});

const intent: OptionGroup = {
  key: 'intent',
  multiSelect: true,
  maxSelection: 2,
  required: true,
  options: [
    { id: 'long_term', label: 'Uzun süreli', order: 1 },
    { id: 'short_term', label: 'Kısa süreli', order: 2 },
    { id: 'friends', label: 'Arkadaşlık', order: 3 },
  ],
};

const audience: OptionGroup = {
  key: 'audience',
  multiSelect: true,
  maxSelection: null,
  required: true,
  options: [
    { id: 'women', label: 'Kadınlar', order: 1 },
    { id: 'men', label: 'Erkekler', order: 2 },
    { id: 'everyone', label: 'Herkes', order: 3 },
  ],
};

/** Platformu gecici olarak degistirir; test bitince eski tanimi geri koyar. */
function onPlatform(os: 'ios' | 'android') {
  const original = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
  return () => {
    if (original) Object.defineProperty(Platform, 'OS', original);
  };
}

const refuse = jest.mocked(Haptics.notificationAsync);
const select = jest.mocked(Haptics.selectionAsync);
let announce: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
});

afterEach(() => {
  announce.mockRestore();
  cleanup();
});

const textColor = (node: { props: { style?: unknown } }) =>
  (StyleSheet.flatten(node.props.style) as { color?: string }).color;

async function renderInterests(max: number | null, selected: string[]) {
  const onChange = jest.fn();
  const options: OptionGroups = { interests: withLimit(max) };
  const view = await renderWithTheme(
    <InterestsStep values={{ interests: selected }} onChange={onChange} options={options} />,
  );
  return { view, onChange };
}

describe('sinir dolmadan once', () => {
  it('kac tane secilebilecegi yaziyor', async () => {
    const { view } = await renderInterests(2, []);

    expect(view.getByText(selectionLimit(2, 0))).toBeTruthy();
  });

  it('sinir sunucudan geliyor: baska bir sayi gelirse o yaziyor', async () => {
    const { view } = await renderInterests(5, ['books']);

    // Beklenen metin bilerek yazili: sozlukteki yardimciyla uretilseydi,
    // sayiyi sabit kodlayan bir degisiklik iki tarafi birden degistirir ve
    // test yesil kalirdi.
    expect(view.getByText('En fazla 5 seçebilirsin · 1 seçili')).toBeTruthy();
  });

  it('sinirsiz listede satir yok', async () => {
    const { view } = await renderInterests(null, ['books']);

    expect(view.queryByText(/En fazla/)).toBeNull();
  });
});

describe('sinir dolu cip', () => {
  it('devre disi ilan edilmiyor; ekran okuyucuya cikis yolunu soyluyor', async () => {
    const { view } = await renderInterests(2, ['books', 'coffee']);
    const blocked = view.getByLabelText('Sinema');

    expect(blocked.props.accessibilityState?.disabled).toBeFalsy();
    expect(blocked.props.accessibilityHint).toBe(strings.selection.blockedHint);
  });

  it('secili cip ipucu tasimiyor: onu birakmak serbest', async () => {
    const { view } = await renderInterests(2, ['books', 'coffee']);

    expect(view.getByLabelText('Kitap').props.accessibilityHint).toBeUndefined();
  });

  it('basilinca sebebini soyluyor ve secimi degistirmiyor', async () => {
    const { view, onChange } = await renderInterests(2, ['books', 'coffee']);

    await act(async () => {
      fireEvent.press(view.getByLabelText('Sinema'));
    });

    expect(view.getByText(selectionLimitReached(2))).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('basilinca satir uyari tonuna geciyor', async () => {
    const { view } = await renderInterests(2, ['books', 'coffee']);

    await act(async () => {
      fireEvent.press(view.getByLabelText('Sinema'));
    });

    const color = textColor(view.getByText(selectionLimitReached(2)));
    expect([palettes.light.danger, palettes.dark.danger]).toContain(color);
  });

  it('basilinca uyari hissi veriyor, secim hissi degil', async () => {
    const { view } = await renderInterests(2, ['books', 'coffee']);

    await act(async () => {
      fireEvent.press(view.getByLabelText('Sinema'));
    });

    expect(refuse).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();
  });

  it("iOS'ta sebep ekran okuyucuya elle duyuruluyor", async () => {
    const restore = onPlatform('ios');
    const { view } = await renderInterests(2, ['books', 'coffee']);

    await act(async () => {
      fireEvent.press(view.getByLabelText('Sinema'));
    });

    expect(announce).toHaveBeenCalledWith(selectionLimitReached(2));
    restore();
  });

  it("Android'de canli bolge duyuruyor; elle ikinci bir duyuru yapilmiyor", async () => {
    const restore = onPlatform('android');
    const { view } = await renderInterests(2, ['books', 'coffee']);

    await act(async () => {
      fireEvent.press(view.getByLabelText('Sinema'));
    });

    const note = view.getByText(selectionLimitReached(2));
    expect(note.props.accessibilityLiveRegion).toBe('polite');
    expect(announce).not.toHaveBeenCalled();
    restore();
  });

  it('birini birakinca uyari sonuyor', async () => {
    const { view, onChange } = await renderInterests(2, ['books', 'coffee']);

    await act(async () => {
      fireEvent.press(view.getByLabelText('Sinema'));
    });
    await act(async () => {
      fireEvent.press(view.getByLabelText('Kahve'));
    });

    expect(onChange).toHaveBeenCalledWith({ interests: ['books'] });
    expect(view.queryByText(selectionLimitReached(2))).toBeNull();
  });
});

describe('ayni davranis kart listesinde', () => {
  it('sinir dolu karta basmak sebebini soyluyor', async () => {
    const onChange = jest.fn();
    const view = await renderWithTheme(
      <IntentStep
        values={{ intent: ['long_term', 'short_term'] }}
        onChange={onChange}
        options={{ intent }}
      />,
    );

    await act(async () => {
      fireEvent.press(view.getByLabelText('Arkadaşlık'));
    });

    expect(view.getByText(selectionLimitReached(2))).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
    expect(view.getByLabelText('Arkadaşlık').props.accessibilityHint).toBe(
      strings.selection.blockedHint,
    );
  });
});

describe('kimlerin gorecegi listesi', () => {
  it('sunucu sinir vermeyince satir yok ve hepsi secilebiliyor', async () => {
    const onChange = jest.fn();
    const view = await renderWithTheme(
      <AudienceStep
        values={{ audience: ['women', 'men'] }}
        onChange={onChange}
        options={{ audience }}
      />,
    );

    expect(view.queryByText(/En fazla/)).toBeNull();

    await act(async () => {
      fireEvent.press(view.getByLabelText('Herkes'));
    });

    expect(onChange).toHaveBeenCalledWith({ audience: ['women', 'men', 'everyone'] });
  });
});

describe('tekli liste', () => {
  const single: OptionGroup = {
    key: 'interests',
    multiSelect: false,
    maxSelection: null,
    required: false,
    options: [
      { id: 'books', label: 'Kitap', order: 1 },
      { id: 'coffee', label: 'Kahve', order: 2 },
    ],
  };

  it('zaten secili olana tekrar dokunmak olay degil: ne his ne cevap', async () => {
    const onChange = jest.fn();
    const view = await renderWithTheme(
      <InterestsStep
        values={{ interests: ['books'] }}
        onChange={onChange}
        options={{ interests: single }}
      />,
    );

    await act(async () => {
      fireEvent.press(view.getByLabelText('Kitap'));
    });

    expect(select).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('cinsiyet listesi de ayni kancadan geciyor', async () => {
    const gender: OptionGroup = {
      key: 'gender',
      multiSelect: false,
      maxSelection: null,
      required: true,
      options: [
        { id: 'woman', label: 'Kadın', order: 1 },
        { id: 'man', label: 'Erkek', order: 2 },
      ],
    };
    const onChange = jest.fn();
    const view = await renderWithTheme(
      <AudienceStep values={{ gender: 'woman' }} onChange={onChange} options={{ gender }} />,
    );

    await act(async () => {
      fireEvent.press(view.getByLabelText('Kadın'));
    });
    expect(select).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(view.getByLabelText('Erkek'));
    });
    expect(select).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ gender: 'man' });

    // Tek secimli listede "onay kutusu" demek, ekran okuyucu kullanicisina
    // birden fazla secebilecegini soylemek olurdu.
    expect(view.getByLabelText('Kadın').props.accessibilityRole).toBe('radio');
  });

  it('coklu kart listesi onay kutusu olarak duyuruluyor', async () => {
    const onChange = jest.fn();
    const view = await renderWithTheme(
      <IntentStep values={{ intent: ['long_term'] }} onChange={onChange} options={{ intent }} />,
    );

    expect(view.getByLabelText('Uzun süreli').props.accessibilityRole).toBe('checkbox');
  });
});

describe('niyet degisince ilgi alanlari', () => {
  it('artik gosterilmeyen listeye ait cevap dusuyor', async () => {
    // Arkadaslik secip bir etiket isaretleyen, sonra arkadasligi birakan
    // kullanicinin etiketi taslakta hayalet olarak kalmamali.
    const options: OptionGroups = {
      intent: {
        key: 'intent',
        multiSelect: true,
        maxSelection: 2,
        required: true,
        options: [
          { id: 'long_term', label: 'Uzun süreli', order: 1 },
          { id: 'friends', label: 'Arkadaşlık', order: 2, unlocks: 'interests_friendship' },
        ],
      },
      interests: {
        key: 'interests',
        multiSelect: true,
        maxSelection: null,
        required: false,
        options: [{ id: 'books', label: 'Kitap', order: 1 }],
      },
      interests_friendship: {
        key: 'interests_friendship',
        multiSelect: true,
        maxSelection: null,
        required: false,
        options: [{ id: 'games', label: 'Oyun', order: 1 }],
      },
    };
    const onChange = jest.fn();
    const view = await renderWithTheme(
      <IntentStep
        values={{ intent: ['friends'], interests: ['games'] }}
        onChange={onChange}
        options={options}
      />,
    );

    await act(async () => {
      fireEvent.press(view.getByLabelText('Arkadaşlık'));
    });

    expect(onChange).toHaveBeenCalledWith({ intent: [], interests: [] });
  });
});
