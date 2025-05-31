import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

jest.mock('@tippyjs/react', () => (props: any) => <span>{props.children}</span>);
jest.mock('../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/BuildPhaseFormConfigModalTitle', () => (props: any) => <div data-testid="title">{props.title}</div>);
jest.mock('../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigMeta', () => () => <div />);
jest.mock('../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigNextBtn', () => (props: any) => (
  <button disabled={props.isDisabled} onClick={props.onNext} data-testid="next">Next{props.children}</button>
));

import SnapshotSelectTokenIds from '../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/SnapshotSelectTokenIds';
import { PhaseConfigStep } from '../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal';

describe('SnapshotSelectTokenIds', () => {
  it('calls onSelectTokenIds on next', async () => {
    const onNextStep = jest.fn();
    const onSelectTokenIds = jest.fn();
    render(<SnapshotSelectTokenIds title="t" onNextStep={onNextStep} onSelectTokenIds={onSelectTokenIds} onClose={jest.fn()} />);
    const input = screen.getByPlaceholderText('Example: 1,3,54-78');
    await userEvent.type(input, '1,2');
    await userEvent.click(screen.getByTestId('next'));
    expect(onSelectTokenIds).toHaveBeenCalledWith('1,2');
  });

  it('disables next when empty', () => {
    const { getByTestId } = render(
      <SnapshotSelectTokenIds title="t" onNextStep={jest.fn()} onSelectTokenIds={jest.fn()} onClose={jest.fn()} />
    );
    expect(getByTestId('next')).toBeDisabled();
  });
});
