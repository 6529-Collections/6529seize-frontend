import { render, screen, fireEvent } from '@testing-library/react';
import { DropdownTrait } from 'components/waves/memes/traits/DropdownTrait';

jest.mock('components/waves/memes/traits/TraitWrapper', () => ({
  TraitWrapper: ({ children }: any) => <div data-testid="wrapper">{children}</div>
}));

describe('DropdownTrait', () => {
  const traits = { rarity: 'Common' } as any;
  const options = ['Common', 'Rare'];

  it('updates value on change and blur', () => {
    const updateText = jest.fn();
    const onBlur = jest.fn();
    render(
      <DropdownTrait label="Rarity" field="rarity" traits={traits} updateText={updateText} options={options} onBlur={onBlur} />
    );
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Rare' } });
    expect(updateText).toHaveBeenCalledWith('rarity', 'Rare');
    fireEvent.blur(select);
    expect(onBlur).toHaveBeenCalledWith('rarity');
  });

  it('syncs when traits change', () => {
    const { rerender } = render(
      <DropdownTrait label="Rarity" field="rarity" traits={traits} updateText={jest.fn()} options={options} />
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('Common');
    rerender(
      <DropdownTrait label="Rarity" field="rarity" traits={{ rarity: 'Rare' } as any} updateText={jest.fn()} options={options} />
    );
    expect(select.value).toBe('Rare');
  });
});
