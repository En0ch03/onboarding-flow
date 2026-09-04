import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { ChoiceCard } from '@/components/ChoiceCard';
import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import type { StepProps } from '../engine/types';
import { isBlockedByLimit, sortedOptions, toggleSelection } from './useSelection';

/**
 * Eslesme havuzunu belirleyen iki cevap, ve istege bagli ucuncusu.
 *
 * Yonelim ozel nitelikli veri: atlanabilir ve yaninda varsayilan olarak
 * isaretsiz bir riza kutusu var. Riza verilmediyse alan istege bos olarak
 * degil, hic eklenmiyor - saklamadigimiz bir seyi saklamis gibi gostermemek
 * icin.
 */
export function AudienceStep({ values, onChange, options }: StepProps) {
  const { colors, radius, spacing } = useTheme();

  const gender = options.gender;
  const audience = options.audience;
  const orientation = options.orientation;

  const selectedAudience = values.audience ?? [];
  const selectedOrientation = values.orientation ?? [];
  const consent = values.orientationConsent === true;

  return (
    <View>
      {gender ? (
        <View style={{ marginBottom: spacing.xl }}>
          <AppText variant="label" tone="inkSoft" style={{ marginBottom: spacing.md }}>
            {strings.steps.genderLabel}
          </AppText>
          {sortedOptions(gender).map((option) => (
            <ChoiceCard
              key={option.id}
              option={option}
              selected={values.gender === option.id}
              onPress={() => onChange({ gender: option.id })}
            />
          ))}
        </View>
      ) : null}

      {audience ? (
        <View style={{ marginBottom: spacing.xl }}>
          <AppText variant="label" tone="inkSoft" style={{ marginBottom: spacing.md }}>
            {strings.steps.audienceLabel}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {sortedOptions(audience).map((option) => (
              <Chip
                key={option.id}
                option={option}
                selected={selectedAudience.includes(option.id)}
                disabled={isBlockedByLimit(audience, selectedAudience, option.id)}
                onPress={() =>
                  onChange({
                    audience: toggleSelection(audience, selectedAudience, option.id).next,
                  })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {orientation ? (
        <View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
            accessibilityLabel={strings.steps.orientationConsent}
            onPress={() =>
              onChange({
                orientationConsent: !consent,
                // Riza geri alindiginda secim de temizleniyor: ekranda
                // gorunmeyen bir cevabin arka planda durmasi dogru degil.
                ...(consent ? { orientation: [] } : {}),
              })
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingVertical: spacing.md,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: radius.sm,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: consent ? colors.clay : colors.hairline,
                backgroundColor: consent ? colors.clay : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {consent ? (
                <AppText variant="caption" tone="onClay" style={{ lineHeight: 14 }}>
                  ✓
                </AppText>
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="control">{strings.steps.orientationConsent}</AppText>
              <AppText variant="caption" tone="inkSoft">
                {strings.steps.orientationConsentHint}
              </AppText>
            </View>
          </Pressable>

          {consent ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
                marginTop: spacing.md,
              }}
            >
              {sortedOptions(orientation).map((option) => (
                <Chip
                  key={option.id}
                  option={option}
                  selected={selectedOrientation.includes(option.id)}
                  disabled={isBlockedByLimit(orientation, selectedOrientation, option.id)}
                  onPress={() =>
                    onChange({
                      orientation: toggleSelection(orientation, selectedOrientation, option.id)
                        .next,
                    })
                  }
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
