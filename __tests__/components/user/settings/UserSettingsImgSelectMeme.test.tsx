import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserSettingsImgSelectMeme, { MemeLite } from '@/components/user/settings/UserSettingsImgSelectMeme';

describe('UserSettingsImgSelectMeme', () => {
  const memes: MemeLite[] = [
    { id: 1, name: 'First', animation: null, contract: '', icon: null, image: null, scaled: null, thumbnail: null, artist: null } as unknown as MemeLite,
    { id: 2, name: 'Second', animation: null, contract: '', icon: null, image: null, scaled: null, thumbnail: null, artist: null } as unknown as MemeLite,
  ];

  it('filters memes and selects one', async () => {
    const onMeme = jest.fn();
    render(<UserSettingsImgSelectMeme memes={memes} onMeme={onMeme} />);
    const input = screen.getByPlaceholderText('Search');
    await userEvent.click(input);
    await userEvent.type(input, 'Second');
    const option = await screen.findByText('#2 Second');
    await userEvent.click(option);
    expect(onMeme).toHaveBeenCalledWith(memes[1]);
  });
});
