import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import { Screen } from "./Screen.js";

export function PageLoader() {
  return (
    <Screen padded={false} scrollable={false}>
      <View style={styles.container}>
        <LottieView
          source={require("../assets/animations/loader.json")}
          autoPlay
          loop
          style={styles.animation}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  animation: {
    width: 120,
    height: 120,
  },
});
