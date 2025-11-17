# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- TypeScript configuration now properly includes Node.js type definitions (removed restrictive `lib` option)
- ESLint configuration now correctly processes test files (added explicit exclude override in tsconfig.test.json)
- Platform-dependent test failure fixed by using consistently invalid IP address for error testing
- Redundant conditional logic in error handler simplified for better maintainability
- Missing `isPortAvailable` import added to advanced.js example file
- CLI argument parser now validates numeric inputs and provides clear error messages for invalid values

### Security
- Updated `rimraf` from v5.0.10 to v6.1.0 to resolve command injection vulnerability in transitive `glob` dependency
- Resolved prototype pollution vulnerability in `js-yaml` dependency
- All security vulnerabilities eliminated (npm audit shows 0 vulnerabilities)

### Changed
- Updated test expectations to match new CLI validation behavior

### Documentation
- Added comprehensive bug analysis documentation (BUG_ANALYSIS.md)
- Added detailed bug fix report (BUG_FIX_REPORT.md)
- Added executive summary of analysis and fixes (COMPREHENSIVE_ANALYSIS_SUMMARY.md)

## [1.0.0] - 2025-07-26

### Added
- Initial release
- Core port finding functionality with `findPort()` and `findPorts()`
- Port availability checking with `isPortAvailable()`
- Plugin system for custom validators
- Built-in validators: `common-ports` and `privileged`
- CLI tool with comprehensive options
- Full TypeScript support with strict mode
- Dual package support (CommonJS and ESM)
- 100% test coverage
- Zero runtime dependencies
- Comprehensive documentation and examples