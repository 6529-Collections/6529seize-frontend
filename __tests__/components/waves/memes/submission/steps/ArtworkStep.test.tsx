import React from 'react';
import { render, screen } from '@testing-library/react';
import ArtworkStep from '../../../../../../components/waves/memes/submission/steps/ArtworkStep';
import { TraitsData } from '../../../../../../components/waves/memes/submission/types/TraitsData';

jest.mock('../../../../../../components/waves/memes/MemesArtSubmissionFile', () => () => <div data-testid="file" />);
jest.mock('../../../../../../components/waves/memes/submission/details/ArtworkDetails', () => (props: any) => (
  <div data-testid="details" onClick={() => props.onTitleChange('t')} />
));
jest.mock('../../../../../../components/waves/memes/MemesArtSubmissionTraits', () => () => <div data-testid="traits" />);
jest.mock('../../../../../../components/waves/memes/submission/ui/SubmissionProgress', () => () => <div data-testid="progress" />);
jest.mock('../../../../../../components/utils/button/PrimaryButton', () => (props: any) => (
  <button data-testid="submit" disabled={props.disabled} title={props.title} onClick={props.onClicked}>{props.children}</button>
));
jest.mock('../../../../../../components/waves/memes/submission/validation', () => ({
  useTraitsValidation: () => ({
    errors: {},
    validateAll: () => ({ isValid: true }),
    focusFirstInvalidField: jest.fn(),
    markFieldTouched: jest.fn(),
    isValid: true,
    submitAttempted: false,
  })
}));

function createTraits(): TraitsData {
  return {
    title: '',
    description: '',
    artist: 'a',
    seizeArtistProfile: '',
    palette: 'p',
    style: '',
    jewel: '',
    superpower: '',
    dharma: '',
    gear: '',
    clothing: '',
    element: '',
    mystery: '',
    secrets: '',
    weapon: '',
    home: '',
    parent: '',
    sibling: '',
    food: '',
    drink: '',
    bonus: '',
    boost: '',
    punk6529: false,
    gradient: false,
    movement: false,
    dynamic: false,
    interactive: false,
    collab: false,
    om: false,
    threeD: false,
    pepe: false,
    gm: false,
    summer: false,
    tulip: false,
    memeName: 'Use a Hardware Wallet',
    pointsPower: 1,
    pointsWisdom: 2,
    pointsLoki: 3,
    pointsSpeed: 4,
  };
}

describe('ArtworkStep', () => {
  it('shows upload tooltip when artwork missing', () => {
    render(
      <ArtworkStep
        traits={createTraits()}
        artworkUploaded={false}
        artworkUrl=""
        setArtworkUploaded={() => {}}
        handleFileSelect={() => {}}
        onSubmit={() => {}}
        updateTraitField={() => {}}
        setTraits={() => {}}
      />
    );
    expect(screen.getByTestId('submit')).toBeDisabled();
    expect(screen.getByTestId('submit').getAttribute('title')).toMatch('Please upload artwork');
  });

  it('enables submit when complete', () => {
    const traits = createTraits();
    traits.title = 't';
    traits.description = 'd';
    traits.style = 's';
    traits.jewel = 'j';
    traits.superpower = 'sp';
    traits.dharma = 'dh';
    traits.gear = 'g';
    traits.clothing = 'c';
    traits.element = 'e';
    traits.mystery = 'm';
    traits.secrets = 'se';
    traits.weapon = 'w';
    traits.home = 'h';
    traits.parent = 'pa';
    traits.sibling = 'si';
    traits.food = 'f';
    traits.drink = 'dr';
    traits.bonus = 'b';
    traits.boost = 'bo';
    render(
      <ArtworkStep
        traits={traits}
        artworkUploaded={true}
        artworkUrl="url"
        setArtworkUploaded={() => {}}
        handleFileSelect={() => {}}
        onSubmit={() => {}}
        updateTraitField={() => {}}
        setTraits={() => {}}
      />
    );
    expect(screen.getByTestId('submit')).not.toBeDisabled();
  });

  it('calls onSubmit when submit clicked', () => {
    const traits = createTraits();
    Object.keys(traits).forEach(k => { if(typeof (traits as any)[k] === 'string') (traits as any)[k] = 'x'; });
    const onSubmit = jest.fn();
    render(
      <ArtworkStep
        traits={{ ...traits, title: 't', description: 'd' }}
        artworkUploaded={true}
        artworkUrl="u"
        setArtworkUploaded={() => {}}
        handleFileSelect={() => {}}
        onSubmit={onSubmit}
        updateTraitField={() => {}}
        setTraits={() => {}}
      />
    );
    screen.getByTestId('submit').click();
    expect(onSubmit).toHaveBeenCalled();
  });

  it('disables cancel during upload phase', () => {
    const traits = createTraits();
    traits.title = 't';
    traits.description = 'd';
    const onCancel = jest.fn();
    render(
      <ArtworkStep
        traits={traits}
        artworkUploaded={true}
        artworkUrl="url"
        setArtworkUploaded={() => {}}
        handleFileSelect={() => {}}
        onSubmit={() => {}}
        onCancel={onCancel}
        updateTraitField={() => {}}
        setTraits={() => {}}
        submissionPhase="uploading"
      />
    );
    const btn = screen.getByRole('button', { name: /cancel/i });
    expect(btn).toBeDisabled();
  });
});
