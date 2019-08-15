/**
 * @typedef {Object} CreateActionOptions
 * @property {Condition[]=} conditions Array of conditions
 */

/**
 * @typedef {Promise} Action
 */

/**
 * Create a new action
 * @param {Condition[]|CreateActionOptions=} opts Options for the action
 * @returns {Action} Prepared action, which is basically an extended Promise
 * @example
 *  createAction([
 *    whenTruthy(someFunc),
 *    whileFalsy(anotherFunc)
 *  ])
 */
function createAction(opts = {}) {
    const { conditions = [] } = Array.isArray(opts) ? { conditions: opts } : opts;
    let validated = false;
    const promise = new Promise(resolve => {
        const check = () => {
            if (conditions.every(cond => cond.isActivated())) {
                resolve();
                validated = true;
                conditions.forEach(condition => {
                    condition.cleanup();
                });
            }
        };
        conditions.forEach(condition => {
            condition.onActivated(check);
        });
    });
    Object.assign(promise, {
        /**
         * Check if the action is validated
         * @returns {Boolean}
         * @memberof Action
         */
        isValidated: () => validated
    });
    return promise;
}

/**
 * @typedef {Object} Emitter
 */

/**
 * Create new emitter
 * Works like an action, but emits evens rather than resolving a promise. This
 * is useful for continually checking for a window (all conditions active).
 * @param {Condition[]|CreateActionOptions=} opts Options for the action
 * @returns {Emitter}
 */
function createEmitter(opts = {}) {
    const { conditions = [] } = Array.isArray(opts) ? { conditions: opts } : opts;
    const onActiveCallbacks = [];
    const check = () => {
        if (conditions.every(cond => cond.isActivated())) {
            onActiveCallbacks.forEach(cb => {
                try {
                    cb();
                } catch (err) {}
            });
        }
    };
    conditions.forEach(condition => {
        condition.onActivated(check);
    });
    return {
        /**
         * Clean up all conditions
         * @memberof Emitter
         */
        cleanup: () => {
            conditions.forEach(condition => {
                condition.cleanup();
            });
        },
        /**
         * Attach a callback that fires when all conditions are active
         * @param {Function} cb Callback to attach
         * @memberof Emitter
         */
        onActive: cb => {
            onActiveCallbacks.push(cb);
            return () => {
                const index = onActiveCallbacks.indexOf(cb);
                if (index >= 0) {
                    onActiveCallbacks.splice(index, 1);
                }
            };
        }
    };
}

module.exports = {
    createAction,
    createEmitter
};
