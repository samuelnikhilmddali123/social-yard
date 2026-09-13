export type CorridorPricing = {
  corridorId: string;
  corridorName: string;
  pricePerScreen: number;
  pricePer30Sec?: number;
  pricePer5Sec?: number;
  city?: string;
  area?: string;
};

export type PricingBreakdownLine = {
  corridorId: string;
  corridorName: string;
  pricePerScreen: number;
  pricePer30Sec?: number;
  pricePer5Sec?: number;
  screenCount: number;
  subtotal: number;
};

export type BookingPricingQuote = {
  selectedScreenCount: number;
  totalAmount: number;
  pricePerScreen: number;
  pricePer5Sec?: number;
  slotMultiplier?: number;
  corridorId: string | null;
  corridorName: string | null;
  breakdown: PricingBreakdownLine[];
  originalAmount?: number;
  discountAmount?: number;
  discountPercent?: number;
  couponApplied?: string | null;
  couponError?: string | null;
};

const DEFAULT_CORRIDOR = 'Vijayawada MG Road Corridor';

export const emptyPricingQuote = (): BookingPricingQuote => ({
  selectedScreenCount: 0,
  totalAmount: 0,
  pricePerScreen: 0,
  pricePer5Sec: undefined,
  slotMultiplier: undefined,
  corridorId: null,
  corridorName: null,
  breakdown: [],
});

export function resolveScreenCorridorName(screen: {
  corridorName?: string;
  location?: string;
}): string {
  if (screen.corridorName?.trim()) return screen.corridorName.trim();
  const loc = (screen.location || '').trim();
  if (loc && !loc.includes(',')) return loc;
  return DEFAULT_CORRIDOR;
}

function ratePer5SecFromCorridor(c: CorridorPricing): number {
  if (c.pricePer5Sec && c.pricePer5Sec > 0) return c.pricePer5Sec;
  const base = c.pricePer30Sec ?? c.pricePerScreen ?? 0;
  if (base > 0) return Math.ceil(base / 6);
  return 0;
}

function rateForCorridor(
  corridorName: string,
  corridorPricing: CorridorPricing[]
): number {
  const key = corridorName.trim().toLowerCase();
  const match = corridorPricing.find(
    (c) => c.corridorName.trim().toLowerCase() === key
  );
  if (match) return ratePer5SecFromCorridor(match);
  if (corridorPricing.length === 1) return ratePer5SecFromCorridor(corridorPricing[0]);
  return 0;
}

/** Client-side pricing mirror — used when server quote is unavailable. */
export function computeLocalPricingQuote(
  selectedScreenIds: string[],
  durationSeconds: number,
  allScreens: { _id: string; corridorName?: string; location?: string }[],
  corridorPricing: CorridorPricing[]
): BookingPricingQuote {
  const slotMultiplier = Math.ceil((durationSeconds || 5) / 5);
  const idSet = new Set(selectedScreenIds.map(String));
  const selectedScreens = allScreens.filter((s) => idSet.has(String(s._id)));

  if (!selectedScreens.length) {
    return emptyPricingQuote();
  }

  const buckets = new Map<string, PricingBreakdownLine>();

  for (const screen of selectedScreens) {
    const cName = resolveScreenCorridorName(screen);
    const key = cName.toLowerCase();
    const rate = rateForCorridor(cName, corridorPricing);
    const corridor = corridorPricing.find(
      (c) => c.corridorName.trim().toLowerCase() === key
    );

    if (!buckets.has(key)) {
      buckets.set(key, {
        corridorId: corridor?.corridorId ?? key,
        corridorName: corridor?.corridorName ?? cName,
        pricePerScreen: rate,
        pricePer5Sec: rate,
        screenCount: 0,
        subtotal: 0,
      });
    }

    const bucket = buckets.get(key)!;
    bucket.screenCount += 1;
    bucket.subtotal += rate * slotMultiplier;
  }

  const breakdown = Array.from(buckets.values()).sort(
    (a, b) => b.screenCount - a.screenCount
  );
  const totalAmount = breakdown.reduce((sum, line) => sum + line.subtotal, 0);
  const primary = breakdown[0];

  return {
    selectedScreenCount: selectedScreens.length,
    totalAmount,
    pricePerScreen: primary?.pricePer5Sec ?? primary?.pricePerScreen ?? 0,
    pricePer5Sec: primary?.pricePer5Sec ?? primary?.pricePerScreen ?? 0,
    slotMultiplier,
    corridorId: primary?.corridorId ?? null,
    corridorName: primary?.corridorName ?? null,
    breakdown,
  };
}

export function isUsableQuote(
  quote: BookingPricingQuote,
  expectedScreenCount: number
): boolean {
  return (
    expectedScreenCount > 0 &&
    quote.selectedScreenCount === expectedScreenCount &&
    quote.totalAmount >= 0 &&
    quote.breakdown.length > 0
  );
}
