import { render } from '@testing-library/react';
import React from 'react';
import DropListItemContentMediaAudio from '../../../../../../../components/drops/view/item/content/media/DropListItemContentMediaAudio';

describe('DropListItemContentMediaAudio', () => {
  it('renders audio source', () => {
    const { container } = render(<DropListItemContentMediaAudio src="file.mp3" />);
    const source = container.querySelector('source') as HTMLSourceElement;
    expect(source).toHaveAttribute('src', 'file.mp3');
    expect(source).toHaveAttribute('type', 'audio/mpeg');
  });
});
