import React from 'react';
import { render, screen } from '@testing-library/react';
import DistributionPlanAddOperationBtn from '../../../../components/distribution-plan-tool/common/DistributionPlanAddOperationBtn';

// helper to render component
function renderBtn(loading: boolean) {
  render(
    <DistributionPlanAddOperationBtn loading={loading}>Add</DistributionPlanAddOperationBtn>
  );
}

describe('DistributionPlanAddOperationBtn', () => {
  it('shows children and no spinner when not loading', () => {
    renderBtn(false);
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(screen.getByText('Add')).toBeVisible();
    // spinner should not be in the document
    expect(button.querySelector('svg')).toBeNull();
  });

  it('disables button and shows spinner when loading', () => {
    renderBtn(true);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    const spinner = button.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    // children container should be hidden via style
    const textDiv = screen.getByText('Add');
    expect(textDiv).toHaveAttribute('style', 'visibility: hidden;');
  });
});
