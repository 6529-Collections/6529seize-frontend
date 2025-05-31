import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Rememes, { RememeSort } from '../../../components/rememes/Rememes';
import { fetchUrl } from '../../../services/6529api';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../services/6529api');
jest.mock('../../../components/nft-image/RememeImage', () => () => <div data-testid="img" />);
jest.mock('../../../components/pagination/Pagination', () => (props: any) => <div data-testid="pagination" onClick={() => props.setPage(2)} />);
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (props: any) => <svg data-testid="icon" onClick={props.onClick} /> }));
jest.mock('next/image', () => ({ __esModule: true, default: (p:any) => <img {...p} /> }));
jest.mock('@tippyjs/react', () => (props: any) => <span>{props.children}</span>);
jest.mock('../../../components/lfg-slideshow/LFGSlideshow', () => ({ LFGButton: () => <div /> }));

const routerPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ query: {}, pathname: '/rememes', push: routerPush });

(fetchUrl as jest.Mock).mockImplementation((url: string) => {
  if (url.includes('memes_lite')) return Promise.resolve({ data: [] });
  return Promise.resolve({ count: 1, data: [{ contract: '0x', id: 1, metadata: {}, contract_opensea_data: {}, replicas: [], image: '' }] });
});

describe('Rememes component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_ENDPOINT = "http://api";
    global.fetch = jest.fn(() => Promise.resolve({ json: () => ({}) } as any));
  });

  it('fetches rememes and changes sorting', async () => {
    render(<Rememes />);
    await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
    expect(fetchUrl).toHaveBeenCalledWith('http://api/api/rememes?page_size=40&page=1');
    await screen.findByText("Sort: Random");
    await userEvent.click(screen.getByText("Sort: Random"));
    await userEvent.click(screen.getByText(RememeSort.CREATED_ASC));
    await waitFor(() => expect(fetchUrl).toHaveBeenLastCalledWith('http://api/api/rememes?page_size=40&page=1&sort=created_at&sort_direction=desc'));
  });
});
