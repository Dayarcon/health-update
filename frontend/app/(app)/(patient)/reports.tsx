import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDataStore } from '../../../store/dataStore';
import { patientAPI, reportAPI } from '../../../services/api';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  uploadCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  pickerText: {
    color: '#333',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  reportItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusFailed: {
    backgroundColor: '#fee2e2',
    color: '#7f1d1d',
  },
});

export default function ReportsScreen() {
  const { patients, reports, setReports } = useDataStore();
  const [selectedReportType, setSelectedReportType] = useState('prescription');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const patientId = patients[0]?.id;

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    if (!patientId) return;
    try {
      const response = await reportAPI.getByPatient(patientId);
      if (response.success) {
        setReports(response.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedFile(result.assets[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !patientId) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const response = await reportAPI.upload(patientId, selectedFile, selectedReportType);
      if (response.success) {
        setSelectedFile(null);
        setError('');
        loadReports();
      } else {
        setError(response.error?.message || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return styles.statusPending;
      case 'completed':
        return styles.statusCompleted;
      case 'failed':
        return styles.statusFailed;
      default:
        return styles.statusPending;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.uploadCard}>
          <Text style={styles.label}>Report Type</Text>
          <View style={styles.picker}>
            <Text style={styles.pickerText}>{selectedReportType}</Text>
          </View>

          <TouchableOpacity onPress={pickImage} style={styles.button}>
            <Text style={styles.buttonText}>
              {selectedFile ? '✓ File Selected' : '📁 Choose File'}
            </Text>
          </TouchableOpacity>

          {selectedFile && (
            <Text style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              {selectedFile.fileName} ({(selectedFile.fileSize / 1024 / 1024).toFixed(2)}MB)
            </Text>
          )}

          {error && (
            <Text style={{ color: '#c33', fontSize: 12, marginTop: 8 }}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleUpload}
            disabled={uploading || !selectedFile}
            style={[styles.button, { opacity: uploading || !selectedFile ? 0.6 : 1 }]}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>📤 Upload Report</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          Your Reports
        </Text>

        {reports.length === 0 ? (
          <View style={{ backgroundColor: '#f0f0f0', padding: 40, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ color: '#999' }}>No reports yet. Upload your first report.</Text>
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.reportItem}>
                <Text style={styles.fileName}>{item.fileName}</Text>
                <Text style={styles.reportMeta}>Type: {item.reportType}</Text>
                <Text style={styles.reportMeta}>
                  Uploaded: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                {item.riskLevel && (
                  <Text style={styles.reportMeta}>Risk: {item.riskLevel}</Text>
                )}
                <Text style={[styles.statusBadge, getStatusColor(item.processingStatus)]}>
                  {item.processingStatus.toUpperCase()}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}
