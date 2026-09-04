import { cleanup } from '@testing-library/react-native';

import type { OptionGroups } from '@/api/schemas';
import { strings } from '@/constants/strings';
import { useOnboardingStore, type DraftAnswers } from '@/state/onboardingStore';
import { renderWithTheme } from '@/test/renderWithTheme';

import { CompletionScreen } from './CompletionScreen';

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
  name: 'Deniz',
  birthDate: { day: '14', month: '3', year: '1996' },
  audience: ['everyone'],
  intent: ['long_term'],
  interests: ['books'],
  photos: [{ id: 'p1', url: 'http://example.test/p1' }],
};

afterEach(cleanup);

async function mount(draft: DraftAnswers) {
  useOnboardingStore.setState({ answers: draft, unsyncedStepIds: [] });
  return renderWithTheme(
    <CompletionScreen options={options} onEnterApp={() => {}} onEditProfile={() => {}} />,
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

  it('etiket ve degeri ekran okuyucuya tek parca veriyor', async () => {
    const view = await mount(answers);
    expect(view.getByLabelText(`${strings.completion.recapAudience}: Herkes`)).toBeTruthy();
  });
});
