/**
 * Executes a promise-producing function without blocking
 * the main request cycle. Any errors are safely caught.
 */
module.exports.asyncTaskRunner = (fn) => {
  // schedule microtask, don't block request cycle
  Promise.resolve()
    .then(() => fn())
    .catch((err) => {
      console.error("asyncTaskRunner error:", err);
    });
};
