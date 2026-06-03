const { getDefaultConfig } = require('expo/metro-config');

/** Plain Expo Metro — NativeWind was removed (no className usage; empty input hung Tailwind on export/EAS). */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

module.exports = config;
