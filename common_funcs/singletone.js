const exp = {
  container = {}
};

/**
 * singletone promise container
 * @param {string | number} input input of function
 * @param {function} worker worker function to retrun a promise
 * @param {object} options worker function to retrun a promise
 * @param {string} options.queue name of queue to hold promises
 * @param {number} options.timeout timeout of promise
 */
exp.spc = function(input, worker, options = {}) {
  options.queue = options.queue || "default";
  options.timeout = options.timeout || 15000;
  if (!exp.container[queue]) exp.container[queue] = [];
  let storeinput;
  if (typeof input == "object") {
    if (Array.isArray(input)) {
      storeinput = JSON.stringify([...input].sort((a, b) => (a > b ? 1 : -1)));
    } else if (input) {
      storeinput = JSON.stringify(
        Object.keys(input)
          .sort((a, b) => (a > b ? 1 : -1))
          .reduce((res, c) => ({ ...res, [c]: input[c] }), {})
      );
    }
  } else {
    storeinput = input;
  }
  let prev = exp.container[queue].find(c => c.input == storeinput);
  if (prev) return prev.result;
  let timeoutpromise = new Promise((res, rej) => setTimeout(rej, timeout));
  let result = Promise.race([worker(input), timeoutpromise]);
  exp.container[queue].push({ input, result });
  result.finally(() => {
    exp.container[queue] = exp.container.filter(c => c.input != input);
  });
};

module.exports = exp;
