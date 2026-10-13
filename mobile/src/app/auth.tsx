import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    if (isRegister && !fullName.trim()) {
      Alert.alert("Error", "Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Error",
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      if (isRegister) {
        const {
          data: { user },
          error,
        } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) {
          Alert.alert("Registration error", error.message);
          return;
        }

        if (!user) {
          Alert.alert(
            "Error",
            "The account could not be created."
          );
          return;
        }

        // Create profile if the profiles table exists
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            full_name: fullName.trim(),
          });

        if (profileError) {
          console.log(
            "Profile creation error:",
            profileError.message
          );
        }

        Alert.alert(
          "Account created",
          "Your Sellio account has been created.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/"),
            },
          ]
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          Alert.alert("Login error", error.message);
          return;
        }

        router.replace("/");
      }
    } catch (error) {
      console.log("Authentication error:", error);

      Alert.alert(
        "Error",
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* LOGO */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>Sellio</Text>
            <Text style={styles.tagline}>
              Buy. Sell. Discover.
            </Text>
          </View>

          {/* CARD */}
          <View style={styles.card}>
            <Text style={styles.title}>
              {isRegister ? "Create account" : "Welcome back"}
            </Text>

            <Text style={styles.subtitle}>
              {isRegister
                ? "Create your Sellio account"
                : "Login to your Sellio account"}
            </Text>

            {/* FULL NAME */}
            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full name</Text>

                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your full name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  style={styles.input}
                />
              </View>
            )}

            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            {/* PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            {/* BUTTON */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isRegister ? "Create account" : "Login"}
                </Text>
              )}
            </TouchableOpacity>

            {/* SWITCH */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isRegister
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </Text>

              <TouchableOpacity
                onPress={() => setIsRegister(!isRegister)}
              >
                <Text style={styles.switchButton}>
                  {isRegister ? " Login" : " Register"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* BACK */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.backButtonText}>
                ← Back to Sellio
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  keyboard: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  logo: {
    fontSize: 42,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: -2,
  },

  tagline: {
    marginTop: 4,
    color: "#777777",
    fontSize: 14,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#111111",
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 14,
    color: "#777777",
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 7,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#111111",
    backgroundColor: "#fafafa",
  },

  primaryButton: {
    height: 52,
    backgroundColor: "#000000",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  switchContainer: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  switchText: {
    color: "#777777",
    fontSize: 14,
  },

  switchButton: {
    color: "#000000",
    fontWeight: "800",
    fontSize: 14,
  },

  backButton: {
    marginTop: 22,
    alignItems: "center",
  },

  backButtonText: {
    color: "#555555",
    fontSize: 14,
    fontWeight: "700",
  },
});