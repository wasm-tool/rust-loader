const $path = require("path");
const $child = require("child_process");
const $util = require("./util");


exports.build = async function (cwd, root, isDebug, name, target_dir) {
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

    await $util.wait($child.spawn("wasm-bindgen", args, { cwd: root, stdio: "inherit" }));

    return $path.join($path.relative(cwd, root), target_dir, "wasm-bindgen", name + ".js");
};
