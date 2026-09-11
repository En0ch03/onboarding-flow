import { StyleSheet } from 'react-native';

type StyledNode = { parent: unknown; props: { style?: unknown } };

/**
 * Bir dugumden koke kadar, tam opak olmayan her saydamlik degeri.
 *
 * Tam opak bir deger solma degil; solma, birden kucuk ya da animasyonlu bir
 * deger. Iki ayri testin ayni soruyu sormasi tesaduf degil: sistemin cam
 * materyali solan bir kabin icinde yarim uygulanmis gibi goruntu veriyor ve
 * bunu her cam yuzey icin ayri ayri sormak gerekiyor. Soru tek yerde
 * yazilirsa, cevabi degistiren bir hata da tek yerde duzeliyor.
 */
export function opacitiesAbove(node: StyledNode | null): unknown[] {
  const values: unknown[] = [];
  let current = node;
  while (current) {
    const style = StyleSheet.flatten(current.props.style) as { opacity?: unknown } | undefined;
    if (style?.opacity !== undefined && style.opacity !== 1) values.push(style.opacity);
    current = current.parent as StyledNode | null;
  }
  return values;
}
