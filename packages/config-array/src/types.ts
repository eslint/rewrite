/**
 * @fileoverview Types for the config-array package.
 * @author Nicholas C. Zakas
 */

export interface BaseConfigObject {

    /**
     * The files to include.
     */
    files?: string[];

    /**
     * The files to exclude.
     */
    ignores?: string[];

    /**
     * The name of the config object.
     */
    name?: string;

}
