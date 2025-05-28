import { render, screen } from '@testing-library/react';
import React from 'react';
import Seize404 from '../../pages/404';
import DisputeResolution from '../../pages/dispute-resolution';
import GradientsPage from '../../pages/6529-gradient';
import PlansPage from '../../pages/emma/plans';
import MemeLabCollectionPage from '../../pages/meme-lab/collection/[collection]';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);
jest.mock('../../components/6529Gradient/6529Gradient', () => () => <div data-testid="gradient" />);
jest.mock('../../components/memelab/MemeLabCollection', () => () => <div data-testid="collection" />);
jest.mock('../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper', () => ({ children }: any) => <div data-testid="wrapper">{children}</div>);
jest.mock('../../components/distribution-plan-tool/plans/DistributionPlanToolPlans', () => () => <div data-testid="plans" />);
jest.mock('../../components/distribution-plan-tool/create-plan/DistributionPlanToolCreatePlan', () => () => <div data-testid="create" />);

const TestProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>{children}</AuthContext.Provider>
);

describe('additional static pages', () => {
  it('renders 404 page', () => {
    render(<TestProvider><Seize404 /></TestProvider>);
    expect(screen.getByText(/404 \| PAGE NOT FOUND/i)).toBeInTheDocument();
  });

  it('renders dispute resolution page', () => {
    render(<TestProvider><DisputeResolution /></TestProvider>);
    expect(screen.getByText(/Dispute Resolution/i)).toBeInTheDocument();
  });

  it('renders gradients page with dynamic component', () => {
    render(<TestProvider><GradientsPage /></TestProvider>);
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  it('renders EMMA plans page', () => {
    render(<TestProvider><PlansPage /></TestProvider>);
    expect(screen.getByText(/EMMA/i)).toBeInTheDocument();
  });

  it('renders meme lab collection page', () => {
    render(
      <TestProvider>
        <MemeLabCollectionPage pageProps={{ name: 'Test Collection' }} />
      </TestProvider>
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });
});
