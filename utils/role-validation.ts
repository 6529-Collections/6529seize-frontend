/**
 * Role validation utility for authentication system
 * This module provides fail-fast role validation functionality
 */

import { ApiProfileProxy } from '../generated/models/ApiProfileProxy';
import { 
  MissingActiveProfileError, 
  InvalidRoleStateError 
} from '../errors/authentication';

/**
 * validateRoleForAuthentication - FAIL-FAST role validation for authentication
 * 
 * This function performs strict validation of the active profile proxy state for authentication.
 * It implements fail-fast behavior - any invalid state immediately throws an error.
 * 
 * @param activeProfileProxy - The current active profile proxy (can be null)
 * @returns The validated role ID as a string
 * @throws InvalidRoleStateError - When role state is invalid
 * @throws MissingActiveProfileError - When activeProfileProxy is null/undefined
 */
export function validateRoleForAuthentication(activeProfileProxy: ApiProfileProxy | null): string {
  // FAIL-FAST: Check for null/undefined activeProfileProxy
  if (activeProfileProxy === null || activeProfileProxy === undefined) {
    throw new MissingActiveProfileError();
  }

  // FAIL-FAST: Direct property access - will throw if structure is invalid
  // No optional chaining - we want this to crash immediately if the structure is wrong
  const roleId = activeProfileProxy.created_by.id;

  // FAIL-FAST: Validate roleId is not null/undefined/empty
  if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
    throw new InvalidRoleStateError(
      `Active profile proxy has invalid created_by.id: '${roleId}' (type: ${typeof roleId})`
    );
  }

  return roleId;
}