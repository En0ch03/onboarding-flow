import { StyleSheet } from 'react-native';

import { stepCounterLabel, strings } from '@/constants/strings';
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
    expect(view.getByText('02 / 05')).toBeTruthy();
  });

  it('sayaci iki haneli yaziyor ama ekran okuyucuya kelimelerle veriyor', async () => {
    const view = await renderWithTheme(<ScreenHeader step={{ current: 1, total: 6 }} />);
    const counter = view.getByText('01 / 06');

    // Sifir dolgu hizalama icin: sayac adim degistikce genislik degistirirse
    // ust serit her ekranda biraz kayiyor. Ekran okuyucu bu bicimi okumuyor,
    // kendi cumlesini aliyor.
    expect(counter).toBeTruthy();
    expect(counter.props.accessibilityLabel).toBe(stepCounterLabel(1, 6));
  });

  it('gecme dugmesi dokunma hedefini kendisi karsiliyor', async () => {
    const view = await renderWithTheme(
      <ScreenHeader skip={{ label: strings.common.skip, onPress: noop }} />,
    );
    const style = StyleSheet.flatten(
      view.getByLabelText(strings.common.skip).props.style,
    ) as Record<string, number>;

    // Onceki surumde bu bir alti cizili baglantiydi ve hedefi yalnizca
    // gorunmez bir `hitSlop` tasiyordu; cihazda kacirilan bir cikis yolu.
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  });

  it('geri oku metin glifi degil, cizilmis bir sekil', async () => {
    const view = await renderWithTheme(<ScreenHeader onBack={noop} />);
    expect(view.getByLabelText(strings.common.back)).toBeTruthy();

    // Glif ailenin kesimine gore inceliyor ve dikeyde ortalanmiyordu; cizim
    // yazi tipinden bagimsiz.
    expect(view.queryByText('‹')).toBeNull();
    expect(view.getByTestId('back-chevron')).toBeTruthy();
  });

  it('ok, dairenin icinde bir kil payi kalmiyor', async () => {
    const view = await renderWithTheme(<ScreenHeader onBack={noop} />);
    const style = StyleSheet.flatten(view.getByTestId('back-chevron').props.style) as {
      width: number;
    };

    // Kol kirk bes derece donunce iki kenari bir "<" olusturuyor ve o seklin
    // yuksekligi kolun kosegen izdusumu kadar cikiyor. Kirk sekiz noktalik
    // dairenin icinde bu isaretin gorunur bir agirligi olmali: cok kucuk bir
    // ok, dokunulacak seyin nerede oldugunu soylemiyor.
    const height = style.width * Math.SQRT2;
    expect(height).toBeGreaterThanOrEqual(20);
    expect(height).toBeLessThanOrEqual(24);
  });
});
