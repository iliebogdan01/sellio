import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";

export default function SellScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>Sellio</Text>

      <Text style={styles.title}>
        Sell your item
      </Text>

      <Text style={styles.success}>
        SELL PAGE WORKS
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>
          ← Back
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    position: "absolute",
    top: 60,
    fontSize: 32,
    fontWeight: "900",
    color: "#000000",
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#000000",
  },

  success: {
    marginTop: 15,
    fontSize: 18,
    color: "#555555",
  },

  button: {
    marginTop: 30,
    backgroundColor: "#000000",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});