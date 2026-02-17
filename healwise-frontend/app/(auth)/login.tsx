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
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/services/authService";

export default function LoginScreen() {
  const router = useRouter();
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

      if (role === "patient") router.replace("/(patient)/home");
      else if (role === "doctor") router.replace("/(doctor)/dashboard");
      else if (role === "admin") router.replace("/(admin)/dashboard");
      else {
        Alert.alert("Login Failed", "Unknown role: " + String(role));
      }
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
            {/* Header */}
            <LinearGradient
              colors={["#22c55e", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <SafeAreaView>
                <View style={styles.headerContent}>
                  <Pressable onPress={() => router.back()} hitSlop={20}>
                    <ArrowLeft size={22} color="white" />
                  </Pressable>
                  <Text style={styles.headerTitle}>Login</Text>
                </View>
              </SafeAreaView>
            </LinearGradient>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <Card style={styles.card}>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.subText}>Sign in to continue</Text>

                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color="#9CA3AF" style={styles.inputIcon} />
                  <Input
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ paddingLeft: 40 }}
                  />
                </View>

                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
                  <Input
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    secureTextEntry={!showPassword}
                    style={{ paddingLeft: 40, paddingRight: 45 }}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#6B7280" />
                    ) : (
                      <Eye size={18} color="#6B7280" />
                    )}
                  </Pressable>
                </View>

                <Pressable style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
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
                      {loading ? "Logging in..." : "Login"}
                      </Text>
                      </Pressable>
              </Card>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Don’t have an account?
                </Text>
                <Pressable onPress={() => router.push("/(auth)/register")}>
                  <Text style={styles.registerLink}>Register Now</Text>
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

  inputWrapper: {
    position: "relative",
    marginBottom: 16,
    justifyContent: "center",
  },

  inputIcon: {
    position: "absolute",
    left: 12,
    zIndex: 10,
  },

  eyeIcon: {
    position: "absolute",
    right: 12,
    zIndex: 10,
    padding: 4,
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
