import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../constants/theme";
import { SessionStage } from "../hooks/useVoiceSession";

interface StatusBubbleProps {
  stage: SessionStage;
  transcript: string;
}

const STAGE_TEXT: Record<string, string> = {
  idle: "",
  recording: "🎤 ...",
  listening: "👂 ...",
  thinking: "🤔 ...",
  speaking: "",
  error: "😅",
};

export function StatusBubble({ stage, transcript }: StatusBubbleProps) {
  const showTranscript = stage === "speaking" && transcript;
  const stageText = STAGE_TEXT[stage] || "";

  if (!showTranscript && !stageText) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text} numberOfLines={2}>
          {showTranscript ? transcript : stageText}
        </Text>
      </View>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 8,
  },
  bubble: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.spacingMd,
    paddingVertical: SIZES.spacing,
    borderRadius: SIZES.borderRadius,
    maxWidth: 280,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  text: {
    fontSize: SIZES.fontMedium,
    color: COLORS.text,
    textAlign: "center",
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.white,
  },
});
