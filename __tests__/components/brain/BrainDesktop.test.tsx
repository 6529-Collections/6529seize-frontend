import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../components/brain/left-sidebar/BrainLeftSidebar', () => ({ __esModule:true, default: () => <div data-testid="left"/> }));
const rightMock = jest.fn(() => <div data-testid="right"/>);
jest.mock('../../../components/brain/right-sidebar/BrainRightSidebar', () => ({ __esModule:true, default: rightMock, SidebarTab:{ ABOUT: 'ABOUT' } }));
jest.mock('../../../components/brain/BrainDesktopDrop', () => jest.fn(({ onClose }) => <div data-testid="drop" onClick={onClose}/>));
jest.mock('../../../components/brain/ContentTabContext', () => ({ ContentTabProvider: ({children}:any) => <div>{children}</div> }));
jest.mock('../../../components/brain/my-stream/layout/LayoutContext', () => ({ useLayout: () => ({ contentContainerStyle:{} }) }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn(), keepPreviousData:{} }));

import BrainDesktop from '../../../components/brain/BrainDesktop';

const mockedRouter = useRouter as jest.Mock;
const mockedUseQuery = useQuery as jest.Mock;
const mockedDrop = require('../../../components/brain/BrainDesktopDrop');

function setup(query:any){
  const push = jest.fn();
  mockedRouter.mockReturnValue({ query, push, pathname:'/brain' });
  mockedUseQuery.mockReturnValue({ data: query.drop ? { id: query.drop } : null });
  rightMock.mockClear();
  (mockedDrop as jest.Mock).mockClear();
  return { push, ...render(<BrainDesktop>child</BrainDesktop>) };
}

describe('BrainDesktop', () => {
  it('shows right sidebar when wave present', () => {
    setup({ wave:'1' });
    expect(screen.getByTestId('right')).toBeInTheDocument();
    expect(screen.queryByTestId('drop')).toBeNull();
  });

  it('shows drop overlay when drop param set', () => {
    setup({ wave:'1', drop:'d1' });
    expect(screen.getByTestId('drop')).toBeInTheDocument();
    expect(screen.queryByTestId('right')).toBeNull();
  });

  it('removes drop param on close', () => {
    const { push } = setup({ wave:'1', drop:'d1' });
    screen.getByTestId('drop').click();
    expect(push).toHaveBeenCalledWith({ pathname:'/brain', query:{ wave:'1' } }, undefined, { shallow:true });
  });

  it('handles drop click from sidebar', () => {
    const { push } = setup({ wave:'1' });
    const call = (rightMock.mock.calls[0] as any)[0];
    call.onDropClick({ id:'new' });
    expect(push).toHaveBeenCalledWith({ pathname:'/brain', query:{ wave:'1', drop:'new' } }, undefined, { shallow:true });
  });
});
