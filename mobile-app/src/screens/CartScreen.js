import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, IconButton, TextInput, Divider } from 'react-native-paper';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartScreen({ navigation }) {
  const { cartItems, removeItem, updateQuantity, clearCart, getSubtotal, getTotal, getTax, discount, setDiscount } = useCart();
  const { user } = useAuth();
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState(discount.toString());

  const taxRate = 0.10; // This should come from settings
  const currencySymbol = '$';

  const handleUpdateQuantity = (productId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId, productName) => {
    Alert.alert(
      'Remove Item',
      `Remove ${productName} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(productId) }
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear all items from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart }
      ]
    );
  };

  const handleApplyDiscount = () => {
    const value = parseFloat(discountInput);
    if (isNaN(value) || value < 0) {
      Alert.alert('Invalid Discount', 'Please enter a valid discount amount');
      return;
    }
    setDiscount(value);
    setEditingDiscount(false);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before checkout');
      return;
    }
    navigation.navigate('Checkout');
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>Scan products to add them to cart</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('Scan')}
          style={styles.scanButton}
        >
          Start Scanning
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Button mode="text" onPress={handleClearCart} textColor="#d32f2f">
            Clear All
          </Button>
        </View>

        {cartItems.map((item) => (
          <Card key={item.product_id} style={styles.itemCard}>
            <Card.Content>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemBarcode}>Barcode: {item.barcode}</Text>
                  <Text style={styles.itemPrice}>
                    {currencySymbol}{item.price.toFixed(2)} each
                  </Text>
                </View>
                <IconButton
                  icon="delete"
                  iconColor="#d32f2f"
                  size={24}
                  onPress={() => handleRemoveItem(item.product_id, item.name)}
                />
              </View>

              <View style={styles.itemFooter}>
                <View style={styles.quantityControl}>
                  <IconButton
                    icon="minus"
                    size={20}
                    onPress={() => handleUpdateQuantity(item.product_id, item.quantity, -1)}
                  />
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={() => handleUpdateQuantity(item.product_id, item.quantity, 1)}
                    disabled={item.quantity >= item.stock_quantity}
                  />
                </View>
                <Text style={styles.itemTotal}>
                  {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>

              {item.quantity >= item.stock_quantity && (
                <Text style={styles.stockWarning}>
                  ⚠️ Maximum available: {item.stock_quantity}
                </Text>
              )}
            </Card.Content>
          </Card>
        ))}

        <Card style={styles.discountCard}>
          <Card.Content>
            <View style={styles.discountHeader}>
              <Text style={styles.discountTitle}>Discount</Text>
              {!editingDiscount ? (
                <Button mode="text" onPress={() => {
                  setEditingDiscount(true);
                  setDiscountInput(discount.toString());
                }}>
                  {discount > 0 ? 'Edit' : 'Add'}
                </Button>
              ) : null}
            </View>

            {editingDiscount ? (
              <View style={styles.discountInput}>
                <TextInput
                  label="Discount Amount"
                  value={discountInput}
                  onChangeText={setDiscountInput}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Affix text={currencySymbol} />}
                />
                <View style={styles.discountButtons}>
                  <Button onPress={() => setEditingDiscount(false)}>Cancel</Button>
                  <Button mode="contained" onPress={handleApplyDiscount}>Apply</Button>
                </View>
              </View>
            ) : (
              <Text style={styles.discountValue}>
                {discount > 0 ? `-${currencySymbol}${discount.toFixed(2)}` : 'No discount applied'}
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{currencySymbol}{getSubtotal().toFixed(2)}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={[styles.totalValue, styles.discountText]}>
                -{currencySymbol}{discount.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({(taxRate * 100).toFixed(0)}%):</Text>
            <Text style={styles.totalValue}>{currencySymbol}{getTax(taxRate).toFixed(2)}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>
              {currencySymbol}{getTotal(taxRate).toFixed(2)}
            </Text>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
        >
          Proceed to Checkout
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  scanButton: {
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemCard: {
    margin: 10,
    marginBottom: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemBarcode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 15,
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  stockWarning: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 8,
  },
  discountCard: {
    margin: 10,
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  discountValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  discountInput: {
    marginTop: 10,
  },
  input: {
    marginBottom: 10,
  },
  discountButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalsContainer: {
    marginBottom: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  discountText: {
    color: '#4caf50',
  },
  divider: {
    marginVertical: 10,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  checkoutButton: {
    marginTop: 5,
  },
  checkoutButtonContent: {
    paddingVertical: 8,
  },
});
