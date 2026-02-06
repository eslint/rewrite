# Changelog

## [1.1.0](https://github.com/eslint/rewrite/compare/core-v1.0.1...core-v1.1.0) (2026-01-29)


### Features

* Add custom rule type helpers to `@eslint/plugin-kit` ([#355](https://github.com/eslint/rewrite/issues/355)) ([8ac8530](https://github.com/eslint/rewrite/commit/8ac853046aa1d4288d06d639be234c09988ade5e))

## [1.0.1](https://github.com/eslint/rewrite/compare/core-v1.0.0...core-v1.0.1) (2026-01-08)


### Bug Fixes

* make `data` property stricter ([#327](https://github.com/eslint/rewrite/issues/327)) ([26e6a50](https://github.com/eslint/rewrite/commit/26e6a50b85bb07b24244095e38e649f746508765))
* remove `category` property from `RulesMetaDocs` interface ([#345](https://github.com/eslint/rewrite/issues/345)) ([b197f00](https://github.com/eslint/rewrite/commit/b197f00f30f96fce72aca4537c2863eaefd83d43))
* remove `experimentalObjectRestSpread` option from types ([#343](https://github.com/eslint/rewrite/issues/343)) ([e3533bc](https://github.com/eslint/rewrite/commit/e3533bcf06a9bc36502fff260f827a289b9c2059))

## [1.0.0](https://github.com/eslint/rewrite/compare/core-v0.17.0...core-v1.0.0) (2025-11-14)


### ⚠ BREAKING CHANGES

* Remove deprecated RuleContext methods ([#263](https://github.com/eslint/rewrite/issues/263))
* remove deprecated `nodeType` property ([#265](https://github.com/eslint/rewrite/issues/265))
* Require Node.js ^20.19.0 || ^22.13.0 || >=24 ([#297](https://github.com/eslint/rewrite/issues/297))

### Features

* Require Node.js ^20.19.0 || ^22.13.0 || &gt;=24 ([#297](https://github.com/eslint/rewrite/issues/297)) ([acc623c](https://github.com/eslint/rewrite/commit/acc623c807bf8237a26b18291f04dd99e4e4981a))


### Bug Fixes

* remove deprecated `nodeType` property ([#265](https://github.com/eslint/rewrite/issues/265)) ([7d6a2a8](https://github.com/eslint/rewrite/commit/7d6a2a8dfb73203790403dea240669b6ab543340))
* Remove deprecated RuleContext methods ([#263](https://github.com/eslint/rewrite/issues/263)) ([0455323](https://github.com/eslint/rewrite/commit/0455323682227ba2e219645a49c20085ab76cbf0))

## [0.17.0](https://github.com/eslint/rewrite/compare/core-v0.16.0...core-v0.17.0) (2025-10-27)


### Features

* export additional core types ([#304](https://github.com/eslint/rewrite/issues/304)) ([5ccde5b](https://github.com/eslint/rewrite/commit/5ccde5bc9442c572d740c063fcb50392bf13c3db))


### Bug Fixes

* require `fix` in suggestion objects ([#298](https://github.com/eslint/rewrite/issues/298)) ([02bac50](https://github.com/eslint/rewrite/commit/02bac50b8a053f12a97afbe65b126ccd2c469d9e))

## [0.16.0](https://github.com/eslint/rewrite/compare/core-v0.15.2...core-v0.16.0) (2025-09-16)


### Features

* Add config types in @eslint/core ([#237](https://github.com/eslint/rewrite/issues/237)) ([7b6dd37](https://github.com/eslint/rewrite/commit/7b6dd370a598ea7fc94fba427a2579342b50b90f))


### Bug Fixes

* remove unsupported `nodeType` from types ([#268](https://github.com/eslint/rewrite/issues/268)) ([d800559](https://github.com/eslint/rewrite/commit/d8005593158f55ba32f5279f3385db95ab87075a))

## [0.15.2](https://github.com/eslint/rewrite/compare/core-v0.15.1...core-v0.15.2) (2025-08-05)


### Bug Fixes

* relax type for rule.meta.docs.recommended ([#235](https://github.com/eslint/rewrite/issues/235)) ([9a4fe34](https://github.com/eslint/rewrite/commit/9a4fe343c309b7a000ffb5cd420b557809e4d58e))

## [0.15.1](https://github.com/eslint/rewrite/compare/core-v0.15.0...core-v0.15.1) (2025-06-25)


### Bug Fixes

* Allow RuleConfig to have array with just severity ([#228](https://github.com/eslint/rewrite/issues/228)) ([c5f92fa](https://github.com/eslint/rewrite/commit/c5f92fa147ecad74164266c374f47ee217c7ccb7))

## [0.15.0](https://github.com/eslint/rewrite/compare/core-v0.14.0...core-v0.15.0) (2025-06-09)


### Features

* Add extendable config types ([#210](https://github.com/eslint/rewrite/issues/210)) ([3089754](https://github.com/eslint/rewrite/commit/3089754848c1acd30368424271810cc9703a6cd4))

## [0.14.0](https://github.com/eslint/rewrite/compare/core-v0.13.0...core-v0.14.0) (2025-04-30)


### Features

* add core types for language-specific rule definitions ([#178](https://github.com/eslint/rewrite/issues/178)) ([fd9b571](https://github.com/eslint/rewrite/commit/fd9b571554085cb5ea9f9831a38650a49dfebb32))
* make `TextSourceCodeBase` a generic type ([#182](https://github.com/eslint/rewrite/issues/182)) ([484b6ca](https://github.com/eslint/rewrite/commit/484b6ca3149354736317fca09efd3156caa4f4f9))

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
