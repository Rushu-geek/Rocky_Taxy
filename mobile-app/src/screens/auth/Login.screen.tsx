import React, { useContext, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, TextInput, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, isLoading } = useContext(AuthContext);
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const passwordRef = useRef<TextInput>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login(email.trim().toLowerCase(), password);
      showToast({ message: 'Welcome back!', type: 'success' });
    } catch (e: unknown) {
      showToast({ message: e instanceof Error ? e.message : 'Login failed. Please try again.', type: 'error' });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.wordmark}>
              <View style={styles.wordmarkDot} />
              <Text style={styles.wordmarkText}>ROCKY</Text>
            </View>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <InputField
              label="Email Address"
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: undefined })); }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              placeholder="you@example.com"
            />

            <InputField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: undefined })); }}
              error={errors.password}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              placeholder="••••••••"
            />

            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginBtn}
            />
          </View>

          {/* Footer */}
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerLink}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  wordmark: {
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm,
  },
  wordmarkDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent,
    marginRight: 6,
  },
  wordmarkText: {
    fontSize: Typography.size.xxxl, fontWeight: '900', color: Colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: { fontSize: Typography.size.base, color: Colors.textSecondary, marginTop: Spacing.xs },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  loginBtn: { marginTop: Spacing.md },
  footer: { alignItems: 'center', marginTop: Spacing.xl },
  footerText: { fontSize: Typography.size.base, color: Colors.textSecondary },
  footerLink: { color: Colors.accent, fontWeight: '700' },
});

export default LoginScreen;
