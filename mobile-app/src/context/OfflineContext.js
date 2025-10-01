import React, { createContext, useState, useContext, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const OfflineContext = createContext();

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online);

      // Auto-sync when coming back online
      if (online && !isSyncing && pendingOperations.length > 0) {
        syncPendingOperations();
      }
    });

    loadPendingOperations();

    return () => unsubscribe();
  }, []);

  const loadPendingOperations = async () => {
    try {
      const stored = await AsyncStorage.getItem('pendingOperations');
      if (stored) {
        setPendingOperations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  };

  const savePendingOperations = async (operations) => {
    try {
      await AsyncStorage.setItem('pendingOperations', JSON.stringify(operations));
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  };

  const queueOperation = async (operation, entityType, entityId, data) => {
    const newOperation = {
      id: Date.now().toString(),
      operation,
      entity_type: entityType,
      entity_id: entityId,
      data,
      timestamp: new Date().toISOString()
    };

    const updated = [...pendingOperations, newOperation];
    setPendingOperations(updated);
    await savePendingOperations(updated);

    // Try to sync immediately if online
    if (isOnline) {
      syncPendingOperations();
    }

    return newOperation.id;
  };

  const syncPendingOperations = async () => {
    if (isSyncing || pendingOperations.length === 0 || !isOnline) {
      return;
    }

    setIsSyncing(true);

    try {
      const results = [];

      for (const operation of pendingOperations) {
        try {
          // Send to server
          await api.queueSync(operation);
          results.push({ id: operation.id, success: true });
        } catch (error) {
          console.error('Failed to sync operation:', operation.id, error);
          results.push({ id: operation.id, success: false, error });
        }
      }

      // Remove successfully synced operations
      const successfulIds = results.filter(r => r.success).map(r => r.id);
      const remaining = pendingOperations.filter(op => !successfulIds.includes(op.id));

      setPendingOperations(remaining);
      await savePendingOperations(remaining);

      return {
        synced: successfulIds.length,
        failed: results.length - successfulIds.length
      };
    } catch (error) {
      console.error('Error syncing operations:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearPendingOperations = async () => {
    setPendingOperations([]);
    await AsyncStorage.removeItem('pendingOperations');
  };

  const value = {
    isOnline,
    pendingOperations,
    isSyncing,
    queueOperation,
    syncPendingOperations,
    clearPendingOperations
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};
