import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet, Alert, Button, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://10.0.2.2:8000/api'; // Change to your backend URL if needed

interface Appointment {
  id: string;
  appointment_date: string;
  patient_first_name: string;
  patient_last_name: string;
  therapist_firstName: string;
  therapist_lastName: string;
  status: string;
}

let db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('appointments.db');
  }
  return db;
}

async function createTable() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      appointment_date TEXT,
      patient_first_name TEXT,
      patient_last_name TEXT,
      therapist_firstName TEXT,
      therapist_lastName TEXT,
      status TEXT
    );
  `);
}

async function saveAppointmentsToDB(appointments: Appointment[]) {
  const db = await getDb();
  await db.runAsync('DELETE FROM appointments');
  for (const appt of appointments) {
    await db.runAsync(
      'INSERT INTO appointments (id, appointment_date, patient_first_name, patient_last_name, therapist_firstName, therapist_lastName, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      appt.id, appt.appointment_date, appt.patient_first_name, appt.patient_last_name, appt.therapist_firstName, appt.therapist_lastName, appt.status
    );
  }
}

async function getAppointmentsFromDB(): Promise<Appointment[]> {
  const db = await getDb();
  return await db.getAllAsync('SELECT * FROM appointments');
}

const AppointmentsScreen = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    await createTable();
    
    const token = await AsyncStorage.getItem('token');
    const tenant_domain = await AsyncStorage.getItem('tenant_domain');
    const netState = await NetInfo.fetch();
    
    if (!netState.isConnected) {
      setOffline(true);
      const localAppointments = await getAppointmentsFromDB();
      setAppointments(localAppointments);
      setLoading(false);
      return;
    }
    
    setOffline(false);
    try {
      const res = await axios.get(`${API_URL}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Domain': tenant_domain,
        },
      });
      
      setAppointments(res.data);
      await saveAppointmentsToDB(res.data);
    } catch (err: any) {
      const localAppointments = await getAppointmentsFromDB();
      setAppointments(localAppointments);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.refreshRow}>
        <Text style={styles.header}>Appointments</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton} disabled={refreshing || loading}>
          <Ionicons name="refresh" size={24} color={refreshing || loading ? '#ccc' : '#333'} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : appointments.length === 0 ? (
        <Text style={styles.emptyText}>{offline ? 'No internet. Showing cached appointments.' : 'No appointments found.'}</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.date}>{new Date(item.appointment_date).toLocaleString()}</Text>
              <Text style={styles.info}>Patient: {item.patient_first_name} {item.patient_last_name}</Text>
              <Text style={styles.info}>Therapist: {item.therapist_firstName} {item.therapist_lastName}</Text>
              <Text style={styles.status}>Status: {item.status}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  date: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  info: {
    fontSize: 15,
    marginBottom: 2,
  },
  status: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888',
  },
});

export default AppointmentsScreen; 