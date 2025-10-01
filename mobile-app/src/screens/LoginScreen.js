import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(username, password);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🛒</Text>
          <Text style={styles.title}>Retail POS</Text>
          <Text style={styles.subtitle}>Point of Sale System</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            left={<TextInput.Icon icon="lock" />}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Login
          </Button>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Default Credentials:</Text>
            <Text style={styles.credText}>Admin: admin / admin123</Text>
            <Text style={styles.credText}>Manager: manager1 / manager123</Text>
            <Text style={styles.credText}>Cashier: cashier1 / cashier123</Text>
          </View>
        </View>
      </View>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setError(''),
        }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  credText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
});
