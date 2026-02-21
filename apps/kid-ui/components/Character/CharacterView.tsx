import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path, G } from "react-native-svg";
import { COLORS, SIZES } from "../../constants/theme";

const AnimatedView = Animated.createAnimatedComponent(View);

interface CharacterViewProps {
  characterId: string;
  emotion: string;
  mouthOpen: number; // 0 to 1, driven by audio amplitude
  isSpeaking: boolean;
  isListening: boolean;
}

const EMOTION_GLOW: Record<string, string> = {
  happy: COLORS.emotionHappy,
  curious: COLORS.emotionCurious,
  sad: COLORS.emotionSad,
  excited: COLORS.emotionExcited,
  encouraging: COLORS.emotionEncouraging,
  empathetic: COLORS.emotionSad,
  patient: COLORS.emotionCurious,
  gentle: COLORS.emotionEncouraging,
  neutral: COLORS.primaryLight,
};

export function CharacterView({
  characterId,
  emotion,
  mouthOpen,
  isSpeaking,
  isListening,
}: CharacterViewProps) {
  const bounce = useSharedValue(0);
  const breathe = useSharedValue(0);
  const emotionScale = useSharedValue(1);

  // Breathing animation (always active)
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  // Bounce when speaking
  useEffect(() => {
    if (isSpeaking) {
      bounce.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      bounce.value = withTiming(0, { duration: 200 });
    }
  }, [isSpeaking]);

  // Emotion change pop
  useEffect(() => {
    emotionScale.value = withSequence(
      withTiming(1.08, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  }, [emotion]);

  const bodyStyle = useAnimatedStyle(() => {
    const breatheY = interpolate(breathe.value, [0, 1], [0, -4]);
    return {
      transform: [
        { translateY: bounce.value + breatheY },
        { scale: emotionScale.value },
      ],
    };
  });

  const glowColor = EMOTION_GLOW[emotion] || COLORS.primaryLight;

  return (
    <View style={styles.container}>
      {/* Glow behind character */}
      <View style={[styles.glow, { backgroundColor: glowColor }]} />

      <AnimatedView style={[styles.characterWrap, bodyStyle]}>
        {characterId === "bear" && (
          <BearCharacter emotion={emotion} mouthOpen={mouthOpen} />
        )}
        {characterId === "rabbit" && (
          <RabbitCharacter emotion={emotion} mouthOpen={mouthOpen} />
        )}
        {characterId === "cat" && (
          <CatCharacter emotion={emotion} mouthOpen={mouthOpen} />
        )}
      </AnimatedView>

      {/* Listening indicator */}
      {isListening && (
        <View style={styles.listeningDots}>
          <PulsingDot delay={0} />
          <PulsingDot delay={200} />
          <PulsingDot delay={400} />
        </View>
      )}
    </View>
  );
}

function PulsingDot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.5, { duration: 400 })
        ),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.5, 1], [0.4, 1]),
  }));

  return <AnimatedView style={[styles.dot, style]} />;
}

// --- Bear Character (SVG) ---
function BearCharacter({ emotion, mouthOpen }: { emotion: string; mouthOpen: number }) {
  const eyeStyle = getEyeStyle(emotion);
  const mouthHeight = 8 + mouthOpen * 20;

  return (
    <Svg width={SIZES.characterSize} height={SIZES.characterSize} viewBox="0 0 200 200">
      {/* Ears */}
      <Circle cx="50" cy="40" r="28" fill="#C49A6C" />
      <Circle cx="50" cy="40" r="18" fill="#E8C9A0" />
      <Circle cx="150" cy="40" r="28" fill="#C49A6C" />
      <Circle cx="150" cy="40" r="18" fill="#E8C9A0" />

      {/* Body / Head */}
      <Ellipse cx="100" cy="115" rx="72" ry="78" fill="#C49A6C" />
      <Ellipse cx="100" cy="120" rx="50" ry="48" fill="#E8C9A0" />

      {/* Eyes */}
      <G>
        {eyeStyle === "normal" && (
          <>
            <Circle cx="75" cy="95" r="8" fill="#5D4037" />
            <Circle cx="125" cy="95" r="8" fill="#5D4037" />
            <Circle cx="78" cy="92" r="3" fill="white" />
            <Circle cx="128" cy="92" r="3" fill="white" />
          </>
        )}
        {eyeStyle === "happy" && (
          <>
            <Path d="M 67 95 Q 75 85 83 95" stroke="#5D4037" strokeWidth="4" fill="none" strokeLinecap="round" />
            <Path d="M 117 95 Q 125 85 133 95" stroke="#5D4037" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}
        {eyeStyle === "sad" && (
          <>
            <Circle cx="75" cy="98" r="7" fill="#5D4037" />
            <Circle cx="125" cy="98" r="7" fill="#5D4037" />
            <Circle cx="77" cy="96" r="2.5" fill="white" />
            <Circle cx="127" cy="96" r="2.5" fill="white" />
            <Path d="M 63 85 Q 73 82 83 88" stroke="#5D4037" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Path d="M 137 85 Q 127 82 117 88" stroke="#5D4037" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        {eyeStyle === "wide" && (
          <>
            <Circle cx="75" cy="95" r="10" fill="#5D4037" />
            <Circle cx="125" cy="95" r="10" fill="#5D4037" />
            <Circle cx="78" cy="91" r="4" fill="white" />
            <Circle cx="128" cy="91" r="4" fill="white" />
          </>
        )}
      </G>

      {/* Nose */}
      <Ellipse cx="100" cy="110" rx="6" ry="5" fill="#8D6E63" />

      {/* Mouth */}
      <Ellipse cx="100" cy={118 + mouthHeight / 4} rx={12 + mouthOpen * 4} ry={mouthHeight / 2} fill="#D4836B" />

      {/* Blush */}
      {(emotion === "happy" || emotion === "excited") && (
        <>
          <Ellipse cx="58" cy="110" rx="12" ry="7" fill="#FFCDD2" opacity={0.6} />
          <Ellipse cx="142" cy="110" rx="12" ry="7" fill="#FFCDD2" opacity={0.6} />
        </>
      )}

      {/* Sweat drop */}
      {emotion === "encouraging" && (
        <Path d="M 145 70 Q 148 60 151 70 Q 148 76 145 70" fill="#74B9FF" />
      )}

      {/* Stars */}
      {emotion === "excited" && (
        <>
          <Path d="M 40 60 L 43 55 L 46 60 L 42 57 L 48 57 Z" fill="#FFD93D" />
          <Path d="M 155 55 L 158 50 L 161 55 L 157 52 L 163 52 Z" fill="#FFD93D" />
        </>
      )}
    </Svg>
  );
}

// --- Rabbit Character (SVG) ---
function RabbitCharacter({ emotion, mouthOpen }: { emotion: string; mouthOpen: number }) {
  const eyeStyle = getEyeStyle(emotion);
  const mouthHeight = 6 + mouthOpen * 16;

  return (
    <Svg width={SIZES.characterSize} height={SIZES.characterSize} viewBox="0 0 200 220">
      {/* Long ears */}
      <Ellipse cx="70" cy="30" rx="16" ry="50" fill="#F5F5F5" />
      <Ellipse cx="70" cy="30" rx="10" ry="40" fill="#FFCDD2" />
      <Ellipse cx="130" cy="25" rx="16" ry="50" fill="#F5F5F5" transform="rotate(10, 130, 25)" />
      <Ellipse cx="130" cy="25" rx="10" ry="40" fill="#FFCDD2" transform="rotate(10, 130, 25)" />

      {/* Head */}
      <Circle cx="100" cy="120" r="65" fill="#F5F5F5" />
      <Ellipse cx="100" cy="130" rx="40" ry="35" fill="white" />

      {/* Eyes */}
      {eyeStyle === "normal" && (
        <>
          <Circle cx="78" cy="108" r="7" fill="#E91E63" />
          <Circle cx="122" cy="108" r="7" fill="#E91E63" />
          <Circle cx="80" cy="106" r="2.5" fill="white" />
          <Circle cx="124" cy="106" r="2.5" fill="white" />
        </>
      )}
      {eyeStyle === "happy" && (
        <>
          <Path d="M 71 108 Q 78 100 85 108" stroke="#E91E63" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <Path d="M 115 108 Q 122 100 129 108" stroke="#E91E63" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {eyeStyle === "sad" && (
        <>
          <Circle cx="78" cy="112" r="6" fill="#E91E63" />
          <Circle cx="122" cy="112" r="6" fill="#E91E63" />
        </>
      )}
      {eyeStyle === "wide" && (
        <>
          <Circle cx="78" cy="108" r="9" fill="#E91E63" />
          <Circle cx="122" cy="108" r="9" fill="#E91E63" />
          <Circle cx="80" cy="105" r="3.5" fill="white" />
          <Circle cx="124" cy="105" r="3.5" fill="white" />
        </>
      )}

      {/* Nose */}
      <Ellipse cx="100" cy="125" rx="5" ry="4" fill="#FF8A80" />
      {/* Whiskers */}
      <Path d="M 60 125 L 82 128" stroke="#BDBDBD" strokeWidth="1.5" />
      <Path d="M 58 132 L 80 132" stroke="#BDBDBD" strokeWidth="1.5" />
      <Path d="M 118 128 L 140 125" stroke="#BDBDBD" strokeWidth="1.5" />
      <Path d="M 120 132 L 142 132" stroke="#BDBDBD" strokeWidth="1.5" />

      {/* Mouth */}
      <Ellipse cx="100" cy={133 + mouthHeight / 4} rx={8 + mouthOpen * 3} ry={mouthHeight / 2} fill="#FF8A80" />

      {/* Blush */}
      {(emotion === "happy" || emotion === "excited") && (
        <>
          <Ellipse cx="60" cy="122" rx="10" ry="6" fill="#FFCDD2" opacity={0.5} />
          <Ellipse cx="140" cy="122" rx="10" ry="6" fill="#FFCDD2" opacity={0.5} />
        </>
      )}
    </Svg>
  );
}

// --- Cat Character (SVG) ---
function CatCharacter({ emotion, mouthOpen }: { emotion: string; mouthOpen: number }) {
  const eyeStyle = getEyeStyle(emotion);
  const mouthHeight = 6 + mouthOpen * 16;

  return (
    <Svg width={SIZES.characterSize} height={SIZES.characterSize} viewBox="0 0 200 200">
      {/* Pointed ears */}
      <Path d="M 45 75 L 30 20 L 72 60 Z" fill="#FFB74D" />
      <Path d="M 50 70 L 38 30 L 68 60 Z" fill="#FFCC80" />
      <Path d="M 155 75 L 170 20 L 128 60 Z" fill="#FFB74D" />
      <Path d="M 150 70 L 162 30 L 132 60 Z" fill="#FFCC80" />

      {/* Head */}
      <Circle cx="100" cy="110" r="62" fill="#FFB74D" />
      <Ellipse cx="100" cy="118" rx="42" ry="36" fill="#FFCC80" />

      {/* Eyes - cat slit pupils */}
      {eyeStyle === "normal" && (
        <>
          <Ellipse cx="78" cy="100" rx="8" ry="9" fill="#4CAF50" />
          <Ellipse cx="78" cy="100" rx="3" ry="8" fill="#1B5E20" />
          <Ellipse cx="122" cy="100" rx="8" ry="9" fill="#4CAF50" />
          <Ellipse cx="122" cy="100" rx="3" ry="8" fill="#1B5E20" />
        </>
      )}
      {eyeStyle === "happy" && (
        <>
          <Path d="M 70 100 Q 78 92 86 100" stroke="#1B5E20" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <Path d="M 114 100 Q 122 92 130 100" stroke="#1B5E20" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {eyeStyle === "sad" && (
        <>
          <Ellipse cx="78" cy="103" rx="7" ry="8" fill="#4CAF50" />
          <Ellipse cx="78" cy="103" rx="2.5" ry="7" fill="#1B5E20" />
          <Ellipse cx="122" cy="103" rx="7" ry="8" fill="#4CAF50" />
          <Ellipse cx="122" cy="103" rx="2.5" ry="7" fill="#1B5E20" />
        </>
      )}
      {eyeStyle === "wide" && (
        <>
          <Circle cx="78" cy="100" r="10" fill="#4CAF50" />
          <Circle cx="78" cy="100" r="5" fill="#1B5E20" />
          <Circle cx="122" cy="100" r="10" fill="#4CAF50" />
          <Circle cx="122" cy="100" r="5" fill="#1B5E20" />
        </>
      )}

      {/* Nose */}
      <Path d="M 97 115 L 100 112 L 103 115 Z" fill="#E65100" />

      {/* Whiskers */}
      <Path d="M 55 112 L 80 115" stroke="#8D6E63" strokeWidth="1.5" />
      <Path d="M 53 120 L 78 120" stroke="#8D6E63" strokeWidth="1.5" />
      <Path d="M 57 128 L 80 124" stroke="#8D6E63" strokeWidth="1.5" />
      <Path d="M 120 115 L 145 112" stroke="#8D6E63" strokeWidth="1.5" />
      <Path d="M 122 120 L 147 120" stroke="#8D6E63" strokeWidth="1.5" />
      <Path d="M 120 124 L 143 128" stroke="#8D6E63" strokeWidth="1.5" />

      {/* Mouth */}
      <Ellipse cx="100" cy={120 + mouthHeight / 4} rx={7 + mouthOpen * 3} ry={mouthHeight / 2} fill="#E65100" opacity={0.7} />

      {/* Blush */}
      {(emotion === "happy" || emotion === "excited") && (
        <>
          <Ellipse cx="58" cy="112" rx="10" ry="6" fill="#FFCDD2" opacity={0.5} />
          <Ellipse cx="142" cy="112" rx="10" ry="6" fill="#FFCDD2" opacity={0.5} />
        </>
      )}
    </Svg>
  );
}

function getEyeStyle(emotion: string): "normal" | "happy" | "sad" | "wide" {
  switch (emotion) {
    case "happy":
    case "encouraging":
    case "proud":
      return "happy";
    case "sad":
    case "empathetic":
    case "gentle":
      return "sad";
    case "excited":
    case "curious":
      return "wide";
    default:
      return "normal";
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glow: {
    position: "absolute",
    width: SIZES.characterSize + 40,
    height: SIZES.characterSize + 40,
    borderRadius: (SIZES.characterSize + 40) / 2,
    opacity: 0.2,
  },
  characterWrap: {
    width: SIZES.characterSize,
    height: SIZES.characterSize,
    alignItems: "center",
    justifyContent: "center",
  },
  listeningDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.secondary,
  },
});
