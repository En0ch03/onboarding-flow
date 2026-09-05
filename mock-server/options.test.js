'use strict';

const { optionGroups } = require('./options');

/**
 * Sunulan listelerin kurallari anlamli olmali. Secenek sayisina esit ya da
 * ondan buyuk bir ust sinir hicbir sey yapmaz ama istemcide "kural var"
 * izlenimi verir: sayac satiri cizilir, sinira hic carpilmaz.
 */
describe('option groups', () => {
  it('declares a selection limit only where it can bind', () => {
    for (const [key, group] of Object.entries(optionGroups)) {
      if (group.maxSelection === null) continue;

      expect({ key, limit: group.maxSelection, options: group.options.length }).toEqual(
        expect.objectContaining({ limit: expect.any(Number) }),
      );
      expect(group.maxSelection).toBeLessThan(group.options.length);
    }
  });

  it('declares a limit only on lists that allow more than one answer', () => {
    for (const group of Object.values(optionGroups)) {
      if (!group.multiSelect) expect(group.maxSelection).toBeNull();
    }
  });
});
