import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Alert, Linking, View } from 'react-native';

import { uploadPhoto } from '@/api/media';
import { AppText } from '@/components/AppText';
import { PhotoSlot, type PhotoSlotState } from '@/components/PhotoSlot';
import { PhotoSourceSheet, type PhotoSource } from '@/components/PhotoSourceSheet';
import { photoCount, strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import type { StepProps } from '../engine/types';

import {
  MINIMUM_PHOTOS,
  PHOTO_SLOTS,
  insertPosition,
  layoutSlots,
  type Slot,
  type Transfer,
} from './photoSlots';

export { MINIMUM_PHOTOS, PHOTO_SLOTS } from './photoSlots';

/** Izgara iki satir; satir basina uc kutu. */
const COLUMNS = 3;

/**
 * Alti kutu gorunuyor, iki tanesi yeterli.
 *
 * Tavani gostermek ama tabani dusuk tutmak, bastan daha fazlasini istemekten
 * daha cok fotograf getiriyor: kullanici zorunlulugu degil imkani goruyor.
 */
export function PhotosStep({ values, onChange }: StepProps) {
  const { spacing } = useTheme();
  const photos = values.photos ?? [];

  // Devam eden isler izgaradaki yerlerine gore tutuluyor. Dizideki siraya
  // gore tutmak, bir yukleme surerken gelen ikinci fotografin isareti baska
  // bir kutuya kaydiriyordu.
  //
  // Ayni harita bir ref'te de duruyor ve ikisi ayni anda yaziliyor: yukleme
  // bittiginde yer, o andaki isaretlere gore hesaplanmali. Dokunma anindaki
  // goruntu yetmiyor -- ondeki bir kutu o sirada yuklenmis ve fotografa
  // donusmus olabilir; React'in yenilemesini beklemek de yetmiyor, cunku iki
  // yukleme ayni anda bitebiliyor.
  const [transfers, setTransfers] = useState<ReadonlyMap<number, Transfer>>(new Map());
  const transfersNow = useRef(transfers);
  const [asked, setAsked] = useState<number | null>(null);

  function updateTransfer(index: number, value: Transfer | null) {
    const next = new Map(transfersNow.current);
    if (value === null) next.delete(index);
    else next.set(index, value);
    transfersNow.current = next;
    setTransfers(next);
  }

  async function permitted(source: PhotoSource): Promise<boolean> {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.granted) return true;

    // Reddedilen izin bir cikmaz olmamali: ne oldugu soyleniyor ve ayarlara
    // giden yol gosteriliyor.
    Alert.alert(
      source === 'camera' ? strings.photoPermission.cameraTitle : strings.photoPermission.title,
      source === 'camera' ? strings.photoPermission.cameraBody : strings.photoPermission.body,
      [
        { text: strings.photoPermission.cancel, style: 'cancel' },
        {
          text: strings.photoPermission.openSettings,
          onPress: () => void Linking.openSettings(),
        },
      ],
    );

    return false;
  }

  async function pick(index: number, from: PhotoSource) {
    if (!(await permitted(from))) return;

    const picked =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });

    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return;

    updateTransfer(index, 'pending');

    try {
      const uploaded = await uploadPhoto(asset.uri);
      updateTransfer(index, null);

      // Liste, yazma aninda depodan okunuyor; ekranin son gordugu liste
      // degil. Iki yukleme ayni anda bitince ikincisi ilkini ezmemeli.
      onChange((current) => {
        const list = current.photos ?? [];
        const position = insertPosition(transfersNow.current, index, list.length);
        const next = [...list];
        next.splice(position, 0, uploaded);
        return { photos: next };
      });
    } catch {
      updateTransfer(index, 'failed');
    }
  }

  function remove(position: number) {
    onChange((current) => ({
      photos: (current.photos ?? []).filter((_, at) => at !== position),
    }));
  }

  const slots = layoutSlots(photos, transfers, PHOTO_SLOTS);

  function stateFor(slot: Slot): PhotoSlotState {
    switch (slot.kind) {
      case 'photo':
        return { status: 'filled', url: slot.photo.url };
      case 'pending':
        return { status: 'uploading' };
      case 'failed':
        return { status: 'failed' };
      case 'open':
        return { status: 'empty' };
      case 'locked':
        return { status: 'locked' };
    }
  }

  return (
    <View>
      <View style={{ gap: spacing.sm }}>
        {[0, 1].map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[0, 1, 2].map((column) => {
              const index = row * COLUMNS + column;
              const slot = slots[index];
              if (slot === undefined) return null;

              return (
                <PhotoSlot
                  key={index}
                  state={stateFor(slot)}
                  cover={index === 0}
                  // Dolu bir kutunun cikisi kaldirma dugmesi. Ustune yeni bir
                  // fotograf almak, yukleme surerken eski fotografi hem
                  // ekranda hem dizide tutmayi gerektirirdi; kaldirip yeniden
                  // eklemek ayni sonuca tek bir anlamla variyor.
                  {...(slot.kind === 'photo'
                    ? { onRemove: () => remove(slot.position) }
                    : { onPress: () => setAsked(index) })}
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

      <PhotoSourceSheet
        visible={asked !== null}
        onClose={() => setAsked(null)}
        onSelect={(from) => {
          const index = asked;
          setAsked(null);
          if (index !== null) void pick(index, from);
        }}
      />
    </View>
  );
}
