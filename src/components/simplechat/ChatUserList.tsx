import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

interface ChatUserListProps {
  navigation: NavigationProp<ParamListBase>;
}

// Update User interface to match CometChat.User properties
interface User {
  uid: string;
  name: string;
  avatar?: string;
  status?: string;
  // Add any other properties that might be used from CometChat.User
}

// List of sample users to filter out
const SAMPLE_USERS = [
  'superhero1', 'superhero2', 'superhero3', 'superhero4', 'superhero5',
  'ironman', 'captainamerica', 'spiderman', 'wolverine',
  'andrew', 'joseph', 'john', 'paul'
];

// Check if a user is a sample user by name or uid
const isSampleUser = (user: User): boolean => {
  const nameInLowerCase = user.name.toLowerCase();
  const uidInLowerCase = user.uid.toLowerCase();
  
  return SAMPLE_USERS.some(sample => 
    nameInLowerCase.includes(sample.toLowerCase()) || 
    uidInLowerCase.includes(sample.toLowerCase())
  );
};

export const ChatUserList = ({ navigation }: ChatUserListProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Get current logged in user
    const getCurrentUser = async () => {
      try {
        const user = await CometChat.getLoggedinUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.log("Error getting current user:", error);
        Alert.alert(
          "Session Error",
          "Your session may have expired. Please log in again.",
          [{ text: "OK", onPress: handleLogout }]
        );
      }
    };

    getCurrentUser();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (refreshing) setRefreshing(false);
    setLoading(true);
    setErrorMessage('');

    try {
      const userRequest = new CometChat.UsersRequestBuilder()
        .setLimit(100) // Fetch more users to ensure we have some after filtering
        .build();
      
      const userList = await userRequest.fetchNext();
      
      // Filter out sample users and current user
      if (userList && userList.length > 0) {
        const user = await CometChat.getLoggedinUser();
        const filteredUsers = userList.filter(u => {
          // Don't convert the entire object, just check properties directly
          return (user ? u.getUid() !== user.getUid() : true) && 
                 !isSampleUser({
                   uid: u.getUid(),
                   name: u.getName(),
                   avatar: u.getAvatar(),
                   status: u.getStatus()
                 });
        });
        
        // Properly map CometChat users to User interface
        const mappedUsers = filteredUsers.map(u => ({
          uid: u.getUid(),
          name: u.getName(),
          avatar: u.getAvatar(),
          status: u.getStatus()
        }));
        
        setUsers(mappedUsers);
        
        if (filteredUsers.length === 0) {
          setErrorMessage('No custom users found. Only sample users are available.');
        }
      } else {
        setUsers([]);
        setErrorMessage('No users found in your app.');
      }
    } catch (error) {
      console.log('Error fetching users:', error);
      setErrorMessage('Failed to load users. Pull down to refresh.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const startChat = (user: User) => {
    navigation.navigate('SimpleChat', { user });
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => startChat(item)}
    >
      <Image 
        source={{ uri: item.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <View style={styles.userDetails}>
          <Text style={styles.userId}>ID: {item.uid}</Text>
          <Text style={[
            styles.userStatus,
            item.status === 'online' ? styles.statusOnline : styles.statusOffline
          ]}>
            {item.status === 'online' ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleLogout = () => {
    setLoading(true);
    CometChat.logout()
      .then(() => {
        setLoading(false);
        navigation.navigate('Login');
      })
      .catch(error => {
        console.log("Logout error:", error);
        setLoading(false);
        // Force navigate to login even if logout fails
        navigation.navigate('Login');
      });
  };

  // Get a display name for the header
  const getDisplayName = () => {
    if (!currentUser) {
      return 'User';
    }
    
    try {
      // First try to get the name
      if (currentUser.getName && typeof currentUser.getName === 'function') {
        const name = currentUser.getName();
        if (name && typeof name === 'string' && name.trim() !== '') {
          return name;
        }
      }
      
      // If name is not available, fall back to UID
      if (currentUser.getUid && typeof currentUser.getUid === 'function') {
        const uid = currentUser.getUid();
        if (uid && typeof uid === 'string') {
          return uid;
        }
      }
      
      // If both methods fail, return a default value
      return 'User';
    } catch (error) {
      console.log('Error getting user display name:', error);
      return 'User';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {`Hi, ${getDisplayName()}`}
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4D8DFF" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchUsers}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={item => item.uid}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No custom users found. Create new users to chat with.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4D8DFF']}
            />
          }
        />
      )}
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
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingHorizontal: 10,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userId: {
    fontSize: 14,
    color: '#666',
  },
  userStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusOnline: {
    color: '#4CAF50',
  },
  statusOffline: {
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4D8DFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 