const { withAndroidStyles, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const TRANSPARENT_SPLASH_LOGO = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
  <size android:width="1dp" android:height="1dp" />
  <solid android:color="@android:color/transparent" />
</shape>
`;

/** Blank native Android splash (background only, no logo flash). */
function withBlankAndroidSplash(config) {
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const drawableDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/drawable'
      );
      fs.mkdirSync(drawableDir, { recursive: true });
      fs.writeFileSync(
        path.join(drawableDir, 'splashscreen_logo.xml'),
        TRANSPARENT_SPLASH_LOGO
      );
      return config;
    },
  ]);

  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;
    const splashStyle = styles.resources.style?.find(
      (style) => style.$?.name === 'Theme.App.SplashScreen'
    );

    if (splashStyle?.item) {
      splashStyle.item = splashStyle.item.filter(
        (item) => item.$?.name !== 'android:windowSplashScreenBehavior'
      );
    }

    return config;
  });
}

module.exports = withBlankAndroidSplash;
