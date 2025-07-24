import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveDropPartContent from '../../../../components/waves/drops/WaveDropPartContent';

jest.mock('../../../../components/waves/drops/WaveDropPartContentMarkdown', () => (props: any) => (
  <div data-testid="markdown">{props.part.content}</div>
));
jest.mock('../../../../components/waves/drops/WaveDropPartContentMedias', () => (props: any) => (
  <div data-testid="medias">{props.activePart.media.length}</div>
));

const baseProps = {
  mentionedUsers: [],
  referencedNfts: [],
  wave: {} as any,
  activePart: { content: 'test', media: [] } as any,
  havePreviousPart: false,
  haveNextPart: false,
  isStorm: false,
  activePartIndex: 0,
  setActivePartIndex: jest.fn(),
  onQuoteClick: jest.fn(),
};

it('renders markdown without medias', () => {
  render(<WaveDropPartContent {...baseProps} />);
  expect(screen.getByTestId('markdown')).toHaveTextContent('test');
  expect(screen.queryByTestId('medias')).toBeNull();
});

it('renders medias and navigation', async () => {
  const user = userEvent.setup();
  const props = {
    ...baseProps,
    isStorm: true,
    haveNextPart: true,
    activePart: { content: 'c', media: [{ url: 'u', mime_type: 'm' }] } as any,
  };
  render(<WaveDropPartContent {...props} />);
  expect(screen.getByTestId('medias')).toBeInTheDocument();
  await user.click(screen.getAllByLabelText('Next part')[0]);
  expect(props.setActivePartIndex).toHaveBeenCalledWith(props.activePartIndex + 1);
});
