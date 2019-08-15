# Opportunity
> Action execution control using conditional checks - _Opportunities_

[![Build Status](https://travis-ci.org/perry-mitchell/opportunity.svg?branch=master)](https://travis-ci.org/perry-mitchell/opportunity) [![npm version](https://badge.fury.io/js/opportunity.svg)](https://www.npmjs.com/package/opportunity)

## About

**Opportunity** provides an asynchronous toolkit with which to manage promises and the actions they're ultimately responsible for executing. The **actions** and **conditions** provided by this library allow for the creation of complex asynchronous "stops", which are only triggered (allowing a promise chain or asynchronous procedure to continue) when all conditions for an action (opportunity) are validated (truthy).

Take a promise chain with a complex step that needs several dependencies to be in the correct state:

![Promise chain with asynchronous dependencies](https://github.com/perry-mitchell/opportunity/blob/master/diagram-opportunity-blocked.jpg?raw=true)

**Opportunity** provides a simple API for checking dependencies (functions, values etc.) to ensure they're all correct before continuing. Once they're all valid (at one point in time, as they're continuously checked), the action can execute:

![Promise resolving based upon valid checks](https://github.com/perry-mitchell/opportunity/blob/master/diagram-opportunity-accepted.jpg?raw=true)

Helper methods are provided to make checking states easier. Of course a condition can be controlled and triggered manually quite easily, but sometimes you need to check the result of an asynchronous function, and this is where the helper functions come in handy:

![Helper functions check state asynchronously](https://github.com/perry-mitchell/opportunity/blob/master/diagram-opportunity-conditions.jpg?raw=true)

## Usage

Let's look at a basic example:

```javascript
const { createAction, whenTruthy, whileFalsy } = require("opportunity");

function someTask() {
    return prefetchSomething()
        .then(createAction([
            whenTruthy(fetchValueFromAPI),
            whileFalsy(pageIsInactive)
        ]))
        .then(finalise);
}
```

Here the Promise chain returned by `someTask()` is halted while the created action is inactive. Once activated, the promise will resolve and the chain will continue. The action depends on two conditions created by `whenTruthy` and `whileFalsy`. These are **helpers**, and they check functions or promises for their return value. Once a value is returned (either synchronously or asynchronously), the state of the condition is updated. If _all_ conditions are in the `true` (active) state, the action will be triggered.
