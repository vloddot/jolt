<!-- omit in toc -->

# Jolt

In physics, [jolt](<https://en.m.wikipedia.org/wiki/Jerk_(physics)>) is the rate at which an object's acceleration changes with respect to time. It is a vector quantity (having both magnitude and direction). Jolt is most commonly denoted by the symbol `j` and expressed in m/s<sup>3</sup> (SI units) or standard gravities per second (g<sub>0</sub>/s).

Custom [Revolt](https://www.github.com/revoltchat) client for desktop made in [Tauri](https://tauri.app) and [Solid.js](https://solidjs.com).

> This is currently a rewrite of the [old Svelte client](https://github.com/vloddot/jolt) in Solid.js.

<!-- omit in toc -->

## Table of Contents

- [Installation](#installation)
- [Running and compiling the project](#running-and-compiling-the-project)
- [Development Server](#development-server)
- [Links](#links)
- [Contributing](#contributing)

## Installation

To install, follow the [releases page](https://www.github.com/vloddot/jolt/releases) and pick out the version you need.

## Running and compiling the project

<!-- omit in toc -->

### Prerequisites

To compile or launch Jolt in a development server on your own machine, you're going to need a node package manager (NPM, Yarn, PNPM, etc.), first run the following command to install NPM packages: `pnpm install`. Then edit [`src-tauri/tauri.conf.json`](src-tauri/tauri.conf.json)'s `beforeDevCommand` and `beforeBuildCommand` keys to adapt to your package manager of choice.

If you want to run the desktop app on a development server, you're also going to need to install `cargo` (preferrably using [Rustup](https://rustup.rs)) then you need to install some packages, if you are using the [Nix package manager](<https://en.m.wikipedia.org/wiki/Nix_(package_manager)>), just run `nix develop` (recommended if you have the flakes experimental feature enabled) or `nix-shell shell.nix` (`cargo` not included). If not, you can find the prerequisites in the [`shell.nix`](shell.nix) or [`flake.nix`](flake.nix) files in the Nix language syntax. Otherwise, the packages to install are in `packages` and `libraries` keys and a bit of setup to add to a shellrc (`.bashrc`, `.zshrc`, etc.) is in the `shellHook` key. You also need to install the `tauri-cli` tool through cargo with:

```bash
cargo install tauri-cli
```

<!-- omit in toc -->

### Build Command

To build the desktop app (has to build the browser app with it; see below), execute this command:

```bash
cargo tauri build
```

> Once it is finished, you will find the build files in [`src-tauri/target/bundle`](src-tauri/target/bundle).

To build the browser app, execute this command:

```bash
pnpm run build # you can also adapt your favorite package manager
```

## Development Server

If you want to test the application before building it or installing the application through [GitHub Releases](https://github.com/vloddot/jolt/releases), you can run it in a development server. It will not have the best performance compared to the built executable.

Just run the following command:

```bash
cargo tauri dev
```

or if you want to run it in a browser:

```bash
pnpm run dev # you can also adapt your favorite package manager
```

## Links

- [Jolt Support Server on Revolt](https://rvlt.gg/fHNkmtwZ)
- [Tauri](https://tauri.app)
- [Solid.js](https://solidjs.com)

## Contributing

To contribute, make sure you follow the [CONTRIBUTING.md](CONTRIBUTING.md) guide.
