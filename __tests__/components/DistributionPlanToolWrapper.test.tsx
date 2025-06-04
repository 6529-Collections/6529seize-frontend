import { render, act } from '@testing-library/react';
import DistributionPlanToolWrapper from '../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper';
import { AuthContext } from '../../components/auth/Auth';
import { useSeizeConnectContext } from '../../components/auth/SeizeConnectContext';
import { useRouter } from 'next/router';
import { Poppins } from 'next/font/google';

jest.mock('next/font/google', () => ({ Poppins: () => ({ className: 'poppins' }) }));
jest.mock('../../components/auth/SeizeConnectContext');
jest.mock('next/router', () => ({ useRouter: jest.fn() }));

const useSeizeConnectContextMock = useSeizeConnectContext as jest.MockedFunction<typeof useSeizeConnectContext>;
const useRouterMock = useRouter as jest.Mock;

describe('DistributionPlanToolWrapper', () => {
  it('sets title on mount and navigates on address change', () => {
    const setTitle = jest.fn();
    const push = jest.fn();
    useRouterMock.mockReturnValue({ push, pathname: '/' });
    useSeizeConnectContextMock.mockReturnValue({ address: undefined } as any);

    const { rerender } = render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <DistributionPlanToolWrapper>
          <div>child</div>
        </DistributionPlanToolWrapper>
      </AuthContext.Provider>
    );

    expect(setTitle).toHaveBeenCalledWith({ title: 'EMMA | Tools' });
    expect(push).not.toHaveBeenCalled();

    useSeizeConnectContextMock.mockReturnValue({ address: '0x1' } as any);
    act(() => {
      rerender(
        <AuthContext.Provider value={{ setTitle } as any}>
          <DistributionPlanToolWrapper>
            <div>child</div>
          </DistributionPlanToolWrapper>
        </AuthContext.Provider>
      );
    });

    expect(push).toHaveBeenCalledWith('/emma');
  });
});
