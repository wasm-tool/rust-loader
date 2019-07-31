const $toml = require("toml");
const $path = require("path");
const $child = require("child_process");
const $util = require("./util");


async function build(cwd, isDebug, name) {
    const args = [
        "build",
        "--lib",
        "--package", name,
        "--target", "wasm32-unknown-unknown"
    ];

    if (!isDebug) {
        args.push("--release");
    }

    try {
        await $util.wait($child.spawn("cargo", args, { cwd, stdio: "inherit" }));

    } catch (e) {
        throw new Error("Rust compilation failed.");
    }
}


async function wasm_pack(cwd, isDebug, name, target_dir) {
    const args = [
        // TODO adjust based on Webpack's error report level
        "--log-level", "error",
        "build",
        "--no-typescript",
        "--target", "bundler",
        "--out-dir", $path.join(target_dir, "wasm-pack"),
        "--out-name", name,
        (isDebug ? "--dev" : "--release")
    ];

    await $util.wait($child.spawn("wasm-pack", args, { cwd, stdio: "inherit" }));

    return $path.join(target_dir, "wasm-pack", name + ".js");
}


async function wasm_bindgen(cwd, isDebug, name, target_dir) {
    await build(cwd, isDebug, name);

    const args = [
        "--out-dir", $path.join(target_dir, "wasm-bindgen"),
        "--target", "bundler",
        "--no-typescript",
        $path.join(
            target_dir,
            "wasm32-unknown-unknown",
            (isDebug ? "debug" : "release"),
            name + ".wasm"
        )
    ];

    await $util.wait($child.spawn("wasm-bindgen", args, { cwd, stdio: "inherit" }));

    return $path.join(target_dir, "wasm-bindgen", name + ".js");
}


// TODO this.sourceMap
// TODO this.target
async function run(cx, source) {
    const cwd = cx.context;
    const root = cx.rootContext;
    const isDebug = (cx.mode !== "production");

    // This is used to cancel things if the same file is compiled multiple times quickly
    const token = $util.acquire_token(cx.resource);

    try {
        return await $util.lock(async () => {
            if (token.cancelled) {
                return null;
            }

            const toml = $toml.parse(source);

            const name = toml.package.name;

            // TODO figure out a better way to handle these
            // TODO test whether this causes any issues with file watching, or whether these should be moved to the top

            // When compiling a sub-crate (which is inside of a workspace),
            // this will cause it to watch the root Cargo.toml
            cx.addDependency($path.join(root, "Cargo.toml"));

            // This will cause it to watch for any changes to the src files
            cx.addContextDependency($path.join(cwd, "src"));

            // TODO retrieve the actual target directory
            const target_dir = $path.join($path.relative(cwd, root), "target");

            const filepath = await wasm_pack(cwd, isDebug, name, target_dir);

            if (token.cancelled) {
                return null;
            }

            return 'import(' + JSON.stringify("./" + filepath) + ').catch(console.error);';
        });

    } finally {
        $util.release_token(token);
    }
}

module.exports = function (source) {
    var callback = this.async();

    run(this, source)
        .then((x) => {
            callback(null, x);
        })
        .catch((e) => {
            e.stack = "";
            callback(e);
        });
};
