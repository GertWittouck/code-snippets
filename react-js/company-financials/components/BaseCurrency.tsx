import { useEffect, useMemo } from 'react';
import { type Control, type FieldValues, type Path, type PathValue, useFormContext } from 'react-hook-form';

import type { Option } from '@fruugo/components';
import { useTranslation } from '@fruugo/i18n';
import { useQuery } from '@tanstack/react-query';

import { fetchCurrencies } from '../../../api/meta.ts';
import type { GetCurrenciesResponse } from '../../../api/types.ts';
import { useFormStore } from '../../../onboarding/store/useFormStore.ts';
import { RHFSelect } from '../RHFSelect.tsx';

interface Props<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  label: string;
  name: Path<TFieldValues>;
  required?: boolean;
}

export const BaseCurrency = <TFieldValues extends FieldValues>({
  control,
  label,
  name,
  required,
}: Props<TFieldValues>) => {
  const { setValue, getValues } = useFormContext<TFieldValues>();

  const t = useTranslation();
  const meta = useFormStore((s) => s.meta);
  const disabled = meta?.status === 'DECLINED' || meta?.status === 'APPROVED' || meta?.status === 'SUBMITTED';
  const registrationCountry = useFormStore((s) => s.data.registrationCountry);

  const { data } = useQuery<GetCurrenciesResponse>({
    queryKey: ['meta', 'baseCurrency'],
    queryFn: ({ signal }) => fetchCurrencies(registrationCountry ?? '', signal),
    staleTime: 24 * 60 * 60_000,
    gcTime: 7 * 24 * 60 * 60_000,
  });

  // API options derived from strings (memoized)
  const apiOptions = useMemo(() => mapCurrencyOptionsToOptions(data?.currencyOptions ?? []), [data]);

  // Set the default currency if available
  useEffect(() => {
    if (data?.defaultCurrency) {
      const currentValue = getValues(name);
      if (!currentValue) {
        setValue(name, data.defaultCurrency as PathValue<TFieldValues, Path<TFieldValues>>, { shouldValidate: false });
      }
    }
  }, [data?.defaultCurrency, name, setValue, getValues]);

  return (
    <RHFSelect
      name={name}
      control={control}
      label={label}
      options={apiOptions}
      disabled={disabled}
      placeholder={t('validation.selectAnOption')}
      required={required}
    />
  );
};

const mapCurrencyOptionsToOptions = (items: string[]): Option[] =>
  items.map((currency) => ({
    value: currency,
    label: currency,
  }));
