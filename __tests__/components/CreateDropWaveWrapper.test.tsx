import { render, screen } from '@testing-library/react';
import React from 'react';
import { CreateDropWaveWrapperContext } from '../../components/waves/CreateDropWaveWrapper';

let mockIos = false;
let keyboard = false;
jest.mock('../../hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ isIos: mockIos, keyboardVisible: keyboard }) }));

beforeEach(() => {
  (global as any).ResizeObserver = class { observe(){} disconnect(){} };
  mockIos = false;
});

describe('CreateDropWaveWrapper', () => {
  it('adds ios margin class', () => {
    mockIos = true;
    const { CreateDropWaveWrapper } = require('../../components/waves/CreateDropWaveWrapper');
    render(<CreateDropWaveWrapper context={CreateDropWaveWrapperContext.WAVE_CHAT}><div>child</div></CreateDropWaveWrapper>);
    const div = screen.getByText('child').parentElement as HTMLElement;
    expect(div.className).toContain('tw-mb-[3.75rem]');
  });

  it('uses default classes when not ios', () => {
    const { CreateDropWaveWrapper } = require('../../components/waves/CreateDropWaveWrapper');
    render(<CreateDropWaveWrapper><span>ok</span></CreateDropWaveWrapper>);
    const div = screen.getByText('ok').parentElement as HTMLElement;
    expect(div.className).toContain('tw-max-h-[calc(100vh-8.5rem)]');
  });

  it('omits margin when keyboard visible', () => {
    mockIos = true;
    keyboard = true;
    const { CreateDropWaveWrapper } = require('../../components/waves/CreateDropWaveWrapper');
    render(<CreateDropWaveWrapper context={CreateDropWaveWrapperContext.WAVE_CHAT}><span>hi</span></CreateDropWaveWrapper>);
    const div = screen.getByText('hi').parentElement as HTMLElement;
    expect(div.className).not.toContain('tw-mb-[3.75rem]');
  });
});
