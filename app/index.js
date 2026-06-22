import { useEffect } from "react";
import { router } from "expo-router";
import { View } from "react-native";
import { Screen } from "../components/Screen";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { useSessionStore } from "../lib/auth";

export default function Index() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const userToken = useSessionStore((state) => state.userToken);

  useEffect(() => {
    if (!hydrated) return;
    if (userToken) {
      router.replace("/(app)/dashboard");
    }
  }, [hydrated, userToken]);

  return (
    <Screen padded={false} scrollable={false}>
      <View style={{ flex: 1 }}>
        <WelcomeScreen />
      </View>
    </Screen>
  );
}
