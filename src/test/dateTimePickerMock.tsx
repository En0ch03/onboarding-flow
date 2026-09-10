import type { ComponentProps } from 'react';
import { View, type ViewProps } from 'react-native';
import type RNDateTimePicker from '@react-native-community/datetimepicker';

/** Testler cargi bu kimlikle buluyor. */
export const PICKER_TEST_ID = 'birth-date-picker';

type PickerProps = ComponentProps<typeof RNDateTimePicker>;

/**
 * Cihazdaki tarih carkinin yerine gecen sade taklit.
 *
 * Gercek bilesen yerel bir gorunum aciyor; testte ne cizilir ne de suzulur.
 * Taklidin isi, verilen sinirlarin ve `onChange(event, date)` sozlesmesinin
 * dogrulanabilmesi: butun prop'lar agacta duruyor, olayi testin kendisi
 * tetikliyor. Boylece dogrulanan sey modulun kendisi degil, onu kullanan
 * mantik oluyor.
 */
export default function DateTimePickerMock(props: PickerProps) {
  return <View testID={PICKER_TEST_ID} {...(props as unknown as ViewProps)} />;
}
