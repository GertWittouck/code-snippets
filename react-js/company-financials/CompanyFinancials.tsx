import { useEffect, useMemo, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from '@fruugo/i18n';
import { zodResolver } from '@hookform/resolvers/zod';

import { useRHFAnalytics } from '../../analytics/hooks/useRHFAnalytics.ts';
import { Fieldset } from '../../components/Fieldset/Fieldset.tsx';
import { BaseCurrency } from '../../components/fields/BaseCurrency/BaseCurrency.tsx';
import { CurrencyInput } from '../../components/fields/CurrencyInput/CurrencyInput.tsx';
import { StepForm } from '../components/Step/StepForm.tsx';
import { useCurrentStep } from '../hooks/useCurrentStep.tsx';
import { useFormStore } from '../store/useFormStore.ts';
import {
  CompanyFinancialsBaseSchema,
  type CompanyFinancialsData,
  CompanyFinancialsSchema,
} from '../validation/steps/companyFinancials.ts';
import styles from './Form.module.scss';

export const CompanyFinancials = () => {
  const t = useTranslation();
  const navigate = useNavigate();
  const { nextStep } = useCurrentStep();
  const updateStore = useFormStore((s) => s.setBulk);
  const persisted = useFormStore((s) => s.data);

  const methods = useForm<CompanyFinancialsData>({
    resolver: zodResolver(CompanyFinancialsSchema),
    defaultValues: {
      companyBaseCurrency: undefined, // Needs to be set to registered country currency if available
      annualRevenue: undefined,
      annualRevenueOnOtherMarketPlaces: '0',
      ...persisted,
    },
    mode: 'onTouched',
  });

  const { control, watch, setValue } = methods;
  const selectedCurrency = watch('companyBaseCurrency');
  const previousCurrencyRef = useRef<string | undefined>(selectedCurrency);

  const onValid = (data: CompanyFinancialsData) => {
    updateStore(data);
    if (nextStep?.path) navigate(nextStep.path);
  };

  // Clear currency input fields when base currency changes
  useEffect(() => {
    // Skip if this is the first render or currency hasn't actually changed
    if (previousCurrencyRef.current === undefined || selectedCurrency === previousCurrencyRef.current) {
      previousCurrencyRef.current = selectedCurrency;
      return;
    }

    // Currency has changed - clear the amount fields if they have values
    const annualRevenue = methods.getValues('annualRevenue');
    const annualRevenueOnOtherMarketPlaces = methods.getValues('annualRevenueOnOtherMarketPlaces');

    if (annualRevenue && annualRevenue !== '') {
      setValue('annualRevenue', '', { shouldValidate: false });
    }

    if (annualRevenueOnOtherMarketPlaces && annualRevenueOnOtherMarketPlaces !== '0') {
      setValue('annualRevenueOnOtherMarketPlaces', '0', { shouldValidate: false });
    }

    previousCurrencyRef.current = selectedCurrency;
  }, [selectedCurrency, setValue, methods]);

  const labels = useMemo(
    () => ({
      companyBaseCurrency: t(CompanyFinancialsBaseSchema.shape.companyBaseCurrency.description as string),
      annualRevenue: t(CompanyFinancialsBaseSchema.shape.annualRevenue.description as string),
      annualRevenueOnOtherMarketPlaces: t(
        CompanyFinancialsBaseSchema.shape.annualRevenueOnOtherMarketPlaces.description as string,
      ),
    }),
    [t],
  );

  const { onInvalid } = useRHFAnalytics(methods, {
    sectionId: 'onboarding.company_financials',
  });

  return (
    <FormProvider {...methods}>
      <StepForm onValid={onValid} onInvalid={onInvalid}>
        <Fieldset title={'form.fieldset.financialDetails'}>
          <div className={styles.row}>
            <BaseCurrency control={control} label={labels.companyBaseCurrency} name={'companyBaseCurrency'} required />
            <CurrencyInput
              control={control}
              label={labels.annualRevenue}
              name={'annualRevenue'}
              currency={selectedCurrency}
              required
            />
            <CurrencyInput
              control={control}
              label={labels.annualRevenueOnOtherMarketPlaces}
              name={'annualRevenueOnOtherMarketPlaces'}
              currency={selectedCurrency}
              required
            />
          </div>
        </Fieldset>
      </StepForm>
    </FormProvider>
  );
};
