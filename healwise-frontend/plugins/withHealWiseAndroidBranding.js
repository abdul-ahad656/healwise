const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/** Force Android launcher label and Gradle project name to match expo.name (HealWise). */
function withHealWiseAndroidBranding(config) {
  const appName = config.name || 'HealWise';

  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;

      const stringsPath = path.join(
        projectRoot,
        'app/src/main/res/values/strings.xml'
      );
      if (fs.existsSync(stringsPath)) {
        const content = fs.readFileSync(stringsPath, 'utf8').replace(
          /<string name="app_name">.*?<\/string>/,
          `<string name="app_name">${appName}</string>`
        );
        fs.writeFileSync(stringsPath, content);
      }

      const settingsPath = path.join(projectRoot, 'settings.gradle');
      if (fs.existsSync(settingsPath)) {
        const settings = fs
          .readFileSync(settingsPath, 'utf8')
          .replace(/rootProject\.name = '.*'/, `rootProject.name = '${appName}'`);
        fs.writeFileSync(settingsPath, settings);
      }

      return config;
    },
  ]);
}

module.exports = withHealWiseAndroidBranding;
