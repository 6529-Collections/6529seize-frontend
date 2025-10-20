import { render, screen } from '@testing-library/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

jest.mock('next/navigation', () => ({ 
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn()
}));
jest.mock('@/components/brain/left-sidebar/BrainLeftSidebar', () => ({ __esModule:true, default: () => <div data-testid="left"/> }));
const rightMock = jest.fn(() => <div data-testid="right"/>);
jest.mock('@/components/brain/right-sidebar/BrainRightSidebar', () => ({ __esModule:true, default: rightMock, SidebarTab:{ ABOUT: 'ABOUT' } }));
jest.mock('@/components/brain/BrainDesktopDrop', () => jest.fn(({ onClose }) => <div data-testid="drop" onClick={onClose}/>));
jest.mock('@/components/brain/ContentTabContext', () => ({ ContentTabProvider: ({children}:any) => <div>{children}</div> }));
jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({ useLayout: () => ({ contentContainerStyle:{} }) }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn(), keepPreviousData:{} }));
jest.mock('@/hooks/useSidebarState', () => ({
  __esModule: true,
  useSidebarState: jest.fn()
}));

import BrainDesktop from '@/components/brain/BrainDesktop';
import { useSidebarState } from '@/hooks/useSidebarState';

const mockedRouter = useRouter as jest.Mock;
const mockedUseSearchParams = useSearchParams as jest.Mock;
const mockedUsePathname = usePathname as jest.Mock;
const mockedUseQuery = useQuery as jest.Mock;
const mockedDrop = require('@/components/brain/BrainDesktopDrop');
const mockedUseSidebarState = useSidebarState as jest.Mock;

function setup(query:any, options?: { sidebarOpen?: boolean }) {
  const push = jest.fn();
  const searchParams = {
    get: jest.fn((key:string) => query[key] || null),
    toString: jest.fn(() => {
      const params = new URLSearchParams();
      Object.keys(query).forEach(key => {
        if (query[key]) params.set(key, query[key]);
      });
      return params.toString();
    })
  };
  mockedRouter.mockReturnValue({ push });
  mockedUseSearchParams.mockReturnValue(searchParams);
  mockedUsePathname.mockReturnValue('/brain');
  mockedUseQuery.mockReturnValue({ data: query.drop ? { id: query.drop } : null });
  rightMock.mockClear();
  (mockedDrop as jest.Mock).mockClear();
  mockedUseSidebarState.mockReturnValue({
    isRightSidebarOpen: options?.sidebarOpen ?? true,
    closeRightSidebar: jest.fn(),
    openRightSidebar: jest.fn(),
    toggleRightSidebar: jest.fn()
  });
  return { push, searchParams, ...render(<BrainDesktop>child</BrainDesktop>) };
}

describe('BrainDesktop', () => {
  it('shows right sidebar when wave present', () => {
    setup({ wave:'1' }, { sidebarOpen: true });
    expect(screen.getByTestId('right')).toBeInTheDocument();
    expect(screen.queryByTestId('drop')).toBeNull();
  });

  it('does not show right sidebar when closed', () => {
    setup({ wave:'1' }, { sidebarOpen: false });
    expect(screen.queryByTestId('right')).toBeNull();
  });

  it('shows drop overlay when drop param set', () => {
    setup({ wave:'1', drop:'d1' }, { sidebarOpen: true });
    expect(screen.getByTestId('drop')).toBeInTheDocument();
    expect(screen.queryByTestId('right')).toBeNull();
  });

  it('removes drop param on close', () => {
    const { push } = setup({ wave:'1', drop:'d1' }, { sidebarOpen: true });
    screen.getByTestId('drop').click();
    expect(push).toHaveBeenCalledWith('/brain?wave=1', { scroll: false });
  });

  it('handles drop click from sidebar', () => {
    const { push } = setup({ wave:'1' }, { sidebarOpen: true });
    const call = (rightMock.mock.calls[0] as any)[0];
    call.onDropClick({ id:'new' });
    expect(push).toHaveBeenCalledWith('/brain?wave=1&drop=new', { scroll: false });
  });
});
