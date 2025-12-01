import { z } from 'zod';

// Helper function to get decimal places for a currency
const getDecimalPlacesForCurrency = (currency: string): number => {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    });
    return formatter.resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
};

// Base schema object that exposes the shape (no refine to preserve .shape access)
export const CompanyFinancialsBaseSchema = z.object({
  companyBaseCurrency: z.string({ description: 'form.companyBaseCurrency' }).min(1, 'validation.selectAnOption'),
  annualRevenue: z.string({ description: 'form.annualRevenue' }).min(1, 'validation.required'),
  annualRevenueOnOtherMarketPlaces: z.string({ description: 'form.annualRevenueOnOtherMarketPlaces' }).optional(),
});

// Export the validated schema with currency-aware validation
export const CompanyFinancialsSchema = CompanyFinancialsBaseSchema.superRefine((data, ctx) => {
  const validateAmount = (
    raw: string | undefined,
    path: ['annualRevenue'] | ['annualRevenueOnOtherMarketPlaces'],
    { allowZero }: { allowZero: boolean },
  ) => {
    if (raw == null || raw === '') return;

    // Normalize: remove commas
    const normalized = raw.replace(/,/g, '');

    // Must be a number (allow leading/trailing spaces, but not other junk)
    const numValue = Number(normalized);
    if (!Number.isFinite(numValue) || (!allowZero && numValue <= 0) || (allowZero && numValue < 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.minDigits',
        path,
      });
      return;
    }

    // Integer digit limit: max 8 digits (ignore commas and decimals)
    // e.g., "10,000,000.00" -> intPart = "10000000" (8 digits)
    const [intPartRaw, fracPartRaw = ''] = normalized.split('.');
    const intPart = intPartRaw.replace(/[^0-9]/g, ''); // just digits
    if (intPart.length > 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.maxDigits',
        path,
      });
    }

    // Decimal places per currency
    const decimalPlaces = getDecimalPlacesForCurrency(data.companyBaseCurrency);
    if (fracPartRaw && fracPartRaw.length > decimalPlaces) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `validation.maxDecimalPlace.${decimalPlaces}`,
        path,
      });
    }

    return { numValue };
  };

  // annualRevenue: must be >= 0 (you can flip to > 0 if you prefer)
  const annual = validateAmount(data.annualRevenue, ['annualRevenue'], { allowZero: true });

  // annualRevenueOnOtherMarketPlaces: must be >= 0 and ≤ annualRevenue
  const other = validateAmount(data.annualRevenueOnOtherMarketPlaces, ['annualRevenueOnOtherMarketPlaces'], {
    allowZero: true,
  });

  if (annual && other) {
    if (other.numValue > annual.numValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.annualRevenueOnOtherMarketPlacesMustBeLessOrEqual',
        path: ['annualRevenueOnOtherMarketPlaces'],
      });
    }
  }
});

export type CompanyFinancialsData = z.output<typeof CompanyFinancialsSchema>;
