import React from 'react';
import { render, screen } from '@testing-library/react';
import DistributionPlanTool from '../../pages/emma/index';

jest.mock('next/dynamic', () => () => ({ children }: any) => <div data-testid="wrapper">{children}</div>);
jest.mock('../../components/distribution-plan-tool/connect/distributipn-plan-tool-connect', () => () => <div data-testid="connect" />);

describe('EMMA page', () => {
  it('renders wrapper and connect components', () => {
    render(<DistributionPlanTool />);
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('connect')).toBeInTheDocument();
    expect(screen.getByText(/Meet EMMA/i)).toBeInTheDocument();
  });

  it('exports metadata', () => {
    expect(DistributionPlanTool.metadata).toEqual({ title: 'EMMA', description: 'Tools' });
  });
});
