import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Linking, View } from 'react-native';

import { uploadPhoto } from '@/api/media';
import { AppText } from '@/components/AppText';
import { PhotoSlot, type PhotoSlotState } from '@/components/PhotoSlot';
import { photoCount, strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import type { StepProps } from '../engine/types';

export const PHOTO_SLOTS = 6;
export const MINIMUM_PHOTOS = 2;

/**
 * Alti slot gorunuyor, iki tanesi yeterli.
 *
 * Tavani gostermek ama tabani dusuk tutmak, bastan daha fazlasini istemekten
 * daha cok fotograf getiriyor: kullanici zorunlulugu degil imkani goruyor.
 */
export function PhotosStep({ values, onChange }: StepProps) {
  const { spacing } = useTheme();
  const photos = values.photos ?? [];
  const [pending, setPending] = useState<number[]>([]);
  const [failed, setFailed] = useState<number[]>([]);

  async function pick(index: number) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      // Reddedilen izin bir cikmaz olmamali: ne oldugu soyleniyor ve
      // ayarlara giden yol gosteriliyor.
      Alert.alert(strings.photoPermission.title, strings.photoPermission.body, [
        { text: strings.photoPermission.cancel, style: 'cancel' },
        {
          text: strings.photoPermission.openSettings,
          onPress: () => void Linking.openSettings(),
        },
      ]);
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return;

    setFailed((current) => current.filter((item) => item !== index));
    setPending((current) => [...current, index]);

    try {
      const uploaded = await uploadPhoto(asset.uri);
      const next = [...photos];
      next[index] = uploaded;
      onChange({ photos: next.filter(Boolean) });
    } catch {
      setFailed((current) => [...current, index]);
    } finally {
      setPending((current) => current.filter((item) => item !== index));
    }
  }

  function remove(index: number) {
    onChange({ photos: photos.filter((_, position) => position !== index) });
  }

  function stateFor(index: number): PhotoSlotState {
    if (pending.includes(index)) return { status: 'uploading' };
    if (failed.includes(index)) return { status: 'failed' };
    const photo = photos[index];
    return photo ? { status: 'filled', url: photo.url } : { status: 'empty' };
  }

  return (
    <View>
      <View style={{ gap: spacing.sm }}>
        {[0, 1].map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[0, 1, 2].map((column) => {
              const index = row * 3 + column;
              return (
                <PhotoSlot
                  key={index}
                  state={stateFor(index)}
                  cover={index === 0}
                  onPress={() => void pick(index)}
                  {...(photos[index] ? { onRemove: () => remove(index) } : {})}
                />
              );
            })}
          </View>
        ))}
      </View>

      <AppText variant="caption" tone="inkSoft" style={{ marginTop: spacing.lg }}>
        {photoCount(photos.length, PHOTO_SLOTS)}
      </AppText>

      {photos.length < MINIMUM_PHOTOS ? (
        <AppText variant="caption" tone="inkSoft" style={{ marginTop: spacing.xs }}>
          {strings.steps.photosSkipCost}
        </AppText>
      ) : null}
    </View>
  );
}
