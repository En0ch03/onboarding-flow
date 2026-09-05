import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Linking, View } from 'react-native';

import { uploadPhoto } from '@/api/media';
import { AppText } from '@/components/AppText';
import { PhotoSlot, type PhotoSlotState } from '@/components/PhotoSlot';
import { PhotoSourceSheet, type PhotoSource } from '@/components/PhotoSourceSheet';
import { photoCount, strings } from '@/constants/strings';
import { useTheme } from '@/theme';

import type { StepProps } from '../engine/types';

import { MINIMUM_PHOTOS, PHOTO_SLOTS, insertPosition, layoutSlots, type Slot } from './photoSlots';
import { usePhotoTransfers } from './photoTransfers';

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
  // bir kutuya kaydiriyordu. Isaretler bu ekranin disinda, akisin omrunde
  // yasiyor: adim terk edilip donuldugunde yukleme hala surer ve kutu yine
  // "yukleniyor" der; akisin kendisi terk edilince isaretler de gider.
  const transfers = usePhotoTransfers((state) => state.transfers);
  const markTransfer = usePhotoTransfers((state) => state.mark);
  const [asked, setAsked] = useState<number | null>(null);

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
    // Nesil dokunma aninda aliniyor ve her beklemeden sonra bakiliyor. Izin
    // diyalogu ve secici dakikalarca acik kalabiliyor; o pencerede akis
    // sokulurse (oturum bitti, taslak silindi) bundan sonra yazilacak her
    // sey baska bir akisa -- baska bir kullaniciya -- ait olurdu.
    const generation = usePhotoTransfers.getState().generation;
    const stale = () => usePhotoTransfers.getState().generation !== generation;

    if (!(await permitted(from))) return;
    if (stale()) return;

    const picked =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });

    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return;
    if (stale()) return;

    markTransfer(index, 'pending');

    // Yuklemeyi baslatan akis bittiginde sonucu uygulanmiyor. Gec biten bir
    // yukleme, aksi halde temizlenmis bir taslagi yeniden dolduruyor ya da
    // baska bir kullanicinin izgarasina isaret koyuyordu.
    try {
      const uploaded = await uploadPhoto(asset.uri);
      if (stale()) return;
      markTransfer(index, null);

      // Liste de isaretler de yazma aninda depodan okunuyor; ekranin son
      // gordugu goruntu degil. Dokunma anindaki goruntu, ondeki bir kutunun
      // arada fotografa donustugunu gormuyordu; ekranin son gordugu liste ise
      // ayni anda biten iki yuklemenin birbirini ezmesine yol aciyordu.
      onChange((current) => {
        const list = current.photos ?? [];
        // Izgara dolduysa yazilmiyor. Buraya normalde gelinmez -- dolu
        // izgarada acik kutu yok -- ama bir yol acilirsa yedinci fotografin
        // gorunmez, silinemez ve sonraki acilista kirpilir hale gelmesindense
        // hic girmemesi iyidir. Kapi sıkı tarafa bozulur.
        if (list.length >= PHOTO_SLOTS) return {};

        const position = insertPosition(
          usePhotoTransfers.getState().transfers,
          index,
          list.length,
        );
        const next = [...list];
        next.splice(position, 0, uploaded);
        return { photos: next };
      });
    } catch {
      if (stale()) return;
      markTransfer(index, 'failed');
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
