import { useCallback } from 'react';

import { bytesToHex } from '@stacks/common';
import { StacksTransaction, broadcastTransaction } from '@stacks/transactions';

import { delay, isError } from '@leather-wallet/utils';

import { logger } from '@shared/logger';

import { getErrorMessage } from '@app/common/get-error-message';
import { useRefreshAllAccountData } from '@app/common/hooks/account/use-refresh-all-account-data';
import { useAnalytics } from '@app/common/hooks/analytics/use-analytics';
import { useLoading } from '@app/common/hooks/use-loading';
import { safelyFormatHexTxid } from '@app/common/utils/safe-handle-txid';
import { useToast } from '@app/features/toasts/use-toast';
import { useCurrentStacksNetworkState } from '@app/store/networks/networks.hooks';
import { useSubmittedTransactionsActions } from '@app/store/submitted-transactions/submitted-transactions.hooks';

const timeForApiToUpdate = 250;

interface UseSubmitTransactionArgs {
  loadingKey: string;
}
interface UseSubmitTransactionCallbackArgs {
  replaceByFee?: boolean;
  onSuccess(txId: string): void;
  onError(error: Error | string): void;
}
export function useSubmitTransactionCallback({ loadingKey }: UseSubmitTransactionArgs) {
  const submittedTransactionsActions = useSubmittedTransactionsActions();
  const toast = useToast();

  const analytics = useAnalytics();
  const refreshAccountData = useRefreshAllAccountData();

  const { setIsLoading, setIsIdle } = useLoading(loadingKey);
  const stacksNetwork = useCurrentStacksNetworkState();

  return useCallback(
    ({ onSuccess, onError }: UseSubmitTransactionCallbackArgs) =>
      async (transaction: StacksTransaction) => {
        setIsLoading();
        try {
          const response = await broadcastTransaction(transaction, stacksNetwork);
          if (response.error) {
            logger.error('Transaction broadcast', response);
            if (response.reason) toast.error(getErrorMessage(response.reason));
            onError(response.error);
            setIsIdle();
          } else {
            logger.info('Transaction broadcast', response);
            submittedTransactionsActions.newTransactionSubmitted({
              rawTx: bytesToHex(transaction.serialize()),
              txId: safelyFormatHexTxid(response.txid),
            });

            await delay(500);

            void analytics.track('broadcast_transaction', { symbol: 'stx' });
            onSuccess(safelyFormatHexTxid(response.txid));
            setIsIdle();
            await refreshAccountData(timeForApiToUpdate);
          }
        } catch (error) {
          logger.error('Transaction callback', { error });
          onError(isError(error) ? error : { name: '', message: '' });
          setIsIdle();
        }
      },
    [
      setIsLoading,
      stacksNetwork,
      toast,
      setIsIdle,
      submittedTransactionsActions,
      analytics,
      refreshAccountData,
    ]
  );
}
