# Changelog

## [0.10.1] - 2021-09-08

### Fixed

- Weird effect on first modal show caused by the delay of DOM querySelector and node injection running after angular rendering

### Chores

- Use [uhtml](https://github.com/WebReflection/uhtml) to handle DOM and have a much less verbose code

## [0.10.0] - 2021-09-07

### Added

- diaspora*, Friendica and Plesmora

### Fixed

- Broken link update to share on filter timestamp & checkboxes

### Chores

- Migration from Webpack 5 to Vite
- Optimization of MutationObserver and querySelector usage

## [0.9.1] - 2021-09-02

### Added

- Gd language support

### Fixed

- Remove a single quote in key translation + use apostrophe instead of single quote for possessive form

## [0.9.0] - 2021-08-29

### Added

- Ability to add multiple services and select them from plugin settings
- Improve display
- Fediverse / custom domain support
- Mastodon, Reddit, WordPress (with [Press It](https://codex.wordpress.org/Press_It)) and Tumblr services
- Update LinkedIn sharer link
- Update Readme for requesting services

## [0.8.3] - 2021-08-28

### Added

- Fr language support

- Support for PeerTube 3.2.0 watch playlist view

- Merge [fork](https://github.com/kontrollanten/peertube-plugin-social-sharing) by [@Kontrollanten](https://github.com/kontrollanten)

  - Support for PeerTube 3.2.0
  - Service name below share icon links
  - MeWe service
  - LikedIn servive
  - Gab service
  - A prefix « Share on » into icon title
  - Colorize icons on non-hover

- Support for PeerTube 3.0.1

### Fixed

- Broken TabObserver
- Duplicated icon links on watch playlist view
- Broken display of icon links on my-library/video-playlists route

### Chores

- Migration from Webpack v4 to v5

## [0.2.0] - 2020-08-28

### Added

- Update link to share on filter timestamp & checkboxes
- Improve display

## [0.1.5] - 2020-06-14

### Initial release
