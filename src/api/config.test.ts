import { api, standInApi } from './client';
import { clearOptionGroupCache, fetchOptionGroups } from './config';

jest.mock('./client', () => ({
  api: { get: jest.fn() },
  standInApi: { get: jest.fn() },
}));

const contractGet = jest.mocked(api.get);
const standInGet = jest.mocked(standInApi.get);

const groups = {
  gender: {
    key: 'gender',
    multiSelect: false,
    maxSelection: null,
    required: true,
    options: [{ id: 'woman', label: 'Kadınım' }],
  },
};

beforeEach(() => {
  clearOptionGroupCache();
  contractGet.mockReset();
  standInGet.mockReset();
  standInGet.mockResolvedValue({ data: groups });
});

describe('fetchOptionGroups', () => {
  /**
   * Bu uc nokta sozlesmede yok. Sozlesmeyi eksiksiz karsilayan bir sunucu bunu
   * karsilamak zorunda degil, dolayisiyla sorulacagi adres sozlesme adresi
   * olmak zorunda degil. Ayrimi tutan tek yer burasi.
   */
  it('secenekler sozlesme adresine degil, tezgah adresine soruluyor', async () => {
    await fetchOptionGroups();

    expect(standInGet).toHaveBeenCalledWith('/config/options');
    expect(contractGet).not.toHaveBeenCalled();
  });
});
