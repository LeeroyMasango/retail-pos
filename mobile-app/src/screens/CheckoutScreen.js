import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, RadioButton, Card, TextInput } from 'react-native-paper';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import api from '../services/api';

export default function CheckoutScreen({ navigation }) {
  const { cartItems, getSubtotal, getTotal, getTax, discount, clearCart } = useCart();
  const { user } = useAuth();
  const { isOnline, queueOperation } = useOffline();

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const taxRate = 0.10;
  const currencySymbol = '$';

  const handleCompleteSale = async () => {
    setProcessing(true);

    const saleData = {
      items: cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
      payment_method: paymentMethod,
      discount_amount: discount,
      notes: notes.trim() || null
    };

    try {
      if (isOnline) {
        // Process sale online
        const response = await api.createSale(saleData);
        const sale = response.data;
        console.log('Sale completed:', sale);

        clearCart();
        
        const receiptSaleId = sale.saleId || sale.id;
        console.log('Navigating to receipt with saleId:', receiptSaleId);
        
        Alert.alert(
          'Sale Completed',
          `Transaction ID: ${sale.transactionId}\nTotal: ${currencySymbol}${sale.total.toFixed(2)}`,
          [
            {
              text: 'View Receipt',
              onPress: () => navigation.replace('Receipt', { saleId: receiptSaleId })
            },
            {
              text: 'New Sale',
              onPress: () => navigation.navigate('Scan')
            }
          ]
        );
      } else {
        // Queue for offline sync
        await queueOperation('create', 'sale', null, saleData);
        
        clearCart();
        
        Alert.alert(
          'Sale Queued',
          'Sale has been saved and will sync when connection is restored.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Scan')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.details || 'Failed to process sale. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚠️ Offline Mode - Sale will be synced when online
          </Text>
        </View>
      )}

      <Card style={styles.card}>
        <Card.Title title="Order Summary" />
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text>Items:</Text>
            <Text style={styles.summaryValue}>{cartItems.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Subtotal:</Text>
            <Text style={styles.summaryValue}>
              {currencySymbol}{getSubtotal().toFixed(2)}
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text>Discount:</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -{currencySymbol}{discount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text>Tax ({(taxRate * 100).toFixed(0)}%):</Text>
            <Text style={styles.summaryValue}>
              {currencySymbol}{getTax(taxRate).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              {currencySymbol}{getTotal(taxRate).toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Payment Method" />
        <Card.Content>
          <RadioButton.Group
            onValueChange={value => setPaymentMethod(value)}
            value={paymentMethod}
          >
            <View style={styles.radioItem}>
              <RadioButton value="cash" />
              <Text style={styles.radioLabel}>Cash</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="card" />
              <Text style={styles.radioLabel}>Credit/Debit Card</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="mobile" />
              <Text style={styles.radioLabel}>Mobile Payment</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="other" />
              <Text style={styles.radioLabel}>Other</Text>
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Notes (Optional)" />
        <Card.Content>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Add any notes about this transaction..."
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Cashier Information" />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{user?.full_name || user?.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{user?.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time:</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleString()}</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
          disabled={processing}
        >
          Back to Cart
        </Button>
        <Button
          mode="contained"
          onPress={handleCompleteSale}
          style={styles.button}
          loading={processing}
          disabled={processing}
        >
          Complete Sale
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  offlineBanner: {
    backgroundColor: '#ff9800',
    padding: 12,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    margin: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryValue: {
    fontWeight: '500',
  },
  discountText: {
    color: '#4caf50',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  button: {
    flex: 1,
  },
});
