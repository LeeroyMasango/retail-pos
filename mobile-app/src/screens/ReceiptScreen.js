import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../services/api';

export default function ReceiptScreen({ route, navigation }) {
  const { saleId } = route.params;
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSale();
  }, []);

  const loadSale = async () => {
    try {
      console.log('Loading sale with ID:', saleId);
      const response = await api.getSaleById(saleId);
      console.log('Sale loaded:', response.data);
      setSale(response.data);
    } catch (error) {
      console.error('Failed to load sale:', error);
      Alert.alert('Error', `Failed to load sale details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!sale) return;

    const html = generateReceiptHTML(sale);

    try {
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert('Error', 'Failed to print receipt');
    }
  };

  const handleShare = async () => {
    if (!sale) return;

    const html = generateReceiptHTML(sale);

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const generateReceiptHTML = (saleData) => {
    const currencySymbol = '$';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .info {
            margin-bottom: 20px;
            font-size: 12px;
          }
          .info div {
            margin-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding: 5px 0;
            font-size: 12px;
          }
          td {
            padding: 5px 0;
            font-size: 12px;
          }
          .totals {
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .totals div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 12px;
          }
          .grand-total {
            font-size: 16px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            border-top: 2px solid #000;
            padding-top: 10px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Retail Store</h1>
          <p>RECEIPT</p>
        </div>
        
        <div class="info">
          <div><strong>Transaction ID:</strong> ${saleData.transaction_id}</div>
          <div><strong>Date:</strong> ${new Date(saleData.created_at).toLocaleString()}</div>
          <div><strong>Cashier:</strong> ${saleData.full_name || saleData.username}</div>
          ${saleData.payment_method ? `<div><strong>Payment:</strong> ${saleData.payment_method}</div>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${saleData.items.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${currencySymbol}${item.unit_price.toFixed(2)}</td>
                <td style="text-align: right;">${currencySymbol}${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div>
            <span>Subtotal:</span>
            <span>${currencySymbol}${saleData.subtotal.toFixed(2)}</span>
          </div>
          ${saleData.discount_amount > 0 ? `
            <div>
              <span>Discount:</span>
              <span>-${currencySymbol}${saleData.discount_amount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div>
            <span>Tax (${(saleData.tax_rate * 100).toFixed(1)}%):</span>
            <span>${currencySymbol}${saleData.tax_amount.toFixed(2)}</span>
          </div>
          <div class="grand-total">
            <span>TOTAL:</span>
            <span>${currencySymbol}${saleData.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading receipt...</Text>
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load receipt</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const currencySymbol = '$';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.header}>RECEIPT</Text>
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transaction ID:</Text>
              <Text style={styles.infoValue}>{sale.transaction_id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>{new Date(sale.created_at).toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cashier:</Text>
              <Text style={styles.infoValue}>{sale.full_name || sale.username}</Text>
            </View>
            {sale.payment_method && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment:</Text>
                <Text style={styles.infoValue}>{sale.payment_method}</Text>
              </View>
            )}
          </View>

          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Items</Text>
            {sale.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemDetails}>
                    {item.quantity} x {currencySymbol}{item.unit_price.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {currencySymbol}{item.subtotal.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{currencySymbol}{sale.subtotal.toFixed(2)}</Text>
            </View>
            {sale.discount_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={[styles.totalValue, styles.discount]}>
                  -{currencySymbol}{sale.discount_amount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({(sale.tax_rate * 100).toFixed(1)}%):</Text>
              <Text style={styles.totalValue}>{currencySymbol}{sale.tax_amount.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>TOTAL:</Text>
              <Text style={styles.grandTotalValue}>
                {currencySymbol}{sale.total.toFixed(2)}
              </Text>
            </View>
          </View>

          <Text style={styles.footer}>Thank you for your business!</Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handlePrint}
          style={styles.button}
          icon="printer"
        >
          Print
        </Button>
        <Button
          mode="outlined"
          onPress={handleShare}
          style={styles.button}
          icon="share"
        >
          Share
        </Button>
      </View>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('Scan')}
        style={styles.newSaleButton}
      >
        New Sale
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 20,
  },
  card: {
    margin: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 120,
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
  },
  itemsSection: {
    marginBottom: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalsSection: {
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  discount: {
    color: '#4caf50',
  },
  grandTotal: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000',
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
  footer: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  button: {
    flex: 1,
  },
  newSaleButton: {
    margin: 15,
    marginTop: 0,
  },
});
