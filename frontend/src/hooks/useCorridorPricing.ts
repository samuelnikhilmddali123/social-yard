import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import API from '../services/api';
import {
  type BookingPricingQuote,
  type CorridorPricing,
  computeLocalPricingQuote,
  emptyPricingQuote,
  isUsableQuote,
} from '../utils/bookingPricing';

export function useCorridorPricing(
  selectedScreenIds: string[],
  durationSeconds: number = 5,
  allScreens: { _id: string; corridorName?: string; location?: string }[] = [],
  hasWatermark: boolean = true,
  daysCount: number = 1,
  couponCode?: string
) {
  const [corridorPricing, setCorridorPricing] = useState<CorridorPricing[]>([]);
  const [serverQuote, setServerQuote] = useState<BookingPricingQuote | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedIds = useMemo(
    () => selectedScreenIds.map(String),
    [selectedScreenIds]
  );

  useEffect(() => {
    API.get('/corridors/pricing')
      .then((res) => setCorridorPricing(res.data))
      .catch((err) => console.warn('Failed to load corridor pricing', err));
  }, []);

  const refreshQuote = useCallback(async (screenIds: string[], dur: number, watermark: boolean = true, days: number = 1, code?: string) => {
    if (!screenIds.length) {
      setServerQuote(null);
      setLoadingPricing(false);
      return;
    }
    setLoadingPricing(true);
    try {
      const res = await API.post('/schedule/calculate-total', {
        screenIds: screenIds.map(String),
        durationSeconds: dur,
        hasWatermark: watermark,
        daysCount: days,
        couponCode: code,
      });
      setServerQuote(res.data);
    } catch (err) {
      console.warn('Pricing quote failed, using local calculation', err);
      setServerQuote(null);
    } finally {
      setLoadingPricing(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!normalizedIds.length) {
      setServerQuote(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      refreshQuote(normalizedIds, durationSeconds, hasWatermark, daysCount, couponCode);
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [normalizedIds.join(','), durationSeconds, hasWatermark, daysCount, couponCode, refreshQuote]);

  const localQuote = useMemo(
    () => {
      const baseQuote = computeLocalPricingQuote(
        normalizedIds,
        durationSeconds,
        allScreens,
        corridorPricing
      );
      // Multiply by daysCount
      baseQuote.totalAmount = baseQuote.totalAmount * daysCount;
      if (baseQuote.breakdown) {
        baseQuote.breakdown = baseQuote.breakdown.map((b: any) => ({
          ...b,
          subtotal: b.subtotal * daysCount,
        }));
      }

      if (!hasWatermark) {
        baseQuote.totalAmount = Math.ceil(baseQuote.totalAmount * 1.25);
        if (baseQuote.pricePer5Sec !== undefined) {
          baseQuote.pricePer5Sec = Math.ceil(baseQuote.pricePer5Sec * 1.25);
        }
        if (baseQuote.breakdown) {
          baseQuote.breakdown = baseQuote.breakdown.map((b: any) => ({
            ...b,
            pricePer5Sec: Math.ceil(b.pricePer5Sec * 1.25),
            subtotal: Math.ceil(b.subtotal * 1.25),
          }));
        }
      }
      return baseQuote;
    },
    [normalizedIds.join(','), durationSeconds, allScreens, corridorPricing, hasWatermark, daysCount]
  );

  const quote: BookingPricingQuote =
    normalizedIds.length === 0
      ? emptyPricingQuote()
      : isUsableQuote(serverQuote ?? emptyPricingQuote(), normalizedIds.length)
        ? serverQuote!
        : isUsableQuote(localQuote, normalizedIds.length)
          ? localQuote
          : localQuote.selectedScreenCount > 0
            ? localQuote
            : serverQuote ?? localQuote;

  const slotMultiplier =
    quote.slotMultiplier ?? Math.ceil((durationSeconds || 5) / 5);

  const corridorRate = (c: CorridorPricing) => {
    if (c.pricePer5Sec && c.pricePer5Sec > 0) return c.pricePer5Sec;
    const base = c.pricePer30Sec ?? c.pricePerScreen ?? 0;
    return base > 0 ? Math.ceil(base / 6) : 0;
  };

  const primaryRate =
    (quote.breakdown[0]?.pricePer5Sec && quote.breakdown[0].pricePer5Sec > 0
      ? quote.breakdown[0].pricePer5Sec
      : undefined) ??
    (quote.breakdown[0]?.pricePerScreen && quote.breakdown[0].pricePerScreen > 0
      ? Math.ceil(quote.breakdown[0].pricePerScreen / 6)
      : undefined) ??
    (corridorPricing[0] ? corridorRate(corridorPricing[0]) : 0);

  const pricePer5Sec =
    quote.pricePer5Sec && quote.pricePer5Sec > 0 ? quote.pricePer5Sec : primaryRate;

  const selectedScreenCount =
    quote.selectedScreenCount > 0 ? quote.selectedScreenCount : normalizedIds.length;

  const totalAmount =
    quote.totalAmount !== undefined
      ? quote.totalAmount
      : selectedScreenCount * pricePer5Sec * slotMultiplier * daysCount;

  return {
    corridorPricing,
    quote,
    loadingPricing,
    totalAmount,
    selectedScreenCount,
    pricePerScreen: primaryRate,
    pricePer5Sec,
    slotMultiplier,
    breakdown: quote.breakdown,
    refreshQuote,
    originalAmount: quote.originalAmount || totalAmount,
    discountAmount: quote.discountAmount || 0,
    discountPercent: quote.discountPercent || 0,
    couponApplied: quote.couponApplied || null,
    couponError: quote.couponError || null,
  };
}
