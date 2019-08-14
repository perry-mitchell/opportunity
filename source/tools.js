function isPromise(item) {
    return item && typeof item === "object" && typeof item.then === "function";
}

module.exports = {
    isPromise
};
