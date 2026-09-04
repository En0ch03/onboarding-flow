import { useCallback, useEffect, useRef, useState } from 'react';

import { normalizeApiError, type ApiError } from '@/api/errors';

/**
 * Her asenkron aksiyonun dort durumu var ve hicbiri atlanamaz.
 *
 * Durumlar ayrik birlesim olarak modellendi: `data` yalnizca basaride,
 * `error` yalnizca hatada okunabiliyor. Tek bir nesnede hepsini optional
 * tutmak, yukleniyorken veriyi okumayi derleme zamaninda serbest birakirdi
 * ve o hata calisma aninda, kullanicinin ekraninda ortaya cikardi.
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; data: T };

export type AsyncAction<TArgs extends unknown[], TResult> = {
  state: AsyncState<TResult>;
  run: (...args: TArgs) => Promise<TResult | undefined>;
  reset: () => void;
};

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
): AsyncAction<TArgs, TResult> {
  const [state, setState] = useState<AsyncState<TResult>>({ status: 'idle' });

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /**
   * Ust uste tetiklenen cagrilarda yalnizca sonuncusu yaziyor. Kullanici bir
   * butona iki kez bastiginda once donen eski cevabin ekrani ele gecirmesi,
   * fark edilmesi en zor hatalardan biri.
   */
  const latest = useRef(0);

  const run = useCallback(
    async (...args: TArgs) => {
      const attempt = ++latest.current;
      setState({ status: 'loading' });

      try {
        const data = await action(...args);
        if (mounted.current && attempt === latest.current) {
          setState({ status: 'success', data });
        }
        return data;
      } catch (thrown) {
        if (mounted.current && attempt === latest.current) {
          setState({ status: 'error', error: normalizeApiError(thrown) });
        }
        return undefined;
      }
    },
    [action],
  );

  const reset = useCallback(() => {
    // Sonraki cevap da gecersiz kilinir; aksi halde iptal edilmis bir istek
    // sifirlanmis ekrani yeniden doldurabilir.
    latest.current++;
    setState({ status: 'idle' });
  }, []);

  return { state, run, reset };
}
