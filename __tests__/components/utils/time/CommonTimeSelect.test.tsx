import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CommonTimeSelect from '@/components/utils/time/CommonTimeSelect';

jest.mock('@/components/utils/input/CommonInput', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <input data-testid="input" value={value} onChange={e => onChange(e.target.value)} />
  )
}));

jest.mock('@/components/utils/select/dropdown/CommonDropdown', () => ({
  __esModule: true,
  default: ({ items, activeItem, setSelected }: any) => (
    <select data-testid="dropdown" value={activeItem} onChange={e => setSelected(e.target.value)}>
      {items.map((i: any) => (
        <option key={i.key} value={i.value}>{i.label}</option>
      ))}
    </select>
  )
}));

describe('CommonTimeSelect', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes value from currentTime', () => {
    const onMillis = jest.fn();
    const currentTime = Date.now() + 3 * 3600 * 1000;
    render(<CommonTimeSelect currentTime={currentTime} onMillis={onMillis} />);
    expect((screen.getByTestId('input') as HTMLInputElement).value).toBe('3');
    expect(onMillis).toHaveBeenCalled();
  });

  it('updates millis when value and mode change', () => {
    const onMillis = jest.fn();
    render(<CommonTimeSelect currentTime={null} onMillis={onMillis} />);

    fireEvent.change(screen.getByTestId('input'), { target: { value: '2' } });
    expect(onMillis).toHaveBeenLastCalledWith(Date.now() + 2 * 3600 * 1000);

    fireEvent.change(screen.getByTestId('dropdown'), { target: { value: 'DAYS' } });
    fireEvent.change(screen.getByTestId('input'), { target: { value: '1' } });
    expect(onMillis).toHaveBeenLastCalledWith(Date.now() + 24 * 3600 * 1000);
  });

  it('shows inline expiration', () => {
    render(<CommonTimeSelect currentTime={null} onMillis={jest.fn()} inline />);
    expect(screen.getByText('Expires At:')).toBeInTheDocument();
  });
});
