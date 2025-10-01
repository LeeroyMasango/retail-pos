import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Portal, Modal } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../services/api';

export default function AddProductScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    price: '',
    cost: '',
    category: '',
    stock_quantity: '',
    min_stock_level: '10'
  });
  const [loading, setLoading] = useState(false);

  const handleBarcodeScanned = ({ data }) => {
    if (scanned) return; // Prevent multiple scans
    
    setScanned(true);
    setFormData(prev => ({ ...prev, barcode: data }));
    
    // Close scanner after a short delay
    setTimeout(() => {
      setScanning(false);
      setScanned(false);
      Alert.alert('Barcode Scanned', `Barcode: ${data}`);
    }, 500);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.barcode || !formData.name || !formData.price) {
      Alert.alert('Error', 'Please fill in barcode, name, and price');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        barcode: formData.barcode,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        category: formData.category || null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
        min_stock_level: formData.min_stock_level ? parseInt(formData.min_stock_level) : 10
      };

      await api.createProduct(productData);
      Alert.alert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Add New Product</Text>

          <TextInput
            label="Barcode *"
            value={formData.barcode}
            onChangeText={(text) => setFormData({ ...formData, barcode: text })}
            style={styles.input}
            mode="outlined"
            right={
              <TextInput.Icon
                icon="barcode-scan"
                onPress={() => {
                  if (!permission.granted) {
                    requestPermission();
                  } else {
                    setScanning(true);
                  }
                }}
              />
            }
          />

          <TextInput
            label="Product Name *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Description"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <TextInput
            label="Price *"
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="$" />}
          />

          <TextInput
            label="Cost"
            value={formData.cost}
            onChangeText={(text) => setFormData({ ...formData, cost: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="$" />}
          />

          <TextInput
            label="Category"
            value={formData.category}
            onChangeText={(text) => setFormData({ ...formData, category: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Initial Stock Quantity"
            value={formData.stock_quantity}
            onChangeText={(text) => setFormData({ ...formData, stock_quantity: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
          />

          <TextInput
            label="Minimum Stock Level"
            value={formData.min_stock_level}
            onChangeText={(text) => setFormData({ ...formData, min_stock_level: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Add Product
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.button}
          >
            Cancel
          </Button>
        </Card.Content>
      </Card>

      <Portal>
        <Modal
          visible={scanning}
          onDismiss={() => setScanning(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.scannerContainer}>
            <CameraView
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
              }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
              <Text style={styles.scannerText}>
                {scanned ? 'Barcode captured!' : 'Point camera at barcode'}
              </Text>
              <Text style={styles.scannerSubtext}>
                {scanned ? 'Processing...' : 'Align barcode within the frame'}
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  setScanning(false);
                  setScanned(false);
                }}
                style={styles.cancelButton}
                disabled={scanned}
              >
                Cancel
              </Button>
            </View>
          </View>
        </Modal>
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
    margin: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#6200ee',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
  modal: {
    flex: 1,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scannerSubtext: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 20,
  },
});
