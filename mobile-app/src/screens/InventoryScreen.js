import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Searchbar, Chip, FAB, Portal, Modal, TextInput, Button, Snackbar } from 'react-native-paper';
import api from '../services/api';

export default function InventoryScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [restockModal, setRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, alertsRes] = await Promise.all([
        api.getProducts({ active: true }),
        api.getInventoryAlerts()
      ]);

      setProducts(productsRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterProducts = () => {
    let filtered = products;

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery)
      );
    }

    // Apply filter
    if (filter === 'low') {
      filtered = filtered.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level);
    } else if (filter === 'out') {
      filtered = filtered.filter(p => p.stock_quantity === 0);
    }

    setFilteredProducts(filtered);
  };

  const handleRestock = (product) => {
    console.log('Opening restock modal for:', product.name);
    setSelectedProduct(product);
    setRestockQuantity('');
    setRestockModal(true);
  };

  const submitRestock = async () => {
    const quantity = parseInt(restockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setMessage('Please enter a valid quantity');
      return;
    }

    try {
      console.log('Restocking product:', selectedProduct.id, 'Quantity:', quantity);
      await api.restockProduct(selectedProduct.id, quantity, 'Manual restock from mobile');
      setMessage(`Successfully restocked ${selectedProduct.name}`);
      setRestockModal(false);
      setRestockQuantity('');
      await loadData();
    } catch (error) {
      console.error('Restock error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to restock product';
      setMessage(errorMsg);
    }
  };

  const getStockStatus = (product) => {
    if (product.stock_quantity === 0) {
      return { label: 'Out of Stock', color: '#d32f2f' };
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { label: 'Low Stock', color: '#ff9800' };
    }
    return { label: 'In Stock', color: '#4caf50' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search products..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={styles.chip}
          >
            All ({products.length})
          </Chip>
          <Chip
            selected={filter === 'low'}
            onPress={() => setFilter('low')}
            style={styles.chip}
          >
            Low Stock ({alerts.filter(a => a.type === 'low_stock').length})
          </Chip>
          <Chip
            selected={filter === 'out'}
            onPress={() => setFilter('out')}
            style={styles.chip}
          >
            Out of Stock ({alerts.filter(a => a.type === 'out_of_stock').length})
          </Chip>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredProducts.map((product) => {
          const status = getStockStatus(product);
          return (
            <Card key={product.id} style={styles.productCard}>
              <Card.Content>
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productBarcode}>Barcode: {product.barcode}</Text>
                    {product.category && (
                      <Text style={styles.productCategory}>Category: {product.category}</Text>
                    )}
                  </View>
                  <View style={styles.productStatus}>
                    <Text style={[styles.statusBadge, { backgroundColor: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.productDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Stock:</Text>
                    <Text style={styles.detailValue}>{product.stock_quantity} units</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Min Level:</Text>
                    <Text style={styles.detailValue}>{product.min_stock_level} units</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={styles.detailValue}>${product.price.toFixed(2)}</Text>
                  </View>
                </View>

                <Button
                  mode="contained"
                  onPress={() => handleRestock(product)}
                  style={styles.restockButton}
                  compact
                >
                  Restock
                </Button>
              </Card.Content>
            </Card>
          );
        })}

        {filteredProducts.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={restockModal}
          onDismiss={() => setRestockModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Restock Product</Text>
          {selectedProduct && (
            <>
              <Text style={styles.modalSubtitle}>{selectedProduct.name}</Text>
              <Text style={styles.modalInfo}>
                Current Stock: {selectedProduct.stock_quantity} units
              </Text>

              <TextInput
                label="Quantity to Add"
                value={restockQuantity}
                onChangeText={setRestockQuantity}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <Button onPress={() => setRestockModal(false)}>Cancel</Button>
                <Button mode="contained" onPress={submitRestock}>
                  Restock
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>

      <Snackbar
        visible={!!message}
        onDismiss={() => setMessage('')}
        duration={3000}
      >
        {message}
      </Snackbar>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
        label="Add Product"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  productCard: {
    margin: 10,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productBarcode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
  },
  productStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  productDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  restockButton: {
    marginTop: 5,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
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
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalInfo: {
    fontSize: 14,
    color: '#666',
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});
