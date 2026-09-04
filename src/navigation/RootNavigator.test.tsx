import { resolveSignIn } from './RootNavigator';

jest.mock('@/state/bootstrap', () => ({
  bootstrap: jest.fn(),
  adoptServerProfile: jest.fn(),
}));

const { adoptServerProfile } = jest.requireMock('@/state/bootstrap');

/**
 * Hata tam olarak burada yasadi: giris yolu sunucudaki profili hic
 * okumuyordu ve kullanici baska bir cihazda verdigi cevaplari gormuyordu.
 * Benimseme fonksiyonunun kendi testleri o cagriyi tutmuyor.
 */
beforeEach(() => {
  adoptServerProfile.mockReset();
  adoptServerProfile.mockResolvedValue('in-progress');
});

describe('resolveSignIn', () => {
  it('sunucudaki profili okumadan hicbir yere gitmiyor', async () => {
    const setPhase = jest.fn();

    await resolveSignIn(false, setPhase);

    expect(adoptServerProfile).toHaveBeenCalled();
    expect(setPhase.mock.calls.map(([phase]) => phase)).toEqual(['loading', 'onboarding']);
  });

  it('sunucu profili tamamlanmis buldiysa uygulamaya gidiyor', async () => {
    adoptServerProfile.mockResolvedValue('complete');
    const setPhase = jest.fn();

    await resolveSignIn(false, setPhase);

    expect(setPhase).toHaveBeenLastCalledWith('app');
  });

  it('giris tamamlanmis dediyse profil okumasi bunu geri almiyor', async () => {
    const setPhase = jest.fn();

    await resolveSignIn(true, setPhase);

    expect(setPhase).toHaveBeenLastCalledWith('app');
  });

  it('oturum bu arada bittiyse akisa degil karsilamaya birakiyor', async () => {
    // Token'i olmayan biri akisin icinde her adimda 401 alir ve "oturumun
    // sona erdi" bandini akisin ortasinda gorurdu.
    adoptServerProfile.mockResolvedValue('session-lost');
    const setPhase = jest.fn();

    await resolveSignIn(false, setPhase);

    expect(setPhase).toHaveBeenLastCalledWith('welcome');
  });

  it('beklenmeyen bir dususte bekleme ekraninda birakmiyor', async () => {
    // O ekranda ne geri tusu var ne yeniden deneme; tek cikis uygulamayi
    // kapatmak olurdu.
    adoptServerProfile.mockRejectedValue(new Error('boom'));
    const setPhase = jest.fn();

    await resolveSignIn(false, setPhase);

    expect(setPhase).toHaveBeenLastCalledWith('welcome');
  });
});
