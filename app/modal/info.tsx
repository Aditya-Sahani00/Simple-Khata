import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  useColorScheme,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";

export default function InfoModal() {
  const insets = useSafeAreaInsets();
  const { settings } = useApp();
  const systemScheme = useColorScheme();
  
  // Sync theme with system
  const isDark = settings.theme === "dark" || 
    (settings.theme === "system" && systemScheme === "dark");
  
  const colors = isDark ? {
    background: "#121212",
    surface: "#1E1E1E",
    card: "#2C2C2C",
    text: "#FFFFFF",
    textSecondary: "#AAAAAA",
    border: "#3D3D3D",
    primary: "#1565C0",
  } : {
    background: "#F5F6FA",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    text: "#222222",
    textSecondary: "#666666",
    border: "#E0E0E0",
    primary: "#1565C0",
  };

  const params = useLocalSearchParams<{ 
    title?: string; 
    content?: string;
    type?: string;
  }>();

  const title = params.title || "Information";
  const type = params.type || "info";

  const getContent = () => {
    switch (type) {
      case "howto":
        return `1. Create a profile for your business or personal use

2. Add accounts (Cash, Bank, Wallet)

3. Record income and expenses

4. Track parties (customers/suppliers)

5. Monitor your financial health from the dashboard

6. Enable app lock for security`;
      case "company":
        return `ABG Groups is a technology company focused on creating innovative mobile and web applications.

Our mission is to simplify financial management for businesses and individuals.

We believe in:
• Simplicity in design
• Security of data
• Offline-first approach
• User privacy`;
      case "apps":
        return `More apps from ABG Groups coming soon!

Stay tuned for:
• StudyHub - Learning platform
• Business management tools
• And more...

Visit: https://stutyhub.web.app/`;
      default:
        return params.content || "No content available";
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => router.back()}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Ionicons 
              name={
                type === "howto" ? "help-circle" : 
                type === "company" ? "business" : 
                type === "apps" ? "apps" : "information-circle"
              } 
              size={48} 
              color={colors.primary} 
              style={styles.icon}
            />
            <Text style={[styles.bodyText, { color: colors.text }]}>
              {getContent()}
            </Text>
          </View>

          {type === "apps" && (
            <TouchableOpacity 
              style={[styles.linkBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                // Would use Linking.openURL in production
                router.back();
              }}
            >
              <Ionicons name="open-outline" size={20} color="#fff" />
              <Text style={styles.linkBtnText}>Visit StudyHub</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
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
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  icon: {
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  linkBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
