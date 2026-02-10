import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BuildPhaseFormConfigModalTitle from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/BuildPhaseFormConfigModalTitle';

function renderWithParent(onClose: jest.Mock, onParentClick: jest.Mock) {
  return render(
    <div onClick={onParentClick} data-testid="parent">
      <BuildPhaseFormConfigModalTitle title="Modal Title" onClose={onClose} />
    </div>
  );
}

describe('BuildPhaseFormConfigModalTitle', () => {
  it('renders provided title', () => {
    render(<BuildPhaseFormConfigModalTitle title="My Title" onClose={jest.fn()} />);
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onClose and stops propagation when button clicked', () => {
    const onClose = jest.fn();
    const onParentClick = jest.fn();
    renderWithParent(onClose, onParentClick);

    const btn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(btn);

    expect(onClose).toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
