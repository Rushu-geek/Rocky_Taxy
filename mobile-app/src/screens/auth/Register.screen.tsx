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
import Dropdown, { DropdownOption } from '../../components/Dropdown';
import { formatName } from '../../utils/stringUtils';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

const ROLE_OPTIONS: DropdownOption[] = [
  { label: '🧑 Client — I want to book rides', value: 'client' },
  { label: '🚗 Driver — I want to accept rides', value: 'driver' },
];

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, isLoading } = useContext(AuthContext);
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    else if (!/^\d{7,15}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Enter a valid phone number.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters.';
    if (!form.role) e.role = 'Please select a role.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      console.log("going to call register api <<<<<<");
      await register({
        name: formatName(form.name),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role as 'client' | 'driver',
      });
      showToast({ message: 'Account created successfully!', type: 'success' });
    } catch (e: unknown) {
      console.error("register api error <<<<<<", e);
      showToast({ message: e instanceof Error ? e.message : 'Registration failed.', type: 'error' });
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
          <View style={styles.header}>
            <View style={styles.wordmark}>
              <View style={styles.wordmarkDot} />
              <Text style={styles.wordmarkText}>ROCKY</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us today</Text>
          </View>

          <View style={styles.card}>
            <InputField
              label="Full Name"
              value={form.name}
              onChangeText={(t) => setField('name', t)}
              error={errors.name}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              placeholder="John Doe"
            />

            <InputField
              ref={emailRef}
              label="Email Address"
              value={form.email}
              onChangeText={(t) => setField('email', t)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              placeholder="you@example.com"
            />

            <InputField
              ref={phoneRef}
              label="Phone Number"
              value={form.phone}
              onChangeText={(t) => setField('phone', t)}
              error={errors.phone}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              placeholder="+91 98765 43210"
            />

            <InputField
              ref={passwordRef}
              label="Password"
              value={form.password}
              onChangeText={(t) => setField('password', t)}
              error={errors.password}
              secureTextEntry
              returnKeyType="done"
              placeholder="Min. 6 characters"
            />

            <Dropdown
              label="I am a..."
              value={form.role}
              options={ROLE_OPTIONS}
              onSelect={(opt) => setField('role', opt.value)}
              placeholder="Select your role"
              error={errors.role}
            />

            <PrimaryButton
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.btn}
            />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text style={styles.footerLink}>Sign in</Text>
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
  container: { flexGrow: 1, padding: Spacing.xl, paddingTop: Spacing.xxl },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  wordmark: {
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm,
  },
  wordmarkDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent,
    marginRight: 5,
  },
  wordmarkText: {
    fontSize: Typography.size.xxl, fontWeight: '900', color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  title: { fontSize: Typography.size.xxl, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
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
  btn: { marginTop: Spacing.md },
  footer: { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.xl },
  footerText: { fontSize: Typography.size.base, color: Colors.textSecondary },
  footerLink: { color: Colors.accent, fontWeight: '700' },
});

export default RegisterScreen;
