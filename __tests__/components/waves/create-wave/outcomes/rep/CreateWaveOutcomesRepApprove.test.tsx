import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesRepApprove from '@/components/waves/create-wave/outcomes/rep/CreateWaveOutcomesRepApprove';
import { ApiWaveType } from '@/generated/models/ApiWaveType';

jest.mock('@/components/utils/input/rep-category/RepCategorySearch', () => {
  return function RepCategorySearch({ category, setCategory }: any) {
    return <input data-testid="category" value={category || ''} onChange={e => setCategory(e.target.value)} />;
  };
});

jest.mock('@/components/utils/button/PrimaryButton', () => {
  return function PrimaryButton({ onClicked, children }: any) {
    return <button onClick={onClicked}>{children}</button>;
  };
});

describe('CreateWaveOutcomesRepApprove', () => {
  const onOutcome = jest.fn();
  const onCancel = jest.fn();

  const setup = async () => {
    const user = userEvent.setup();
    render(
      <CreateWaveOutcomesRepApprove
        waveType={ApiWaveType.Approve}
        dates={{} as any}
        onOutcome={onOutcome}
        onCancel={onCancel}
      />
    );
    const categoryInput = screen.getByTestId('category');
    const creditInput = screen.getByLabelText('Rep');
    const maxWinnersInput = screen.getByLabelText('Max Winners');
    const saveButton = screen.getByText('Save');
    return { user, categoryInput, creditInput, maxWinnersInput, saveButton };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onOutcome with entered values', async () => {
    const { user, categoryInput, creditInput, maxWinnersInput, saveButton } = await setup();

    await user.type(categoryInput, 'cat');
    await user.type(creditInput, '5');
    await user.type(maxWinnersInput, '3');
    await user.click(saveButton);

    expect(onOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'cat', credit: 5, maxWinners: 3 })
    );
  });

  it('shows errors when required fields missing', async () => {
    const { user, saveButton } = await setup();

    await user.click(saveButton);
    expect(onOutcome).not.toHaveBeenCalled();
    expect(screen.getByText('Rep must be a positive number')).toBeInTheDocument();
  });
});
