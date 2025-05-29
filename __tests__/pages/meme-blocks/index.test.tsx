import React from 'react';
import { render, screen } from '@testing-library/react';
import BlockPicker from '../../../pages/meme-blocks';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('../../../components/block-picker/BlockPickerTimeWindowSelect', () => () => <div data-testid="window" />);
jest.mock('../../../components/block-picker/BlockPickerDateSelect', () => () => <div data-testid="date" />);
jest.mock('../../../components/block-picker/BlockPickerBlockNumberIncludes', () => () => <div data-testid="includes" />);
jest.mock('../../../components/block-picker/result/BlockPickerResult', () => () => <div data-testid="result" />);

describe('BlockPicker page', () => {
  it('sets title on mount', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <BlockPicker />
      </AuthContext.Provider>
    );
    expect(setTitle).toHaveBeenCalledWith({ title: 'Meme Blocks | Tools' });
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('exposes metadata', () => {
    expect(BlockPicker.metadata).toEqual({ title: 'Meme Blocks', description: 'Tools' });
  });
});
