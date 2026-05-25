import { useRouter } from "expo-router";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
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
import { LinearGradient } from 'expo-linear-gradient';

import { Card } from "@/components/ui/card";
import { register } from "@/services/authService";
import { useTranslation } from "react-i18next";
import { validatePassword, validatePasswordMatch } from "@/utils/passwordValidator";
import { validateEmail } from "@/utils/emailValidator";

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordValidation = validatePassword(form.password);
  const passwordMatchesConfirm = validatePasswordMatch(form.password, form.confirmPassword);
  const emailValidation = validateEmail(form.email);

  const isFormValid =
    form.name.trim().length > 0 &&
    emailValidation.isValid &&
    passwordValidation.isValid &&
    passwordMatchesConfirm;

  const handleRegister = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password, 'patient');
      InteractionManager.runAfterInteractions(() => {
        router.replace({
          pathname: "/(auth)/language",
          params: { next: "/(patient)/home" },
        } as any);
      });
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      {/* Header with LinearGradient */}
      <LinearGradient
        colors={["#22c55e", "#3b82f6"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }: { pressed: boolean }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>{t("register")}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#22c55e", "#3b82f6"]}
              style={styles.avatarGradient}
            >
              <User size={32} color="white" />
            </LinearGradient>
            <Text style={styles.avatarText}>{t("register_title")}</Text>
          </View>

          <Text style={styles.label}>{t("full_name")}</Text>
          <View style={styles.field}>
            <View style={styles.inputRow}>
              <View style={styles.iconSlot}>
                <User size={16} color="#9CA3AF" />
              </View>
              <TextInput
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder={t("full_name_placeholder")}
                placeholderTextColor="#9CA3AF"
                style={styles.textInput}
              />
            </View>
          </View>

          <Text style={styles.label}>{t("email")}</Text>
          <View style={styles.field}>
            <View
              style={[
                styles.inputRow,
                form.email.length > 0 && !emailValidation.isValid && styles.inputRowError,
              ]}
            >
              <View style={styles.iconSlot}>
                <Mail size={16} color="#9CA3AF" />
              </View>
              <TextInput
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                placeholder={t("email_register_placeholder")}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.textInput}
              />
            </View>
            {form.email.length > 0 && !emailValidation.isValid && emailValidation.error ? (
              <Text style={styles.fieldError}>{t(emailValidation.error)}</Text>
            ) : null}
          </View>

          <Text style={styles.label}>{t("password")}</Text>
          <View style={styles.field}>
            <View
              style={[
                styles.inputRow,
                form.password &&
                  !passwordValidation.isValid &&
                  styles.inputRowError,
              ]}
            >
              <View style={styles.iconSlot}>
                <Lock size={16} color="#9CA3AF" />
              </View>
              <TextInput
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                placeholder={t("password_register_placeholder")}
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
            {form.password && !passwordValidation.isValid ? (
              <Text style={styles.fieldError}>
                {t(passwordValidation.errors[0] || "password_error_required")}
              </Text>
            ) : null}
          </View>

          <Text style={styles.label}>{t("confirm_password")}</Text>
          <View style={styles.field}>
            <View
              style={[
                styles.inputRow,
                form.confirmPassword &&
                  !passwordMatchesConfirm &&
                  styles.inputRowError,
              ]}
            >
              <View style={styles.iconSlot}>
                <Lock size={16} color="#9CA3AF" />
              </View>
              <TextInput
                value={form.confirmPassword}
                onChangeText={(v) => setForm({ ...form, confirmPassword: v })}
                placeholder={t("confirm_password_placeholder")}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                style={styles.textInput}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.iconSlot}
                hitSlop={8}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} color="#6B7280" />
                ) : (
                  <Eye size={18} color="#6B7280" />
                )}
              </Pressable>
            </View>
            {form.confirmPassword && !passwordMatchesConfirm ? (
              <Text style={styles.fieldError}>{t("password_error_mismatch")}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={handleRegister}
            disabled={!isFormValid || loading}
            style={[
              styles.submitButton,
              (!isFormValid || loading) && { opacity: 0.5 },
              ]}
              >
            <Text style={styles.submitButtonText}>
              {loading ? t("creating_account") : t("register")}
              </Text>
            </Pressable>
        </Card>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("already_account")} </Text>
          <Pressable onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.loginLink}>{t("login_link")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
  scrollView: { flex: 1, paddingHorizontal: 24, marginTop: -16 },
  card: { padding: 24, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatarGradient: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  field: { marginBottom: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  inputRowError: {
    borderColor: '#ef4444',
  },
  iconSlot: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  fieldError: {
    marginTop: 6,
    fontSize: 13,
    color: '#ef4444',
    lineHeight: 18,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 40 },
  footerText: { color: '#4b5563' },
  loginLink: { color: '#16a34a', fontWeight: '700' },
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
});
