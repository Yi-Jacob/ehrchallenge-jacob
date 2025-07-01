import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [tenantDomain, setTenantDomain] = useState('');
  const [role, setRole] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const storedEmail = await AsyncStorage.getItem('email');
      const storedTenant = await AsyncStorage.getItem('tenant_domain');
      const storedRole = await AsyncStorage.getItem('role');
      const storedFirstName = await AsyncStorage.getItem('first_name');
      const storedLastName = await AsyncStorage.getItem('last_name');
      setEmail(storedEmail || '');
      setTenantDomain(storedTenant || '');
      setRole(storedRole || '');
      setFirstName(storedFirstName || '');
      setLastName(storedLastName || '');
    };
    fetchProfile();
  }, []);

  const logout = async () => {
    await AsyncStorage.clear();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'Notifications coming soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleNotificationPress} style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Email:</Text>
      <Text style={styles.value}>{email || 'Not set'}</Text>
      <Text style={styles.label}>Tenant Domain:</Text>
      <Text style={styles.value}>{tenantDomain || 'Not set'}</Text>
      <Text style={styles.label}>First Name:</Text>
      <Text style={styles.value}>{firstName || 'Not set'}</Text>
      <Text style={styles.label}>Last Name:</Text>
      <Text style={styles.value}>{lastName || 'Not set'}</Text>
      <Text style={styles.label}>Role:</Text>
      <Text style={styles.value}>{role || 'Not set'}</Text>
      <View style={{ height: 24 }} />
      <Button title="Logout" color="#d9534f" onPress={logout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default ProfileScreen; 