import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const LoginScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Navigate to the main app flow
    navigation.replace('MainApp');
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Icon name="cctv" size={80} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>Frigate</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>Centralized NVR Dashboard</Text>
        </View>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={4}>
          <TextInput
            label="Server URL"
            value={serverUrl}
            onChangeText={setServerUrl}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="server" />}
            autoCapitalize="none"
            placeholder="http://frigate.local:5000"
          />
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
            autoCapitalize="none"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
          />
          
          <Button 
            mode="contained" 
            onPress={handleLogin} 
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon="login"
          >
            Connect to Server
          </Button>

          <Button 
            mode="text" 
            onPress={handleLogin} 
            style={styles.skipButton}
          >
            Skip for Demo
          </Button>
        </Surface>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  card: {
    padding: 24,
    borderRadius: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  skipButton: {
    marginTop: 16,
  }
});
