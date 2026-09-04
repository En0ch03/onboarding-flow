/**
 * Tek ucuslu yenileme kuyrugu.
 *
 * Bir ekran acilirken birden fazla istek ayni anda yola cikiyor. Token
 * suresi dolmussa hepsi ayni anda 401 aliyor ve her biri kendi yenilemesini
 * baslatirsa sunucuya es zamanli birden fazla yenileme gidiyor. Rotasyon
 * yapan bir sunucuda bu, ilk yenilemenin urettigi token'i ikincinin
 * gecersiz kilmasi demek: kullanici hicbir sey yapmadan oturumdan duser.
 *
 * Sozlesme su an rotasyon yapmiyor ama bu kod rotasyona dayanikli yazildi:
 * sunucu ileride rotasyona gecerse istemci degismeden calismaya devam eder.
 */
export type RefreshQueue = {
  /** Devam eden bir yenileme varsa ayni soz dondurulur; yoksa yenisi baslar. */
  refresh: () => Promise<string>;
  /** Test ve oturum kapanisi icin: bekleyen yenilemeyi unutur. */
  cancel: () => void;
};

export function createRefreshQueue(doRefresh: () => Promise<string>): RefreshQueue {
  let inFlight: Promise<string> | null = null;

  return {
    refresh() {
      if (inFlight) return inFlight;

      // Sonuc ne olursa olsun kuyruk bosaltilir: basarisiz bir yenileme
      // sonraki denemeyi kalici olarak engellememeli.
      const attempt = doRefresh().finally(() => {
        if (inFlight === attempt) inFlight = null;
      });

      inFlight = attempt;
      return attempt;
    },

    cancel() {
      inFlight = null;
    },
  };
}
