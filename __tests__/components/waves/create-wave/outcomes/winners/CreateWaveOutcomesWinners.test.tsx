import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesWinners from '@/components/waves/create-wave/outcomes/winners/CreateWaveOutcomesWinners';
import type {
  CreateWaveOutcomeConfigWinner,
  CreateWaveOutcomeConfigWinnersConfig,
} from '@/types/waves.types';
import {
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from '@/types/waves.types';

jest.mock(
  '@/components/waves/create-wave/outcomes/winners/CreateWaveOutcomesWinnersRows',
  () =>
    function MockRows(props: {
      readonly winners: readonly CreateWaveOutcomeConfigWinner[];
      readonly isError: boolean;
      readonly creditValueType: CreateWaveOutcomeConfigWinnersCreditValueType;
      readonly outcomeType: CreateWaveOutcomeType;
      readonly setWinners: (winners: CreateWaveOutcomeConfigWinner[]) => void;
    }) {
      return (
        <div
          data-testid="rows"
          data-is-error={String(props.isError)}
          data-credit-value-type={props.creditValueType}
          data-outcome-type={props.outcomeType}>
          {props.winners.length}
          <button type="button" onClick={() => props.setWinners([{ value: 9 }])}>
            replace-winners
          </button>
        </div>
      );
    }
);

jest.mock(
  '@/components/waves/create-wave/outcomes/winners/CreateWaveOutcomesWinnersAddWinner',
  () =>
    function MockAddWinner(props: { readonly addWinner: () => void }) {
      return (
        <button type="button" onClick={props.addWinner}>
          add
        </button>
      );
    }
);

const absoluteConfig = (
  overrides: Partial<CreateWaveOutcomeConfigWinnersConfig> = {}
): CreateWaveOutcomeConfigWinnersConfig => ({
  creditValueType:
    CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
  totalAmount: 0,
  winners: [{ value: 1 }],
  ...overrides,
});

const percentageConfig = (
  overrides: Partial<CreateWaveOutcomeConfigWinnersConfig> = {}
): CreateWaveOutcomeConfigWinnersConfig => ({
  creditValueType: CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE,
  totalAmount: 100,
  winners: [{ value: 60 }, { value: 40 }],
  ...overrides,
});

const renderWinners = (
  winnersConfig: CreateWaveOutcomeConfigWinnersConfig,
  overrides: Partial<
    React.ComponentProps<typeof CreateWaveOutcomesWinners>
  > = {}
) => {
  const setWinnersConfig = jest.fn();
  const view = render(
    <CreateWaveOutcomesWinners
      winnersConfig={winnersConfig}
      totalValueError={false}
      percentageError={false}
      outcomeType={CreateWaveOutcomeType.REP}
      setWinnersConfig={setWinnersConfig}
      {...overrides}
    />
  );
  return { setWinnersConfig, ...view };
};

describe('CreateWaveOutcomesWinners', () => {
  it('updates winners when add button clicked', async () => {
    const { setWinnersConfig } = renderWinners(absoluteConfig());
    setWinnersConfig.mockClear();

    await userEvent.click(screen.getByText('add'));

    expect(setWinnersConfig).toHaveBeenCalledWith(
      expect.objectContaining({ winners: [{ value: 1 }, { value: 0 }] })
    );
  });

  it('replaces the winners list when a row edit comes back up', async () => {
    const { setWinnersConfig } = renderWinners(absoluteConfig());
    setWinnersConfig.mockClear();

    await userEvent.click(
      screen.getByRole('button', { name: 'replace-winners' })
    );

    expect(setWinnersConfig).toHaveBeenCalledWith(
      expect.objectContaining({ winners: [{ value: 9 }] })
    );
  });

  it('derives the absolute total from the sum of winner values on mount', () => {
    const { setWinnersConfig } = renderWinners(
      absoluteConfig({ winners: [{ value: 3 }, { value: 4 }] })
    );

    expect(setWinnersConfig).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: 7 })
    );
  });

  it('keeps the entered total for percentage credit instead of summing winners', () => {
    const { setWinnersConfig } = renderWinners(
      percentageConfig({ totalAmount: 100, winners: [{ value: 60 }] })
    );

    expect(setWinnersConfig).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: 100 })
    );
  });

  it('shows no total amount field for absolute credit', () => {
    renderWinners(absoluteConfig());

    expect(screen.queryByLabelText('Total Amount')).not.toBeInTheDocument();
  });

  it('shows the total amount field with the outcome type suffix for percentage credit', () => {
    renderWinners(percentageConfig(), {
      outcomeType: CreateWaveOutcomeType.NIC,
    });

    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('NIC')).toBeInTheDocument();
  });

  it.each([
    [CreateWaveOutcomeType.MANUAL, 'Manual'],
    [CreateWaveOutcomeType.REP, 'Rep'],
    [CreateWaveOutcomeType.NIC, 'NIC'],
  ])('labels the %s outcome type as %s', (outcomeType, label) => {
    renderWinners(percentageConfig(), { outcomeType });

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('writes a parsed total amount up on change', async () => {
    const { setWinnersConfig } = renderWinners(
      percentageConfig({ totalAmount: 0 })
    );
    setWinnersConfig.mockClear();

    await userEvent.type(screen.getByDisplayValue('0'), '5');

    expect(setWinnersConfig).toHaveBeenLastCalledWith(
      expect.objectContaining({ totalAmount: 5 })
    );
  });

  it('falls back to zero when the total amount is cleared', async () => {
    const { setWinnersConfig } = renderWinners(
      percentageConfig({ totalAmount: 100 })
    );
    setWinnersConfig.mockClear();

    await userEvent.clear(screen.getByDisplayValue('100'));

    expect(setWinnersConfig).toHaveBeenLastCalledWith(
      expect.objectContaining({ totalAmount: 0 })
    );
  });

  it('renders no error banner when both error flags are clear', () => {
    renderWinners(absoluteConfig());

    expect(
      screen.queryByText('Total amount must be higher than 0')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Total percentage must be 100%')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('rows')).toHaveAttribute('data-is-error', 'false');
  });

  it('shows the total value error and forwards it to the rows for absolute credit', () => {
    renderWinners(absoluteConfig(), { totalValueError: true });

    expect(
      screen.getByText('Total amount must be higher than 0')
    ).toBeInTheDocument();
    expect(screen.getByTestId('rows')).toHaveAttribute('data-is-error', 'true');
  });

  it('shows the percentage error and forwards it to the rows for percentage credit', () => {
    renderWinners(percentageConfig(), { percentageError: true });

    expect(
      screen.getByText('Total percentage must be 100%')
    ).toBeInTheDocument();
    expect(screen.getByTestId('rows')).toHaveAttribute('data-is-error', 'true');
  });

  it('ignores the percentage error for absolute credit rows', () => {
    renderWinners(absoluteConfig(), { percentageError: true });

    expect(
      screen.getByText('Total percentage must be 100%')
    ).toBeInTheDocument();
    expect(screen.getByTestId('rows')).toHaveAttribute('data-is-error', 'false');
  });

  it('ignores the total value error for percentage credit rows', () => {
    renderWinners(percentageConfig(), { totalValueError: true });

    expect(
      screen.getByText('Total amount must be higher than 0')
    ).toBeInTheDocument();
    expect(screen.getByTestId('rows')).toHaveAttribute('data-is-error', 'false');
  });

  it('passes the credit value type and outcome type down to the rows', () => {
    renderWinners(percentageConfig(), {
      outcomeType: CreateWaveOutcomeType.MANUAL,
    });

    const rows = screen.getByTestId('rows');
    expect(rows).toHaveAttribute(
      'data-credit-value-type',
      CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE
    );
    expect(rows).toHaveAttribute(
      'data-outcome-type',
      CreateWaveOutcomeType.MANUAL
    );
  });
});
