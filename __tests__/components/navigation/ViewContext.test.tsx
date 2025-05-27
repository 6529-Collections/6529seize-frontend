import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { ViewProvider, useViewContext } from '../../../components/navigation/ViewContext';
import { useRouter } from 'next/router';
import { commonApiFetch } from '../../../services/api/common-api';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../services/api/common-api', () => ({ commonApiFetch: jest.fn() }));

const push = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ query: {}, push, pathname: '/my-stream', asPath: '/my-stream' });
});

describe('ViewContext', () => {
  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useViewContext())).toThrow('useViewContext must be used within a ViewProvider');
  });

  it('handles route navigation', () => {
    function Test() {
      const { handleNavClick } = useViewContext();
      React.useEffect(() => {
        handleNavClick({ kind: 'route', name: 'Home', href: '/home', icon: 'h' });
      }, []);
      return null;
    }
    render(
      <ViewProvider>
        <Test />
      </ViewProvider>
    );
    expect(push).toHaveBeenCalledWith('/home', undefined, { shallow: true });
  });

  it('navigates to waves view when no last visited wave', () => {
    function Test() {
      const { handleNavClick, hardBack } = useViewContext();
      React.useEffect(() => {
        handleNavClick({ kind: 'view', name: 'Waves', viewKey: 'waves', icon: 'w' });
        hardBack('waves');
      }, []);
      return null;
    }
    render(
      <ViewProvider>
        <Test />
      </ViewProvider>
    );
    expect(push).toHaveBeenCalledWith('/my-stream?view=waves', undefined, { shallow: true });
    expect(push).toHaveBeenLastCalledWith('/my-stream?view=waves', undefined, { shallow: true });
  });
});
