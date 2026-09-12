import { StyleSheet } from 'react-native';

import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes } from '@/theme';

import { PhotoSlot, type PhotoSlotState } from './PhotoSlot';

const noop = () => {};

function backgroundOf(state: PhotoSlotState) {
  return async () => {
    const view = await renderWithTheme(<PhotoSlot state={state} onPress={noop} />);
    const style = StyleSheet.flatten(view.getByRole('button').props.style) as Record<
      string,
      unknown
    >;
    return style.backgroundColor;
  };
}

describe('PhotoSlot', () => {
  it('bos kutu, dolu kutudan daha koyu bir zeminde duruyor', async () => {
    const empty = await backgroundOf({ status: 'empty' })();
    expect(empty).toBe(palettes.dark.surfaceSunken);
    expect(empty).not.toBe(palettes.dark.surface);
  });

  it('kilitli kutu da coken zemini paylasiyor', async () => {
    const locked = await backgroundOf({ status: 'locked' })();
    expect(locked).toBe(palettes.dark.surfaceSunken);
  });

  it('dolu kutunun zemini degismiyor', async () => {
    const filled = await backgroundOf({ status: 'filled', url: 'https://example.com/a.jpg' })();
    expect(filled).toBe(palettes.dark.surface);
  });

  it('yukleniyor kutusunun zemini degismiyor', async () => {
    const uploading = await backgroundOf({ status: 'uploading' })();
    expect(uploading).toBe(palettes.dark.surface);
  });

  it('yuklenemedi kutusunun zemini degismiyor', async () => {
    const failed = await backgroundOf({ status: 'failed' })();
    expect(failed).toBe(palettes.dark.surface);
  });

  it('siradaki ve kilitli kutu ayni zemini paylasir ama saydamlikla ayrisir', async () => {
    const open = await renderWithTheme(<PhotoSlot state={{ status: 'empty' }} onPress={noop} />);
    const locked = await renderWithTheme(<PhotoSlot state={{ status: 'locked' }} />);

    const openStyle = StyleSheet.flatten(open.getByRole('button').props.style) as Record<
      string,
      unknown
    >;
    const lockedStyle = StyleSheet.flatten(locked.getByRole('button').props.style) as Record<
      string,
      unknown
    >;

    // K-042'nin kalbi: dokunulabilen tek bos kutu siradaki olan. Zemin tonu
    // ayni ama saydamlik farki -- kilitli kutunun dokunulamazligi -- duruyor.
    expect(openStyle.backgroundColor).toBe(lockedStyle.backgroundColor);
    expect(openStyle.opacity).toBe(1);
    expect(lockedStyle.opacity).toBe(0.4);
  });
});
