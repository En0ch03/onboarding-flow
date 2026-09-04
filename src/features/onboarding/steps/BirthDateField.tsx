import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PickerSheet, type PickerOption } from '@/components/PickerSheet';
import { monthNames, strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { dayCount, daysInMonth, yearRange, type PartialDate } from './dateParts';

type Part = 'day' | 'month' | 'year';

type BirthDateFieldProps = {
  value: PartialDate;
  onChange: (next: PartialDate) => void;
  today: Date;
};

/**
 * Dogum tarihi: uc ayri alan, her biri kendi sayfasini aciyor.
 *
 * Tarih tek bir sey degil uc cevap. Uc carki ayni anda gostermek, kullaniciyi
 * ilgilenmedigi iki carkin yaninda dogru olani bulmaya zorluyordu. Gune
 * dokunan yalnizca gunu goruyor.
 *
 * Hicbir alan klavye acmiyor. Ustteki ad alani klavyesini koruyor; degisen
 * yalnizca tarih.
 */
export function BirthDateField({ value, onChange, today }: BirthDateFieldProps) {
  const { spacing } = useTheme();
  const [open, setOpen] = useState<Part | null>(null);

  // Sunulmayan gun secilemedigi icin "31 Subat" arayuzde olusamiyor.
  const dayOptions = useMemo<PickerOption[]>(
    () =>
      Array.from({ length: dayCount(value.month, value.year) }, (_, index) => ({
        value: index + 1,
        label: String(index + 1),
      })),
    [value.month, value.year],
  );

  const monthOptions = useMemo<PickerOption[]>(
    () => monthNames.map((label, index) => ({ value: index + 1, label })),
    [],
  );

  const yearOptions = useMemo<PickerOption[]>(
    () => yearRange(today).map((year) => ({ value: year, label: String(year) })),
    [today],
  );

  /**
   * Ay veya yil degistiginde secili gun o aya sigmiyorsa dusuruluyor.
   * Sessizce baska bir gune kaydirmak, kullanicinin vermedigi bir cevabi
   * onun adina vermek olurdu.
   */
  const choose = (part: Part) => (chosen: number) => {
    const next: PartialDate = { ...value, [part]: chosen };
    if (part !== 'day' && next.day !== null && next.month !== null && next.year !== null) {
      if (next.day > daysInMonth(next.year, next.month)) next.day = null;
    }
    onChange(next);
    setOpen(null);
  };

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="label" tone="inkSoft" style={{ marginBottom: spacing.sm }}>
        {strings.steps.birthDateLabel}
      </AppText>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <PartButton
          label={strings.steps.dayLabel}
          text={value.day === null ? null : String(value.day)}
          onPress={() => setOpen('day')}
          flex={1}
        />
        <PartButton
          label={strings.steps.monthLabel}
          text={value.month === null ? null : monthNames[value.month - 1]}
          onPress={() => setOpen('month')}
          flex={1.7}
        />
        <PartButton
          label={strings.steps.yearLabel}
          text={value.year === null ? null : String(value.year)}
          onPress={() => setOpen('year')}
          flex={1.2}
        />
      </View>

      <PickerSheet
        visible={open === 'day'}
        title={strings.steps.dayLabel}
        options={dayOptions}
        value={value.day}
        onSelect={choose('day')}
        onClose={() => setOpen(null)}
      />
      <PickerSheet
        visible={open === 'month'}
        title={strings.steps.monthLabel}
        options={monthOptions}
        value={value.month}
        onSelect={choose('month')}
        onClose={() => setOpen(null)}
      />
      <PickerSheet
        visible={open === 'year'}
        title={strings.steps.yearLabel}
        options={yearOptions}
        value={value.year}
        onSelect={choose('year')}
        onClose={() => setOpen(null)}
      />
    </View>
  );
}

/** Alanlardan biri. Girdi kutusu degil dugme: dokunulunca klavye degil sayfa aciliyor. */
function PartButton({
  label,
  text,
  onPress,
  flex,
}: {
  label: string;
  /** Secilmemisse null; alan o zaman kendi adini soluk gosterir. */
  text: string | undefined | null;
  onPress: () => void;
  flex: number;
}) {
  const { colors, radius, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...(text ? { accessibilityValue: { text } } : {})}
      onPress={onPress}
      style={({ pressed }) => ({
        flex,
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
        {text ?? label}
      </AppText>
    </Pressable>
  );
}
