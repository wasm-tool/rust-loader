const $fs = require("fs");
const $child = require("child_process");


exports.mkdir = function (path) {
    return new Promise((resolve, reject) => {
        $fs.mkdir(path, { recursive: true }, (err) => {
            if (err) {
                reject(err);

            } else {
                resolve();
            }
        });
    });
};

exports.readdir = function (path) {
    return new Promise((resolve, reject) => {
        $fs.readdir(path, (err, files) => {
            if (err) {
                reject(err);

            } else {
                resolve(files);
            }
        });
    });
};

exports.wait = function (p) {
    return new Promise((resolve, reject) => {
        p.on("close", (code) => {
            if (code === 0) {
                resolve();

            } else {
                reject(new Error("Command `" + p.spawnargs.join(" ") + "` failed with error code: " + code));
            }
        });

        p.on("error", reject);
    });
};

exports.exec = function (str, options) {
    return new Promise((resolve, reject) => {
        $child.exec(str, options, (err, stdout, stderr) => {
            if (err != null) {
                reject(err);

            } else if (stderr) {
                reject(new Error("Command `" + str + "` failed with:\n" + stderr));

            } else {
                resolve(stdout);
            }
        });
    });
};


let build_locked = false;
let build_locks = [];

// TODO figure out a way to make this more efficient ?
exports.lock = async function (f) {
    if (build_locked) {
        await new Promise((resolve, reject) => {
            build_locks.push(resolve);
        });
    }

    build_locked = true;

    try {
        return await f();

    } finally {
        if (build_locks.length === 0) {
            build_locked = false;

        } else {
            build_locks.shift()();
        }
    }
};


const tokens = {};

exports.acquire_token = function (name) {
    if (tokens[name]) {
        tokens[name].cancelled = true;
    }

    return tokens[name] = {
        name,
        cancelled: false
    };
};

exports.release_token = function (token) {
    token.cancelled = true;

    if (tokens[token.name] === token) {
        delete tokens[token.name];
    }
};
