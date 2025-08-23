import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./navigation/AppNavigator";
import { AuthProvider } from "./context/AuthContext";
import * as SplashScreen from "expo-splash-screen";

// Keep splash visible until we explicitly hide it
SplashScreen.preventAutoHideAsync().catch(() => {
  /* avoid warning if already hidden */
});

const App = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts, assets, API bootstrap here if needed
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn("App prepare error:", e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn("Splash hide error:", e);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    // While not ready, don’t render anything: splash will stay visible
    return null;
  }

  return (
    <AuthProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </View>
    </AuthProvider>
  );
};

export default App;
