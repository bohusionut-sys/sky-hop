/** Sky Hop ads config — App ID, interstitial, and rewarded wired. Real ads on native when USE_REAL_ADS; web stays simulated. */
(function (global) {
  "use strict";
  var config = {
    ADMOB_APP_ID: "ca-app-pub-1834002965799249~7940720644",
    INTERSTITIAL_UNIT_ID: "ca-app-pub-1834002965799249/1207791334",
    REWARDED_UNIT_ID: "ca-app-pub-1834002965799249/4057315950",
    USE_REAL_ADS: true,
    isPlaceholder: function (id) {
      return !id || String(id).indexOf("PLACEHOLDER_") === 0;
    },
    isConfigured: function () {
      return (
        !!this.USE_REAL_ADS &&
        !this.isPlaceholder(this.INTERSTITIAL_UNIT_ID) &&
        !this.isPlaceholder(this.REWARDED_UNIT_ID)
      );
    },
    unitIdFor: function (kind) {
      if (kind === "rewarded") return this.REWARDED_UNIT_ID;
      return this.INTERSTITIAL_UNIT_ID;
    },
  };
  global.SkyHopAdConfig = config;
})(typeof window !== "undefined" ? window : globalThis);
