import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useDataStore } from '../../../store/dataStore';
import { caregiverAPI } from '../../../services/api';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#16a34a', color: '#fff', padding: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  role: { color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 20 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 8, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#16a34a', padding: 12, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  logoutButton: { backgroundColor: '#fee', borderColor: '#c33', borderWidth: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  logoutText: { color: '#c33', fontWeight: '600' },
  loading: { justifyContent: 'center', alignItems: 'center' },
});

export default function CaregiverHomeScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { setPatients } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [patients, setLocalPatients] = useState<any[]>([]);
  const [invitationCode, setInvitationCode] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await caregiverAPI.getMyPatients();
      if (response.success) {
        setLocalPatients(response.data);
        setPatients(response.data);
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitationCode) return;
    try {
      const response = await caregiverAPI.acceptInvitation(invitationCode);
      if (response.success) {
        setInvitationCode('');
        loadPatients();
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
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
        <Text style={styles.greeting}>❤️ {user?.name}</Text>
        <Text style={styles.role}>Caregiver</Text>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{patients.length}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 12 }}>Accept Invitation</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter invitation code"
            value={invitationCode}
            onChangeText={setInvitationCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity onPress={handleAcceptInvitation} style={styles.button}>
            <Text style={styles.buttonText}>✓ Accept</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>My Patients</Text>
        {patients.length === 0 ? (
          <Text style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>No patients yet</Text>
        ) : (
          patients.map(patient => (
            <TouchableOpacity
              key={patient.patientId}
              style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#16a34a' }]}
              onPress={() => router.push(`/(app)/(caregiver)/patient/${patient.patientId}`)}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>{patient.name}</Text>
              <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Age: {patient.age}</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>Reports: {patient.totalReports}</Text>
            </TouchableOpacity>
          ))
        )}

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
