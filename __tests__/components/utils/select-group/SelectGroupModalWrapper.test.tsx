import React from 'react';
import { render, screen } from '@testing-library/react';
import SelectGroupModalWrapper from '../../../../components/utils/select-group/SelectGroupModalWrapper';

jest.mock('../../../../components/utils/animation/CommonAnimationWrapper', () => ({ __esModule: true, default: (p:any) => <div data-testid="wrapper">{p.children}</div> }));
jest.mock('../../../../components/utils/animation/CommonAnimationOpacity', () => ({ __esModule: true, default: (p:any) => <div data-testid="opacity" onClick={p.onClicked}>{p.children}</div> }));
jest.mock('../../../../components/utils/select-group/SelectGroupModal', () => ({ __esModule: true, default: ({ onClose, onGroupSelect }: any) => <div data-testid="modal" onClick={() => onGroupSelect({ id:1 })} /> }));

describe('SelectGroupModalWrapper', () => {
  it('renders modal when open', () => {
    const onGroupSelect = jest.fn();
    render(<SelectGroupModalWrapper isOpen onClose={jest.fn()} onGroupSelect={onGroupSelect} />);
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    const { queryByTestId } = render(<SelectGroupModalWrapper isOpen={false} onClose={jest.fn()} onGroupSelect={jest.fn()} />);
    expect(queryByTestId('modal')).toBeNull();
  });
});
