import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArtworkDetails from '@/components/waves/memes/submission/details/ArtworkDetails';

describe('ArtworkDetails', () => {
  it('calls blur handlers when values change', async () => {
    const user = userEvent.setup();
    const onTitleChange = jest.fn();
    const onDescriptionChange = jest.fn();
    const onTitleBlur = jest.fn();
    const onDescriptionBlur = jest.fn();
    render(
      <ArtworkDetails
        title="old"
        description="desc"
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
        onTitleBlur={onTitleBlur}
        onDescriptionBlur={onDescriptionBlur}
      />
    );
    const title = screen.getByLabelText('Artwork Title');
    const desc = screen.getByLabelText('Description');
    await user.clear(title);
    await user.type(title, 'new');
    await user.tab();
    expect(onTitleChange).toHaveBeenCalledWith('new');
    expect(onTitleBlur).toHaveBeenCalled();
    await user.clear(desc);
    await user.type(desc, 'text');
    await user.tab();
    expect(onDescriptionChange).toHaveBeenCalledWith('text');
    expect(onDescriptionBlur).toHaveBeenCalled();
  });

  it('syncs input values when props change', () => {
    const { rerender } = render(
      <ArtworkDetails title="one" description="two" onTitleChange={() => {}} onDescriptionChange={() => {}} />
    );
    const title = screen.getByLabelText('Artwork Title') as HTMLInputElement;
    expect(title.value).toBe('one');
    rerender(
      <ArtworkDetails title="three" description="two" onTitleChange={() => {}} onDescriptionChange={() => {}} />
    );
    expect(title.value).toBe('three');
  });
});
