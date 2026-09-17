const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);
const defaultBlockList = defaultConfig.resolver.blockList;
const config = {
  resolver: {
    // Git metadata and local backups are not app modules or assets. In
    // particular, writing a diagnostic screenshot must not trigger a refresh.
    blockList: [
      ...(Array.isArray(defaultBlockList)
        ? defaultBlockList
        : [defaultBlockList]),
      /[/\\]\.git[/\\].*/,
    ].filter(Boolean),
  },
};

module.exports = mergeConfig(defaultConfig, config);
