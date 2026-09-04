import { StyleSheet } from 'react-native';

import { strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';

import { ScreenHeader } from './ScreenHeader';

const noop = () => {};

describe('ScreenHeader', () => {
  it('geri hedefi platformlarin asgarisini karsiliyor', async () => {
    const view = await renderWithTheme(<ScreenHeader onBack={noop} />);
    const style = StyleSheet.flatten(
      view.getByLabelText(strings.common.back).props.style,
    ) as Record<string, number>;

    // Dokunma alanini gorunmez bir `hitSlop` ile buyutmek yetmiyor:
    // kullanici gordugu daireye nisan aliyor.
    expect(style.width).toBeGreaterThanOrEqual(48);
    expect(style.height).toBeGreaterThanOrEqual(48);
  });

  it('geri yoksa yerini bos tutuyor: baslik ekrandan ekrana ziplamiyor', async () => {
    const view = await renderWithTheme(<ScreenHeader step={{ current: 2, total: 5 }} />);
    expect(view.queryByLabelText(strings.common.back)).toBeNull();
    expect(view.getByText('2 / 5')).toBeTruthy();
  });
});
