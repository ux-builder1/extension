import { FormEvent, useCallback, useState } from 'react';

import { SettingsSelectors } from '@tests/selectors/settings.selectors';
import { Box, Stack, styled } from 'leather-styles/jsx';

import { useAnalytics } from '@app/common/hooks/analytics/use-analytics';
import { useKeyActions } from '@app/common/hooks/use-key-actions';
import { buildEnterKeyEvent } from '@app/common/hooks/use-modifier-key';
import { WaitingMessages, useWaitingMessage } from '@app/common/hooks/use-waiting-message';
import { Button } from '@app/ui/components/button/button';
import { Footer } from '@app/ui/components/containers/footers/footer';
import { Logo } from '@app/ui/components/logo';
import { Card } from '@app/ui/layout/card/card';
import { Page } from '@app/ui/layout/page/page.layout';

import { ErrorLabel } from './error-label';

const waitingMessages: WaitingMessages = {
  '2': 'Verifying password…',
  '10': 'Still working…',
  '20': 'Almost there',
};

const caption =
  'Your password is used to secure your Secret Key and is only used locally on your device.';

interface RequestPasswordProps {
  onSuccess(): void;
}
export function RequestPassword({ onSuccess }: RequestPasswordProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { unlockWallet } = useKeyActions();
  const analytics = useAnalytics();
  const [isRunning, waitingMessage, startWaitingMessage, stopWaitingMessage] =
    useWaitingMessage(waitingMessages);

  const submit = useCallback(async () => {
    const startUnlockTimeMs = performance.now();
    void analytics.track('start_unlock');
    startWaitingMessage();
    setError('');
    try {
      await unlockWallet(password);
      onSuccess?.();
    } catch (error) {
      setError('The password you entered is invalid');
    }
    stopWaitingMessage();
    const unlockSuccessTimeMs = performance.now();
    void analytics.track('complete_unlock', {
      durationMs: unlockSuccessTimeMs - startUnlockTimeMs,
    });
  }, [analytics, startWaitingMessage, stopWaitingMessage, unlockWallet, password, onSuccess]);

  return (
    <Page>
      <Card
        header={
          <styled.h1 p="space.04" hideBelow="sm">
            <Box px="space.02">
              <Logo />
            </Box>
          </styled.h1>
        }
        footer={
          <Footer variant="card">
            <Button
              data-testid={SettingsSelectors.UnlockWalletBtn}
              disabled={isRunning || !!error}
              aria-busy={isRunning}
              onClick={submit}
              variant="solid"
            >
              Continue
            </Button>
          </Footer>
        }
      >
        <Stack gap="space.05" px="space.05" minHeight="330px">
          <styled.h3 textStyle="heading.03">Enter your password</styled.h3>
          <styled.p textStyle="label.02">{(isRunning && waitingMessage) || caption}</styled.p>
          <styled.input
            _focus={{ border: 'focus' }}
            autoCapitalize="off"
            autoComplete="off"
            autoFocus
            border="active"
            borderRadius="sm"
            data-testid={SettingsSelectors.EnterPasswordInput}
            height="inputHeight"
            onChange={(e: FormEvent<HTMLInputElement>) => {
              setError('');
              setPassword(e.currentTarget.value);
            }}
            onKeyUp={buildEnterKeyEvent(submit)}
            p="space.04"
            placeholder="Enter your password"
            ring="none"
            type="password"
            textStyle="body.02"
            value={password}
            width="100%"
          />
          {error && <ErrorLabel width="100%">{error}</ErrorLabel>}
        </Stack>
      </Card>
    </Page>
  );
}
