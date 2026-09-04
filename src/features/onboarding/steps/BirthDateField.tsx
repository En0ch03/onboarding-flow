import { useMemo, useState } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { WheelPicker, WHEEL_ROWS, wheelRowHeight, type WheelItem } from '@/components/WheelPicker';
import { birthDateSummary, monthNames, strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { clampParts, daysInMonth, yearRange, type DateParts } from './dateWheel';

type BirthDateFieldProps = {
  /** Henuz secilmediyse null; alan o zaman ipucu metnini gosterir. */
  value: DateParts | null;
  /** Carkin bos taslakta acilacagi satir. */
  opening: DateParts;
  onChange: (parts: DateParts) => void;
  today: Date;
};

/**
 * Dogum tarihi alani.
 *
 * Alan bir girdi kutusu degil bir dugme: dokununca klavye degil cark aciliyor.
 * Uc rakam alani yerine cark olmasinin sebebi, klavyenin ekranin yarisini
 * kaplamasi ve tarihin zaten yazilarak degil secilerek verilen bir sey olmasi.
 * Ustteki ad alani klavyesini koruyor; degisen yalnizca tarih.
 *
 * Secim, cark cevrildikce degil "Tamam" denince islenir. Cark cevirmek
 * kacinilmaz olarak aradaki degerlerden geciyor ve her gecisi kaydetmek,
 * kullanicinin hic secmedigi bir tarihte yas kapisini calistirabilirdi.
 */
export function BirthDateField({ value, opening, onChange, today }: BirthDateFieldProps) {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateParts>(value ?? opening);

  const start = () => {
    setDraft(value ?? opening);
    setOpen(true);
  };

  const commit = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="label" tone="inkSoft" style={{ marginBottom: spacing.sm }}>
        {strings.steps.birthDateLabel}
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.steps.birthDateLabel}
        accessibilityValue={{
          text: value ? birthDateSummary(value.day, value.month, value.year) : undefined,
        }}
        onPress={start}
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: pressed ? colors.clay : colors.hairline,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
        })}
      >
        <AppText variant="control" tone={value ? 'ink' : 'inkSoft'}>
          {value
            ? birthDateSummary(value.day, value.month, value.year)
            : strings.steps.birthDatePlaceholder}
        </AppText>
      </Pressable>

      <BirthDateSheet
        visible={open}
        draft={draft}
        today={today}
        onDraftChange={setDraft}
        onCancel={() => setOpen(false)}
        onConfirm={commit}
      />
    </View>
  );
}

function BirthDateSheet({
  visible,
  draft,
  today,
  onDraftChange,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  draft: DateParts;
  today: Date;
  onDraftChange: (parts: DateParts) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { colors, radius, spacing, screenPadding } = useTheme();
  // Olculer saglayicidan, yani pencereden geliyor; sayfa yerel bir pencerede
  // aciliyor ama ayni ekrani kapliyor, dolayisiyla alt bosluk ayni. Cihazda
  // dogrulanacak: gezinme cubugu olan Android'de sayfanin dibi kontrol edilmeli.
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();

  const years = useMemo(() => yearRange(today), [today]);
  const yearItems = useMemo<WheelItem[]>(
    () => years.map((year) => ({ value: year, label: String(year) })),
    [years],
  );
  const monthItems = useMemo<WheelItem[]>(
    () => monthNames.map((label, index) => ({ value: index + 1, label })),
    [],
  );
  // Gun listesi secili aya gore kisalip uzuyor. Sunulmayan gun secilemedigi
  // icin "31 Subat" arayuzde hic olusamiyor.
  const dayItems = useMemo<WheelItem[]>(
    () =>
      Array.from({ length: daysInMonth(draft.year, draft.month) }, (_, index) => ({
        value: index + 1,
        label: String(index + 1),
      })),
    [draft.year, draft.month],
  );

  // Ay veya yil degisince gun taspaysa son gune cekiliyor: 31 Ocak'tan
  // Subat'a gecen kullanici bos bir carkla karsilasmiyor.
  const update = (patch: Partial<DateParts>) => onDraftChange(clampParts({ ...draft, ...patch }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // Android donanimsal geri tusu sayfayi kapatir, akistan cikarmaz.
      onRequestClose={onCancel}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.common.cancel}
        onPress={onCancel}
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      />

      <View
        style={{
          backgroundColor: colors.surfaceRaised,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          borderCurve: 'continuous',
          paddingHorizontal: screenPadding,
          paddingTop: spacing.lg,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.lg,
          }}
        >
          <SheetAction label={strings.common.cancel} onPress={onCancel} />
          <AppText variant="heading">{strings.steps.birthDateSheetTitle}</AppText>
          <SheetAction label={strings.common.done} onPress={onConfirm} tone="clay" />
        </View>

        <View
          style={{ flexDirection: 'row', gap: spacing.sm, height: wheelRowHeight(fontScale) * WHEEL_ROWS }}
        >
          <WheelPicker
            items={dayItems}
            value={draft.day}
            onChange={(day) => update({ day })}
            accessibilityLabel={strings.steps.dayLabel}
            background={colors.surfaceRaised}
            fontScale={fontScale}
          />
          <WheelPicker
            items={monthItems}
            value={draft.month}
            onChange={(month) => update({ month })}
            accessibilityLabel={strings.steps.monthLabel}
            background={colors.surfaceRaised}
            fontScale={fontScale}
            flex={1.6}
          />
          <WheelPicker
            items={yearItems}
            value={draft.year}
            onChange={(year) => update({ year })}
            accessibilityLabel={strings.steps.yearLabel}
            background={colors.surfaceRaised}
            fontScale={fontScale}
            flex={1.2}
          />
        </View>
      </View>
    </Modal>
  );
}

function SheetAction({
  label,
  onPress,
  tone = 'inkSoft',
}: {
  label: string;
  onPress: () => void;
  tone?: 'inkSoft' | 'clay';
}) {
  const { spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      // Sayfa basligiyla ayni hizada duran kucuk hedefler; dokunma alani
      // metinden buyuk tutuluyor.
      hitSlop={spacing.md}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingVertical: spacing.xs })}
    >
      <AppText variant="button" tone={tone}>
        {label}
      </AppText>
    </Pressable>
  );
}
