import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoundedJsonIconButton from '@/components/distribution-plan-tool/common/RoundedJsonIconButton';

jest.mock('@/components/distribution-plan-tool/common/JsonIcon', () => () => <svg data-testid="json-icon" />);
jest.mock('@/components/distribution-plan-tool/common/CircleLoader', () => () => <div data-testid="loader" />);

describe('RoundedJsonIconButton', () => {
  it('renders json icon when not loading and handles click', async () => {
    const onClick = jest.fn();
    render(<RoundedJsonIconButton loading={false} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByTestId('json-icon')).toBeInTheDocument();
  });

  it('shows loader when loading', () => {
    render(<RoundedJsonIconButton loading={true} onClick={() => {}} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });
});
