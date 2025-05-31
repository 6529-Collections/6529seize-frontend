import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import RoundedManifoldIconButton from '../../../../components/distribution-plan-tool/common/RoundedManifoldIconButton';

jest.mock('../../../../components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

jest.mock('../../../../components/distribution-plan-tool/common/ManifoldIcon', () => ({
  __esModule: true,
  default: () => <div data-testid="icon" />,
}));

describe('RoundedManifoldIconButton', () => {
  it('renders loader when loading and handles click', () => {
    const onClick = jest.fn();
    render(<RoundedManifoldIconButton loading={true} onClick={onClick} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows icon when not loading', () => {
    render(<RoundedManifoldIconButton loading={false} onClick={() => {}} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
