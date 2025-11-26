import 'dotenv/config';
import appJson from './app.json';

export default () => ({
  name: "Slipsgutta Planner",
  slug: "slipsgutta",
  owner: "egeiran",

  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,

  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#5460ff"
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.slipsgutta.planner"
  },

  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#5460ff"
    },
    package: "com.slipsgutta.planner",
    permissions: [
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.VIBRATE"
    ],
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false
  },

  web: {
    favicon: "./assets/favicon.png"
  },

  plugins: [
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#5460ff"
      }
    ]
  ],

  extra: {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

    eas: {
      projectId: "2bd42864-f654-46d4-ba6f-093a00714d91"
    }
  }
});
