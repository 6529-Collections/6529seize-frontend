import React from 'react';
import { render, screen } from '@testing-library/react';
import { SingleWaveDropLog } from '../../../../components/waves/drop/SingleWaveDropLog';
import { ApiWaveCreditType } from '../../../../generated/models/ApiWaveCreditType';

jest.mock('next/image', () => ({ __esModule: true, default: (p: any) => <img {...p} /> }));
jest.mock('../../../../helpers/Helpers', () => {
  const original = jest.requireActual('../../../../helpers/Helpers');
  return { ...original, formatNumberWithCommas: (n: number) => String(n), getTimeAgoShort: () => '1h' };
});
jest.mock('../../../../helpers/image.helpers', () => ({ getScaledImageUri: (u: string) => u, ImageScale: {} }));
jest.mock('../../../../hooks/isMobileScreen', () => jest.fn());

const useIsMobile = require('../../../../hooks/isMobileScreen') as jest.Mock;

const log = {
  created_at: new Date().toISOString(),
  invoker: { handle: 'bob', pfp: null },
  contents: { oldVote: 1, newVote: 2 },
} as any;

test('renders desktop layout', () => {
  useIsMobile.mockReturnValue(false);
  render(<SingleWaveDropLog log={log} creditType={ApiWaveCreditType.Tdh} />);
  expect(screen.getByText('bob')).toBeInTheDocument();
  expect(screen.getByText('1 →')).toBeInTheDocument();
  expect(screen.getByText(/2\s*TDH/)).toBeInTheDocument();
  expect(screen.getByText('1h')).toBeInTheDocument();
});

test('renders mobile layout', () => {
  useIsMobile.mockReturnValue(true);
  render(<SingleWaveDropLog log={log} creditType={ApiWaveCreditType.Rep} />);
  expect(screen.getByText('bob')).toBeInTheDocument();
  expect(screen.getByText(/2\s*REP/)).toBeInTheDocument();
});
