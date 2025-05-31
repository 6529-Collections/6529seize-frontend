import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveDropTime from '../../../../../components/waves/drops/time/WaveDropTime';

function renderWithTime(ts: number) {
  render(<WaveDropTime timestamp={ts} />);
}

test('shows time for today', () => {
  const now = Date.now();
  renderWithTime(now);
  const expected = new Date(now).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
  expect(screen.getByText(expected)).toBeInTheDocument();
});

test('shows yesterday prefix', () => {
  const now = Date.now();
  const yesterday = now - 24*60*60*1000;
  renderWithTime(yesterday);
  const timeStr = new Date(yesterday).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
  expect(screen.getByText(`Yesterday - ${timeStr}`)).toBeInTheDocument();
});
