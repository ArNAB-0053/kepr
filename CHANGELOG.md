# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0](https://github.com/ArNAB-0053/kepr/compare/kepr-v0.1.0...kepr-v1.0.0) (2026-07-02)


### Added

* add markdown preview functionality and styles ([c189a91](https://github.com/ArNAB-0053/kepr/commit/c189a9132e3b4309309bd8d818428518ab5483c0))
* add MIT License to the repository ([bf36c67](https://github.com/ArNAB-0053/kepr/commit/bf36c67b2a07c6973e010db0c1404e70e4bb8ac0))
* add MIT License to the repository ([a289973](https://github.com/ArNAB-0053/kepr/commit/a2899739a1c03b6e77b17e91b49684b0c96b2996))
* add release workflow for extension deployment ([eea7782](https://github.com/ArNAB-0053/kepr/commit/eea778261b922e4bb335aa4f30e4cbd0e63abfaa))
* add release workflow for extension deployment ([ab4ceda](https://github.com/ArNAB-0053/kepr/commit/ab4ceda9766c2333c0cc1448fd7ad5d85a08ed93))
* enhance Home component with new icons and improved note display ([fa7dda4](https://github.com/ArNAB-0053/kepr/commit/fa7dda43b004500018d10bddc6299e18954ac993))
* improve GitHub settings handling and add default settings constant ([d4e4d79](https://github.com/ArNAB-0053/kepr/commit/d4e4d791f60a4eddf9e3b21f9edc5aace8e82b82))
* initial setup ([a5e5ab5](https://github.com/ArNAB-0053/kepr/commit/a5e5ab53adf66d7e2fb273eb9d22c2379fcc71a4))
* refactor code structure for improved readability and maintainability ([3c5b3e0](https://github.com/ArNAB-0053/kepr/commit/3c5b3e0a10973f57060a99b6840cc1602d38f13a))
* refactor code structure for improved readability and maintainability ([93b9fee](https://github.com/ArNAB-0053/kepr/commit/93b9fee60de70ece217ea8f478f96091d1af46e6))
* rename project from LeetPush to Kepr and update related configurations ([60e3360](https://github.com/ArNAB-0053/kepr/commit/60e3360c5505c8fc2535fda04c6d428f0a9c1d40))
* update release workflow configuration and add manifest files ([61e5945](https://github.com/ArNAB-0053/kepr/commit/61e5945fd13ab4a86ba8928fe28e40b7163ca302))
* update release workflow configuration and add manifest files ([169578e](https://github.com/ArNAB-0053/kepr/commit/169578e24defe4c4f20b04c4a0ffa2ef2d825990))
* update workflows to use latest action versions and improve release process ([4616dda](https://github.com/ArNAB-0053/kepr/commit/4616dda42cd47e69936f106ebc6d7f63a675a0ec))
* update workflows to use latest action versions and improve release process ([5441ce1](https://github.com/ArNAB-0053/kepr/commit/5441ce1b5884c6b7cbd81f0f81f3feb473f29129))


### Fixed

* 1:: add mount safeguard and restore test connection validation ([f0dbdeb](https://github.com/ArNAB-0053/kepr/commit/f0dbdeb4ed4f0aabdf0271b15316656a004977d1))
* versioning ([c8d0477](https://github.com/ArNAB-0053/kepr/commit/c8d047728b33f113fc1697b33fa69232b24144d2))
* versioning ([da8a020](https://github.com/ArNAB-0053/kepr/commit/da8a020a76fb123e6787a7747120a6dd8a2164a5))
* versioning issue ([0614f30](https://github.com/ArNAB-0053/kepr/commit/0614f30a5fbd9022440334bf812e53ea6891d223))
* versioning issue ([6cc9e6e](https://github.com/ArNAB-0053/kepr/commit/6cc9e6ef045c704a66b7659acc022b879498c46f))
* versioning issue ([2d32189](https://github.com/ArNAB-0053/kepr/commit/2d321898457ad26850fdb4e1e1575bc7be9073f0))


### Infrastructure

* add build validation workflow ([bc347c4](https://github.com/ArNAB-0053/kepr/commit/bc347c4a47b8dc484e5bdb3cdcc1bd78b1e1e9a1))
* add build validation workflow ([6ddb013](https://github.com/ArNAB-0053/kepr/commit/6ddb0138af1adc4d28104bf972e9af5315f0d481))
* release 1.0.0 ([89a1980](https://github.com/ArNAB-0053/kepr/commit/89a19805cd9b27a2874b2abec666df31eeb55bbd))

## [Unreleased]

## [1.0.0] - 2026-07-02

First stable public release of Kepr.

### Added
- MIT License to the repository.
- Markdown preview functionality for notes in extension popup.
- Default settings configuration constants for fallback handling.

### Changed
- Rebranded project from LeetPush to Kepr.
- Updated extension branding, icons, name, descriptions, and configurations.
- Refactored project directory structure and code organization.
- Updated popup Header to display the new Kepr logo icon instead of the generic code icon.
- Improved robustness of GitHub settings persistence and validation.

### Infrastructure
- Integrated Release Please for release automation setup.
- Configured release workflow configuration to use Release Please manifest-based setup (`release-please-config.json` and `.release-please-manifest.json`).
- Upgraded GitHub Actions workflows (build, release, submit) to use checkout@v4, setup-node@v4, setup-pnpm@v4.

## [0.1.0] - 2026-07-01

### Added
- GitHub repository synchronization.
- Notes support.
- Session tracking.
- Sync status tracking.
- Local storage service.

### Fixed
- Fixed settings page loading-state stability and unmounted component state update issues.
- Fixed Test Connection button validation issues.

### Infrastructure
- Added build validation workflow.
- Added release workflow for extension packaging.

[Unreleased]: https://github.com/ArNAB-0053/kepr/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ArNAB-0053/kepr/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/ArNAB-0053/kepr/releases/tag/v0.1.0
