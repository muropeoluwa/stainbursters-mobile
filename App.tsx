import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Alert, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./navigation/AppNavigator";
import { AuthProvider, useAuth } from "./context/AuthContext";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

// Keep splash visible until we explicitly hide it
SplashScreen.preventAutoHideAsync().catch(() => {});

// Configure how notifications behave when received in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const AppContent = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const { token } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    async function prepare() {
      try {
        // Request notification permission + token setup
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
          await sendTokenToServer(token);
        }

        // Optional: simulate small loading time or preload assets
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (e) {
        console.warn("App prepare error:", e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const body = notification.request.content.body;
      Alert.alert("New Notification", body || "You have a new message.");
    });

    // Handle when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification interaction:", response);
      // Optional: navigate user based on notification data
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [token]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn("Splash hide error:", e);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </View>
  );
};

// Helper: Register and get Expo Push Token
async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Permission required", "Enable notifications to stay updated!");
      return null;
    }

    const { data } = await Notifications.getExpoPushTokenAsync();
    token = data;
    console.log("Expo Push Token:", token);
  } else {
    Alert.alert("Physical device required", "Push notifications need a real device.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

// Send token to your PHP backend
async function sendTokenToServer(token: string) {
  try {
    await fetch("https://yourdomain.com/api/save_push_token.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    console.warn("Error sending push token:", error);
  }
}

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
