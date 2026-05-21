import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useDataStore } from '../../../store/dataStore';
import { notificationAPI } from '../../../services/api';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  notificationTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  notificationMessage: { fontSize: 13, color: '#666', marginBottom: 6 },
  notificationTime: { fontSize: 11, color: '#999' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a', marginRight: 8 },
});

export default function NotificationsScreen() {
  const { notifications, setNotifications, markNotificationAsRead } = useDataStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTap = async (id: string) => {
    markNotificationAsRead(id);
    try {
      await notificationAPI.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          Notifications ({notifications.filter(n => !n.isRead).length})
        </Text>

        {notifications.length === 0 ? (
          <Text style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>No notifications</Text>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.notificationItem}
                onPress={() => handleTap(item.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  {!item.isRead && <View style={styles.unreadDot} />}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationMessage}>{item.message}</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}
