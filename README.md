# @wasm-tool/rust-loader

> Webpack plugin for Rust

## Installation

```sh
yarn add --dev @wasm-tool/rust-loader
```

### `wasm-bindgen`

You need to run `cargo install wasm-bindgen-cli -f --version {VERSION}` to install wasm-bindgen.

The `{VERSION}` must match the version of `wasm-bindgen` in your `Cargo.lock`.

## Usage

Add the loader in your `webpack.config.js` and import the `Cargo.toml` file:

```js
module.exports = {
  entry: {
    index: "./Cargo.toml"
  },
  module: {
    rules: [{ test: /Cargo\.toml$/, use: "@wasm-tool/rust-loader" }]
  }
};
```

Then just run `webpack` as usual.

It also fully supports `webpack-dev-server` (including live reloading):

```js
module.exports = {
  entry: {
    index: "./Cargo.toml"
  },
  devServer: {
    liveReload: true,
    open: true,
    noInfo: true,
    overlay: true
  },
  module: {
    rules: [{ test: /Cargo\.toml$/, use: "@wasm-tool/rust-loader" }]
  }
};
```
