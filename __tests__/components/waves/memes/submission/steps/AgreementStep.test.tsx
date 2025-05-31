import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import AgreementStep from '../../../../../../components/waves/memes/submission/steps/AgreementStep';

jest.mock('../../../../../../components/utils/button/PrimaryButton', () => (props: any) => (
  <button onClick={props.onClicked} disabled={props.disabled} data-testid="primary">
    {props.children}
  </button>
));

type Wave = { participation: { terms: string } };
jest.mock('../../../../../../components/waves/memes/submission/steps/AgreementStepAgreement', () => (p: any) => <div data-testid="agreement">{p.text}</div>);

const wave: Wave = { participation: { terms: 'terms' } } as any;

describe('AgreementStep', () => {
  it('toggles agreement and calls continue', async () => {
    const setAgreements = jest.fn();
    const onContinue = jest.fn();
    const user = userEvent.setup();
    render(
      <AgreementStep wave={wave as any} agreements={false} setAgreements={setAgreements} onContinue={onContinue} />
    );
    await user.click(screen.getByRole('button', { name: /Check terms agreement/i }));
    expect(setAgreements).toHaveBeenCalledWith(true);
  });

  it('enables continue when agreed', async () => {
    const setAgreements = jest.fn();
    const onContinue = jest.fn();
    const user = userEvent.setup();
    render(
      <AgreementStep wave={wave as any} agreements={true} setAgreements={setAgreements} onContinue={onContinue} />
    );
    const btn = screen.getByTestId('primary');
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(onContinue).toHaveBeenCalled();
  });
});
