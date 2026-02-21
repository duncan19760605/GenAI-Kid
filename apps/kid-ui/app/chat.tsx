import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, SafeAreaView, Pressable, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants/theme";
import { CharacterView } from "../components/Character/CharacterView";
import { MicButton } from "../components/MicButton/MicButton";
import { RoundControls } from "../components/RoundControls/RoundControls";
import { StatusBubble } from "../components/StatusBubble";
import { useVoiceSession } from "../hooks/useVoiceSession";
import { clearSession } from "../services/api";

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    childId: string;
    childName: string;
    characterId: string;
  }>();

  const {
    state,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendCommand,
    onAmplitude,
  } = useVoiceSession(params.childId || "");

  const [mouthOpen, setMouthOpen] = useState(0);

  // Connect on mount
  useEffect(() => {
    if (params.childId) {
      connect();
    }
    return () => disconnect();
  }, [params.childId]);

  // Register amplitude callback for lip-sync
  useEffect(() => {
    onAmplitude((amplitude) => {
      setMouthOpen(amplitude);
    });
  }, [onAmplitude]);

  // Reset mouth when not speaking
  useEffect(() => {
    if (state.stage !== "speaking") {
      setMouthOpen(0);
    }
  }, [state.stage]);

  const isBusy = state.stage === "thinking" || state.stage === "listening";
  const isSpeaking = state.stage === "speaking";
  const isRecording = state.stage === "recording";

  const handleLogout = async () => {
    disconnect();
    await clearSession();
    router.replace("/");
  };

  return (
    <LinearGradient
      colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Top bar - minimal, just exit button */}
        <View style={styles.topBar}>
          <Pressable onPress={handleLogout} style={styles.exitButton}>
            <Ionicons name="close-circle-outline" size={28} color={COLORS.textLight} />
          </Pressable>
          {params.childName ? (
            <Text style={styles.greeting}>
              Hi, {params.childName}! 👋
            </Text>
          ) : null}
        </View>

        {/* Main area - Character */}
        <View style={styles.characterArea}>
          {/* Speech bubble / status */}
          <StatusBubble stage={state.stage} transcript={state.transcript} />

          {/* Character */}
          <CharacterView
            characterId={params.characterId || "bear"}
            emotion={state.emotion}
            mouthOpen={mouthOpen}
            isSpeaking={isSpeaking}
            isListening={isBusy}
          />
        </View>

        {/* Controls area */}
        <View style={styles.controlsArea}>
          {/* Round controls */}
          <RoundControls
            onRepeat={() => sendCommand("repeat")}
            onSlower={() => sendCommand("slower")}
            onSwitchLanguage={(lang) => sendCommand("switch_language", lang)}
            onDontUnderstand={() => sendCommand("repeat")}
            currentLanguage="zh"
            availableLanguages={["en", "es"]}
            disabled={isBusy || isRecording}
          />

          {/* Mic button */}
          <View style={styles.micArea}>
            <MicButton
              isRecording={isRecording}
              isDisabled={isBusy || isSpeaking}
              onPressIn={startRecording}
              onPressOut={stopRecording}
            />
            <Text style={styles.micHint}>
              {isRecording ? "I'm listening... 👂" : "Hold to talk 🎤"}
            </Text>
          </View>
        </View>

        {/* Error display */}
        {state.error && (
          <View style={styles.errorBar}>
            <Text style={styles.errorText}>😅 {state.error}</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.spacingMd,
    paddingTop: SIZES.spacing,
    gap: SIZES.spacing,
  },
  exitButton: {
    padding: SIZES.spacing,
  },
  greeting: {
    fontSize: SIZES.fontMedium,
    color: COLORS.text,
    fontWeight: "600",
  },
  characterArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: SIZES.spacingLg,
  },
  controlsArea: {
    paddingBottom: SIZES.spacingXl,
    gap: SIZES.spacingLg,
  },
  micArea: {
    alignItems: "center",
    gap: SIZES.spacing,
  },
  micHint: {
    fontSize: SIZES.fontSmall,
    color: COLORS.textLight,
  },
  errorBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    paddingVertical: SIZES.spacing,
    paddingHorizontal: SIZES.spacingMd,
    alignItems: "center",
  },
  errorText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
  },
});
