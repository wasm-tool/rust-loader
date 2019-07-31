# @wasm-tool/rust-loader

> Webpack plugin for Rust

## Installation

```sh
yarn add --dev @wasm-tool/rust-loader
```

## Usage

It is *highly* recommended to use the [Rust Webpack Template](https://github.com/rustwasm/rust-webpack-template) to create a new Rust project.

----

But if you instead want to manually create the project yourself, follow these steps:

Create a `Cargo.toml` file which has the `cdylib` crate type:

```toml
[package]
name = "foo"
version = "0.1.0"
edition = "2018"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2.48"

[dependencies.web-sys]
version = "0.3.25"
features = ["console"]
```

And create a `src/lib.rs` file:

```rust
use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen(start)]
pub fn main_js() {
    console::log_1(&JsValue::from("Hello world!"));
}
```

Now add the loader to your `webpack.config.js` and import the `Cargo.toml` file:

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
