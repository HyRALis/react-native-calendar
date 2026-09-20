module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['coverage/'],
  rules: { 'no-void': ['error', { allowAsStatement: true }] },
};
