import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CreateDropContentRequirementsItem from '../../../components/waves/CreateDropContentRequirementsItem';
import { DropRequirementType } from '../../../components/waves/CreateDropContentRequirements';

jest.mock('@tippyjs/react', () => ({ children }: any) => <div>{children}</div>);

describe('CreateDropContentRequirementsItem', () => {
  it('calls onOpenMetadata when requirement type is METADATA', () => {
    const open = jest.fn();
    const setFiles = jest.fn();
    const { getByRole } = render(
      <CreateDropContentRequirementsItem isValid={false} requirementType={DropRequirementType.METADATA} missingItems={[]} onOpenMetadata={open} setFiles={setFiles} disabled={false} />
    );
    fireEvent.click(getByRole('button'));
    expect(open).toHaveBeenCalled();
  });

  it('opens file chooser when requirement type is MEDIA', () => {
    const open = jest.fn();
    const setFiles = jest.fn();
    const input = document.createElement('input');
    const clickSpy = jest.spyOn(input, 'click').mockImplementation(() => {});
    jest.spyOn(document, 'createElement').mockReturnValue(input as any);
    const { getByRole } = render(
      <CreateDropContentRequirementsItem isValid={false} requirementType={DropRequirementType.MEDIA} missingItems={[]} onOpenMetadata={open} setFiles={setFiles} disabled={false} />
    );
    fireEvent.click(getByRole('button'));
    expect(clickSpy).toHaveBeenCalled();
  });
});
