module.exports = {
  // These environments contain lists of global variables which are allowed to be accessed
  env: {
    // According to https://node.green, the target node version (v10) supports all important ES2018 features. But es2018
    // is not an option since it presumably doesn't introduce any new globals over ES2017.
    es2017: true,
    node: true,
    mocha: true,
  },
  rules: {
    // These rules dont like the use of devDependencies - which test code uses often.
    'node/no-unpublished-require': 0,
    'node/no-missing-require': 0,
  },
};
