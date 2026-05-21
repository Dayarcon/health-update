import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#16a34a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    color: '#0066cc',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
});

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'caregiver'>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.register(email, password, name, role);
      if (response.success) {
        const { userId, email: userEmail, role: userRole, accessToken, refreshToken } = response.data;
        setUser({ id: userId, email: userEmail, name, role: userRole });
        setTokens(accessToken, refreshToken);

        const route = userRole === 'patient' ? '/(app)/(patient)' : '/(app)/(caregiver)';
        router.replace(route);
      } else {
        setError(response.error?.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
        I am a:
      </Text>

      <View style={styles.roleContainer}>
        <Pressable
          style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
          onPress={() => setRole('patient')}
        >
          <Text style={[styles.roleButtonText, role === 'patient' && styles.roleButtonTextActive]}>
            👤 Patient
          </Text>
        </Pressable>

        <Pressable
          style={[styles.roleButton, role === 'caregiver' && styles.roleButtonActive]}
          onPress={() => setRole('caregiver')}
        >
          <Text style={[styles.roleButtonText, role === 'caregiver' && styles.roleButtonTextActive]}>
            ❤️ Caregiver
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password (min 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.backButton}>← Back to Login</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
