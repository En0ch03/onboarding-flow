import type { OptionGroup } from '@/api/schemas';
import { AppText } from '@/components/AppText';
import { selectionLimit, selectionLimitReached } from '@/constants/strings';
import { useTheme } from '@/theme';

type SelectionLimitNoteProps = {
  group: OptionGroup;
  selected: string[];
  /** Son dokunus sinira carpti: satir sebebe donuyor ve uyari tonu aliyor. */
  refused: boolean;
};

/**
 * Sinirli her listenin altindaki tek satir.
 *
 * Sinira carpmadan once de duruyor -- "en fazla N" -- cunku kullanici
 * onuncu cipin neden sonuk oldugunu ancak sinir yazili olursa onceden
 * bilir. Carpinca satir sebebe donuyor: ne oldugunu ve ne yapilacagini
 * soyluyor. Sayi sunucudan geliyor; burada hicbir sinir yazili degil.
 *
 * Sinirsiz listede satir yok: olmayan bir kurali anlatmak gurultu.
 */
export function SelectionLimitNote({ group, selected, refused }: SelectionLimitNoteProps) {
  const { spacing } = useTheme();
  const max = group.maxSelection;

  if (max === null) return null;

  return (
    <AppText
      variant="caption"
      tone={refused ? 'danger' : 'inkSoft'}
      accessibilityLiveRegion="polite"
      style={{ marginTop: spacing.sm }}
    >
      {refused ? selectionLimitReached(max) : selectionLimit(max, selected.length)}
    </AppText>
  );
}
