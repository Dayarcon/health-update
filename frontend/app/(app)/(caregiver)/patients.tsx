import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useDataStore } from '../../../store/dataStore';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  patientItem: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#16a34a' },
  patientName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  patientDetail: { fontSize: 12, color: '#666' },
});

export default function PatientsScreen() {
  const { patients } = useDataStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {patients.length === 0 ? (
          <Text style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>No patients</Text>
        ) : (
          patients.map(patient => (
            <View key={patient.id} style={styles.patientItem}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientDetail}>Age: {patient.age}</Text>
              <Text style={styles.patientDetail}>Patient ID: {patient.id}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
