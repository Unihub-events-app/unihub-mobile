import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Calendar, MapPin } from "lucide-react-native";
import Animated from "react-native-reanimated";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const EventCard = ({
  title = "Untitled Event",
  date,
  location = "Location TBA",
  imageSrc,
  eventId,
  price,
  category,
  time,
  isPremium = false,
}) => {
  const handleCardClick = () => {
    if (eventId) {
      router.push(`/event/${eventId}`);
    }
  };

  const formattedPrice =
    price === 0 || price === "0"
      ? "Free"
      : price !== undefined && price !== null
      ? `₦${parseInt(price).toLocaleString()}`
      : null;

  let day = null;
  let monthName = null;
  if (date) {
    try {
      const parts = date.split("/");
      if (parts.length >= 2) {
        day = parts[0];
        const monthIndex = parseInt(parts[1]) - 1;
        monthName = MONTHS[monthIndex] ?? null;
      }
    } catch {}
  }

  return (
    <Pressable style={styles.card} onPress={handleCardClick}>
      {/* Background Image */}
      {imageSrc ? (
        <Image
          source={{ uri: imageSrc }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder} />
      )}

      {/* Dark Gradient Overlay */}
      <View style={styles.gradientOverlay} />

      {/* Date Badge (Top Left) */}
      {day && monthName && (
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{monthName}</Text>
        </View>
      )}

      {/* Top Right Badges */}
      <View style={styles.topRightBadges}>
        {isPremium && (
          <View style={[styles.badge, styles.premiumBadge]}>
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </View>
        )}
        {category && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{category.toUpperCase()}</Text>
          </View>
        )}
        {formattedPrice && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formattedPrice}</Text>
          </View>
        )}
      </View>

      {/* Bottom Content */}
      <View style={styles.bottomContent}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.locationRow}>
          <MapPin size={14} color="rgba(255,255,255,0.75)" />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          {time && (
            <View style={styles.timeRow}>
              <Calendar size={14} color="rgba(255,255,255,0.75)" />
              <Text style={styles.timeText}>{time}</Text>
            </View>
          )}
          <Pressable
            style={styles.addButton}
            onPress={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            <Calendar size={14} color="white" />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 220,
    height: (220 * 4) / 3,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(75,85,99,1)",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    backgroundImage:
      "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)",
  },
  dateBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 48,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    lineHeight: 24,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  topRightBadges: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-end",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumBadge: {
    backgroundColor: "rgba(245,158,11,0.9)",
    borderColor: "rgba(252,211,77,0.4)",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  premiumBadgeText: {
    color: "black",
    fontWeight: "900",
  },
  bottomContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    zIndex: 10,
  },
  title: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 16,
    color: "white",
    lineHeight: 22,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    flex: 1,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: "auto",
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
});

