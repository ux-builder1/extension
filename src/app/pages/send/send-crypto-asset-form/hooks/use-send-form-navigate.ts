import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { bytesToHex } from '@stacks/common';
import { StacksTransaction } from '@stacks/transactions';
import { AxiosError } from 'axios';

import type { UtxoResponseItem } from '@leather-wallet/query';

import { BitcoinSendFormValues } from '@shared/models/form.model';
import { RouteUrls } from '@shared/route-urls';

interface ConfirmationRouteState {
  decimals?: number;
  token?: string;
  tx: string;
}

interface ConfirmationRouteStacksSip10Args {
  decimals?: number;
  name?: string;
  tx: StacksTransaction;
}

interface ConfirmationRouteBtcArgs {
  tx: string;
  recipient: string;
  fee: number;
  feeRowValue: string;
  time: string;
}

export function useSendFormNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return useMemo(
    () => ({
      backToSendForm(state: any) {
        return navigate('../', { relative: 'path', replace: true, state });
      },
      toChooseTransactionFee(
        isSendingMax: boolean,
        utxos: UtxoResponseItem[],
        values: BitcoinSendFormValues
      ) {
        return navigate(RouteUrls.SendBtcChooseFee, {
          replace: true,
          state: {
            isSendingMax,
            utxos,
            values,
          },
        });
      },
      toConfirmAndSignBtcTransaction({
        tx,
        recipient,
        fee,
        feeRowValue,
        time,
      }: ConfirmationRouteBtcArgs) {
        return navigate(RouteUrls.SendBtcConfirmation, {
          state: {
            tx,
            recipient,
            fee,
            feeRowValue,
            time,
          } as ConfirmationRouteState,
        });
      },
      toConfirmAndSignStxTransaction(tx: StacksTransaction, showFeeChangeWarning: boolean) {
        return navigate(RouteUrls.SendStxConfirmation, {
          replace: true,
          state: {
            tx: bytesToHex(tx.serialize()),
            showFeeChangeWarning,
          } as ConfirmationRouteState,
        });
      },
      toConfirmAndSignStacksSip10Transaction({
        decimals,
        name,
        tx,
      }: ConfirmationRouteStacksSip10Args) {
        return navigate(`${location.pathname}/confirm`, {
          state: {
            decimals,
            token: name,
            tx: bytesToHex(tx.serialize()),
          } as ConfirmationRouteState,
        });
      },
      toErrorPage(error: unknown) {
        // without this processing, navigate does not work
        const processedError = error instanceof AxiosError ? new Error(error.message) : error;

        return navigate('../error', {
          relative: 'path',
          replace: true,
          state: { error: processedError },
        });
      },
    }),
    [navigate, location]
  );
}
