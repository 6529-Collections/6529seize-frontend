import { render, screen } from '@testing-library/react';
import CreateWaveVotingRep from '../../../../../components/waves/create-wave/voting/CreateWaveVotingRep';
import { CREATE_WAVE_VALIDATION_ERROR } from '../../../../../helpers/waves/create-wave.validation';

jest.mock('../../../../../components/utils/input/identity/IdentitySearch', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="identity" data-error={props.error} />,
}));

jest.mock('../../../../../components/utils/input/rep-category/RepCategorySearch', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="category" data-error={props.error} />,
}));

describe('CreateWaveVotingRep', () => {
  const baseProps = {
    category: null,
    profileId: null,
    errors: [] as CREATE_WAVE_VALIDATION_ERROR[],
    setCategory: jest.fn(),
    setProfileId: jest.fn(),
  };

  it('passes error props based on errors array', () => {
    render(<CreateWaveVotingRep {...baseProps} errors={[CREATE_WAVE_VALIDATION_ERROR.VOTING_CATEGORY_CANNOT_BE_EMPTY, CREATE_WAVE_VALIDATION_ERROR.VOTING_PROFILE_ID_CANNOT_BE_EMPTY]} />);
    expect(screen.getByTestId('category').getAttribute('data-error')).toBe('true');
    expect(screen.getByTestId('identity').getAttribute('data-error')).toBe('true');
  });

  it('does not set error when array empty', () => {
    render(<CreateWaveVotingRep {...baseProps} />);
    expect(screen.getByTestId('category').getAttribute('data-error')).toBe('false');
    expect(screen.getByTestId('identity').getAttribute('data-error')).toBe('false');
  });
});
