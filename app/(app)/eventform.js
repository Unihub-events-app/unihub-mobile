import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../theme/ThemeProvider.js";
import { useRouter as _ur } from "expo-router";
import { Screen } from "../../components/index";
import { getUserToken } from "../../lib/auth";
import { getAdminToken } from "../../lib/auth";
import BackButton from "../../components/BackButton";
import CreateEventForm from "../../components/CreateEventForm";

export default function EventFormScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const userToken = await getUserToken();
      const adminToken = await getAdminToken();

      if (!userToken && !adminToken) {
        router.push("/(auth)/signin");
      } else {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading || !isAuthenticated) {
    return (
      <Screen padded={false}>
        <View style={styles.loadingContainer} />
      </Screen>
    );
  }

  return (
    <Screen padded={true}>
      <View style={styles.headerContainer}>
        <BackButton />
      </View>
      <CreateEventForm />
    </Screen>
  );
}

const getStyles = (theme) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 24,
  },
});
