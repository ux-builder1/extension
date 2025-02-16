import { SharedComponentsSelectors } from '@tests/selectors/shared-component.selectors';
import { styled } from 'leather-styles/jsx';

import type { Money } from '@leather-wallet/models';
import { formatDustUsdAmounts, i18nFormatCurrency } from '@leather-wallet/utils';

import { CryptoCurrencies } from '@shared/models/currencies.model';

import { BasicTooltip } from '@app/ui/components/tooltip/basic-tooltip';

interface TransactionFeeProps {
  fee: string | number;
  feeCurrencySymbol: CryptoCurrencies;
  usdAmount: Money | null;
}
export function TransactionFee({ fee, feeCurrencySymbol, usdAmount }: TransactionFeeProps) {
  const feeLabel = (
    <styled.span
      color="ink.text-subdued"
      data-testid={SharedComponentsSelectors.FeeToBePaidLabel}
      textStyle="label.02"
    >
      {fee} {feeCurrencySymbol}
    </styled.span>
  );
  if (!usdAmount || usdAmount.amount.isNaN()) return feeLabel;
  return (
    <BasicTooltip label={formatDustUsdAmounts(i18nFormatCurrency(usdAmount))}>
      {feeLabel}
    </BasicTooltip>
  );
}
