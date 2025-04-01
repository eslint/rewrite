# Changelog

## [0.13.0](https://github.com/eslint/rewrite/compare/core-v0.12.0...core-v0.13.0) (2025-04-01)


### Features

* Set type for RuleDefinition.defaultOptions ([#173](https://github.com/eslint/rewrite/issues/173)) ([d5806df](https://github.com/eslint/rewrite/commit/d5806dfe5c2af849b84f39e3eb0300aaa7c29092))

## [0.12.0](https://github.com/eslint/rewrite/compare/core-v0.11.0...core-v0.12.0) (2025-02-21)


### Features

* Add meta.language and meta.dialects to RuleDefinition ([#156](https://github.com/eslint/rewrite/issues/156)) ([dac0387](https://github.com/eslint/rewrite/commit/dac0387fc3dd7e74811ae045ab782c70366bb14c))


### Bug Fixes

* Types to align with older ESLint types ([#155](https://github.com/eslint/rewrite/issues/155)) ([664740a](https://github.com/eslint/rewrite/commit/664740a8d4a93bee896cec3a661bf2072e893e24))

## [0.11.0](https://github.com/eslint/rewrite/compare/core-v0.10.0...core-v0.11.0) (2025-01-31)


### Features

* Update RuleDefinition for frozen and deprecations ([#149](https://github.com/eslint/rewrite/issues/149)) ([4964322](https://github.com/eslint/rewrite/commit/49643228d230f2d0edce6d2a310ccf3131b72d89))
* Update RuleDefinition with `meta.defaultOptions` ([#150](https://github.com/eslint/rewrite/issues/150)) ([e9a987e](https://github.com/eslint/rewrite/commit/e9a987e8d92a6383e9782332e515aa2a719a18af))


### Bug Fixes

* Make meta.replacedBy read only ([#146](https://github.com/eslint/rewrite/issues/146)) ([7dfc0d9](https://github.com/eslint/rewrite/commit/7dfc0d92e617108c0e9493f09db3f86919e02fd1))

## [0.10.0](https://github.com/eslint/rewrite/compare/core-v0.9.1...core-v0.10.0) (2025-01-09)


### Features

* Check messageIds in context.report() ([#140](https://github.com/eslint/rewrite/issues/140)) ([1c9ca4d](https://github.com/eslint/rewrite/commit/1c9ca4d0a4726218948a92ebc2e8be7a13d224d4))


### Bug Fixes

* make `plugin-kit` types usable in CommonJS ([#143](https://github.com/eslint/rewrite/issues/143)) ([f77ba17](https://github.com/eslint/rewrite/commit/f77ba177d4e4c5d2ed828cfd9a5149df2ccb3a7f))
* Update RuleDefinition type ([#138](https://github.com/eslint/rewrite/issues/138)) ([0a0ea6f](https://github.com/eslint/rewrite/commit/0a0ea6fbac827b354ee18f5b10eefad2bc0794f7))

## [0.9.1](https://github.com/eslint/rewrite/compare/core-v0.9.0...core-v0.9.1) (2024-12-04)


### Bug Fixes

* Update RuleVisitor type ([#135](https://github.com/eslint/rewrite/issues/135)) ([156d601](https://github.com/eslint/rewrite/commit/156d601181deb362a2864c4d47d4e3da8609500b))

## [0.9.0](https://github.com/eslint/rewrite/compare/core-v0.8.0...core-v0.9.0) (2024-11-14)


### Features

* Add Language#normalizeLanguageOptions() ([#131](https://github.com/eslint/rewrite/issues/131)) ([3591a78](https://github.com/eslint/rewrite/commit/3591a7805a060cb130d40d61f200431b782431d8))


### Bug Fixes

* non-optional properties in generic interfaces ([#132](https://github.com/eslint/rewrite/issues/132)) ([d0b2e70](https://github.com/eslint/rewrite/commit/d0b2e705c49709cfb92a9110c65cd628c91aaa29))

## [0.8.0](https://github.com/eslint/rewrite/compare/core-v0.7.0...core-v0.8.0) (2024-10-25)


### Features

* Add rule types ([#110](https://github.com/eslint/rewrite/issues/110)) ([ffa176f](https://github.com/eslint/rewrite/commit/ffa176f0c80c14c8ba088d2ba359af4b2805c4f5))

## [0.7.0](https://github.com/eslint/rewrite/compare/core-v0.6.0...core-v0.7.0) (2024-10-18)


### Features

* Add `Language.defaultLanguageOptions` ([#123](https://github.com/eslint/rewrite/issues/123)) ([1ecf0f8](https://github.com/eslint/rewrite/commit/1ecf0f88808a7629e06e949dea8eb1ec4fd2f472))

## [0.6.0](https://github.com/eslint/rewrite/compare/core-v0.5.0...core-v0.6.0) (2024-08-30)


### Features

* Add Directive and DirectiveType ([#112](https://github.com/eslint/rewrite/issues/112)) ([e5bbcf1](https://github.com/eslint/rewrite/commit/e5bbcf148874be07d5667f34ed395faaf8c72972))

## [0.5.0](https://github.com/eslint/rewrite/compare/core-v0.4.0...core-v0.5.0) (2024-08-27)


### Features

* Add plugin-kit package ([#99](https://github.com/eslint/rewrite/issues/99)) ([09ce430](https://github.com/eslint/rewrite/commit/09ce43073760b69a3bcca89f99793549cd566bf6))

## [0.4.0](https://github.com/eslint/rewrite/compare/core-v0.3.0...core-v0.4.0) (2024-08-12)


### Features

* add CommonJS `core` types ([#102](https://github.com/eslint/rewrite/issues/102)) ([6caa5e1](https://github.com/eslint/rewrite/commit/6caa5e1408d94387277abc65ff2b6d6b1d005488))

## [0.3.0](https://github.com/eslint/rewrite/compare/core-v0.2.0...core-v0.3.0) (2024-07-22)


### ⚠ BREAKING CHANGES

* Add getLoc/getRange to SourceCode interface ([#89](https://github.com/eslint/rewrite/issues/89))

### Features

* Add getLoc/getRange to SourceCode interface ([#89](https://github.com/eslint/rewrite/issues/89)) ([d51f979](https://github.com/eslint/rewrite/commit/d51f9791aecd9aa80136a0926e57549df9e25ab3))

## [0.2.0](https://github.com/eslint/rewrite/compare/core-v0.1.0...core-v0.2.0) (2024-07-11)


### Features

* Add more type definitions ([#81](https://github.com/eslint/rewrite/issues/81)) ([df3263b](https://github.com/eslint/rewrite/commit/df3263b336b663b22be32bf0c499a70b378b5021))

## [0.1.0](https://github.com/eslint/rewrite/compare/core-v0.0.1...core-v0.1.0) (2024-06-26)


### Features

* Add eslint/core package ([#68](https://github.com/eslint/rewrite/issues/68)) ([e3d309d](https://github.com/eslint/rewrite/commit/e3d309d93fefe4e10f40568e89f380159c7f63d3))
