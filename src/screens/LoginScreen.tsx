import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, useTheme } from 'react-native-paper';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';

export const LoginScreen = () => {
  const {
    serverUrl,
    setServerUrl,
    username,
    setUsername,
    password,
    setPassword,
    error,
    isLoggingIn,
    handleLogin,
  } = useAuthViewModel();
  const theme = useTheme();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={{ color: theme.colors.primary }}>Frigate NVR</Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Login to your server</Text>
        </View>

        <TextInput
          label="Server URL (e.g., http://192.168.1.100:5000)"
          value={serverUrl}
          onChangeText={setServerUrl}
          autoCapitalize="none"
          keyboardType="url"
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Username (Optional)"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Password (Optional)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          mode="outlined"
        />

        {error ? <HelperText type="error" visible={!!error}>{error}</HelperText> : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoggingIn}
          disabled={isLoggingIn}
          style={styles.button}
        >
          Connect
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
    paddingVertical: 6,
  },
});
