import { View } from 'react-native';

/**
 * Acik ve kapali goz.
 *
 * Elde ciziliyor: bir ikon kutuphanesi bu tek isaret icin uygulamaya yeni bir
 * bagimlilik ve yuzlerce kullanilmayan cizim getirirdi. Halka ve goz bebegi
 * iki kutudan ibaret; kapali hal ustune bir cizgi ekliyor.
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
          {/* Ikisi ust uste: kalin olan zemin renginde, cizginin halkayi
              kestigi yeri aciyor; ince olan cizginin kendisi. Ikisi de ayni
              yerde duruyor, yoksa hale bir yanda kaliniyor. Uzunluk kutunun
              kosegeninden kisa: dondukten sonra kutuyu tasmiyor. */}
          <Slash length={size + 6} thickness={stroke * 3} color={background} />
          <Slash length={size + 6} thickness={stroke} color={color} />
        </>
      )}
    </View>
  );
}

function Slash({ length, thickness, color }: { length: number; thickness: number; color: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        width: length,
        height: thickness,
        borderRadius: thickness / 2,
        backgroundColor: color,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  );
}
