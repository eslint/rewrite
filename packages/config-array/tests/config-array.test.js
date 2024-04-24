/**
 * @fileoverview Tests for ConfigArray object.
 * @author Nicholas C. Zakas
 */
/* globals URL */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { ConfigArray, ConfigArraySymbol } from '../src/config-array.js';
import path from 'path';
import assert from "node:assert";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

// calculate base path using import.meta
const basePath = path.dirname(new URL(import.meta.url).pathname);

const schema = {
	language: {
		required: false,
		validate(value) {
			if (typeof value !== 'function') {
				throw new TypeError('Expected a function.');
			}
		},
		merge(a, b) {
			if (!b) {
				return a;
			}

			if (!a) {
				return b;
			}
		}
	},
	defs: {
		required: false,
		validate(value) {
			if (!value || typeof value !== 'object') {
				throw new TypeError('Object expected.');
			}
		},
		merge(a, b) {
			return {
				...a,
				...b
			};
		}
	}
};

const JSLanguage = class {};
const CSSLanguage = class {};
const MarkdownLanguage = class {};
const JSONLanguage = class {};

function createConfigArray(options) {
	return new ConfigArray([
		{
			files: ['**/*.js'],
			language: JSLanguage
		},
		{
			files: ['**/*.json'],
			language: JSONLanguage
		},
		{
			files: ['**/*.css'],
			language: CSSLanguage
		},
		{
			files: ['**/*.md', '**/.markdown'],
			language: MarkdownLanguage
		},
		{},
		{
			files: ['!*.css'],
			defs: {
				css: false
			}
		},
		{
			files: ['**/*.xsl'],
			ignores: ['fixtures/test.xsl'],
			defs: {
				xsl: true
			}
		},
		{
			files: ['tests/**/*.xyz'],
			defs: {
				xyz: true
			}
		},
		{
			ignores: ['tests/fixtures/**'],
			defs: {
				name: 'config-array'
			}
		},
		{
			ignores: ['node_modules/**']
		},
		{
			files: ['foo.test.js'],
			defs: {
				name: 'config-array.test'
			}
		},
		function(context) {
			return {
				files: ['bar.test.js'],
				defs: {
					name: context.name
				}
			};
		},
		function(context) {
			return [
				{
					files: ['baz.test.js'],
					defs: {
						name: 'baz-' + context.name
					}
				},
				{
					files: ['boom.test.js'],
					defs: {
						name: 'boom-' + context.name
					}
				}
			];
		},
		{
			files: [['*.and.*', '*.js']],
			defs: {
				name: 'AND operator'
			}
		},
		{
			files: [filePath => filePath.endsWith('.html')],
			defs: {
				name: 'HTML'
			}
		},
		{
			ignores: [filePath => filePath.endsWith('.gitignore')]
		},
		{
			files: ['**/*'],
			defs: {
				universal: true
			}
		}
	], {
		basePath,
		schema,
		extraConfigTypes: ['array', 'function'],
		...options
	});
}

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe('ConfigArray', () => {

	let configs,
		unnormalizedConfigs;

	beforeEach(() => {
		unnormalizedConfigs = new ConfigArray([], { basePath, extraConfigTypes: ['array', 'function'] });
		configs = createConfigArray();
		return configs.normalize({
			name: 'from-context'
		});
	});

	describe('Config Types Validation', () => {
		it('should not throw an error when objects are allowed', async () => {
			configs = new ConfigArray([
				{
					files: ['*.js']
				}
			], {
				basePath
			});
			await configs.normalize();

		});

		it('should not throw an error when arrays are allowed', async () => {
			configs = new ConfigArray([
				[
					{
						files: ['*.js']
					}
				]
			], {
				basePath,
				extraConfigTypes: ['array']
			});
			await configs.normalize();

		});

		it('should not throw an error when functions are allowed', async () => {
			configs = new ConfigArray([
				() => ({})
			], {
				basePath,
				extraConfigTypes: ['function']
			});
			await configs.normalize();

		});

		it('should throw an error in normalize() when arrays are not allowed', done => {

			configs = new ConfigArray([
				[
					{
						files: '*.js'
					}
				]
			], {
				basePath
			});

			configs
				.normalize()
				.then(() => {
					throw new Error('Missing error.');
				})
				.catch(ex => {
					assert.match(ex.message, /Unexpected array/);
					done();
				});

		});

		it('should throw an error in normalizeSync() when arrays are not allowed', () => {

			configs = new ConfigArray([
				[
					{
						files: '*.js'
					}
				]
			], {
				basePath
			});
			assert.throws(() => {
				configs.normalizeSync();
			}, /Unexpected array/);

		});

		it('should throw an error in normalize() when functions are not allowed', done => {

			configs = new ConfigArray([
				() => ({})
			], {
				basePath
			});

			configs
				.normalize()
				.then(() => {
					throw new Error('Missing error.');
				})
				.catch(ex => {
					assert.match(ex.message, /Unexpected function/);
					done();
				});

		});

		it('should throw an error in normalizeSync() when functions are not allowed', () => {

			configs = new ConfigArray([
				() => {}
			], {
				basePath
			});

			assert.throws(() => {
				configs.normalizeSync();
			}, /Unexpected function/);

		});

	});

	describe('Validation', () => {

		function testValidationError({ only = false, title, configs, expectedError }) {
			
			const localIt = only ? it.only : it;
			
			localIt(`${title} when calling normalize()`, async () => {
				const configArray = new ConfigArray(configs, { basePath });

				let actualError;
				try {
					await configArray.normalize();
				} catch (error) {
					actualError = error;
				}
				assert.throws(() => {
					if (actualError) {
						throw actualError;
					}
				}, expectedError.message);

			});

			localIt(`${title} when calling normalizeSync()`, () => {
				const configArray = new ConfigArray(configs, { basePath });

				assert.throws(() => configArray.normalizeSync(), expectedError.message);

			});
		}

		testValidationError({
			title: 'should throw an error when files is not an array',
			configs: [
				{
					files: '*.js'
				}
			],
			expectedError: /non-empty array/
		});

		testValidationError({
			title: 'should throw an error when files is an empty array',
			configs: [
				{
					files: []
				}
			],
			expectedError: /non-empty array/
		});

		testValidationError({
			title: 'should throw an error when files is undefined',
			configs: [
				{
					files: undefined
				}
			],
			expectedError: /non-empty array/
		});

		testValidationError({
			title: 'should throw an error when files contains an invalid element',
			configs: [
				{
					name: '',
					files: ['*.js', undefined]
				}
			],
			expectedError: 'Config Error: Config (unnamed): Key "files": Items must be a string, a function, or an array of strings and functions.'
		});

		testValidationError({
			title: 'should throw an error when ignores is undefined',
			configs: [
				{
					ignores: undefined
				}
			],
			expectedError: 'Config Error: Config (unnamed): Key "ignores": Expected value to be an array.'
		});

		testValidationError({
			title: 'should throw an error when a global ignores contains an invalid element',
			configs: [
				{
					name: 'foo',
					ignores: ['ignored/**', -1]
				}
			],
			expectedError: 'Config "foo": Key "ignores": Expected array to only contain strings and functions.'
		});

		testValidationError({
			title: 'should throw an error when a non-global ignores contains an invalid element',
			configs: [
				{
					name: 'foo',
					files: ['*.js'],
					ignores: [-1]
				}
			],
			expectedError: 'Config "foo": Key "ignores": Expected array to only contain strings and functions.'
		});

		it('should throw an error when a config is not an object', async () => {
			configs = new ConfigArray([
				{
					files: ['*.js']
				},
				'eslint:reccommended' // typo
			], { basePath });

			assert.throws(() => {
				configs.normalizeSync();
			}, 'Config Error: Config (unnamed): Unexpected non-object config.');

		});

		it('should throw an error when base config name is not a string', async () => {
			configs = new ConfigArray([
				{
					files: ['**'],
					name: true
				}
			], { basePath });
			
			await configs.normalize();

			assert.throws(() => {
				configs.getConfig(path.resolve(basePath, 'foo.js'));
			}, 'Config Error: Config (unnamed): Key "name": Property must be a string.');

		});

		it('should throw an error when additional config name is not a string', async () => {
			configs = new ConfigArray([{}], { basePath });
			configs.push(
				{
					files: ['**'],
					name: true
				}
			);
			
			await configs.normalize();

			assert.throws(() => {
				configs.getConfig(path.resolve(basePath, 'foo.js'));
			}, 'Config Error: Config (unnamed): Key "name": Property must be a string.');

		});

		it('should throw an error when base config is undefined', async () => {
			configs = new ConfigArray([undefined], { basePath });
			
			assert.throws(() => {
				configs.normalizeSync();
			}, 'ConfigError: Config (unnamed): Unexpected undefined config.');

		});

		it('should throw an error when base config is null', async () => {
			configs = new ConfigArray([null], { basePath });
			
			assert.throws(() => {
				configs.normalizeSync();
			}, 'Config Error: Config (unnamed): Unexpected null config.');

		});

		it('should throw an error when additional config is undefined', async () => {
			configs = new ConfigArray([{}], { basePath });
			configs.push(undefined);
			
			assert.throws(() => {
				configs.normalizeSync();
			}, 'Config Error: Config (unnamed): Unexpected undefined config.');

		});

		it('should throw an error when additional config is null', async () => {
			configs = new ConfigArray([{}], { basePath });
			configs.push(null);

			assert.throws(() => {
				configs.normalizeSync();
			}, 'Config Error: Config (unnamed): Unexpected null config.');

		});
	});

	describe('ConfigArray members', () => {

		beforeEach(() => {
			configs = createConfigArray();
			return configs.normalize({
				name: 'from-context'
			});
		});

		describe('ConfigArraySymbol.finalizeConfig', () => {
			it('should allow finalizeConfig to alter config before returning when calling normalize()', async () => {

				configs = createConfigArray();
				configs[ConfigArraySymbol.finalizeConfig] = () => {
					return {
						name: 'from-finalize'
					};
				};

				await configs.normalize({
					name: 'from-context'
				});

				const filename = path.resolve(basePath, 'foo.js');
				const config = configs.getConfig(filename);
				assert.strictEqual(config.name, 'from-finalize');
			});

			it('should allow finalizeConfig to alter config before returning when calling normalizeSync()', async () => {

				configs = createConfigArray();
				configs[ConfigArraySymbol.finalizeConfig] = () => {
					return {
						name: 'from-finalize'
					};
				};

				configs.normalizeSync({
					name: 'from-context'
				});

				const filename = path.resolve(basePath, 'foo.js');
				const config = configs.getConfig(filename);
				assert.strictEqual(config.name, 'from-finalize');
			});

		});

		describe('ConfigArraySymbol.preprocessConfig', () => {
			it('should allow preprocessConfig to alter config before returning', async () => {

				configs = createConfigArray();
				configs.push('foo:bar');

				configs[ConfigArraySymbol.preprocessConfig] = config => {

					if (config === 'foo:bar') {
						return {
							defs: {
								name: 'foo:bar'
							}
						};
					}

					return config;
				};

				await configs.normalize({
					name: 'from-context'
				});

				const filename = path.resolve(basePath, 'foo.js');
				const config = configs.getConfig(filename);
				assert.strictEqual(config.defs.name, 'foo:bar');
			});

			it('should have "this" inside of function be equal to config array when calling normalize()', async () => {

				configs = createConfigArray();
				configs.push('foo:bar');
				let internalThis;

				configs[ConfigArraySymbol.preprocessConfig] = function(config) {
					internalThis = this;

					if (config === 'foo:bar') {
						return {
							defs: {
								name: 'foo:bar'
							}
						};
					}

					return config;
				};

				await configs.normalize({
					name: 'from-context'
				});

				assert.strictEqual(internalThis, configs);
			});

			it('should have "this" inside of function be equal to config array when calling normalizeSync()', async () => {

				configs = createConfigArray();
				configs.push('foo:bar');
				let internalThis;

				configs[ConfigArraySymbol.preprocessConfig] = function(config) {
					internalThis = this;

					if (config === 'foo:bar') {
						return {
							defs: {
								name: 'foo:bar'
							}
						};
					}

					return config;
				};

				configs.normalizeSync({
					name: 'from-context'
				});

				assert.strictEqual(internalThis, configs);
			});

		});

		describe('basePath', () => {
			it('should store basePath property when basePath is provided', () => {
				assert.strictEqual(unnormalizedConfigs.basePath, basePath);
				assert.strictEqual(configs.basePath, basePath);
			});
		});

		describe('isNormalized()', () => {
			it('should return true when the config array is normalized', () => {
				assert.strictEqual(configs.isNormalized(), true);
			});

			it('should return false when the config array is not normalized', () => {
				assert.strictEqual(unnormalizedConfigs.isNormalized(), false);
			});
		});

		describe('getConfig()', () => {

			it('should throw an error when not normalized', () => {
				const filename = path.resolve(basePath, 'foo.js');

				assert.throws(() => {
					unnormalizedConfigs.getConfig(filename);
				}, /normalized/);
			});

			it('should calculate correct config when passed JS filename', () => {
				const filename = path.resolve(basePath, 'foo.js');
				const config = configs.getConfig(filename);

				assert.strictEqual(config.language, JSLanguage);
				assert.strictEqual(typeof config.defs, 'object');
				assert.strictEqual(config.defs.name, 'config-array');
				assert.strictEqual(config.defs.universal, true);
				assert.strictEqual(config.defs.css, false);
			});

			it('should calculate correct config when passed XYZ filename', () => {
				const filename = path.resolve(basePath, 'tests/.bar/foo.xyz');

				const config = configs.getConfig(filename);

				assert.strictEqual(typeof config.defs, 'object');
				assert.strictEqual(config.defs.name, 'config-array');
				assert.strictEqual(config.defs.universal, true);
				assert.strictEqual(config.defs.xyz, true);
			});

			it('should calculate correct config when passed HTML filename', () => {
				const filename = path.resolve(basePath, 'foo.html');

				const config = configs.getConfig(filename);

				assert.strictEqual(typeof config.defs, 'object');
				assert.strictEqual(config.defs.name, 'HTML');
				assert.strictEqual(config.defs.universal, true);
			});

			it('should return undefined when passed ignored .gitignore filename', () => {
				const filename = path.resolve(basePath, '.gitignore');

				const config = configs.getConfig(filename);

				assert.strictEqual(config, undefined);
			});

			it('should calculate correct config when passed JS filename that matches two configs', () => {
				const filename = path.resolve(basePath, 'foo.test.js');

				const config = configs.getConfig(filename);

				assert.strictEqual(config.language, JSLanguage);
				assert.strictEqual(typeof config.defs, 'object');
				assert.strictEqual(config.defs.name, 'config-array.test');
				assert.strictEqual(config.defs.css, false);
				assert.strictEqual(config.defs.universal, true);
			});

			it('should calculate correct config when passed JS filename that matches a function config', () => {
				const filename = path.resolve(basePath, 'bar.test.js');

				const config = configs.getConfig(filename);

				assert.strictEqual(config.language, JSLanguage);
				assert.strictEqual(typeof config.defs, 'object');
				assert.strictEqual(config.defs.name, 'from-context');
				assert.strictEqual(config.defs.css, false);
				assert.strictEqual(config.defs.universal, true);
			});

			it('should not match a filename that doesn\'t explicitly match a files pattern', () => {
				const matchingFilename = path.resolve(basePath, 'foo.js');
				const notMatchingFilename = path.resolve(basePath, 'foo.md');
				configs = new ConfigArray([
					{},
					{
						files: ['**/*.js']
					}
				], { basePath, schema });

				configs.normalizeSync();

				const config1 = configs.getConfig(matchingFilename);
				assert.strictEqual(typeof config1, 'object');

				const config2 = configs.getConfig(notMatchingFilename);
				assert.strictEqual(config2, undefined);
			});

			it('should calculate correct config when passed JS filename that matches a async function config', () => {
				const configs = createConfigArray();
				configs.push(context => {
					return Promise.resolve([
						{
							files: ['async.test.js'],
							defs: {
								name: 'async-' + context.name
							}
						}
					]);
				});

				assert.throws(() => {
					configs.normalizeSync();
				}, /Async config functions are not supported/);
			});

			it('should throw an error when passed JS filename that matches a async function config and normalizeSync() is called', async () => {
				const filename = path.resolve(basePath, 'async.test.js');
				const configs = createConfigArray();
				configs.push(context => {
					return Promise.resolve([
						{
							files: ['async.test.js'],
							defs: {
								name: 'async-' + context.name
							}
						}
					]);
				});

				await configs.normalize({
					name: 'from-context'
				});

				const config = configs.getConfig(filename);

				assert.strictEqual(config.language, JSLanguage);
				assert.strictEqual(typeof config.defs, 'object');
				assert.strictEqual(config.defs.name, 'async-from-context');
				assert.strictEqual(config.defs.css, false);
				assert.strictEqual(config.defs.universal, true);
			});

			it('should throw an error when defs doesn\'t pass validation', async () => {
				const configs = new ConfigArray([
					{
						files: ['**/*.js'],
						defs: 'foo',
						name: 'bar'
					}
				], { basePath, schema });

				await configs.normalize();

				const filename = path.resolve(basePath, 'foo.js');
				assert.throws(() => {
					configs.getConfig(filename);
				}, /Config "bar": Key "defs": Object expected./);
			});

			it('should calculate correct config when passed JS filename that matches a function config returning an array', () => {
				const filename1 = path.resolve(basePath, 'baz.test.js');
				const config1 = configs.getConfig(filename1);

				assert.strictEqual(typeof config1.defs, 'object');
				assert.strictEqual(config1.language, JSLanguage);
				assert.strictEqual(config1.defs.name, 'baz-from-context');

				const filename2 = path.resolve(basePath, 'baz.test.js');
				const config2 = configs.getConfig(filename2);

				assert.strictEqual(config2.language, JSLanguage);
				assert.strictEqual(typeof config2.defs, 'object');
				assert.strictEqual(config2.defs.name, 'baz-from-context');
				assert.strictEqual(config2.defs.css, false);
			});

			it('should calculate correct config when passed CSS filename', () => {
				const filename = path.resolve(basePath, 'foo.css');

				const config = configs.getConfig(filename);
				assert.strictEqual(config.language, CSSLanguage);
				assert.strictEqual(typeof config.defs, 'object');
				assert.strictEqual(config.defs.name, 'config-array');
				assert.strictEqual(config.defs.universal, true); ;
			});

			it('should calculate correct config when passed JS filename that matches AND pattern', () => {
				const filename = path.resolve(basePath, 'foo.and.js');

				const config = configs.getConfig(filename);
				assert.strictEqual(config.language, JSLanguage);
				assert.strictEqual(typeof config.defs, 'object');
				assert.strictEqual(config.defs.name, 'AND operator');
				assert.strictEqual(config.defs.css, false); ;
				assert.strictEqual(config.defs.universal, true); ;
			});

			it('should return the same config when called with the same filename twice (caching)', () => {
				const filename = path.resolve(basePath, 'foo.js');

				const config1 = configs.getConfig(filename);
				const config2 = configs.getConfig(filename);

				assert.strictEqual(config1, config2);
			});

			it('should return the same config when called with two filenames that match the same configs (caching)', () => {
				const filename1 = path.resolve(basePath, 'foo1.js');
				const filename2 = path.resolve(basePath, 'foo2.js');

				const config1 = configs.getConfig(filename1);
				const config2 = configs.getConfig(filename2);

				assert.strictEqual(config1, config2);
			});

			it('should return empty config when called with ignored node_modules filename', () => {
				const filename = path.resolve(basePath, 'node_modules/foo.js');
				const config = configs.getConfig(filename);

				assert.strictEqual(config, undefined); 
			});

			// https://github.com/eslint/eslint/issues/17103
			describe('ignores patterns should be properly applied', () => {
				
				it('should return undefined when a filename matches an ignores pattern but not a files pattern', () => {
					const matchingFilename = path.resolve(basePath, 'foo.js');
					const notMatchingFilename = path.resolve(basePath, 'foo.md');
					configs = new ConfigArray([
						{
							defs: {
								severity: 'error'
							}
						},
						{
							ignores: ['**/*.md'],
							defs: {
								severity: 'warn'
							}
						}
					], { basePath, schema });
	
					configs.normalizeSync();
	
					const config1 = configs.getConfig(matchingFilename);
					assert.strictEqual(config1, undefined); 
	
					const config2 = configs.getConfig(notMatchingFilename);
					assert.strictEqual(config2, undefined); 
				});

				it('should apply config with only ignores when a filename matches a files pattern', () => {
					const matchingFilename = path.resolve(basePath, 'foo.js');
					const notMatchingFilename = path.resolve(basePath, 'foo.md');
					configs = new ConfigArray([
						{
							files: ['**/*.js'],
							defs: {
								severity: 'error'
							}
						},
						{
							ignores: ['**/*.md'],
							defs: {
								severity: 'warn'
							}
						}
					], { basePath, schema });

					configs.normalizeSync();

					const config1 = configs.getConfig(matchingFilename);
					assert.strictEqual(typeof config1, 'object');
					assert.strictEqual(config1.defs.severity, 'warn');

					const config2 = configs.getConfig(notMatchingFilename);
					assert.strictEqual(config2, undefined); 
				});

				it('should not apply config with only ignores when a filename should be ignored', () => {
					const matchingFilename = path.resolve(basePath, 'foo.js');
					const ignoredFilename = path.resolve(basePath, 'bar.js');
					configs = new ConfigArray([
						{
							files: ['**/*.js'],
							defs: {
								severity: 'error'
							}
						},
						{
							ignores: ['**/bar.js'],
							defs: {
								severity: 'warn'
							}
						}
					], { basePath, schema });

					configs.normalizeSync();

					const config1 = configs.getConfig(matchingFilename);
					assert.strictEqual(typeof config1, 'object');
					assert.strictEqual(config1.defs.severity, 'warn');

					const config2 = configs.getConfig(ignoredFilename);
					assert.strictEqual(typeof config2, 'object');
					assert.strictEqual(config2.defs.severity, 'error');
				});

			});	

		});

		describe('isIgnored()', () => {

			it('should throw an error when not normalized', () => {
				const filename = path.resolve(basePath, 'foo.js');
				assert.throws(() => {
					unnormalizedConfigs.isIgnored(filename);
				}, /normalized/);
			});
			it('should return false when passed JS filename', () => {
				const filename = path.resolve(basePath, 'foo.js');
				assert.strictEqual(configs.isIgnored(filename), false);
			});

			it('should return true when passed JS filename in parent directory', () => {
				const filename = path.resolve(basePath, '../foo.js');
				assert.strictEqual(configs.isIgnored(filename), true);
			});

			it('should return false when passed HTML filename', () => {
				const filename = path.resolve(basePath, 'foo.html');
				assert.strictEqual(configs.isIgnored(filename), false);
			});

			it('should return true when passed ignored .gitignore filename', () => {
				const filename = path.resolve(basePath, '.gitignore');
				assert.strictEqual(configs.isIgnored(filename), true);
			});

			it('should return false when passed CSS filename', () => {
				const filename = path.resolve(basePath, 'foo.css');

				assert.strictEqual(configs.isIgnored(filename), false);
			});

			it('should return true when passed docx filename', () => {
				const filename = path.resolve(basePath, 'sss.docx');

				assert.strictEqual(configs.isIgnored(filename), false);
			});

			it('should return true when passed ignored node_modules filename', () => {
				const filename = path.resolve(basePath, 'node_modules/foo.js');

				assert.strictEqual(configs.isIgnored(filename), true);
			});
			it('should return true when passed matching both files and ignores in a config', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.xsl'],
						ignores: ['fixtures/test.xsl'],
						defs: {
							xsl: true
						}
					}
				], { basePath });

				configs.normalizeSync();
				const filename = path.resolve(basePath, 'fixtures/test.xsl');

				assert.strictEqual(configs.isIgnored(filename), true);
			});

			it('should return false when negated pattern comes after matching pattern', () => {
				configs = new ConfigArray([
					{
						files: ['**/foo.*'],
						ignores: ['**/*.txt', '!foo.txt']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isIgnored(path.join(basePath, 'bar.txt')), true);
				assert.strictEqual(configs.isIgnored(path.join(basePath, 'foo.txt')), false);
			});

			it('should return true when negated pattern comes before matching pattern', () => {
				configs = new ConfigArray([
					{
						ignores: ['!foo.txt', '**/*.txt']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isIgnored(path.join(basePath, 'bar.txt')), true); ;
				assert.strictEqual(configs.isIgnored(path.join(basePath, 'foo.txt')), true); ;
			});

			it('should return false when matching files and ignores has a negated pattern comes after matching pattern', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js'],
						ignores: ['**/*.test.js', '!foo.test.js']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isIgnored(path.join(basePath, 'bar.test.js')), true); ;
				assert.strictEqual(configs.isIgnored(path.join(basePath, 'foo.test.js')), false); ;
			});

		});

		describe('isFileIgnored()', () => {

			it('should throw an error when not normalized', () => {
				const filename = path.resolve(basePath, 'foo.js');
				assert.throws(() => {
					unnormalizedConfigs.isFileIgnored(filename);
				}, /normalized/);
			});

			it('should return false when passed JS filename', () => {
				const filename = path.resolve(basePath, 'foo.js');

				assert.strictEqual(configs.isFileIgnored(filename), false); ;
			});

			it('should return true when passed JS filename in parent directory', () => {
				const filename = path.resolve(basePath, '../foo.js');

				assert.strictEqual(configs.isFileIgnored(filename), true); ;
			});

			it('should return false when passed HTML filename', () => {
				const filename = path.resolve(basePath, 'foo.html');

				assert.strictEqual(configs.isFileIgnored(filename), false); ;
			});

			it('should return true when passed ignored .gitignore filename', () => {
				const filename = path.resolve(basePath, '.gitignore');

				assert.strictEqual(configs.isFileIgnored(filename), true); ;
			});

			it('should return false when passed CSS filename', () => {
				const filename = path.resolve(basePath, 'foo.css');

				assert.strictEqual(configs.isFileIgnored(filename), false); ;
			});

			it('should return true when passed docx filename', () => {
				const filename = path.resolve(basePath, 'sss.docx');

				assert.strictEqual(configs.isFileIgnored(filename), false); ;
			});

			it('should return true when passed ignored node_modules filename', () => {
				const filename = path.resolve(basePath, 'node_modules/foo.js');

				assert.strictEqual(configs.isFileIgnored(filename), true); ;
			});

			it('should return true when passed matching both files and ignores in a config', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.xsl'],
						ignores: ['fixtures/test.xsl'],
						defs: {
							xsl: true
						}
					}
				], { basePath });

				configs.normalizeSync();
				const filename = path.resolve(basePath, 'fixtures/test.xsl');

				assert.strictEqual(configs.isFileIgnored(filename), true); ;
			});

			it('should return false when negated pattern comes after matching pattern', () => {
				configs = new ConfigArray([
					{
						files: ['**/foo.*'],
						ignores: ['**/*.txt', '!foo.txt']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'bar.txt')), true); ;
				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo.txt')), false); ;
			});

			it('should return true when negated pattern comes before matching pattern', () => {
				configs = new ConfigArray([
					{
						ignores: ['!foo.txt', '**/*.txt']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'bar.txt')), true); ;
				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo.txt')), true); ;
			});

			it('should return false when matching files and ignores has a negated pattern comes after matching pattern', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js'],
						ignores: ['**/*.test.js', '!foo.test.js']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'bar.test.js')), true); ;
				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo.test.js')), false); ;
			});

			it('should return false when file is inside of ignored directory', () => {
				configs = new ConfigArray([
					{
						ignores: ['ignoreme']
					},
					{
						files: ['**/*.js']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'ignoreme/foo.js')), true); ;
			});

			it('should return false when file is inside of ignored directory', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'foo/*',
							'!foo/bar'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/bar/a.js')), false); ;
			});

			it('should return true when file is ignored, unignored, and then reignored', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'a.js',
							'!a*.js',
							'a.js'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'a.js')), true); ;
			});

			it('should return true when the parent directory of a file is ignored', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'foo'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/bar/a.js')), true); ;
			});

			it('should return true when an ignored directory is later negated with **', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'**/node_modules/**'
						]
					},
					{
						ignores: [
							'!node_modules/package/**'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'node_modules/package/a.js')), true); ;
			});

			it('should return true when an ignored directory is later negated with *', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'**/node_modules/**'
						]
					},
					{
						ignores: [
							'!node_modules/package/*'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'node_modules/package/a.js')), true); ;
			});

			it('should return true when there are only patterns ending with /*', () => {
				configs = new ConfigArray([
					{
						files: ['foo/*']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/a.js')), true); ;
			});

			it('should return true when there are only patterns ending with /**', () => {
				configs = new ConfigArray([
					{
						files: ['foo/**']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/a.js')), true); ;
			});

			it('should return false when files pattern matches and there is a pattern ending with /**', () => {
				configs = new ConfigArray([
					{
						files: ['foo/*.js', 'foo/**']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/a.js')), false); ;
			});

			it('should return false when file has the same name as a directory that is ignored by a pattern that ends with `/`', () => {
				configs = new ConfigArray([
					{
						files: ['**/foo']
					},
					{
						ignores: [
							'foo/'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo')), false); ;
			});

			it('should return false when file is in the parent directory of directories that are ignored by a pattern that ends with `/`', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'foo/*/'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/a.js')), false); ;
			});

			it('should return true when file is in a directory that is ignored by a pattern that ends with `/`', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'foo/'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/a.js')), true); ;
			});

			it('should return true when file is in a directory that is ignored by a pattern that does not end with `/`', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'foo'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/a.js')), true); ;
			});

			it('should return false when file is in a directory that is ignored and then unignored by pattern that end with `/`', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'foo/',
							'!foo/'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/a.js')), false); ;
			});

			it('should return true when file is in a directory that is ignored along with its files by a pattern that ends with `/**` and then unignored by pattern that ends with `/`', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'foo/**',

							// only the directory is unignored, files are not
							'!foo/'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/a.js')), true); ;
			});

			it('should return true when file is in a directory that is ignored along with its files by a pattern that ends with `/**` and then unignored by pattern that does not end with `/`', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'foo/**',

							// only the directory is unignored, files are not
							'!foo'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/a.js')), true); ;
			});

			it('should return false when file is in a directory that is ignored along its files by pattern that ends with `/**` and then unignored along its files by pattern that ends with `/**`', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'foo/**',

							// both the directory and the files are unignored
							'!foo/**'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/a.js')), false); ;
			});

			it('should return true when file is ignored by a pattern and there are unignore patterns that target files of a directory with the same name', () => {
				configs = new ConfigArray([
					{
						files: ['**/foo']
					},
					{
						ignores: [
							'foo',
							'!foo/*',
							'!foo/**'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo')), true); ;
			});

			it('should return true when file is in a directory that is ignored even if an unignore pattern that ends with `/*` matches the file', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'foo',
							'!foo/*'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'foo/a.js')), true); ;
			});

			// https://github.com/eslint/eslint/issues/17964#issuecomment-1879840650
			it('should return true for all files ignored in a directory tree except for explicitly unignored ones', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [

							// ignore all files and directories
							'tests/format/**/*',

							// unignore all directories
							'!tests/format/**/*/',

							// unignore specific files
							'!tests/format/**/jsfmt.spec.js'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'tests/format/foo.js')), true); ;
				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'tests/format/jsfmt.spec.js')), false); ;
				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'tests/format/subdir/foo.js')), true); ;
				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'tests/format/subdir/jsfmt.spec.js')), false); ;
			});

			// https://github.com/eslint/eslint/pull/16579/files
			describe('gitignore-style unignores', () => {

				it('should return true when a subdirectory is ignored and then we try to unignore a directory', () => {
					configs = new ConfigArray([
						{
							ignores: [
								'/**/node_modules/*',
								'!/node_modules/foo'
							],
						}
					], { basePath });
	
					configs.normalizeSync();
					const filename = path.resolve(basePath, 'node_modules/foo/bar.js');
	
					assert.strictEqual(configs.isFileIgnored(filename), true); ;
				});				

				it('should return true when a subdirectory is ignored and then we try to unignore a file', () => {
					configs = new ConfigArray([
						{
							ignores: [
								'/**/node_modules/*',
								'!/node_modules/foo/**'
							],
						}
					], { basePath });
	
					configs.normalizeSync();
					const filename = path.resolve(basePath, 'node_modules/foo/bar.js');
	
					assert.strictEqual(configs.isFileIgnored(filename), true); ;
				});

				it('should return true when all descendant directories are ignored and then we try to unignore a file', () => {
					configs = new ConfigArray([
						{
							ignores: [
								'/**/node_modules/**',
								'!/node_modules/foo/**'
							],
						}
					], { basePath });
	
					configs.normalizeSync();
					const filename = path.resolve(basePath, 'node_modules/foo/bar.js');
	
					assert.strictEqual(configs.isFileIgnored(filename), true); ;
				});				

				it('should return true when all descendant directories are ignored without leading slash and then we try to unignore a file', () => {
					configs = new ConfigArray([
						{
							ignores: [
								'**/node_modules/**',
								'!/node_modules/foo/**'
							],
						}
					], { basePath });
	
					configs.normalizeSync();
					const filename = path.resolve(basePath, 'node_modules/foo/bar.js');
	
					assert.strictEqual(configs.isFileIgnored(filename), true); ;
				});				
			});

		});

		describe('isDirectoryIgnored()', () => {
			
			it('should return true when a function return false in ignores', () => {
				configs = new ConfigArray([
					{
						ignores: [directoryPath => directoryPath.includes('node_modules')]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules'), 'No trailing slash'), true); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules') + '/', 'Trailing slash'), true); ;

			});

			it('should return true when a directory is in ignores', () => {
				configs = new ConfigArray([
					{
						ignores: ['**/node_modules']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules'), 'No trailing slash'), true); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules') + '/', 'Trailing slash'), true); ;
				
			});

			it('should return true when a directory with a trailing slash is in ignores', () => {
				configs = new ConfigArray([
					{
						ignores: ['**/node_modules/']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules')), true); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules') + '/', 'Trailing slash'), true); ;
			});

			it('should return true when a directory followed by ** is in ignores', () => {
				configs = new ConfigArray([
					{
						ignores: ['**/node_modules/**']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules')), true); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules') + '/'), true); ;
				
			});

			it('should return false when there is a files entry', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js'],
						ignores: ['**/node_modules']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules')), false); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules') + '/', 'Trailing slash'), false); ;
			});

			it('should return true when directory matches and there is a negated pattern', () => {
				configs = new ConfigArray([
					{
						ignores: ['**/foo/', '!**/node_modules']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'foo')), true); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'foo') + '/', 'Trailing slash'), true); ;
			});

			it('should return false when directory doesn\'t match and there is a negated pattern', () => {
				configs = new ConfigArray([
					{
						ignores: ['**/foo/', '!**/node_modules']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'bar')), false); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'bar') + '/', 'Trailing slash'), false); ;
			});

			it('should return false when ignored directory is unignored', () => {
				configs = new ConfigArray([
					{
						ignores: [
							'foo/*',
							'!foo/bar'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'foo/bar')), false); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'foo/bar/')), false); ;
			});


			it('should return true when there is a directory relative to basePath in ignores', () => {
				configs = new ConfigArray([
					{
						ignores: ['foo/bar']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'foo/bar')), true); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'foo/bar') + '/', 'Trailing slash'), true); ;
			});

			it('should throw an error when the config array isn\'t normalized', () => {
				configs = new ConfigArray([
					{
						ignores: ['foo/bar']
					}
				], {
					basePath
				});
				assert.throws(() => {
					configs.isDirectoryIgnored('foo/bar');
				}, /normalized/);
			});

			it('should return true when the directory is outside of the basePath', () => {
				configs = new ConfigArray([
					{
						ignores: ['foo/bar']
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.resolve(basePath, '../foo/bar')), true); ;
			});

			it('should return true when the parent directory of a directory is ignored', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'foo'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'foo/bar')), true); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'foo/bar/')), true); ;
			});


			it('should return true when a directory in an ignored directory is later negated with **', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'**/node_modules/**'
						]
					},
					{
						ignores: [

							// this unignores  `node_modules/package/`, but its parent `node_modules/` is still ignored
							'!node_modules/package/**'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules/package')), true); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules/package/')), true); ;
			});

			it('should return false when a directory is later negated with **', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'**/node_modules/**'
						]
					},
					{
						ignores: [
							'!node_modules/**'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules')), false); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules/')), false); ;
			});

			it('should return true when a directory\'s content is later negated with *', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'**/node_modules/**'
						]
					},
					{
						ignores: [
							'!node_modules/*'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules')), true); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules/')), true); ;
			});

			it('should return true when an ignored directory is later unignored with *', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.js']
					},
					{
						ignores: [
							'**/node_modules/**'
						]
					},
					{
						ignores: [
							'!node_modules/package/*'
						]
					}
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules/package')), true); ;
				assert.strictEqual(configs.isDirectoryIgnored(path.join(basePath, 'node_modules/package/')), true); ;
			});

			// https://github.com/eslint/eslint/pull/16579/files
			describe('gitignore-style unignores', () => {

				it('should return false when first-level subdirectories are ignored and then one is negated', () => {
					configs = new ConfigArray([
						{
							ignores: [
								'**/node_modules/*',
								'!**/node_modules/foo/'
							],
						}
					], { basePath });

					configs.normalizeSync();
					const directoryPath = path.resolve(basePath, 'node_modules/foo');

					assert.strictEqual(configs.isDirectoryIgnored(directoryPath), false); ;
				});

				it('should return false when first-level subdirectories are ignored with leading slash and then one is negated', () => {
					configs = new ConfigArray([
						{
							ignores: [
								'/**/node_modules/*',
								'!**/node_modules/foo/'
							],
						}
					], { basePath });

					configs.normalizeSync();
					const directoryPath = path.resolve(basePath, 'node_modules/foo');

					assert.strictEqual(configs.isDirectoryIgnored(directoryPath), false); ;
				});

				it('should return true when all descendant subdirectories are ignored and then one is negated', () => {
					configs = new ConfigArray([
						{
							ignores: [
								'**/node_modules/**',
								'!**/node_modules/foo/'
							],
						}
					], { basePath });

					configs.normalizeSync();
					const directoryPath = path.resolve(basePath, 'node_modules/foo');

					assert.strictEqual(configs.isDirectoryIgnored(directoryPath), true); ;
				});

				it('should return true when all descendant subdirectories are ignored and then other descendants are negated', () => {
					configs = new ConfigArray([
						{
							ignores: [
								'**/node_modules/**',
								'!**/node_modules/foo/**'
							],
						}
					], { basePath });

					configs.normalizeSync();
					const directoryPath = path.resolve(basePath, 'node_modules/foo');

					assert.strictEqual(configs.isDirectoryIgnored(directoryPath), true); ;
				});
			});

		});

		describe('isExplicitMatch()', () => {

			it('should throw an error when not normalized', () => {
				const filename = path.resolve(basePath, 'foo.js');
				assert.throws(() => {
					unnormalizedConfigs.isExplicitMatch(filename);
				}, /normalized/);
			});

			it('should return true when passed JS filename', () => {
				const filename = path.resolve(basePath, 'foo.js');

				assert.strictEqual(configs.isExplicitMatch(filename), true); ;
			});

			it('should return true when passed HTML filename', () => {
				const filename = path.resolve(basePath, 'foo.html');

				assert.strictEqual(configs.isExplicitMatch(filename), true); ;
			});

			it('should return true when passed CSS filename', () => {
				const filename = path.resolve(basePath, 'foo.css');

				assert.strictEqual(configs.isExplicitMatch(filename), true); ;
			});

			it('should return true when passed EXE filename because it matches !.css', () => {
				const filename = path.resolve(basePath, 'foo.exe');

				assert.strictEqual(configs.isExplicitMatch(filename), true); ;
			});

			it('should return false when passed EXE filename because no explicit matches', () => {
				const filename = path.resolve(basePath, 'foo.exe');
				configs = new ConfigArray([
					{
						files: ['*.js']
					}
				], {
					basePath
				});
				configs.normalizeSync();

				assert.strictEqual(configs.isExplicitMatch(filename), false); ;
			});

			it('should return false when passed matching both files and ignores in a config', () => {
				configs = new ConfigArray([
					{
						files: ['**/*.xsl'],
						ignores: ['fixtures/test.xsl'],
						defs: {
							xsl: true
						}
					}
				], { basePath });

				configs.normalizeSync();
				const filename = path.resolve(basePath, 'fixtures/test.xsl');

				assert.strictEqual(configs.isExplicitMatch(filename), false); ;
			});

		});

		describe('files', () => {

			it('should throw an error when not normalized', () => {
				assert.throws(() => {
					unnormalizedConfigs.files;
				}, /normalized/);
			});

			it('should return all string pattern file from all configs when called', () => {
				const expectedFiles = configs.reduce((list, config) => {
					if (config.files) {
						list.push(...config.files);
					}

					return list;
				}, []);
				const files = configs.files;
				assert.deepStrictEqual(files, expectedFiles);

			});
		});

		describe('ignores', () => {

			it('should throw an error when not normalized', () => {
				assert.throws(() => {
					unnormalizedConfigs.ignores;
				}, /normalized/);
			});

			it('should return all ignores from all configs without files when called', () => {
				const expectedIgnores = configs.reduce((list, config) => {
					if (config.ignores && Object.keys(config).length === 1) {
						list.push(...config.ignores);
					}

					return list;
				}, []);
				const ignores = configs.ignores;
				assert.deepStrictEqual(ignores, expectedIgnores);

			});

			it('should ignore name field for when considering global ignores', () => {
				configs = new ConfigArray([
					{
						name: 'foo',
						ignores: ['ignoreme']
					},
				], {
					basePath
				});

				configs.normalizeSync();

				assert.strictEqual(configs.isFileIgnored(path.join(basePath, 'ignoreme/foo.js')), true); ;
				assert.deepStrictEqual(configs.ignores, ['ignoreme']);
			});
		});

		describe('push()', () => {

			it('should throw an error when normalized', () => {
				assert.throws(() => {
					configs.push({});
				}, /extensible/);
			});

		});

	});

});
