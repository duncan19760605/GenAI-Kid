import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, SIZES } from "../../constants/theme";

const AnimatedView = Animated.createAnimatedComponent(View);

interface MicButtonProps {
  isRecording: boolean;
  isDisabled: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function MicButton({
  isRecording,
  isDisabled,
  onPressIn,
  onPressOut,
}: MicButtonProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Pulse animation while recording
  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(0.4, { duration: 0 })
        ),
        -1,
        false
      );
      buttonScale.value = withTiming(1.1, { duration: 200 });
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
      buttonScale.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPressIn();
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressOut();
  };

  return (
    <View style={styles.container}>
      {/* Pulse ring */}
      <AnimatedView
        style={[
          styles.pulse,
          pulseStyle,
          { backgroundColor: COLORS.micPulse },
        ]}
      />

      {/* Button */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
      >
        <AnimatedView
          style={[
            styles.button,
            buttonStyle,
            {
              backgroundColor: isRecording
                ? COLORS.micRecording
                : COLORS.micDefault,
              opacity: isDisabled ? 0.5 : 1,
            },
          ]}
        >
          <Ionicons
            name={isRecording ? "mic" : "mic-outline"}
            size={40}
            color={COLORS.white}
          />
        </AnimatedView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: SIZES.micButtonSize + 40,
    height: SIZES.micButtonSize + 40,
  },
  pulse: {
    position: "absolute",
    width: SIZES.micButtonSize,
    height: SIZES.micButtonSize,
    borderRadius: SIZES.micButtonSize / 2,
  },
  button: {
    width: SIZES.micButtonSize,
    height: SIZES.micButtonSize,
    borderRadius: SIZES.micButtonSize / 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});
