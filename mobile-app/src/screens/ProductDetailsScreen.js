import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.barcode}>Barcode: {product.barcode}</Text>

          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>${product.price.toFixed(2)}</Text>
            </View>

            {product.cost && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cost:</Text>
                <Text style={styles.detailValue}>${product.cost.toFixed(2)}</Text>
              </View>
            )}

            {product.category && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{product.category}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stock:</Text>
              <Text style={styles.detailValue}>{product.stock_quantity} units</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Min Stock Level:</Text>
              <Text style={styles.detailValue}>{product.min_stock_level} units</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, product.active ? styles.active : styles.inactive]}>
                {product.active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={() => navigation.goBack()}
        style={styles.button}
      >
        Back
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 15,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  barcode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
    lineHeight: 20,
  },
  detailsContainer: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  active: {
    color: '#4caf50',
  },
  inactive: {
    color: '#d32f2f',
  },
  button: {
    margin: 15,
  },
});
