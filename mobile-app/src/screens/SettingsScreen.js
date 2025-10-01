import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, List, Switch, TextInput, Button, Divider, Dialog, Portal } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import api from '../services/api';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { isOnline, pendingOperations, syncPendingOperations, isSyncing } = useOffline();

  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editLabel, setEditLabel] = useState('');

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleEditSetting = (key, label) => {
    setEditKey(key);
    setEditLabel(label);
    setEditValue(settings[key]?.value || '');
    setEditDialog(true);
  };

  const handleSaveSetting = async () => {
    setLoading(true);
    try {
      await api.updateSetting(editKey, editValue);
      await loadSettings();
      setEditDialog(false);
      Alert.alert('Success', 'Setting updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline');
      return;
    }

    const result = await syncPendingOperations();
    if (result) {
      Alert.alert(
        'Sync Complete',
        `Synced: ${result.synced}\nFailed: ${result.failed}`
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="User Information" />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username:</Text>
            <Text style={styles.infoValue}>{user?.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name:</Text>
            <Text style={styles.infoValue}>{user?.full_name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{user?.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Connection Status" />
        <Card.Content>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Network Status:</Text>
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#4caf50' : '#d32f2f' }]}>
              <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pending Sync:</Text>
            <Text style={styles.statusValue}>{pendingOperations.length} operations</Text>
          </View>
          {pendingOperations.length > 0 && (
            <Button
              mode="contained"
              onPress={handleSync}
              loading={isSyncing}
              disabled={!isOnline || isSyncing}
              style={styles.syncButton}
            >
              Sync Now
            </Button>
          )}
        </Card.Content>
      </Card>

      {isManagerOrAdmin && (
        <Card style={styles.card}>
          <Card.Title title="Store Settings" />
          <List.Section>
            <List.Item
              title="Tax Rate"
              description={`${(parseFloat(settings.tax_rate?.value || 0) * 100).toFixed(1)}%`}
              left={props => <List.Icon {...props} icon="percent" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => handleEditSetting('tax_rate', 'Tax Rate (0-1)')}
            />
            <Divider />
            <List.Item
              title="Currency"
              description={settings.currency?.value || 'USD'}
              left={props => <List.Icon {...props} icon="currency-usd" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => handleEditSetting('currency', 'Currency Code')}
            />
            <Divider />
            <List.Item
              title="Currency Symbol"
              description={settings.currency_symbol?.value || '$'}
              left={props => <List.Icon {...props} icon="currency-usd" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => handleEditSetting('currency_symbol', 'Currency Symbol')}
            />
            <Divider />
            <List.Item
              title="Low Stock Threshold"
              description={`${settings.low_stock_threshold?.value || 10} units`}
              left={props => <List.Icon {...props} icon="alert" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => handleEditSetting('low_stock_threshold', 'Low Stock Threshold')}
            />
            <Divider />
            <List.Item
              title="Receipt Header"
              description={settings.receipt_header?.value || 'Retail Store'}
              left={props => <List.Icon {...props} icon="receipt" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => handleEditSetting('receipt_header', 'Receipt Header')}
            />
            <Divider />
            <List.Item
              title="Receipt Footer"
              description={settings.receipt_footer?.value || 'Thank you!'}
              left={props => <List.Icon {...props} icon="receipt" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => handleEditSetting('receipt_footer', 'Receipt Footer')}
            />
          </List.Section>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Title title="About" />
        <Card.Content>
          <Text style={styles.aboutText}>Retail POS v1.0.0</Text>
          <Text style={styles.aboutText}>Point of Sale System</Text>
          <Text style={styles.aboutText}>© 2025 All Rights Reserved</Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#d32f2f"
      >
        Logout
      </Button>

      <Portal>
        <Dialog visible={editDialog} onDismiss={() => setEditDialog(false)}>
          <Dialog.Title>Edit {editLabel}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={editLabel}
              value={editValue}
              onChangeText={setEditValue}
              mode="outlined"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialog(false)}>Cancel</Button>
            <Button onPress={handleSaveSetting} loading={loading}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    width: 100,
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  syncButton: {
    marginTop: 10,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  logoutButton: {
    margin: 10,
    marginBottom: 30,
  },
});
