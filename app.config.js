const baseConfig = require("./app.json");
const { APP_BASE_URL } = require("./config/serverConfig");

const appUrl = APP_BASE_URL || "";

let appHost = "";
try {
  appHost = appUrl ? new URL(appUrl).host : "";
} catch {
  appHost = "";
}

const applyIntentHost = (androidConfig = {}) => {
  const intentFilters = androidConfig.intentFilters || [];
  const nextIntentFilters = intentFilters.map((filter) => {
    const data = (filter.data || []).map((entry) => {
      const nextEntry = { ...entry };
      if (appHost) {
        nextEntry.host = appHost;
      } else {
        delete nextEntry.host;
      }
      return nextEntry;
    });
    return { ...filter, data };
  });

  return {
    ...androidConfig,
    intentFilters: nextIntentFilters,
  };
};

module.exports = {
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    android: applyIntentHost(baseConfig.expo.android),
  },
};
