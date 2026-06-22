import { useEffect } from "react";
import { router } from "expo-router";
import { View } from "react-native";
import { Screen } from "../../components/Screen";
import { useSessionStore } from "../../lib/auth";

export default function UsersIndex() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const userToken = useSessionStore((state) => state.userToken);

  useEffect(() => {
    if (!hydrated) return;
    if (userToken) {
      router.replace("/(app)/dashboard");
    } else {
      router.replace("/");
    }
  }, [hydrated, userToken]);

  return (
    <Screen padded={false}>
      <View style={{ flex: 1 }} />
    </Screen>
  );
}
