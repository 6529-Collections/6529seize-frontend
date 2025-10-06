import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenTokenRenderCenter from '@/components/nextGen/collections/nextgenToken/NextGenTokenRenderCenter';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  const RB: any = {
    Container: (p: any) => <div {...p} />,
    Row: (p: any) => <div {...p} />,
    Col: (p: any) => <div {...p} />,
  };
  const Dropdown: any = (p: any) => <div {...p} />;
  Dropdown.Toggle = (p: any) => <button {...p}>{p.children}</button>;
  Dropdown.Menu = (p: any) => <div {...p} />;
  Dropdown.Item = (p: any) => <button {...p}>{p.children}</button>;
  RB.Dropdown = Dropdown;
  return RB;
});

jest.mock('@/components/nextGen/collections/nextgenToken/NextGenTokenDownload', () => ({
  __esModule: true,
  default: () => <div data-testid="download" />,
  Resolution: { '1K':'1K','2K':'2K','4K':'4K','8K':'8K','16K':'16K','0.5K':'0.5K', Thumbnail:'Thumbnail' }
}));

jest.mock('@/helpers/AllowlistToolHelpers', () => ({ getRandomObjectId: () => 'id' }));

jest.mock('@/helpers/Helpers', () => ({ numberWithCommas: (n:number) => n.toString() }));

const token = { id: 42 } as any;

function setup() {
  return render(<NextGenTokenRenderCenter token={token} />);
}

describe('NextGenTokenRenderCenter', () => {
  it('opens generator with default options', async () => {
    const open = jest.fn();
    const orig = window.open;
    // @ts-ignore
    window.open = open;
    setup();
    await userEvent.click(screen.getByText('GO!'));
    expect(open).toHaveBeenCalledWith('https://generator.6529.io/mainnet/html/42', '_blank');
    window.open = orig;
  });

  it('passes selected options to generator url', async () => {
    const open = jest.fn();
    // @ts-ignore
    window.open = open;
    setup();
    await userEvent.click(screen.getByText('Static'));
    await userEvent.click(screen.getByText('OG'));
    const input = screen.getByPlaceholderText('enter height');
    await userEvent.type(input, '400');
    await userEvent.click(screen.getByText('GO!'));
    expect(open).toHaveBeenCalledWith(
      'https://generator.6529.io/mainnet/html/42?render_static=true&render_og=true&height=400',
      '_blank'
    );
    window.open = undefined as any;
  });
});
