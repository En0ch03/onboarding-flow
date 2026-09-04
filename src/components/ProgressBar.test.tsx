import { StyleSheet } from 'react-native';

import { renderWithTheme } from '@/test/renderWithTheme';

import { ProgressBar } from './ProgressBar';

type Node = { props?: Record<string, unknown>; children?: unknown } | string | null;

/** Kaptaki dolgunun duzlestirilmis bicimi. */
function fillStyle(node: Node | Node[]): Record<string, unknown> | null {
  if (node === null || typeof node === 'string') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = fillStyle(child);
      if (found !== null) return found;
    }
    return null;
  }

  const style = StyleSheet.flatten(node.props?.style as never) as
    Record<string, unknown> | undefined;
  if (style?.transform !== undefined) return style;

  return fillStyle((node.children ?? []) as Node[]);
}

/** Agacta gizlenmis bir dugum var mi. */
function hidden(node: Node | Node[]): boolean {
  if (node === null || typeof node === 'string') return false;
  if (Array.isArray(node)) return node.some(hidden);

  const props = node.props as { accessibilityElementsHidden?: boolean } | undefined;
  if (props?.accessibilityElementsHidden === true) return true;

  return hidden((node.children ?? []) as Node[]);
}

describe('ProgressBar', () => {
  it('ekran okuyucuda sayaci tekrar etmiyor', async () => {
    const view = await renderWithTheme(<ProgressBar current={2} total={5} />);
    // Ayni bilgiyi ust seritteki sayac kelimelerle soyluyor; iki kez
    // duyurmak ayni cumleyi tekrar okutmak olurdu.
    expect(hidden(view.toJSON())).toBe(true);
  });

  it('dolgu soldan buyuyor', async () => {
    const view = await renderWithTheme(<ProgressBar current={2} total={5} />);
    // Varsayilan merkez olsaydi dolgu iki uctan birden acilirdi.
    expect(fillStyle(view.toJSON())?.transformOrigin).toBe('left');
  });

  it('toplam sifirken bolme yapmiyor', async () => {
    const view = await renderWithTheme(<ProgressBar current={0} total={0} />);
    expect(fillStyle(view.toJSON())).not.toBeNull();
  });
});
