import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { loadData, saveData, STORAGE_KEYS } from "@/utils/storage";
import { useApp } from "@/context/AppContext";

type PinMode = "enter" | "set" | "change";

export default function PinModal() {
  const insets = useSafeAreaInsets();
  const { colors, primary } = useTheme();
  const { updateSettings } = useApp();
  const params = useLocalSearchParams<{ mode?: string }>();
  
  const mode: PinMode = (params.mode as PinMode) || "enter";
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);

  useEffect(() => {
    loadStoredPin();
  }, []);

  const loadStoredPin = async () => {
    const lockData = await loadData<{ pin: string; enabled: boolean }>(
      STORAGE_KEYS.APP_LOCK,
      { pin: "", enabled: false }
    );
    setStoredPin(lockData.pin);
  };

  const handleDigitPress = (digit: string) => {
    if (isConfirming) {
      if (confirmPin.length < 4) {
        setConfirmPin(prev => prev + digit);
        Haptics.selectionAsync();
      }
    } else {
      if (pin.length < 4) {
        setPin(prev => prev + digit);
        Haptics.selectionAsync();
      }
    }
  };

  const handleBackspace = () => {
    if (isConfirming) {
      setConfirmPin(prev => prev.slice(0, -1));
      Haptics.selectionAsync();
    } else {
      setPin(prev => prev.slice(0, -1));
      Haptics.selectionAsync();
    }
  };

  const handleSubmit = async () => {
    const currentPin = isConfirming ? confirmPin : pin;

    if (currentPin.length !== 4) {
      Alert.alert("Invalid PIN", "Please enter a 4-digit PIN.");
      return;
    }

    if (mode === "enter") {
      // Verify PIN
      if (currentPin === storedPin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Go to tabs after successful unlock
        router.replace("/(tabs)");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Incorrect PIN", "Please try again.");
        setPin("");
        setConfirmPin("");
      }
    } else if (mode === "set") {
      // Set new PIN
      if (!isConfirming) {
        setIsConfirming(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Confirm PIN
        if (currentPin === pin) {
          await saveData(STORAGE_KEYS.APP_LOCK, { pin: currentPin, enabled: true });
          updateSettings({ appLockEnabled: true });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Success", "PIN has been set and app lock is enabled.");
          router.back();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("PIN Mismatch", "PINs do not match. Please try again.");
          setPin("");
          setConfirmPin("");
          setIsConfirming(false);
        }
      }
    } else if (mode === "change") {
      // Change PIN - first verify old PIN
      if (!isConfirming) {
        if (currentPin === storedPin) {
          setIsConfirming(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Incorrect PIN", "Your current PIN is incorrect.");
          setPin("");
        }
      } else {
        // Set new PIN
        if (currentPin === pin) {
          await saveData(STORAGE_KEYS.APP_LOCK, { pin: currentPin, enabled: true });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Success", "PIN has been changed successfully.");
          router.back();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("PIN Mismatch", "PINs do not match. Please try again.");
          setPin("");
          setConfirmPin("");
          setIsConfirming(false);
        }
      }
    }
  };

  const getTitle = () => {
    if (mode === "enter") return "Enter PIN";
    if (mode === "set") return isConfirming ? "Confirm PIN" : "Set PIN";
    return isConfirming ? "Enter New PIN" : "Current PIN";
  };

  const currentPin = isConfirming ? confirmPin : pin;
  const dots = Array(4).fill(0).map((_, i) => i < currentPin.length);

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {dots.map((filled, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { borderColor: primary },
            filled && { backgroundColor: primary },
          ]}
        />
      ))}
    </View>
  );

  const renderKeypad = () => {
    const rows = [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["", "0", "backspace"],
    ];

    return (
      <View style={styles.keypad}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key) => {
              if (key === "") {
                return <View key={rowIndex + "empty"} style={styles.key} />;
              }
              if (key === "backspace") {
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.key}
                    onPress={handleBackspace}
                    disabled={currentPin.length === 0}
                  >
                    <Ionicons
                      name="backspace-outline"
                      size={24}
                      color={currentPin.length === 0 ? colors.textMuted : colors.text}
                    />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.key}
                  onPress={() => handleDigitPress(key)}
                >
                  <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Ionicons name="lock-closed" size={48} color={primary} style={{ marginBottom: 24 }} />
        
        {renderDots()}

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isConfirming ? "Re-enter your PIN" : "Enter 4-digit PIN"}
        </Text>

        {renderKeypad()}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: primary }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>
            {mode === "enter" ? "Unlock" : isConfirming ? "Confirm" : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
  },
  keypad: {
    marginBottom: 32,
  },
  keypadRow: {
    flexDirection: "row",
  },
  key: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    fontSize: 32,
    fontWeight: "500",
  },
  submitBtn: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    marginTop: 16,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
