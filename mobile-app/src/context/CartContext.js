import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    saveCart();
  }, [cartItems, discount]);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem('cart');
      const storedDiscount = await AsyncStorage.getItem('discount');

      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
      if (storedDiscount) {
        setDiscount(parseFloat(storedDiscount));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
      await AsyncStorage.setItem('discount', discount.toString());
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addItem = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product_id === product.id);

      if (existingItem) {
        return prevItems.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prevItems,
        {
          product_id: product.id,
          barcode: product.barcode,
          name: product.name,
          price: product.price,
          quantity,
          stock_quantity: product.stock_quantity
        }
      ];
    });
  };

  const removeItem = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product_id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotal = (taxRate = 0.10) => {
    const subtotal = getSubtotal();
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * taxRate;
    return subtotal - discount + tax;
  };

  const getTax = (taxRate = 0.10) => {
    const subtotal = getSubtotal();
    const taxableAmount = subtotal - discount;
    return taxableAmount * taxRate;
  };

  const getItemCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value = {
    cartItems,
    discount,
    setDiscount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotal,
    getTax,
    getItemCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
