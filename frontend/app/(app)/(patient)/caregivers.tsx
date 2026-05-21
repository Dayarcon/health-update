import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { useDataStore } from '../../../store/dataStore';
import { caregiverAPI } from '../../../services/api';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#16a34a', padding: 12, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  caregiverItem: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caregiverName: { fontSize: 14, fontWeight: '600', color: '#333' },
  caregiverRel: { fontSize: 12, color: '#666', marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 11, fontWeight: '600' },
  statusActive: { backgroundColor: '#d1fae5', color: '#065f46' },
  statusPending: { backgroundColor: '#fef3c7', color: '#92400e' },
});

export default function CaregiversScreen() {
  const { caregivers, setCaregivers } = useDataStore();
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCaregivers();
  }, []);

  const loadCaregivers = async () => {
    try {
      const response = await caregiverAPI.getMyCaregivers();
      if (response.success) {
        setCaregivers(response.data);
      }
    } catch (error) {
      console.error('Failed to load caregivers:', error);
    }
  };

  const handleInvite = async () => {
    if (!email || !relationship) return;
    setLoading(true);
    try {
      const response = await caregiverAPI.invite(email, relationship);
      if (response.success) {
        setEmail('');
        setRelationship('');
        loadCaregivers();
      }
    } catch (error) {
      console.error('Failed to invite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 12 }}>Invite Caregiver</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Relationship (e.g., Daughter)"
            value={relationship}
            onChangeText={setRelationship}
          />
          <TouchableOpacity onPress={handleInvite} disabled={loading} style={styles.button}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Invite</Text>}
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>My Caregivers</Text>
        {caregivers.length === 0 ? (
          <Text style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>No caregivers yet</Text>
        ) : (
          <FlatList
            data={caregivers}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.caregiverItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caregiverName}>{item.name}</Text>
                  <Text style={styles.caregiverRel}>{item.relationship}</Text>
                </View>
                <Text style={[styles.statusBadge, item.status === 'active' ? styles.statusActive : styles.statusPending]}>
                  {item.status}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}
