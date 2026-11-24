const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Hardware features the app works fine without, but which Android marks as
 * REQUIRED in the merged manifest:
 *
 * - `android.hardware.screen.portrait` — implied by the activity's
 *   `android:screenOrientation="portrait"` (from `expo.orientation: "portrait"`
 *   in app.json). Excluding it blocks the app on devices without a portrait
 *   sensor (some Chromebooks/desktops/XR).
 *
 * - `android.hardware.wifi` — implied by the `android.permission.ACCESS_WIFI_STATE`
 *   permission merged in from the expo-network library manifest. The app only
 *   uses it for connectivity checks (`Network.getNetworkStateAsync`), so it
 *   must not block installation on Wi-Fi-less devices.
 *
 * Declaring each feature explicitly with `android:required="false"` overrides
 * the implied requirement and restores availability on those devices
 * (this is the fix Google Play recommends in its device-compatibility warning).
 */
const OPTIONAL_FEATURES = [
  "android.hardware.screen.portrait",
  "android.hardware.wifi",
];

const withOptionalHardwareFeatures = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!Array.isArray(manifest["uses-feature"])) {
      manifest["uses-feature"] = [];
    }

    for (const name of OPTIONAL_FEATURES) {
      const alreadyDeclared = manifest["uses-feature"].some(
        (feature) => feature?.$?.["android:name"] === name
      );

      if (!alreadyDeclared) {
        manifest["uses-feature"].push({
          $: {
            "android:name": name,
            "android:required": "false",
          },
        });
      }
    }

    return config;
  });
};

module.exports = withOptionalHardwareFeatures;
