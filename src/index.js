const $path = require("path");
const $child = require("child_process");
const $util = require("./util");
const $wasm_bindgen = require("./wasm-bindgen");


async function get_name(cwd) {
    // TODO figure out a better way to get the current name
    const json = await $util.exec("cargo read-manifest", { cwd });
    return JSON.parse(json).name;
}


async function build(cwd, isDebug, name) {
    const args = [
        "build",
        "--lib",
        "--package", name,
        "--color", "always",
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


// TODO this.sourceMap
// TODO this.target
async function run(cx) {
    const cwd = cx.context;
    const root = cx.rootContext;
    const isDebug = (cx.mode !== "production");

    const target_dir = $path.relative(root, "target");

    // TODO figure out a better way to handle this
    cx.addContextDependency($path.join(cwd, "src"));

    const token = $util.acquire_token(cx.resource);

    try {
        return await $util.lock(async () => {
            if (token.cancelled) {
                return null;
            }

            const name = await get_name(cwd);

            if (token.cancelled) {
                return null;
            }

            await build(cwd, isDebug, name);

            if (token.cancelled) {
                return null;
            }

            const filepath = await $wasm_bindgen.build(cwd, root, isDebug, name, target_dir);

            if (token.cancelled) {
                return null;
            }

            return 'import(' + JSON.stringify("./" + filepath) + ').then(console.error);';
        });

    } finally {
        $util.release_token(token);
    }
}

module.exports = function () {
    var callback = this.async();

    run(this)
        .then((x) => {
            callback(null, x);
        })
        .catch((e) => {
            e.stack = "";
            callback(e);
        });
};
