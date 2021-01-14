import { UserSession, AppConfig } from '@stacks/auth';
import { SECP256K1Client, TokenSigner } from 'jsontokens';
import { popupCenter, setupListener } from '../popup';
import {
  ContractCallOptions,
  ContractCallPayload,
  ContractDeployOptions,
  ContractDeployPayload,
  TransactionPopup,
  TransactionOptions,
  STXTransferOptions,
  STXTransferPayload,
  TransactionPayload,
  TransactionTypes,
  FinishedTxPayload,
} from './types';
import { serializeCV } from '@stacks/transactions';
import { getStacksProvider } from '../utils';
import { deserializeTransaction, BufferReader } from '@stacks/transactions';

export * from './types';

const getKeys = (_userSession?: UserSession) => {
  let userSession = _userSession;

  if (!userSession) {
    const appConfig = new AppConfig(['store_write'], document.location.href);
    userSession = new UserSession({ appConfig });
  }

  const privateKey = userSession.loadUserData().appPrivateKey;
  const publicKey = SECP256K1Client.derivePublicKey(privateKey);

  return { privateKey, publicKey };
};

const signPayload = async (payload: TransactionPayload, privateKey: string) => {
  const tokenSigner = new TokenSigner('ES256k', privateKey);
  return tokenSigner.signAsync(payload as any);
};

const openTransactionPopup = async ({ token, options }: TransactionPopup) => {
  const provider = getStacksProvider();
  if (!provider) {
    throw new Error('Stacks Wallet not installed.');
  }
  const extensionURL = await provider?.getURL();
  const authURL = new URL(extensionURL);
  const urlParams = new URLSearchParams();
  urlParams.set('request', token);

  const popup = popupCenter({
    url: `${authURL.origin}/index.html#/transaction?${urlParams.toString()}`,
    h: 560,
  });

  setupListener<FinishedTxPayload>({
    popup,
    authURL,
    onFinish: data => {
      const finishedCallback = options.finished || options.onFinish;
      const { txRaw } = data;
      const txBuffer = Buffer.from(txRaw.replace(/^0x/, ''), 'hex');
      const stacksTransaction = deserializeTransaction(new BufferReader(txBuffer));
      finishedCallback?.({
        ...data,
        stacksTransaction,
      });
    },
    messageParams: {},
  });
  return popup;
};

export const makeContractCallToken = async (options: ContractCallOptions) => {
  const { functionArgs, appDetails, userSession, ..._options } = options;
  const { privateKey, publicKey } = getKeys(userSession);

  const args: string[] = functionArgs.map(arg => {
    if (typeof arg === 'string') {
      return arg;
    }
    return serializeCV(arg).toString('hex');
  });

  const payload: ContractCallPayload = {
    ..._options,
    functionArgs: args,
    txType: TransactionTypes.ContractCall,
    publicKey,
  };

  if (appDetails) {
    payload.appDetails = appDetails;
  }

  return signPayload(payload, privateKey);
};

export const makeContractDeployToken = async (options: ContractDeployOptions) => {
  const { appDetails, userSession, ..._options } = options;
  const { privateKey, publicKey } = getKeys(userSession);

  const payload: ContractDeployPayload = {
    ..._options,
    publicKey,
    txType: TransactionTypes.ContractDeploy,
  };

  if (appDetails) {
    payload.appDetails = appDetails;
  }

  return signPayload(payload, privateKey);
};

export const makeSTXTransferToken = async (options: STXTransferOptions) => {
  const { amount, appDetails, userSession, ..._options } = options;
  const { privateKey, publicKey } = getKeys(userSession);

  const payload: STXTransferPayload = {
    ..._options,
    amount: amount.toString(10),
    publicKey,
    txType: TransactionTypes.STXTransfer,
  };

  if (appDetails) {
    payload.appDetails = appDetails;
  }

  return signPayload(payload, privateKey);
};

async function generateTokenAndOpenPopup<T extends TransactionOptions>(
  options: T,
  makeTokenFn: (options: T) => Promise<string>
) {
  const token = await makeTokenFn(options);
  return openTransactionPopup({ token, options });
}

export const openContractCall = async (options: ContractCallOptions) =>
  generateTokenAndOpenPopup(options, makeContractCallToken);

export const openContractDeploy = async (options: ContractDeployOptions) =>
  generateTokenAndOpenPopup(options, makeContractDeployToken);

export const openSTXTransfer = async (options: STXTransferOptions) =>
  generateTokenAndOpenPopup(options, makeSTXTransferToken);
