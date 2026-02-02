/**
 * Authentication State Atoms (Jotai)
 * 
 * KEY CONCEPTS:
 * 1. Atomic State: Each piece of state is an independent atom
 * 2. Derived State: Computed values from base atoms
 * 3. Async Atoms: Handle async operations within atoms
 * 
 * WHY JOTAI?
 * - Minimal boilerplate compared to Redux
 * - Fine-grained reactivity (only re-renders what's needed)
 * - Easy integration with React Suspense
 * - No providers needed at component level
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/**
 * User atom - stores current user data
 * Uses atomWithStorage for persistence across page refreshes
 * Note: Sensitive data like tokens are in HTTP-only cookies, not here
 */
export const userAtom = atomWithStorage('user', null);

/**
 * Authentication loading state
 * Used to show loading indicators during auth operations
 */
export const authLoadingAtom = atom(false);

/**
 * Auth error state
 * Stores the last authentication error for display
 */
export const authErrorAtom = atom(null);

/**
 * Derived atom: Check if user is authenticated
 * Read-only, computed from userAtom
 */
export const isAuthenticatedAtom = atom((get) => {
  const user = get(userAtom);
  return user !== null;
});

/**
 * Derived atom: Check if user is admin
 */
export const isAdminAtom = atom((get) => {
  const user = get(userAtom);
  return user?.role === 'ADMIN';
});

/**
 * Derived atom: Get user's display name
 */
export const userDisplayNameAtom = atom((get) => {
  const user = get(userAtom);
  if (!user) return '';
  return `${user.first_name} ${user.last_name}`;
});
