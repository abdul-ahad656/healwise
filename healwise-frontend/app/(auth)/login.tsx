import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  InteractionManager,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { Card } from "@/components/ui/card";
import { login } from "@/services/authService";
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data.user.role;
      const userLang = data.user?.language;

      // Defer navigation so loading state clears and the router commit isn’t blocked on Android.
      InteractionManager.runAfterInteractions(() => {
        if (!userLang) {
          const next =
            role === "doctor"
              ? "/(doctor)/dashboard"
              : role === "admin"
                ? "/(admin)/dashboard"
                : "/(patient)/home";

          router.replace({
            pathname: "/(auth)/language",
            params: { next },
          } as any);
          return;
        }

        if (role === "patient") router.replace("/(patient)/home");
        else if (role === "doctor") router.replace("/(doctor)/dashboard");
        else if (role === "admin") router.replace("/(admin)/dashboard");
        else {
          Alert.alert("Login Failed", "Unknown role: " + String(role));
        }
      });
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1 }}>
            <LinearGradient
              colors={["#22c55e", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <SafeAreaView edges={["top"]}>
                <View style={styles.headerContent}>
                  <Pressable onPress={() => router.back()} hitSlop={20}>
                    <ArrowLeft size={22} color="white" />
                  </Pressable>
                  <Text style={styles.headerTitle}>{t("login")}</Text>
                </View>
              </SafeAreaView>
            </LinearGradient>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <Card style={styles.card}>
                <Text style={styles.welcomeText}>{t("welcome")}</Text>
                <Text style={styles.subText}>{t("login_subtitle")}</Text>

                <Text style={styles.label}>{t("email")}</Text>
                <View style={styles.field}>
                  <View style={styles.inputRow}>
                    <View style={styles.iconSlot}>
                      <Mail size={16} color="#9CA3AF" />
                    </View>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder={t("email_placeholder")}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <Text style={styles.label}>{t("password")}</Text>
                <View style={styles.field}>
                  <View style={styles.inputRow}>
                    <View style={styles.iconSlot}>
                      <Lock size={16} color="#9CA3AF" />
                    </View>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t("password_placeholder")}
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      style={styles.textInput}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.iconSlot}
                      hitSlop={8}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color="#6B7280" />
                      ) : (
                        <Eye size={18} color="#6B7280" />
                      )}
                    </Pressable>
                  </View>
                </View>

                <Pressable style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>{t("forgot_password")}</Text>
                </Pressable>

                <Pressable
                onPress={handleLogin}
                disabled={!email || !password || loading}
                style={[
                  styles.submitButton,
                  (!email || !password || loading) && { opacity: 0.5 },
                  ]}
                  >
                    <Text style={styles.submitButtonText}>
                      {loading ? t("logging_in") : t("login")}
                      </Text>
                      </Pressable>
              </Card>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {t("no_account")}
                </Text>
                <Pressable onPress={() => router.push("/(auth)/register")}>
                  <Text style={styles.registerLink}>{t("register_now")}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  scrollContent: {
    flexGrow: 1,
  },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: Platform.OS === "android" ? 40 : 10,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },

  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -30,
    justifyContent: "space-between",
  },

  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  welcomeText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  subText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },

  field: {
    marginBottom: 16,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },

  iconSlot: {
    width: 40,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },

  forgotText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "500",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
    paddingBottom: 40,
    gap: 6,
  },

  footerText: {
    color: "#4b5563",
  },
  submitButton: {
    width: "100%",
    height: 50,
    marginTop: 10,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  registerLink: {
    color: "#16a34a",
    fontWeight: "700",
  },
});
