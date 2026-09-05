import { insertPosition, layoutSlots, nextOpenIndex } from './photoSlots';

const p = (id: string) => ({ id, url: `https://example.test/${id}.jpg` });

const none = new Map<number, 'pending' | 'failed'>();

describe('layoutSlots', () => {
  it('fotograflari bastan sirayla diziyor', () => {
    const slots = layoutSlots([p('a'), p('b')], none, 6);

    expect(slots.map((slot) => slot.kind)).toEqual([
      'photo',
      'photo',
      'open',
      'locked',
      'locked',
      'locked',
    ]);
  });

  it('yalnizca ilk bos kutu aciliyor; gerisi kilitli', () => {
    const slots = layoutSlots([], none, 6);

    expect(slots.map((slot) => slot.kind)).toEqual([
      'open',
      'locked',
      'locked',
      'locked',
      'locked',
      'locked',
    ]);
  });

  it('butun kutular doluysa acik kutu kalmiyor', () => {
    const slots = layoutSlots([p('a'), p('b'), p('c')], none, 3);

    expect(slots.every((slot) => slot.kind === 'photo')).toBe(true);
  });

  it('yuklenen kutu kendi yerinde duruyor; fotograf onu atlayarak yerlesiyor', () => {
    // Kullanici once 0'a bastı, o yuklenirken 1'e de basti ve 1 once bitti.
    const slots = layoutSlots([p('b')], new Map([[0, 'pending' as const]]), 6);

    expect(slots.map((slot) => slot.kind)).toEqual([
      'pending',
      'photo',
      'open',
      'locked',
      'locked',
      'locked',
    ]);
  });

  it('basarisiz kutu yerini biraktigi kutuda tutuyor', () => {
    const slots = layoutSlots([p('a')], new Map([[1, 'failed' as const]]), 6);

    expect(slots.map((slot) => slot.kind)).toEqual([
      'photo',
      'failed',
      'open',
      'locked',
      'locked',
      'locked',
    ]);
  });

  it('fotografin kendi dizideki yerini tasiyor: silme dogru olani silsin', () => {
    const slots = layoutSlots([p('a'), p('b')], new Map([[1, 'pending' as const]]), 6);

    expect(slots[0]).toEqual({ kind: 'photo', photo: p('a'), position: 0 });
    expect(slots[2]).toEqual({ kind: 'photo', photo: p('b'), position: 1 });
  });
});

describe('nextOpenIndex', () => {
  it('bos izgarada ilk kutu', () => {
    expect(nextOpenIndex([], none, 6)).toBe(0);
  });

  it('yuklenen kutuyu dolu sayiyor', () => {
    expect(nextOpenIndex([], new Map([[0, 'pending' as const]]), 6)).toBe(1);
  });

  it('izgara dolduysa yer yok', () => {
    expect(nextOpenIndex([p('a'), p('b')], none, 2)).toBeNull();
  });
});

describe('insertPosition', () => {
  it('onunde baska bir kutu yoksa basa giriyor', () => {
    expect(insertPosition(none, 0, 3)).toBe(0);
  });

  it('onundeki bos kutular kadar ilerliyor', () => {
    // 0 ve 1 fotografla dolu, 2'ye giren ucuncu sirada olmali.
    expect(insertPosition(none, 2, 2)).toBe(2);
  });

  it('onundeki yuklenen kutulari saymiyor: onlarin fotografi henuz yok', () => {
    // 0 yukleniyor, 1'de bir fotograf var. 2'ye giren, o fotografin arkasina.
    // Fotograf sayisi bilerek buyuk: kirpma devreye girerse yanlis sayim da
    // ayni sonucu verir ve test hicbir sey sinamaz.
    expect(insertPosition(new Map([[0, 'pending' as const]]), 2, 3)).toBe(1);
  });

  it('onundeki birden fazla yuklenen kutuyu da saymiyor', () => {
    const two = new Map([
      [0, 'pending' as const],
      [1, 'failed' as const],
    ]);
    expect(insertPosition(two, 3, 4)).toBe(1);
  });

  it('eldeki fotograf sayisini asmiyor', () => {
    expect(insertPosition(none, 5, 1)).toBe(1);
  });
});
