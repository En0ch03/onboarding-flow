import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import { strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

export type PhotoSlotState =
  | { status: 'empty' }
  | { status: 'uploading' }
  | { status: 'filled'; url: string }
  | { status: 'failed' }
  /** Sirasi gelmemis bos kutu: gorunuyor ama dokunulmuyor. */
  | { status: 'locked' };

type PhotoSlotProps = {
  state: PhotoSlotState;
  /** Ilk slot kapak; rozetle isaretleniyor. */
  cover?: boolean;
  /** Verilmediyse kutu dokunulmuyor: dolu bir kutunun cikisi kaldirma dugmesi. */
  onPress?: () => void;
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
            : state.status === 'uploading'
              ? strings.photoSlot.uploading
              : state.status === 'locked'
                ? strings.photoSlot.locked
                : strings.photoSlot.empty
      }
      accessibilityState={{
        busy: state.status === 'uploading',
        disabled: state.status === 'locked' || onPress === undefined,
      }}
      onPress={onPress}
      disabled={onPress === undefined || state.status === 'uploading' || state.status === 'locked'}
      style={({ pressed }) => ({
        flex: 1,
        aspectRatio: 4 / 5,
        borderRadius: radius.sm,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderStyle: state.status === 'empty' || state.status === 'locked' ? 'dashed' : 'solid',
        borderColor:
          state.status === 'failed' ? colors.danger : pressed ? colors.clay : colors.hairline,
        // Yalniz doldurulmamis kutular (siradaki ve kilitli) coker: dolu bir
        // kutu ve devam eden bir is zaten fotograf ya da gostergesiyle
        // ayirt ediliyor, onlarin zemini degismiyor.
        backgroundColor:
          state.status === 'empty' || state.status === 'locked'
            ? colors.surfaceSunken
            : colors.surface,
        // Solgunluk tek isaret: kilitli kutu duruyor ama siraya isaret ediyor.
        opacity: state.status === 'locked' ? 0.4 : 1,
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
