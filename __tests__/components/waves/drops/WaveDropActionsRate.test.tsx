import React from 'react';
import { render } from '@testing-library/react';
import WaveDropActionsRate from '@/components/waves/drops/WaveDropActionsRate';

const useDropInteractionRules = jest.fn();
jest.mock('@/hooks/drops/useDropInteractionRules', () => ({
  useDropInteractionRules: (...args: any[]) => useDropInteractionRules(...args),
}));

jest.mock('@/components/drops/view/item/rate/give/DropListItemRateGive', () => (props: any) => <div data-testid="rate" data-mobile={props.isMobile} />);
jest.mock('@/contexts/SeizeSettingsContext', () => ({ 
  useSeizeSettings: () => ({ isMemesWave: jest.fn().mockReturnValue(false) })
}));

const drop: any = { id: 'd1' };

beforeEach(() => jest.clearAllMocks());

test('renders rate component when voting allowed', () => {
  useDropInteractionRules.mockReturnValue({ canShowVote: true });
  const { container } = render(<WaveDropActionsRate drop={drop} isMobile />);
  expect(container.querySelector('div[data-testid="rate"]')).toHaveAttribute('data-mobile', 'true');
});

test('returns null when voting not allowed', () => {
  useDropInteractionRules.mockReturnValue({ canShowVote: false });
  const { container } = render(<WaveDropActionsRate drop={drop} />);
  expect(container.firstChild).toBeNull();
});
