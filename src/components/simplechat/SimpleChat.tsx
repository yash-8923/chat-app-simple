import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';

interface SimpleChatProps {
  navigation: NavigationProp<ParamListBase>;
  route: RouteProp<{ params: { user?: any; group?: any } }, 'params'>;
}

interface Message {
  id: string;
  text: string;
  sender: {
    uid: string;
  };
  receiverType: string;
  receiverId: string;
  sentAt: number;
}

export const SimpleChat = ({ navigation, route }: SimpleChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [receiver, setReceiver] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const listenerIdRef = useRef('simple-chat-listener-' + Date.now());
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get the receiver information from route params
    if (route.params && route.params.user) {
      setReceiver(route.params.user);
    } else if (route.params && route.params.group) {
      setReceiver(route.params.group);
    }

    // Set current user
    CometChat.getLoggedinUser().then(user => {
      if (user) {
        setCurrentUser(user);
      }
    });

    return () => {
      // Clean up the listener on unmount
      CometChat.removeMessageListener(listenerIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (!receiver) return;
    
    // Set up the message listener
    setupMessageListener();
    
    // Fetch previous messages
    fetchPreviousMessages();
  }, [receiver]);

  const setupMessageListener = () => {
    // Remove any existing listener first
    CometChat.removeMessageListener(listenerIdRef.current);
    
    // Add new listener
    CometChat.addMessageListener(
      listenerIdRef.current,
      new CometChat.MessageListener({
        onTextMessageReceived: (textMessage: any) => {
          // Check if the message is for the current conversation
          const isUserChat = receiver?.uid && 
            ((textMessage.getSender().getUid() === receiver.uid && textMessage.getReceiverType() === 'user') || 
             (textMessage.getReceiverId() === receiver.uid));
          
          const isGroupChat = receiver?.guid && textMessage.getReceiverId() === receiver.guid;
          
          if (isUserChat || isGroupChat) {
            // Add message to state if it's for the current conversation
            setMessages(prevMessages => {
              // Avoid duplicate messages
              const isDuplicate = prevMessages.some(msg => msg.id === textMessage.getId());
              if (isDuplicate) return prevMessages;
              
              // Format the message to match our Message interface
              const formattedMessage: Message = {
                id: textMessage.getId(),
                text: textMessage.getText(),
                sender: {
                  uid: textMessage.getSender().getUid()
                },
                receiverType: textMessage.getReceiverType(),
                receiverId: textMessage.getReceiverId(),
                sentAt: textMessage.getSentAt()
              };
              
              return [...prevMessages, formattedMessage];
            });
            scrollToBottom();
          }
        },
      })
    );
  };

  const fetchPreviousMessages = async () => {
    if (!receiver) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      let messagesRequest;

      if (receiver.uid) {
        // User chat
        messagesRequest = new CometChat.MessagesRequestBuilder()
          .setUID(receiver.uid)
          .setLimit(50)
          .build();
      } else if (receiver.guid) {
        // Group chat
        messagesRequest = new CometChat.MessagesRequestBuilder()
          .setGUID(receiver.guid)
          .setLimit(50)
          .build();
      } else {
        throw new Error('Invalid receiver');
      }

      const previousMessages = await messagesRequest.fetchPrevious();
      if (Array.isArray(previousMessages)) {
        // Convert CometChat messages to our Message interface
        const formattedMessages: Message[] = previousMessages.map((msg: any) => ({
          id: msg.getId(),
          text: msg.getText ? msg.getText() : '',
          sender: {
            uid: msg.getSender().getUid()
          },
          receiverType: msg.getReceiverType(),
          receiverId: msg.getReceiverId(),
          sentAt: msg.getSentAt()
        }));
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
      scrollToBottom();
    } catch (error) {
      console.log('Error fetching messages:', error);
      setErrorMessage('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const retryLoadMessages = () => {
    setIsRefreshing(true);
    fetchPreviousMessages();
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !receiver) return;

    const messageText = inputText.trim();
    setInputText(''); // Clear input immediately for better UX

    try {
      let textMessage;

      if (receiver.uid) {
        // User chat
        textMessage = new CometChat.TextMessage(
          receiver.uid,
          messageText,
          CometChat.RECEIVER_TYPE.USER
        );
      } else if (receiver.guid) {
        // Group chat
        textMessage = new CometChat.TextMessage(
          receiver.guid,
          messageText,
          CometChat.RECEIVER_TYPE.GROUP
        );
      }

      // Add message to state immediately with a temporary ID
      const loggedInUser = await CometChat.getLoggedinUser();
      const uid = loggedInUser ? loggedInUser.getUid() : 'unknown';
      
      const tempMessage: Message = {
        id: 'temp-' + Date.now(),
        sender: { uid },
        sentAt: Math.floor(Date.now() / 1000),
        text: messageText,
        receiverType: receiver.uid ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP,
        receiverId: receiver.uid || receiver.guid
      };
      
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      scrollToBottom();

      // Send message to server
      const sentMessage = await CometChat.sendMessage(textMessage);
      
      // Replace temporary message with the sent message while preserving the sender
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempMessage.id ? {
            id: String(sentMessage.getId()),
            text: typeof sentMessage.getText === 'function' ? sentMessage.getText() : messageText,
            sender: { uid },
            receiverType: sentMessage.getReceiverType(),
            receiverId: sentMessage.getReceiverId(),
            sentAt: sentMessage.getSentAt()
          } : msg
        )
      );
    } catch (error) {
      console.log('Error sending message:', error);
      // Keep the message in the list but mark it as failed
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === 'temp-' + Date.now() ? { ...msg, sendingFailed: true } : msg
        )
      );
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMyMessage = currentUser && item.sender.uid === currentUser.getUid();
    const isFailed = (item as any).sendingFailed;
    
    return (
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.theirMessage,
          isFailed && styles.failedMessage
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <View style={styles.messageFooter}>
          {isFailed ? (
            <Text style={styles.failedText}>Failed to send</Text>
          ) : (
            <Text style={styles.timestamp}>{formatTime(item.sentAt)}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {receiver?.name || 'Chat'}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4D8DFF" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={retryLoadMessages}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          }
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  messageList: {
    padding: 16,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    elevation: 1,
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  failedMessage: {
    backgroundColor: '#ffecec',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  failedText: {
    fontSize: 12,
    color: '#f44336',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 20,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4D8DFF',
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 