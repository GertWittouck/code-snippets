import { useMemo } from 'react';
import { type Control, type FieldValues, type Path, useController } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

import { useTranslation } from '@fruugo/i18n';

import { useResolvedLocale } from '../../../hooks/useResolvedLocale.ts';
import { getCurrencyDP } from '../../../onboarding/utils/getCurrencyDP.ts';
import { FormElement } from '../FormElement/FormElement.tsx';
import styles from './CurrencyInput.module.scss';

interface Props<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  label?: string;
  name: Path<TFieldValues>;
  required?: boolean;
  currency?: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  id?: string;
  className?: string;
  ariaLabel?: string;
  autoComplete?: string;
}

export const CurrencyInput = <TFieldValues extends FieldValues>({
  control,
  label,
  name,
  required,
  currency,
  placeholder,
  disabled,
  hint,
  id,
  ariaLabel,
  autoComplete,
}: Props<TFieldValues>) => {
  const t = useTranslation();
  const { field, fieldState } = useController({ name, control });

  const locale = useResolvedLocale({ currency, userCountry: undefined });

  const dp = useMemo(() => getCurrencyDP(currency), [currency]);
  const symbol = useMemo(() => getCurrencySymbol(currency, locale), [currency, locale]);

  const { group, decimal, style } = useMemo(() => getLocaleSeparators(locale), [locale]);

  const defaultPlaceholder = dp > 0 ? `0.${'0'.repeat(dp)}` : '0';

  return (
    <FormElement
      label={label}
      id={name}
      required={required}
      error={fieldState.error?.message && t(fieldState.error?.message)}
      hint={hint}
    >
      <div className={styles.currencyInputWrapper}>
        <span className={styles.currencyPrefix}>{symbol}</span>

        <NumericFormat
          id={id ?? name}
          thousandSeparator={group}
          decimalSeparator={decimal}
          thousandsGroupStyle={style} // 'thousand' | 'lakh' | 'wan'
          decimalScale={dp}
          fixedDecimalScale
          allowNegative={false}
          // keep RHF value RAW (no grouping, '.' decimal)
          value={field.value ?? ''}
          onValueChange={(vals) => field.onChange(vals.value)}
          onBlur={field.onBlur}
          // Enforce max 8 integer digits (ignoring leading zeros)
          isAllowed={(vals) => {
            const v = vals.value ?? '';
            const [intPart = ''] = v.split('.');
            const intDigits = intPart.replace(/^0+/, '').length;
            return intDigits <= MAX_INT_DIGITS;
          }}
          inputMode="decimal"
          aria-label={ariaLabel}
          autoComplete={autoComplete}
          placeholder={placeholder ?? defaultPlaceholder}
          disabled={disabled}
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
          onKeyDown={(e) => {
            if (['e', 'E', '+'].includes(e.key)) e.preventDefault();
          }}
          className={'customInput'}
        />
      </div>
    </FormElement>
  );
};

/* ---------------- helpers ---------------- */

const MAX_INT_DIGITS = 8;

// Locale → separators & grouping
function getLocaleSeparators(locale: string): {
  group: string;
  decimal: string;
  style: 'thousand' | 'lakh' | 'wan';
} {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.89);
  const group = parts.find((p) => p.type === 'group')?.value ?? ',';
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';

  // Grouping style: default 3-3-3; en-IN uses 3-2-2; opt-in 4-4 only if you need it.
  const style: 'thousand' | 'lakh' | 'wan' = /^en-?IN/i.test(locale) ? 'lakh' : 'thousand';
  return { group, decimal, style };
}

// Currency symbol
function getCurrencySymbol(currencyCode?: string, locale = 'en-GB'): string {
  if (!currencyCode) return '¤';
  try {
    return (
      (0)
        .toLocaleString(locale, {
          style: 'currency',
          currency: currencyCode,
          currencyDisplay: 'narrowSymbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
          numberingSystem: 'latn',
        })
        .replace(/\d/g, '')
        .trim() || '¤'
    );
  } catch {
    return '¤';
  }
}
