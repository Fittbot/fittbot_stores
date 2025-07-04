export default ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: "./google-services.json",
    },
    extra: {
      ...config.extra,
      // backendUrl: "https://app.fittbot.com",
      // backendUrl: "https://8ddd-115-99-221-38.ngrok-free.app",
      backendUrl:
        "https://f394-2409-408d-4e8a-15a4-6df6-4c85-7bd5-1cc2.ngrok-free.app",
      backendPort: "8000",
      eas: {
        projectId: "d83115b4-2dd1-43c9-af11-da8dc85a5966",
      },
    },
  };
};
// "buildType": "app-bundle"
