import { View } from 'react-native';

/**
 * Acik ve kapali goz.
 *
 * Elde ciziliyor: bir ikon kutuphanesi bu tek isaret icin uygulamaya yeni bir
 * bagimlilik ve yuzlerce kullanilmayan cizim getirirdi. Halka ve bebek iki
 * kutudan ibaret; kapali hal ustune bir cizgi ekliyor.
 *
 * Cizgi, halkanin uzerinden gecerken arkasina zeminin rengini aliyor. Aksi
 * halde iki cizgi kesistigi yerde birbirine karisiyor ve isaret bulaniyor.
 */
export function EyeIcon({
  open,
  color,
  background,
  size = 20,
}: {
  open: boolean;
  color: string;
  /** Cizginin halkayi keserken arkasina aldigi renk. */
  background: string;
  size?: number;
}) {
  const ring = Math.round(size * 0.8);
  const pupil = Math.round(size * 0.3);
  const stroke = 1.5;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: stroke,
          borderColor: color,
        }}
      />

      {open ? (
        <View
          style={{
            position: 'absolute',
            width: pupil,
            height: pupil,
            borderRadius: pupil / 2,
            backgroundColor: color,
          }}
        />
      ) : (
        <>
          <Slash length={size + 4} thickness={stroke * 3} color={background} offset={-stroke} />
          <Slash length={size + 4} thickness={stroke} color={color} offset={0} />
        </>
      )}
    </View>
  );
}

function Slash({
  length,
  thickness,
  color,
  offset,
}: {
  length: number;
  thickness: number;
  color: string;
  offset: number;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        width: length,
        height: thickness,
        borderRadius: thickness / 2,
        backgroundColor: color,
        transform: [{ translateY: offset }, { rotate: '-45deg' }],
      }}
    />
  );
}
