import { lazy, ComponentType } from 'react';

/**
 * Every page in this app is a named export (`export const FooPage`), but
 * React.lazy() only accepts a factory that resolves to a default export.
 * This bridges the two so route-level code-splitting doesn't force every
 * page component to switch to a default export.
 */
export function lazyImport<M extends Record<string, ComponentType<any>>, K extends keyof M>(
  factory: () => Promise<M>,
  name: K,
): React.LazyExoticComponent<M[K]> {
  return lazy(() => factory().then((module) => ({ default: module[name] })));
}
