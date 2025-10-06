import { render, screen } from '@testing-library/react';
import CreateWaveOutcomesCIC from '@/components/waves/create-wave/outcomes/cic/CreateWaveOutcomesCIC';
import { ApiWaveType } from '@/generated/models/ApiWaveType';

jest.mock('@/components/waves/create-wave/outcomes/cic/CreateWaveOutcomesCICRank', () => () => <div data-testid="rank" />);
jest.mock('@/components/waves/create-wave/outcomes/cic/CreateWaveOutcomesCICApprove', () => () => <div data-testid="approve" />);

describe('CreateWaveOutcomesCIC', () => {
  it('renders rank component for rank waves', () => {
    render(
      <CreateWaveOutcomesCIC waveType={ApiWaveType.Rank} dates={{} as any} onOutcome={jest.fn()} onCancel={jest.fn()} />
    );
    expect(screen.getByTestId('rank')).toBeInTheDocument();
  });

  it('renders approve component for approve waves', () => {
    render(
      <CreateWaveOutcomesCIC waveType={ApiWaveType.Approve} dates={{} as any} onOutcome={jest.fn()} onCancel={jest.fn()} />
    );
    expect(screen.getByTestId('approve')).toBeInTheDocument();
  });

  it('renders empty div for chat waves', () => {
    const { container } = render(
      <CreateWaveOutcomesCIC waveType={ApiWaveType.Chat} dates={{} as any} onOutcome={jest.fn()} onCancel={jest.fn()} />
    );
    expect(container.querySelector('div')).toBeEmptyDOMElement();
  });
});
