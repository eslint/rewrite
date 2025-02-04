/**
 * @fileoverview Types for this package.
 */

import type { Linter } from "eslint";

/**
 * The type of array element in the `extends` property after flattened.
 */
export type SimpleExtendsElement = string | Linter.Config;

/**
 * The type of array element in the `extends` property before flattening.
 */
export type ExtendsElement = SimpleExtendsElement | Linter.Config[];

/**
 * Config with extends. Valid only inside of `defineConfig()`.
 */
export interface ConfigWithExtends extends Linter.Config {
	extends?: ExtendsElement[];
}

/**
 * Infinite array type.
 */
type InfiniteArray<T> = InfiniteArray<T>[];

export type ConfigWithExtendsArray = InfiniteArray<ConfigWithExtends>;
