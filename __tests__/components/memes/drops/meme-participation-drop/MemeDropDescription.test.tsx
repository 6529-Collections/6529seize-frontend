import { render } from '@testing-library/react';
import React from 'react';
import MemeDropDescription from '../../../../../components/memes/drops/meme-participation-drop/MemeDropDescription';

test('renders provided description', () => {
  const { getByText } = render(<MemeDropDescription description="hello" />);
  expect(getByText('hello')).toBeInTheDocument();
});
