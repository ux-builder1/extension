import { useState } from 'react';

import { Stack, styled } from 'leather-styles/jsx';

import { useAlexCurrencyPriceAsMarketData } from '@app/query/common/alex-sdk/alex-sdk.hooks';
import type { Sip10TokenAssetDetails } from '@app/query/stacks/sip10/sip10-tokens.hooks';
import { Accordion } from '@app/ui/components/accordion/accordion';

import { Sip10TokenAssetItem } from './sip10-token-asset-item';

const accordionValue = 'accordion-unsupported-token-asset-list';

interface Sip10TokenAssetListUnsupportedProps {
  isLoading: boolean;
  tokens: Sip10TokenAssetDetails[];
}
export function Sip10TokenAssetListUnsupported({
  isLoading,
  tokens,
}: Sip10TokenAssetListUnsupportedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const priceAsMarketData = useAlexCurrencyPriceAsMarketData();

  function onValueChange(value: string) {
    setIsOpen(value === accordionValue);
  }

  if (!tokens.length) return null;

  return (
    <Accordion.Root onValueChange={onValueChange} type="single" collapsible>
      <Accordion.Item title="Stacks Fungible Tokens" value={accordionValue}>
        <Accordion.Trigger>
          <styled.span>View {isOpen ? 'fewer' : 'more'}</styled.span>
        </Accordion.Trigger>
        <Accordion.Content>
          <Stack>
            {tokens.map(token => (
              <Sip10TokenAssetItem
                balance={token.balance}
                key={token.info.name}
                info={token.info}
                isLoading={isLoading}
                marketData={priceAsMarketData(
                  token.info.contractId,
                  token.balance.availableBalance.symbol
                )}
              />
            ))}
          </Stack>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
