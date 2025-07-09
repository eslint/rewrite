/**
 * @fileoverview Types for the config-array package.
 * @author Nicholas C. Zakas
 */

export interface ConfigObject {
	/**
	 * The base path for files and ignores.
	 */
	basePath?: string;

	/**
	 * The files to include.
	 */
	files?: Array<string>;

	/**
	 * The files to exclude.
	 */
	ignores?: Array<string>;

	/**
	 * The name of the config object.
	 */
	name?: string;

	// may also have any number of other properties
	[key: string]: unknown;
}
