import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Appbar, List, Button } from 'react-native-paper';
import { AuthContext } from '../store/AuthContext';

export const SettingsScreen = () => {
  const theme = useTheme();
  const auth = useContext(AuthContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Settings" color={theme.colors.onSurface} />
      </Appbar.Header>

      <List.Section>
        <List.Subheader style={{ color: theme.colors.primary }}>Server Info</List.Subheader>
        <List.Item
          title="Server URL"
          description={auth?.serverUrl}
          left={props => <List.Icon {...props} icon="server" color={theme.colors.onBackground} />}
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: '#888' }}
        />
      </List.Section>

      <View style={styles.logoutContainer}>
        <Button mode="outlined" onPress={auth?.logout} color={theme.colors.error}>
          Logout
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoutContainer: {
    padding: 16,
    marginTop: 32,
  }
});
