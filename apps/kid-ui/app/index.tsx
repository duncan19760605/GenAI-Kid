import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { COLORS, SIZES } from "../constants/theme";
import { loginWithCode, getStoredSession } from "../services/api";

export default function LoginScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check for existing session
  useEffect(() => {
    (async () => {
      const session = await getStoredSession();
      if (session?.token) {
        router.replace({
          pathname: "/chat",
          params: {
            childId: session.childId,
            childName: session.childName,
            characterId: session.characterId,
          },
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleLogin = async () => {
    if (code.length < 4) return;
    setError("");
    setLoading(true);
    try {
      const session = await loginWithCode(code);
      router.replace({
        pathname: "/chat",
        params: {
          childId: session.childId,
          childName: session.childName,
          characterId: session.characterId,
        },
      });
    } catch (err: any) {
      setError("Oops! That code didn't work. Ask mommy or daddy for help!");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>🌟</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Friendly mascot icon */}
      <Text style={styles.mascot}>🐻</Text>
      <Text style={styles.title}>Hi there!</Text>
      <Text style={styles.subtitle}>
        Type the secret code from mommy or daddy
      </Text>

      <View style={styles.codeContainer}>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^0-9]/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="● ● ● ● ● ●"
          placeholderTextColor={COLORS.textLight}
          textAlign="center"
          autoFocus
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            opacity: code.length < 4 ? 0.5 : pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
        onPress={handleLogin}
        disabled={code.length < 4 || loading}
      >
        <Text style={styles.buttonText}>Let&apos;s Go! 🚀</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: SIZES.spacingXl,
  },
  loadingText: {
    fontSize: 60,
  },
  mascot: {
    fontSize: 80,
    marginBottom: SIZES.spacingLg,
  },
  title: {
    fontSize: SIZES.fontXLarge,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: SIZES.spacing,
  },
  subtitle: {
    fontSize: SIZES.fontMedium,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: SIZES.spacingXl,
  },
  codeContainer: {
    marginBottom: SIZES.spacingLg,
  },
  codeInput: {
    fontSize: 32,
    letterSpacing: 12,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.spacingXl,
    paddingVertical: SIZES.spacingMd,
    borderRadius: SIZES.borderRadius,
    minWidth: 240,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  error: {
    fontSize: SIZES.fontSmall,
    color: COLORS.accent,
    textAlign: "center",
    marginBottom: SIZES.spacingMd,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.spacingXl,
    paddingVertical: SIZES.spacingMd,
    borderRadius: SIZES.borderRadiusLarge,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: SIZES.fontLarge,
    fontWeight: "bold",
    color: COLORS.white,
  },
});
