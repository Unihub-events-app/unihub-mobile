import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

function isRenderableImageSource(profileImage) {
  return (
    typeof profileImage === "string" &&
    (profileImage.startsWith("http") || profileImage.startsWith("/"))
  );
}

export default function CommunityAvatar({
  profileImage,
  alt = "",
  fallbackEmoji = "🏛️",
  style = {},
  imageStyle = {},
  emojiStyle = {},
  onPress,
}) {
  const [imageErrored, setImageErrored] = useState(false);

  useEffect(() => {
    setImageErrored(false);
  }, [profileImage]);

  const shouldRenderImage = useMemo(
    () => isRenderableImageSource(profileImage) && !imageErrored,
    [profileImage, imageErrored],
  );

  const renderedFallback =
    profileImage && !isRenderableImageSource(profileImage)
      ? profileImage
      : fallbackEmoji;

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
        {shouldRenderImage ? (
          <Image
            source={{ uri: profileImage }}
            style={[styles.image, imageStyle]}
            onError={() => setImageErrored(true)}
          />
        ) : (
          <View style={[styles.emojiContainer, emojiStyle]}>
            <Text style={styles.emoji}>{renderedFallback}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {shouldRenderImage ? (
        <Image
          source={{ uri: profileImage }}
          style={[styles.image, imageStyle]}
          onError={() => setImageErrored(true)}
        />
      ) : (
        <View style={[styles.emojiContainer, emojiStyle]}>
          <Text style={styles.emoji}>{renderedFallback}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    borderRadius: 24,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  emojiContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 40,
  },
});
