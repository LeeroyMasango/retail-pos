import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, SegmentedButtons } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import api from '../services/api';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState('today');
  const [dashboard, setDashboard] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dashboardRes = await api.getDashboard();
      setDashboard(dashboardRes.data);

      // Get date range based on period
      const endDate = new Date().toISOString().split('T')[0];
      let startDate;

      if (period === 'today') {
        startDate = endDate;
      } else if (period === 'week') {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        startDate = date.toISOString().split('T')[0];
      } else if (period === 'month') {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        startDate = date.toISOString().split('T')[0];
      }

      const [salesRes, categoryRes] = await Promise.all([
        api.getSalesByDate(startDate, endDate),
        api.getSalesByCategory(startDate, endDate)
      ]);

      setSalesData(salesRes.data);
      setCategoryData(categoryRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundColor: '#6200ee',
    backgroundGradientFrom: '#6200ee',
    backgroundGradientTo: '#9c4dcc',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  const getSalesChartData = () => {
    if (!salesData || salesData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    const labels = salesData.map(d => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const data = salesData.map(d => d.total_revenue || 0);

    return {
      labels: labels.slice(-7), // Last 7 days
      datasets: [{ data: data.slice(-7) }],
    };
  };

  const getCategoryChartData = () => {
    if (!categoryData || categoryData.length === 0) {
      return [];
    }

    const colors = ['#6200ee', '#03dac6', '#ff9800', '#4caf50', '#f44336', '#9c27b0'];

    return categoryData.slice(0, 6).map((cat, index) => ({
      name: cat.category,
      population: cat.total_revenue,
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <SegmentedButtons
          value={period}
          onValueChange={setPeriod}
          buttons={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {dashboard && (
        <>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statValue}>${dashboard.today.total_revenue?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.statLabel}>Today's Revenue</Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statValue}>{dashboard.today.transaction_count || 0}</Text>
                <Text style={styles.statLabel}>Today's Sales</Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statValue}>${dashboard.month.total_revenue?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.statLabel}>Month Revenue</Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statValue}>{dashboard.month.transaction_count || 0}</Text>
                <Text style={styles.statLabel}>Month Sales</Text>
              </Card.Content>
            </Card>
          </View>

          <Card style={styles.card}>
            <Card.Title title="Inventory Status" />
            <Card.Content>
              <View style={styles.inventoryRow}>
                <Text style={styles.inventoryLabel}>Total Products:</Text>
                <Text style={styles.inventoryValue}>{dashboard.inventory.total_products}</Text>
              </View>
              <View style={styles.inventoryRow}>
                <Text style={styles.inventoryLabel}>Low Stock:</Text>
                <Text style={[styles.inventoryValue, styles.warningText]}>
                  {dashboard.inventory.low_stock_count}
                </Text>
              </View>
              <View style={styles.inventoryRow}>
                <Text style={styles.inventoryLabel}>Out of Stock:</Text>
                <Text style={[styles.inventoryValue, styles.errorText]}>
                  {dashboard.inventory.out_of_stock_count}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {dashboard.top_products && dashboard.top_products.length > 0 && (
            <Card style={styles.card}>
              <Card.Title title="Top Products Today" />
              <Card.Content>
                {dashboard.top_products.map((product, index) => (
                  <View key={index} style={styles.topProductRow}>
                    <Text style={styles.topProductName}>{product.name}</Text>
                    <Text style={styles.topProductValue}>{product.total_sold} sold</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}
        </>
      )}

      {salesData && salesData.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Sales Trend" />
          <Card.Content>
            <LineChart
              data={getSalesChartData()}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {categoryData && categoryData.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Sales by Category" />
          <Card.Content>
            <PieChart
              data={getCategoryChartData()}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  segmentedButtons: {
    marginBottom: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
  },
  statCard: {
    width: '48%',
    margin: '1%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  card: {
    margin: 10,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inventoryLabel: {
    fontSize: 14,
  },
  inventoryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  warningText: {
    color: '#ff9800',
  },
  errorText: {
    color: '#d32f2f',
  },
  topProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topProductName: {
    fontSize: 14,
    flex: 1,
  },
  topProductValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
