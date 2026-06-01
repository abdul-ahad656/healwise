const { withProjectBuildGradle } = require('expo/config-plugins');

/** Zego RN SDKs (express-video, zim, uikitreport) are hosted on maven.zego.im. */
function withZegoMavenRepository(config) {
  return withProjectBuildGradle(config, (config) => {
    const marker = 'maven.zego.im';
    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents = config.modResults.contents.replace(
        /maven \{ url 'https:\/\/www\.jitpack\.io' \}/,
        `maven { url 'https://www.jitpack.io' }\n    maven { url 'https://${marker}' }`
      );
    }
    return config;
  });
}

module.exports = withZegoMavenRepository;
