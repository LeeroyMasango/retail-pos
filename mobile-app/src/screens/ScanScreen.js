import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, FAB, Portal, Modal, TextInput, Snackbar } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCart } from '../context/CartContext';
import { useOffline } from '../context/OfflineContext';
import api from '../services/api';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { addItem, getItemCount } = useCart();
  const { isOnline } = useOffline();

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanning(false);
    await lookupProduct(data);
  };

  const lookupProduct = async (barcodeValue) => {
    setLoading(true);

    try {
      const response = await api.getProductByBarcode(barcodeValue);
      const product = response.data;

      if (product.stock_quantity <= 0) {
        Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
      } else {
        addItem(product, 1);
        setMessage(`Added ${product.name} to cart`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        Alert.alert('Product Not Found', `No product found with barcode: ${barcodeValue}`);
      } else {
        Alert.alert('Error', 'Failed to lookup product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!barcode.trim()) {
      Alert.alert('Error', 'Please enter a barcode');
      return;
    }

    await lookupProduct(barcode.trim());
    setBarcode('');
    setManualEntry(false);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission denied</Text>
        <Button mode="contained" onPress={requestPermission} style={styles.button}>
          Grant Permission
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠️ Offline Mode</Text>
        </View>
      )}

      {scanning ? (
        <View style={styles.scannerContainer}>
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerText}>Align barcode within frame</Text>
            <Button 
              mode="contained" 
              onPress={() => setScanning(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📷</Text>
            <Text style={styles.title}>Scan Products</Text>
            <Text style={styles.subtitle}>
              Tap the scan button to start scanning barcodes
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getItemCount()}</Text>
              <Text style={styles.statLabel}>Items in Cart</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              icon="barcode-scan"
              onPress={() => setScanning(true)}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              disabled={loading}
            >
              Start Scanning
            </Button>

            <Button
              mode="outlined"
              icon="keyboard"
              onPress={() => setManualEntry(true)}
              style={styles.secondaryButton}
              contentStyle={styles.buttonContent}
              disabled={loading}
            >
              Manual Entry
            </Button>

            <Button
              mode="outlined"
              icon="cart"
              onPress={() => navigation.navigate('Cart')}
              style={styles.secondaryButton}
              contentStyle={styles.buttonContent}
            >
              View Cart ({getItemCount()})
            </Button>
          </View>
        </View>
      )}

      <Portal>
        <Modal
          visible={manualEntry}
          onDismiss={() => setManualEntry(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Enter Barcode</Text>
          <TextInput
            label="Barcode"
            value={barcode}
            onChangeText={setBarcode}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            autoFocus
          />
          <View style={styles.modalButtons}>
            <Button onPress={() => setManualEntry(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleManualEntry} loading={loading}>
              Lookup
            </Button>
          </View>
        </Modal>
      </Portal>

      <Snackbar
        visible={!!message}
        onDismiss={() => setMessage('')}
        duration={2000}
      >
        {message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  offlineBanner: {
    backgroundColor: '#ff9800',
    padding: 10,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    marginVertical: 20,
  },
  statCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  buttonContainer: {
    gap: 10,
  },
  primaryButton: {
    marginBottom: 10,
  },
  secondaryButton: {
    marginBottom: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  scannerContainer: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  cancelButton: {
    marginTop: 30,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
  },
});
