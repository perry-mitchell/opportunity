const { isPromise } = require("./tools.js");

/**
 * @typedef {Object} Condition
 */

/**
 * Create a new condition
 * @returns {Condition}
 */
function createCondition() {
    let activatedCallbacks = [];
    let deactivatedCallbacks = [];
    let isActivated = false;
    return {
        /**
         * Activate the condition (set state to true)
         * @memberof Condition
         */
        activate: () => {
            const changed = isActivated === false;
            isActivated = true;
            if (changed) {
                [...activatedCallbacks].forEach(cb => {
                    try {
                        cb();
                    } catch (err) {}
                });
            }
        },
        /**
         * Clean up the condition, stopping all callbacks and timers
         * @memberof Condition
         */
        cleanup: () => {
            activatedCallbacks = [];
            deactivatedCallbacks = [];
        },
        /**
         * Deactivate the condition (set state to false)
         * @memberof Condition
         */
        deactivate: () => {
            const changed = isActivated === true;
            isActivated = false;
            if (changed) {
                [...deactivatedCallbacks].forEach(cb => {
                    try {
                        cb();
                    } catch (err) {}
                });
            }
        },
        /**
         * Check if the condition is activated (state)
         * @returns {Boolean}
         * @memberof Condition
         */
        isActivated: () => {
            return isActivated;
        },
        /**
         * Attach a callback that fires upon activation
         * @param {Function} cb The callback to fire
         * @returns {Function} Returns a removal function to disable the callback
         * @memberof Condition
         */
        onActivated: cb => {
            activatedCallbacks.push(cb);
            return () => {
                const index = activatedCallbacks.indexOf(cb);
                if (index >= 0) {
                    activatedCallbacks.splice(index, 1);
                }
            };
        },
        /**
         * Attach a callback that fires upon de-activation
         * @param {Function} cb The callback to fire
         * @returns {Function} Returns a removal function to disable the callback
         * @memberof Condition
         */
        onDeactivated: cb => {
            deactivatedCallbacks.push(cb);
            return () => {
                const index = deactivatedCallbacks.indexOf(cb);
                if (index >= 0) {
                    deactivatedCallbacks.splice(index, 1);
                }
            };
        }
    };
}

/**
 * @typedef {Object} CreateReactionOptions
 * @property {Number=} delay Delay, in milliseconds, between checks of the callback result.
 *  If the callback returns a Promise, the delay counter is halted so that the result of
 *  the promise can be checked.
 * @property {Function=} validate The validation function for checking the callback's
 *  result. It should return true or false based upon the desired outcome of the callback
 *  with respect to the state of the condition.
 */

/**
 * Create a new reaction condition (reacts to a callback's result)
 * @param {Function} cb The callback function to monitor
 * @param {CreateReactionOptions=} opts Creation options for the condition
 * @returns {Condition}
 */
function createReaction(cb, opts = {}) {
    const {
        delay = 200,
        validate = val => !!val
    } = opts;
    const condition = createCondition();
    let running = true;
    function performCheck() {
        let result;
        try {
            result = cb();
        } catch (err) {
            condition.deactivate();
            resetTimer();
            return;
        }
        if (isPromise(result)) {
            result
                .then(res => {
                    if (validate(res)) {
                        condition.activate();
                    } else {
                        condition.deactivate();
                    }
                    resetTimer();
                })
                .catch(() => {
                    condition.deactivate();
                    resetTimer();
                });
        } else {
            if (validate(result)) {
                condition.activate();
            } else {
                condition.deactivate();
            }
            resetTimer();
        }
    }
    const resetTimer = () => {
        clearTimeout(timer);
        if (running) {
            timer = setTimeout(performCheck, delay);
        }
    };
    let timer = setTimeout(performCheck, 0);
    const oldCleanup = condition.cleanup;
    condition.cleanup = () => {
        clearTimeout(timer);
        running = false;
        oldCleanup();
    };
    return condition;
}

/**
 * Create a condition that waits for a callback to result in a falsy value
 * (checks continuously UNTIL the result is falsy - no further checks
 * occur after this)
 * @param {Function} cb The callback to monitor
 * @param {CreateReactionOptions=} opts Creation options
 * @returns {Condition}
 */
function whenFalsy(cb, opts = {}) {
    const condition = whileFalsy(cb, opts);
    condition.onActivated(() => {
        condition.cleanup();
    });
    return condition;
}

/**
 * Create a condition that waits for a promise (or callback that returns
 * a promise) to complete
 * @param {Function<Promise>|Promise} cbOrPromise Callback or Promise to check
 * @param {Boolean=} mustResolve Whether or not the promise must resolve for
 *  this check to be a success. Defaults to false (promise just has to complete
 *  for activation to happen). If set to true, the promise must resolve for
 *  activation to occur.
 * @returns {Condition}
 */
function whenFinished(cbOrPromise, mustResolve = false) {
    const condition = createCondition();
    const promise = isPromise(cbOrPromise) ? cbOrPromise : cbOrPromise();
    if (!isPromise(promise)) {
        throw new Error("Failed creating 'whenFinished' condition: Resulting value is not a promise");
    }
    promise
        .then(() => {
            condition.activate();
        })
        .catch(() => {
            if (mustResolve) {
                condition.deactivate();
            } else {
                condition.activate();
            }
        });
    return condition;
}

/**
 * Create a condition that waits for a callback to result in a truthy value
 * (checks continuously UNTIL the result is truthy - no further checks
 * occur after this)
 * @param {Function} cb The callback to monitor
 * @param {CreateReactionOptions=} opts Creation options
 * @returns {Condition}
 */
function whenTruthy(cb, opts = {}) {
    const condition = whileTruthy(cb, opts);
    condition.onActivated(() => {
        condition.cleanup();
    });
    return condition;
}

/**
 * Create a condition that waits for a callback to result in a falsy value
 * (checks promises and callbacks periodically, and updates the state as
 * the result changes) (continuous)
 * @param {Function} cb The callback to monitor
 * @param {CreateReactionOptions=} opts Creation options
 * @returns {Condition}
 */
function whileFalsy(cb, opts = {}) {
    return createReaction(cb, Object.assign({}, opts, {
        validate: val => !val
    }));
}

/**
 * Create a condition that waits for a callback to result in a truthy value
 * (checks promises and callbacks periodically, and updates the state as
 * the result changes) (continuous)
 * @param {Function} cb The callback to monitor
 * @param {CreateReactionOptions=} opts Creation options
 * @returns {Condition}
 */
function whileTruthy(cb, opts = {}) {
    return createReaction(cb, Object.assign({}, opts, {
        validate: val => !!val
    }));
}

module.exports = {
    createCondition,
    createReaction,
    whenFalsy,
    whenFinished,
    whenTruthy,
    whileFalsy,
    whileTruthy
};
