import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComponentRandomHoldersWeight, { ComponentRandomHoldersWeightType } from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/utils/ComponentRandomHoldersWeight';

jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/utils/ComponentRandomHoldersWeightItem', () => ({
  __esModule: true,
  default: ({ item, onChange }: any) => <button onClick={() => onChange(item.itemType)}>{item.name}</button>,
}));

describe('ComponentRandomHoldersWeight', () => {
  it('renders items and triggers onChange', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<ComponentRandomHoldersWeight selected={ComponentRandomHoldersWeightType.OFF} onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map(b => b.textContent)).toEqual(['Off', 'Total cards', 'Unique cards']);
    await user.click(screen.getByText('Unique cards'));
    expect(onChange).toHaveBeenCalledWith(ComponentRandomHoldersWeightType.UNIQUE_CARDS);
  });
});
