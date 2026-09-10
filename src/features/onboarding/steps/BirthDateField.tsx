import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { monthNames, strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { dateFromParts, EARLIEST_YEAR, partsFromDate, type PartialDate } from './dateParts';

/** Cark bos taslakta burada aciliyor; bir varsayim, secim degil. */
const OPENING_AGE = 18;

type BirthDateFieldProps = {
  value: PartialDate;
  onChange: (next: PartialDate) => void;
  today: Date;
};

/**
 * Dogum tarihi: platformun kendi carki.
 *
 * Elde yazilmis bir cark bir kez denendi ve cihazda reddedildi: yapisma,
 * ivmelenme ve erisilebilirlik jestleri platformun bedavaya verdigi seyler,
 * biz onlari yeniden kurup bakimini ustlenmis oluyorduk. Ikinci kez yazmak
 * inat olurdu.
 *
 * Iki platform ayni sunumu paylasmiyor, bilerek: iOS'ta cark alttan acilan
 * sayfada ve ayri bir onay dugmesi var, Android'de sistemin kendi diyalogu
 * kendi dugmeleriyle geliyor. Kullaniciya kendi cihazinin tanidik jestini
 * ogretmek, iki cihazda ayni gorunmekten onemli.
 *
 * En buyuk secilebilir tarih bugun; alt sinir 1900. Yas siniri carka
 * konulmuyor: 18 altini hic sundurmamak, yas kapisini gorunur bir dogrulama
 * olmaktan cikarip sessiz bir engele cevirirdi.
 *
 * Alan bir dugme, girdi kutusu degil: dokunulunca klavye degil cark aciliyor.
 */
export function BirthDateField({ value, onChange, today }: BirthDateFieldProps) {
  const { colors, radius, scheme, spacing, screenPadding } = useTheme();
  const [open, setOpen] = useState(false);

  const chosen = useMemo(() => dateFromParts(value), [value]);
  const opening = useMemo(() => chosen ?? yearsBefore(today, OPENING_AGE), [chosen, today]);
  const earliest = useMemo(() => new Date(EARLIEST_YEAR, 0, 1), []);

  // Carkin uzerinde durdugu tarih. Taslaktan ayri tutuluyor: onaylanmamis bir
  // donus cevap degil, bu yuzden taslaga yazilmiyor.
  const [spun, setSpun] = useState<Date | null>(null);
  const wheel = spun ?? opening;

  const start = () => {
    setSpun(null);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setSpun(null);
  };

  const confirm = () => {
    onChange(partsFromDate(wheel));
    close();
  };

  /** Android'de onay sistemin diyalogunda; olay hem secimi hem vazgecmeyi tasiyor. */
  const answerFromDialog = (event: DateTimePickerEvent, date?: Date) => {
    close();
    if (event.type === 'set' && date) onChange(partsFromDate(date));
  };

  const text = chosen === null ? null : formatDate(chosen);

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="label" tone="inkSoft" style={{ marginBottom: spacing.sm }}>
        {strings.steps.birthDateLabel}
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.steps.birthDateLabel}
        {...(text ? { accessibilityValue: { text } } : {})}
        onPress={start}
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: pressed ? colors.clay : colors.hairline,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.md,
        })}
      >
        <AppText variant="control" tone={text ? 'ink' : 'inkSoft'} numberOfLines={1}>
          {text ?? placeholder}
        </AppText>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <BottomSheet visible={open} title={strings.steps.birthDateLabel} onClose={close}>
          <View style={{ paddingHorizontal: screenPadding, gap: spacing.lg }}>
            <DateTimePicker
              value={wheel}
              mode="date"
              display="spinner"
              locale="tr-TR"
              maximumDate={today}
              minimumDate={earliest}
              // Tema varyanti yerel carka dogrudan geciyor. Yazi rengi ayrica
              // veriliyor: koyu zeminde okunurlugun varyantla saglandigi
              // cihazda henuz dogrulanmadi, renk o dogrulamaya kadar duruyor.
              themeVariant={scheme === 'dark' ? 'dark' : 'light'}
              textColor={colors.ink}
              onChange={(_event, date) => {
                if (date) setSpun(date);
              }}
            />
            <Button title={strings.birthDate.confirm} onPress={confirm} />
          </View>
        </BottomSheet>
      ) : null}

      {Platform.OS !== 'ios' && open ? (
        <DateTimePicker
          value={wheel}
          mode="date"
          display="spinner"
          maximumDate={today}
          minimumDate={earliest}
          onChange={answerFromDialog}
          // Sistem diyalogu acilamazsa istek kapaniyor. Acik birakmak, alanin
          // bir daha hicbir sey acmamasi ve kullanicinin adimda mahsur
          // kalmasi demekti; hata en azindan yeniden denemeye izin vermeli.
          onError={close}
        />
      ) : null}
    </View>
  );
}

/** Bos alanin yazisi: alanin bekledigi uc parca, ayri bir metin uydurmadan. */
const placeholder = `${strings.steps.dayLabel} ${strings.steps.monthLabel} ${strings.steps.yearLabel}`;

/** `14 Mart 1998`. Ay adiyla yaziliyor: rakamli bicimde gun ve ay karisiyor. */
function formatDate(date: Date): string {
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

/** Verilen tarihten bu kadar yil once. */
function yearsBefore(date: Date, years: number): Date {
  return new Date(date.getFullYear() - years, date.getMonth(), date.getDate());
}
