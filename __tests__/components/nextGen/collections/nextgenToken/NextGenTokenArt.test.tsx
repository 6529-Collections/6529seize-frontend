import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenTokenArt from '../../../../../components/nextGen/collections/nextgenToken/NextGenTokenArt';
import { get16KUrl } from '../../../../../components/nextGen/collections/nextgenToken/NextGenTokenImage';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  const RB: any = {
    Container: (p:any)=> <div {...p} />,
    Row: (p:any)=> <div {...p} />,
    Col: (p:any)=> <div {...p} />,
  };
  const Dropdown: any = (p:any)=> <div {...p}/>;
  Dropdown.Toggle = (p:any)=> <button {...p}/>;
  Dropdown.Menu = (p:any)=> <div {...p}/>;
  RB.Dropdown = Dropdown;
  return RB;
});

jest.mock('../../../../../components/nextGen/collections/nextgenToken/NextGenTokenImage', () => ({
  NextGenTokenImage: ({ onClick }: any) => (
    <img data-testid="token-image" onClick={onClick} />
  ),
  get16KUrl: jest.fn((id:number)=>`https://test/16k/${id}`),
  get8KUrl: jest.fn((id:number)=>`https://test/8k/${id}`)
}));

jest.mock('../../../../../components/nextGen/collections/nextgenToken/NextGenZoomableImage', () => ({
  __esModule: true,
  default: (props:any) => {
    const React = require('react');
    React.useEffect(()=>{ props.onImageLoaded(); },[]);
    return <img data-testid="zoom" />;
  }
}));

jest.mock('../../../../../components/nextGen/collections/nextgenToken/Lightbulb', () => (props:any) => <span data-testid={`light-${props.mode}`} onClick={props.onClick}/>);

jest.mock('../../../../../components/nextGen/collections/nextgenToken/NextGenTokenDownload', () => ({
  NextGenTokenDownloadDropdownItem: (props:any) => <div data-testid={`download-${props.resolution}`}/>,
  Resolution: { '0.5K':'0.5K', Thumbnail:'Thumbnail', '2K':'2K', '16K':'16K' }
}));

jest.mock('../../../../../hooks/isMobileDevice', () => ({ __esModule: true, default: jest.fn(()=>false) }));
jest.mock('../../../../../hooks/isMobileScreen', () => ({ __esModule: true, default: jest.fn(()=>false) }));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props:any) => <svg data-testid={props.icon.iconName} onClick={props.onClick} />
}));

const token = { id:7, image_url:'img', animation_url:'anim' } as any;
const collection = {} as any;

function renderComponent(){
  return render(<NextGenTokenArt token={token} collection={collection}/>);
}

describe('NextGenTokenArt', () => {
  beforeEach(()=> jest.clearAllMocks());

  it('opens image link by default', async () => {
    const open = jest.fn();
    const orig = window.open;
    // @ts-ignore
    window.open = open;
    renderComponent();
    await userEvent.click(screen.getByTestId('arrow-up-right-from-square'));
    expect(open).toHaveBeenCalledWith('img', '_blank');
    window.open = orig;
  });

  it('opens high res link and adjusts zoom', async () => {
    const open = jest.fn();
    // @ts-ignore
    window.open = open;
    renderComponent();
    await userEvent.click(screen.getByText('16K'));
    await screen.findByTestId('zoom');
    await userEvent.click(screen.getByTestId('arrow-up-right-from-square'));
    expect(open).toHaveBeenCalledWith('https://test/16k/7', '_blank');
    window.open = undefined as any;
  });

  it('opens animation link when live mode selected', async () => {
    const open = jest.fn();
    // @ts-ignore
    window.open = open;
    renderComponent();
    await userEvent.click(screen.getByTestId('circle-play'));
    await userEvent.click(screen.getByTestId('arrow-up-right-from-square'));
    expect(open).toHaveBeenCalledWith('anim', '_blank');
    window.open = undefined as any;
  });
});

