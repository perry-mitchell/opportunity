const sleep = require("sleep-promise");
const { createReaction } = require("../../source/condition.js");
const { createAction, createEmitter } = require("../../source/action.js");

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
        describe("instance", function() {
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

    describe("createEmitter", function() {
        describe("instance", function() {
            it("emits a single event when activated", function() {
                const emitter = createEmitter([
                    createReaction(() => true)
                ]);
                const spy = sinon.spy();
                emitter.onActive(spy);
                return sleep(250).then(() => {
                    expect(spy.callCount).to.equal(1);
                    emitter.cleanup();
                });
            });

            it("emits a single event when deactivated", function() {
                let value = true;
                const emitter = createEmitter([
                    createReaction(() => value)
                ]);
                const spy = sinon.spy();
                emitter.onInactive(spy);
                return sleep(250)
                    .then(() => {
                        value = false;
                        return sleep(250);
                    })
                    .then(() => {
                        expect(spy.callCount).to.equal(1);
                        emitter.cleanup();
                    });
            });
        });
    });
});
