import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, useTheme, Text, Surface, List, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const SettingsScreen = ({ navigation }: any) => {
  const theme = useTheme();

  const handleLogout = () => {
    // Return to Login screen
    navigation.replace('Login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 4 }}>
        <Appbar.Action icon="cog" color={theme.colors.primary} size={28} />
        <Appbar.Content title="Settings" titleStyle={styles.headerTitle} color={theme.colors.onSurface} />
        <Appbar.Action icon="account" onPress={() => {}} color={theme.colors.onSurface} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>Account</List.Subheader>
          <List.Item
            title="Profile Details"
            description="Manage your account info"
            left={props => <List.Icon {...props} icon="account-details" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Security"
            description="Passwords and 2FA"
            left={props => <List.Icon {...props} icon="shield-account" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        <Divider style={{ backgroundColor: theme.colors.surfaceVariant, height: 1 }} />

        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>App Settings</List.Subheader>
          <List.Item
            title="Notifications"
            description="Alerts and push messages"
            left={props => <List.Icon {...props} icon="bell-ring" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Theme"
            description="Dark Mode"
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Server Connection"
            description="http://frigate.local:5000"
            left={props => <List.Icon {...props} icon="server-network" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        <Divider style={{ backgroundColor: theme.colors.surfaceVariant, height: 1 }} />

        <List.Section>
          <List.Item
            title="Logout"
            titleStyle={{ color: theme.colors.error, fontWeight: 'bold' }}
            left={props => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
            onPress={handleLogout}
          />
        </List.Section>
        
        <Text style={styles.versionText}>Frigate App v0.0.1</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { textAlign: 'center', fontWeight: 'bold' },
  scrollContent: { paddingVertical: 8 },
  versionText: { textAlign: 'center', marginTop: 32, marginBottom: 16, color: '#666', fontSize: 12 }
});
