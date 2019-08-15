const { createReaction } = require("../../source/condition.js");
const { createAction } = require("../../source/action.js");

function newControlledPromise() {
    let resolve, reject;
    const prom = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    Object.assign(prom, {
        resolve, reject
    });
    return prom;
}

describe("action", function() {
    describe("createAction", function() {
        describe("created action", function() {
            it("resolves once everything is validated", function() {
                let value = false;
                const action = createAction([
                    createReaction(() => value)
                ]);
                const control = newControlledPromise();
                setTimeout(() => {
                    if (action.isValidated()) {
                        control.reject(new Error("Reaction should not have validated so early"));
                        return;
                    }
                    control.resolve();
                    value = true;
                }, 250);
                return Promise.all([action, control]);
            });
        });
    });
});
