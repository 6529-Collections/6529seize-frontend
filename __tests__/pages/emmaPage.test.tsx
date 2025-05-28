import React from 'react';
import { render, screen } from '@testing-library/react';
import DistributionPlanTool from '../../pages/emma/index';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('EMMA page', () => {
  it('renders dynamic wrapper placeholder', () => {
    render(<DistributionPlanTool />);
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  it('exports metadata', () => {
    expect(DistributionPlanTool.metadata).toEqual({ title: 'EMMA', description: 'Tools' });
  });
});
