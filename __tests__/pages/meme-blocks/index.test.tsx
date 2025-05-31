import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlockPicker from '../../../pages/meme-blocks';
import { AuthContext } from '../../../components/auth/Auth';
import { distributionPlanApiPost } from '../../../services/distribution-plan-api';

jest.mock('next/font/google', () => ({ Poppins: () => ({ className: 'font' }) }));
jest.mock('../../../services/distribution-plan-api', () => ({ distributionPlanApiPost: jest.fn() }));
jest.mock('../../../components/block-picker/BlockPickerTimeWindowSelect', () => (props: any) => <div data-testid="window" />);
jest.mock('../../../components/block-picker/BlockPickerDateSelect', () => (props: any) => <div data-testid="date" />);
jest.mock('../../../components/block-picker/BlockPickerBlockNumberIncludes', () => (props: any) => <input data-testid="blocknos" value={props.blockNumberIncludes} onChange={e=>props.setBlockNumberIncludes(e.target.value)} />);
jest.mock('../../../components/utils/button/PrimaryButton', () => (props: any) => <button onClick={props.onClicked}>{props.children}</button>);
jest.mock('../../../components/block-picker/result/BlockPickerResult', () => () => <div data-testid="result" />);
jest.mock('react-toastify', () => ({ ToastContainer: () => null }));

const mockedPost = distributionPlanApiPost as jest.Mock;

function renderPage(ctx: any) {
  return render(
    <AuthContext.Provider value={ctx}>
      <BlockPicker />
    </AuthContext.Provider>
  );
}

describe('BlockPicker page', () => {
  it('sets page title on mount', () => {
    const setTitle = jest.fn();
    renderPage({ setTitle } as any);
    expect(setTitle).toHaveBeenCalledWith({ title: 'Meme Blocks | Tools' });
  });

  it('alerts on invalid block numbers', async () => {
    mockedPost.mockResolvedValue({});
    const setTitle = jest.fn();
    window.alert = jest.fn();
    renderPage({ setTitle } as any);
    await userEvent.type(screen.getByTestId('blocknos'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(window.alert).toHaveBeenCalled();
    expect(mockedPost).not.toHaveBeenCalled();
  });
});
