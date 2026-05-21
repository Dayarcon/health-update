import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useDataStore } from '../../../store/dataStore';
import { patientAPI, reportAPI } from '../../../services/api';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#16a34a',
    color: '#fff',
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  menuIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#fee',
    borderColor: '#c33',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#c33',
    fontWeight: '600',
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function PatientHomeScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { patients, reports, setPatients, setReports } = useDataStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [patientsRes, reportsRes] = await Promise.all([
        patientAPI.getAll(),
        reportAPI.getByPatient(patients[0]?.id || ''),
      ]);

      if (patientsRes.success) {
        setPatients(patientsRes.data);
      }
      if (reportsRes.success) {
        setReports(reportsRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.replace('/(auth)');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>🏥 {user?.name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>Patient</Text>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{patients.length}</Text>
            <Text style={styles.statLabel}>Profiles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{reports.length}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(app)/(patient)/reports')}
        >
          <Text style={styles.menuIcon}>📄</Text>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>My Medical Reports</Text>
            <Text style={styles.menuDesc}>Upload & view AI analysis</Text>
          </View>
          <Text style={{ color: '#999' }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(app)/(patient)/caregivers')}
        >
          <Text style={styles.menuIcon}>❤️</Text>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>My Caregivers</Text>
            <Text style={styles.menuDesc}>Manage who can see your data</Text>
          </View>
          <Text style={{ color: '#999' }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(app)/(patient)/notifications')}
        >
          <Text style={styles.menuIcon}>🔔</Text>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Notifications</Text>
            <Text style={styles.menuDesc}>View all alerts</Text>
          </View>
          <Text style={{ color: '#999' }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
