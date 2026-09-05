import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

export type PhotoSlotState =
  | { status: 'empty' }
  | { status: 'uploading' }
  | { status: 'filled'; url: string }
  | { status: 'failed' };

type PhotoSlotProps = {
  state: PhotoSlotState;
  /** Ilk slot kapak; rozetle isaretleniyor. */
  cover?: boolean;
  onPress: () => void;
  onRemove?: () => void;
};

/**
 * Dort durumun en gorunur oldugu yer: yukleme, kullanicinin izleyecegi kadar
 * uzun suruyor.
 *
 * Ilerleme slotun icinde duruyor ve ekrani kilitlemiyor; kullanici bir
 * fotograf yuklenirken digerini secebiliyor.
 */
export function PhotoSlot({ state, cover = false, onPress, onRemove }: PhotoSlotProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        state.status === 'filled'
          ? cover
            ? strings.photoSlot.cover
            : strings.photoSlot.filled
          : state.status === 'failed'
            ? strings.photoSlot.failed
            : strings.photoSlot.empty
      }
      accessibilityState={{ busy: state.status === 'uploading' }}
      onPress={onPress}
      disabled={state.status === 'uploading'}
      style={({ pressed }) => ({
        flex: 1,
        aspectRatio: 4 / 5,
        borderRadius: radius.sm,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderStyle: state.status === 'empty' ? 'dashed' : 'solid',
        borderColor:
          state.status === 'failed' ? colors.danger : pressed ? colors.clay : colors.hairline,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      })}
    >
      {state.status === 'filled' ? (
        <>
          <Image source={{ uri: state.url }} style={{ width: '100%', height: '100%' }} />
          {cover ? (
            <View
              style={{
                position: 'absolute',
                left: spacing.sm,
                bottom: spacing.sm,
                backgroundColor: colors.paper,
                borderRadius: radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: 2,
              }}
            >
              <AppText variant="caption">{strings.steps.photosCover}</AppText>
            </View>
          ) : null}
          {onRemove ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={strings.photoSlot.remove}
              onPress={onRemove}
              hitSlop={8}
              style={{
                position: 'absolute',
                right: spacing.sm,
                top: spacing.sm,
                width: 24,
                height: 24,
                borderRadius: radius.full,
                backgroundColor: colors.paper,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText variant="caption">✕</AppText>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {state.status === 'uploading' ? <ActivityIndicator color={colors.clay} /> : null}

      {state.status === 'empty' ? (
        <AppText variant="title" tone="inkSoft" style={{ lineHeight: 34 }}>
          +
        </AppText>
      ) : null}

      {state.status === 'failed' ? (
        <AppText variant="caption" tone="danger" style={{ textAlign: 'center' }}>
          {strings.common.retry}
        </AppText>
      ) : null}
    </Pressable>
  );
}
