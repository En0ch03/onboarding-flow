import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

import { completeOnboarding } from '@/api/endpoints';
import type { OptionGroups } from '@/api/schemas';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Screen } from '@/components/Screen';
import { presentError } from '@/constants/errorMessages';
import { completionTitle, nameWithAge, photoSummary, strings } from '@/constants/strings';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuthStore } from '@/state/authStore';
import { useOnboardingStore } from '@/state/onboardingStore';
import { useTheme } from '@/theme';

import { saveStep } from './saveStep';
import { ageOn, inspectBirthDate } from './steps/birthDate';
import { groupKeyForIntent } from './steps/interestsGroup';

type CompletionScreenProps = {
  options: OptionGroups;
  /** Ana uygulamaya geri donulemez gecis. */
  onEnterApp: () => void;
  onEditProfile: () => void;
};

/**
 * Kapanis, kutlama degil.
 *
 * Konfeti yerine cevaplar geri okunuyor: kullaniciya ne paylastigini
 * hatirlatiyor ve bir sonraki adimi dogal kiliyor.
 */
export function CompletionScreen({ options, onEnterApp, onEditProfile }: CompletionScreenProps) {
  const { colors, radius, spacing } = useTheme();

  const answers = useOnboardingStore((state) => state.answers);
  const unsynced = useOnboardingStore((state) => state.unsyncedStepIds);
  const markStepSynced = useOnboardingStore((state) => state.markStepSynced);
  const clearDraft = useOnboardingStore((state) => state.clearDraft);
  const markOnboardingComplete = useAuthStore((state) => state.markOnboardingComplete);

  const finish = useAsyncAction(async () => {
    // Yazilamamis adimlar once tekrar deneniyor: sunucuda eksik bir profili
    // tamamlanmis olarak isaretlemek, kullanicinin sonradan bosluk gormesi demek.
    for (const stepId of unsynced) {
      await saveStep(stepId, answers);
      markStepSynced(stepId);
    }

    await completeOnboarding();
    markOnboardingComplete();
    return true;
  });

  useEffect(() => {
    void finish.run();
    // Ekran acildiginda bir kez calisir; tekrar denemeyi kullanici tetikler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelsFor = (groupKey: string, ids: string[] | undefined) => {
    if (!ids?.length) return strings.completion.recapEmpty;

    const group = options[groupKey];
    // Grup hic gelmediginde kullaniciyi suclamiyoruz: cevabi vermis olabilir,
    // eksik olan sunucunun etiket katalogu.
    if (!group) return strings.completion.recapEmpty;

    // Cozulemeyen bir kimlik gosterilmiyor. Ham kimlikler Ingilizce ve
    // kullanicinin hicbir yerde gormedigi seyler; ekrana dusmeleri, ozeti
    // "board_games" yazan bir satira cevirir.
    const labels = ids
      .map((id) => group.options.find((option) => option.id === id)?.label)
      .filter((label): label is string => label !== undefined);

    return labels.length > 0 ? labels.join(', ') : strings.completion.recapEmpty;
  };

  const failure = finish.state.status === 'error' ? finish.state.error : null;

  const age = readAge(answers.birthDate);
  // Ilgi alanlari grubu niyete gore degisiyor; ozet, kullanicinin gordugu
  // listeye karsi etiket cozmeli.
  const interestsGroupKey = groupKeyForIntent(answers.intent, options);

  return (
    <Screen
      align="center"
      footer={
        <View>
          <Button
            title={strings.completion.primary}
            // Taslak burada siliniyor, tamamlanma aninda degil. Tamamlanmada
            // silmek iki seyi bozuyordu: ekran gosterecegi ozeti kendi
            // siliyordu, ve "profilimi duzenle" yolu adimlari bos aciyordu.
            // Burasi akisin geri donulemez tek noktasi.
            onPress={() => {
              clearDraft();
              onEnterApp();
            }}
            loading={finish.state.status === 'loading'}
          />
          <Button
            title={strings.completion.secondary}
            onPress={onEditProfile}
            variant="ghost"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      }
    >
      <ProfileMark name={answers.name ?? ''} cover={answers.photos?.[0]?.url} />

      {/* Isim yalin birakiliyor: ek getirmek bir isimde dogru, digerinde bozuk. */}
      <AppText variant="title" accessibilityRole="header" style={{ marginTop: spacing.xl }}>
        {completionTitle(answers.name ?? '')}
      </AppText>
      <AppText variant="subhead" tone="inkSoft" style={{ marginTop: spacing.md }}>
        {strings.completion.subtitle}
      </AppText>

      {failure ? (
        <View style={{ marginTop: spacing.xl }}>
          <ErrorBanner
            message={presentError(failure).message}
            action={{ label: strings.common.retry, onPress: () => void finish.run() }}
          />
        </View>
      ) : null}

      {/* Ozet bir kart: cevaplar ekranin geri kalanina karismiyor, kendi
          yuzeyinde duruyor ve okunacak bir sey oldugu belli oluyor. */}
      <View
        style={{
          marginTop: spacing.xl,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          padding: spacing.lg,
          gap: spacing.md,
        }}
      >
        <AppText variant="heading">{nameWithAge(answers.name ?? '', age)}</AppText>

        {/* Sayilar degil cevaplar geri okunuyor: "Ilgi alanlari 3" kullaniciya
            ne sectigini hatirlatmiyor. */}
        <RecapRow
          label={strings.completion.recapAudience}
          value={labelsFor('audience', answers.audience)}
        />
        <RecapRow
          label={strings.completion.recapIntent}
          value={labelsFor('intent', answers.intent)}
        />
        <RecapRow
          label={strings.completion.recapInterests}
          value={labelsFor(interestsGroupKey, answers.interests)}
        />
        <RecapRow
          label={strings.completion.recapPhotos}
          value={photoSummary(answers.photos?.length ?? 0)}
        />
      </View>
    </Screen>
  );
}

/**
 * Kapak fotografi, yoksa adin ilk harfi.
 *
 * Once burada soyut bir amblem vardi ve kullanicinin kendisiyle hicbir
 * ilgisi yoktu. Kapanis ekraninin isi kullaniciya ne kurdugunu gostermek;
 * gosterilecek en dogru sey profilinin yuzu.
 *
 * Ekran okuyucudan gizli: tasidigi bilginin tamami (ad) iki satir asagida
 * zaten okunuyor ve ciplak bir "D" harfi orada yalnizca gurultu olurdu.
 */
function ProfileMark({ name, cover }: { name: string; cover?: string | undefined }) {
  const { colors, radius } = useTheme();
  // Medya sunucuda yasiyor ve taslak diskte; sunucu yeniden baslatildiginda
  // kayitli bir adres 404 doner. Hata yakalanmazsa geriye ne fotograf ne
  // harf kalir, yalnizca bos bir daire.
  const [broken, setBroken] = useState(false);
  const size = 88;

  const shape = {
    width: size,
    height: size,
    borderRadius: radius.full,
    overflow: 'hidden' as const,
    backgroundColor: colors.clay,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  if (cover && !broken) {
    return (
      <View
        style={shape}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Image
          source={{ uri: cover }}
          onError={() => setBroken(true)}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    );
  }

  // `slice` cok kodlu bir harfte yarim karakter uretir; `Array.from` tam
  // harfi veriyor.
  const first = Array.from(name.trim())[0] ?? '';

  return (
    <View style={shape} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <AppText variant="title" tone="onClay" style={{ lineHeight: 40 }}>
        {first === 'i' ? 'İ' : first.toLocaleUpperCase('tr-TR')}
      </AppText>
    </View>
  );
}

/**
 * Yas yalnizca dogrulamadan gecen bir tarihten okunuyor: yarim, takvimde
 * olmayan veya yas sinirinin altinda bir taslak yas uretmiyor. Son sart
 * savunma amacli - kapiyi gecmeden bu ekrana gelinemiyor.
 */
function readAge(
  birthDate: { day: string; month: string; year: string } | undefined,
): number | null {
  if (birthDate === undefined || inspectBirthDate(birthDate) !== null) return null;
  const birth = new Date(
    Number(birthDate.year),
    Number(birthDate.month) - 1,
    Number(birthDate.day),
  );
  return ageOn(birth, new Date());
}

function RecapRow({ label, value }: { label: string; value: string }) {
  const { spacing } = useTheme();

  return (
    // Etiket ve deger tek bir odak: ayri ayri okundugunda ekran okuyucu
    // kullanicisi "Kimler gorecek" ile "Herkes" arasindaki bagi kaybediyor.
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg }}
    >
      <AppText variant="label" tone="inkSoft">
        {label}
      </AppText>
      <AppText variant="label" style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}
