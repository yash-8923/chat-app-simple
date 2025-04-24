import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView } from 'react-native';

const SimpleChatModules = [
  {
    id: 'ChatUserList',
    name: 'User List',
    description: 'View and select users to chat with',
  },
  {
    id: 'SimpleChat',
    name: 'Simple Chat',
    description: 'Direct messaging with real-time updates',
  }
];

export const SimpleChatModuleList = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Simple Chat</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {SimpleChatModules.map((module) => (
          <TouchableOpacity
            key={module.id}
            style={styles.moduleCard}
            onPress={() => navigation.navigate(module.id)}
          >
            <View style={styles.moduleContent}>
              <Text style={styles.moduleName}>{module.name}</Text>
              <Text style={styles.moduleDescription}>{module.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#4D8DFF',
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    padding: 16,
  },
  moduleCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  moduleContent: {
    padding: 16,
  },
  moduleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 