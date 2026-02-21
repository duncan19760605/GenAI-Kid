import React from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, SIZES } from "../../constants/theme";

interface RoundControlsProps {
  onRepeat: () => void;
  onSlower: () => void;
  onSwitchLanguage: (lang: string) => void;
  onDontUnderstand: () => void;
  currentLanguage: string;
  availableLanguages: string[];
  disabled: boolean;
}

const LANG_FLAGS: Record<string, string> = {
  zh: "🇹🇼",
  en: "🇺🇸",
  es: "🇪🇸",
};

const LANG_LABELS: Record<string, string> = {
  zh: "中文",
  en: "ABC",
  es: "ESP",
};

export function RoundControls({
  onRepeat,
  onSlower,
  onSwitchLanguage,
  onDontUnderstand,
  currentLanguage,
  availableLanguages,
  disabled,
}: RoundControlsProps) {
  const nextLanguage = () => {
    const allLangs = [currentLanguage, ...availableLanguages.filter((l) => l !== currentLanguage)];
    const currentIdx = allLangs.indexOf(currentLanguage);
    const nextIdx = (currentIdx + 1) % allLangs.length;
    return allLangs[nextIdx];
  };

  const handlePress = (action: () => void) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  };

  const next = nextLanguage();

  return (
    <View style={styles.container}>
      {/* Repeat */}
      <ControlButton
        icon={<Ionicons name="refresh" size={26} color={COLORS.text} />}
        label="🔁"
        onPress={() => handlePress(onRepeat)}
        disabled={disabled}
      />

      {/* Slower */}
      <ControlButton
        icon={<MaterialCommunityIcons name="tortoise" size={26} color={COLORS.text} />}
        label="🐢"
        onPress={() => handlePress(onSlower)}
        disabled={disabled}
      />

      {/* Switch Language */}
      <ControlButton
        icon={
          <Text style={styles.flagText}>
            {LANG_FLAGS[next] || "🌐"}
          </Text>
        }
        label={LANG_LABELS[next] || next}
        onPress={() => handlePress(() => onSwitchLanguage(next))}
        disabled={disabled}
      />

      {/* Don't understand */}
      <ControlButton
        icon={<Ionicons name="help-circle-outline" size={26} color={COLORS.text} />}
        label="❓"
        onPress={() => handlePress(onDontUnderstand)}
        disabled={disabled}
      />
    </View>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: SIZES.controlButtonSize,
    height: SIZES.controlButtonSize,
    borderRadius: SIZES.controlButtonSize / 2,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  flagText: {
    fontSize: 24,
  },
});
