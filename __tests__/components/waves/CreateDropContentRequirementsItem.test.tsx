import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CreateDropContentRequirementsItem from '../../../components/waves/CreateDropContentRequirementsItem';
import { DropRequirementType } from '../../../components/waves/CreateDropContentRequirements';


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
    // Mock file input behavior without mocking createElement
    const originalCreateElement = document.createElement;
    const clickSpy = jest.fn();
    
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'input') {
        const input = originalCreateElement.call(document, tagName) as HTMLInputElement;
        input.click = clickSpy;
        return input;
      }
      return originalCreateElement.call(document, tagName);
    });
    
    const { getByRole } = render(
      <CreateDropContentRequirementsItem isValid={false} requirementType={DropRequirementType.MEDIA} missingItems={[]} onOpenMetadata={open} setFiles={setFiles} disabled={false} />
    );
    fireEvent.click(getByRole('button'));
    expect(document.createElement).toHaveBeenCalledWith('input');
    expect(clickSpy).toHaveBeenCalled();
    
    // Cleanup
    document.createElement = originalCreateElement;
  });
});
