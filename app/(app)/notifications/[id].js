import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, NeuCard, BackButton } from "../../../components/index.js";
import { useTheme } from "../../../theme/ThemeProvider.js";
import { API_URL } from "../../../lib/config.js";
import { getUserToken } from "../../../lib/auth.js";
import { Bell } from "lucide-react-native";

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const token = await getUserToken();
        if (!token) return;

        const res = await fetch(`${API_URL}/notifications/user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const notifs = data.notifications || [];
          const found = notifs.find(n => n._id === id);
          if (found) {
            setNotification(found);
            
            if (!found.read) {
              fetch(`${API_URL}/notifications/read/${id}`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchNotification();
  }, [id]);

  if (loading) {
    return (
      <Screen padded>
        <BackButton onPress={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
        </View>
      </Screen>
    );
  }

  if (!notification) {
    return (
      <Screen padded>
        <BackButton onPress={() => router.back()} />
        <View style={styles.center}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Notification not found</Text>
        </View>
      </Screen>
    );
  }

  const timeString = new Date(notification.createdAt).toLocaleString();

  return (
    <Screen padded>
      <BackButton onPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Bell size={24} color={theme.colors.brand} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>{notification.title}</Text>
          <Text style={[styles.time, { color: theme.colors.textSubtle }]}>{timeString}</Text>
        </View>

        <NeuCard style={styles.card}>
          <Text style={[styles.message, { color: theme.colors.text }]}>
            {notification.message}
          </Text>
        </NeuCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingTop: 24,
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
  },
  time: {
    fontSize: 14,
    fontWeight: "500",
  },
  card: {
    padding: 24,
    minHeight: 120,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
});
