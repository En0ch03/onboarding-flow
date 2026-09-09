import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Text } from 'react-native';

import { strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';

import { BottomSheet } from './BottomSheet';

/**
 * Sayfa, ekrandan tamamen kalktigini haber veriyor ve cagiran taraf native bir
 * seciciyi ancak o haberle aciyor. Haberin **ne zaman gitmedigi** de en az ne
 * zaman gittigi kadar onemli: hic acilmamis bir sayfadan gelen haber, bekleyen
 * bir isi zamanindan once calistirirdi.
 */
function Host({ visible, onClosed }: { visible: boolean; onClosed: () => void }) {
  return (
    <BottomSheet visible={visible} title="Baslik" onClose={() => {}} onClosed={onClosed}>
      <Text>icerik</Text>
    </BottomSheet>
  );
}

function Toggling({ onClosed }: { onClosed: () => void }) {
  const [visible, setVisible] = useState(true);

  return (
    <>
      <Text testID="kapat" onPress={() => setVisible(false)}>
        kapat
      </Text>
      <Host visible={visible} onClosed={onClosed} />
    </>
  );
}

describe('BottomSheet', () => {
  it('hic acilmamis sayfa kapanmis sayilmiyor', async () => {
    const onClosed = jest.fn();
    await renderWithTheme(<Host visible={false} onClosed={onClosed} />);

    // Ilk cizimde sayfa zaten yok; buradan gidecek bir haber, cagirani
    // bekleyen isini bosa calistirmaya iterdi.
    expect(onClosed).not.toHaveBeenCalled();
  });

  it('acilip kapanan sayfa bir kez haber veriyor', async () => {
    const onClosed = jest.fn();
    const view = await renderWithTheme(<Toggling onClosed={onClosed} />);

    expect(view.queryByText('icerik')).not.toBeNull();
    expect(onClosed).not.toHaveBeenCalled();

    await act(async () => {
      view.getByTestId('kapat').props.onPress();
    });

    // Kapanis animasyonu suruyor: sayfa hala ekranda ve haber gitmemis olmali.
    expect(onClosed).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(view.queryByText('icerik')).toBeNull();
    });
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('perdeye dokunarak kapatmak da ayni haberi veriyor', async () => {
    const onClosed = jest.fn();
    const view = await renderWithTheme(<Toggling onClosed={onClosed} />);

    await act(async () => {
      fireEvent.press(view.getByLabelText(strings.common.close));
    });

    // Perde `onClose` cagiriyor; gorunurlugu kaldirmak cagirana ait ve bu
    // testte `Toggling` onu yapmiyor. Sayfa acik kaldigi surece haber de
    // gitmiyor.
    expect(onClosed).not.toHaveBeenCalled();

    await act(async () => {
      view.getByTestId('kapat').props.onPress();
    });
    await waitFor(() => {
      expect(view.queryByText('icerik')).toBeNull();
    });

    expect(onClosed).toHaveBeenCalledTimes(1);
  });
});
