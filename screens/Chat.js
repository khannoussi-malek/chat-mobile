import { Accelerometer } from 'expo-sensors';
import md5 from 'md5';
import React, { useEffect, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';

import {
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import firebase, { supabase } from '../config';

import dayjs from 'dayjs';
import {
  Avatar,
  Button,
  IconButton,
  MD3Colors,
  Modal,
  Portal,
  TextInput,
} from 'react-native-paper';
import { useUser } from '../context/UserContext';
import { sendLocation } from '../utils';
import { decode } from 'base64-arraybuffer';

const Chat = () => {
  // Shake detection
  const shakeThreshold = 1.5; // Adjust sensitivity
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const shakeCooldown = useRef(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showSearchBar, setShowSearchBar] = useState(false);
  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const flatListRef = useRef(null);

  const [callPhoneModal, setCallPhoneModal] = useState(false);
  // Search through messages
  const searchMessages = (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    // Case-insensitive search
    const results = messages.reduce((acc, message, index) => {
      if (message.text.toLowerCase().includes(query.toLowerCase())) {
        acc.push(index);
      }
      return acc;
    }, []);

    setSearchResults(results);
    setCurrentSearchIndex(0);

    // Scroll to first result if exists
    if (results.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: results[0],
        animated: true,
      });
    }
  };

  // Navigate through search results
  const navigateSearchResults = (direction) => {
    if (searchResults.length === 0) return;

    const newIndex =
      direction === 'next'
        ? (currentSearchIndex + 1) % searchResults.length
        : (currentSearchIndex - 1 + searchResults.length) %
          searchResults.length;

    setCurrentSearchIndex(newIndex);

    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: searchResults[newIndex],
        animated: true,
      });
    }
  };

  const currentUser = firebase.auth().currentUser;
  const { chatInfo, user } = useUser();
  const { email: curetEmail, avatar: myPhoto } = user;

  const { users = [], fierbaseKey, chatTitle = '' } = chatInfo;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setContactIsTyping] = useState(false);

  const sanitizeEmailForFirebaseKey = (email) => {
    if (!email) return '';
    return email.replace(/[.#$\/\[\]]/g, '_');
  };

  const generateChatId = () => {
    const sortedEmails = users
      .map((user) => sanitizeEmailForFirebaseKey(user.email))
      .filter(Boolean)
      .sort()
      .join('_');
    console.log({ sortedEmails :md5(sortedEmails)});
    return md5(sortedEmails);
  };
  const chatId = generateChatId();

  useEffect(() => {
    if (fierbaseKey == 'chat-group') {
      const messagesRef = firebase
        .database()
        .ref(`${fierbaseKey}/${chatId}`)
        .update({ users, chatTitle });
    }
  }, []);

  useEffect(() => {
    const messagesRef = firebase
      .database()
      .ref(`${fierbaseKey}/${chatId}/messages`);

    const userTypingRef = firebase
      .database()
      .ref(`${fierbaseKey}/${chatId}/usersTyping`);

    const onMessageAdded = (snapshot) => {
      const newMessage = snapshot.val();
      if (firebase.auth().currentUser) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } else messagesRef.off('child_added', onMessageAdded);
    };

    const onTypingStatusChanged = (snapshot) => {
      const typingStatus = snapshot.val() || {};

      setContactIsTyping(
        Object.entries(typingStatus).reduce(
          (acc, [key, value]) => {
            if (value.isTyping && value.user.email != user.email) {
              acc.isAnyoneTyping = true;
              acc.typingUsers.push(value.user);
            }
            return acc;
          },
          { isAnyoneTyping: false, typingUsers: [] }
        )
      );
    };

    messagesRef.on('child_added', onMessageAdded);
    userTypingRef.on('value', onTypingStatusChanged);

    return () => {
      messagesRef.off('child_added', onMessageAdded);
      userTypingRef.off('value', onTypingStatusChanged);
    };
  }, [user, users]);

  const sendMessage = () => {
    if (!currentUser) {
      console.log('User is not authenticated');
      return;
    }

    if (newMessage.trim() === '') {
      return;
    }

    const message = {
      ...chatInfo,
      users,
      senderEmail: user,
      receiverEmail: users,
      text: newMessage,
      timestamp: Date.now(),
      read: false,
      seenBy: {
        [sanitizeEmailForFirebaseKey(user.email)]: {
          timestamp: Date.now(),
          user,
        },
      },
    };

    firebase
      .database()
      .ref(`${fierbaseKey}/${chatId}/messages`)
      .push(message);
    setNewMessage('');

    // Stop typing after sending a message
    stopTyping();
    messages.length - 1 > 1 &&
      flatListRef.current.scrollToIndex({
        index: messages.length - 1,
        animated: true,
      });
  };

  const startTyping = () => {
    const userTypingRef = firebase
      .database()
      .ref(`${fierbaseKey}/${chatId}/usersTyping`);

    userTypingRef.update({
      [sanitizeEmailForFirebaseKey(curetEmail)]: {
        isTyping: true,
        user,
      },
    });
  };

  const stopTyping = () => {
    const userTypingRef = firebase
      .database()
      .ref(`${fierbaseKey}/${chatId}/usersTyping`);

    userTypingRef.update({
      [sanitizeEmailForFirebaseKey(curetEmail)]: {
        isTyping: false,
        user,
      },
    });
  };

  const renderMessage = ({ item }) => {
    const formattedDate = dayjs(item.timestamp)
      .format('YYYY MMM ddd hh:mm A')
      .replace('AM', '☀️')
      .replace('PM', '🌙');
    let myMessage = item.senderEmail.email === curetEmail;

    const seenByUsers = item.seenBy ? Object.values(item.seenBy) : [];

    const seenByAvatars = seenByUsers.length > 0 && (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 5,
          marginRight: 10,
        }}
      >
        {seenByUsers
          .filter((u) => u.user?.email != user.email)
          .map((user, index) => (
            <Avatar.Image
              key={index}
              size={20}
              source={{ uri: user.user.avatar }}
              style={{
                marginRight: 5,
                borderWidth: 1,
                borderColor: '#007BFF',
              }}
            />
          ))}
      </View>
    );

    const chatId = generateChatId();

    firebase
      .database()
      .ref(`${fierbaseKey}/${chatId}/messages/${item.key}`);
    if (
      item.text.includes('https://www.google.com/maps?q=') ||
      item.text.includes('supabase.co')
    )
      return (
        <View
          style={{
            display: 'flex',
            flexDirection: !myMessage ? 'row' : 'row-reverse',
            alignItems: 'flex-end',
            gap: 5,
            marginVertical: 10,
          }}
        >
          <Avatar.Image
            size={17}
            source={{
              uri: item.senderEmail.avatar,
            }}
          />
          <Button
            mode="contained-tonal"
            style={styles.messageText}
            onPress={() => Linking.openURL(item.text)}
          >
            {item.text.includes('supabase.co')
              ? 'Donload file'
              : 'Open map'}
          </Button>
        </View>
      );
    return (
      <View
        style={{
          ...(myMessage ? styles.userMessage : styles.contactMessage),
          ...styles.message,
        }}
      >
        <View
          style={{
            display: 'flex',
            flexDirection: !myMessage ? 'row' : 'row-reverse',
            alignItems: 'flex-end',
            gap: 5,
          }}
        >
          <Avatar.Image
            size={17}
            source={{
              uri: item.senderEmail.avatar,
            }}
          />
          <View>
            <Text
              style={{
                ...(myMessage
                  ? styles.userMessageText
                  : styles.contactMessageText),
                ...styles.messageText,
              }}
            >
              {item.text}
            </Text>

            <Text
              style={{
                ...styles.timestampText,
                ...(myMessage
                  ? {
                      color: '#ddd',
                    }
                  : {}),
              }}
            >
              {formattedDate}
            </Text>
            {seenByAvatars}
          </View>
        </View>
      </View>
    );
  };

  const capitalizeWords = (str = '') => {
    return str
      ?.split(' ')
      ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      ?.join(' ');
  };

  async function handleSendLocation() {
    const msg = await sendLocation();
    setNewMessage(msg);
    sendMessage();
  }

  // Accelerometer subscription
  useEffect(() => {
    let subscription;
    const subscribeToAccelerometer = () => {
      subscription = Accelerometer.addListener(
        (accelerometerData) => {
          const { x, y, z } = accelerometerData;

          // Calculate magnitude of acceleration
          const acceleration = Math.sqrt(x * x + y * y + z * z);

          // Compare with previous acceleration
          const prevAcceleration = Math.sqrt(
            lastAcceleration.current.x * lastAcceleration.current.x +
              lastAcceleration.current.y *
                lastAcceleration.current.y +
              lastAcceleration.current.z * lastAcceleration.current.z
          );

          // Check for significant change and no ongoing cooldown
          if (
            !shakeCooldown.current &&
            Math.abs(acceleration - prevAcceleration) > shakeThreshold
          ) {
            // Trigger delete conversation modal
            setShowDeleteModal(true);

            // Set cooldown to prevent multiple triggers
            shakeCooldown.current = true;
            setTimeout(() => {
              shakeCooldown.current = false;
            }, 2000); // 2 second cooldown
          }

          // Update last acceleration
          lastAcceleration.current = { x, y, z };
        }
      );
    };

    subscribeToAccelerometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];

    // Only update if the last message is not from the current user
    if (lastMessage.senderEmail.email !== user.email) {
      const messagesRef = firebase
        .database()
        .ref(`${fierbaseKey}/${chatId}/messages`);

      // Find the last message's key and update its seenBy
      messagesRef
        .orderByChild('timestamp')
        .equalTo(lastMessage.timestamp)
        .once('child_added', (snapshot) => {
          const currentUserKey = sanitizeEmailForFirebaseKey(
            user.email
          );

          // Create or update the seenBy object
          const seenBy = snapshot.val().seenBy || {};
          seenBy[currentUserKey] = {
            timestamp: Date.now(),
            user,
          };

          snapshot.ref.update({
            seenBy: seenBy,
          });
        });
    }
  }, [messages, user]);
  const deleteConversation = () => {
    const chatRef = firebase
      .database()
      .ref(`${fierbaseKey}/${chatId}`);

    chatRef
      .remove()
      .then(() => {
        setMessages([]);
      })
      .catch((error) => {
        console.error('Error deleting conversation:', error);
      })
      .finally(() => {
        setShowDeleteModal(false);
      });
  };
  const renderDeleteModal = () => (
    <Portal>
      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        style={{
          backgroundColor: 'white',
          padding: 5,
          width: '100%',
          height: '25%',
          borderRadius: 20,
          position: 'absolute',
          top: '25%',
        }}
      >
        <Text style={{ padding: 20, fontSize: 30 }}>
          Delete Conversation
        </Text>
        <Text style={{ paddingHorizontal: 20 }}>
          Are you sure you want to delete this entire conversation?
        </Text>
        <View
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            flexDirection: 'row',
            marginTop: 20,
          }}
        >
          <Button
            mode="contained"
            onPress={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            buttonColor="#dc3545"
            onPress={deleteConversation}
          >
            Delete
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  const sendFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({});

    const fileUri = result.assets[0].uri;
    const fileType = result.assets[0].mimeType;

    try {
      const response = await fetch(fileUri);

      const base64 = await response.blob().then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );
      const base64String = base64.split(',')[1];

      const arrayBuffer = decode(base64String);
      const filename = `${fileType}-${user?.uid}-${Date.now()}`;

      const { data, error } = await supabase.storage
        .from('profileImage')
        .upload(filename, arrayBuffer, {
          contentType: fileType,
        });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('profileImage')
        .getPublicUrl(filename);

      const filePath = publicUrl.publicUrl;

      setNewMessage(filePath);
    } catch (error) {
      console.error('Error sending file:', error);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={require('../assets/background.jpg')}
        resizeMode="cover"
        style={styles.image}
      >
        <View style={styles.container}>
          <View style={styles.navBar}>
            {showSearchBar && (
              <View
                style={{
                  flexDirection: u'center',
                  backgroundColor: '#f0f0f000',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <TextInput
                  placeholder="Search messages..."
                  style={{
                    flex: 1,
                    height: 40,
                    backgroundColor: '',
                    paddingHorizontal: 15,
                    marginRight: 10,
                  }}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    searchMessages(text);
                  }}
                />
                {searchResults.length > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        marginRight: 10,
                      }}
                    >
                      {currentSearchIndex + 1} of{' '}
                      {searchResults.length}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigateSearchResults('prev')}
                      style={{
                        marginHorizontal: 5,
                      }}
                    >
                      <Icon name="chevron-up" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigateSearchResults('next')}
                      style={{
                        marginHorizontal: 5,
                      }}
                    >
                      <Icon name="chevron-down" size={20} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: 10,
                paddingBottom: 10,
              }}
            >
              <Icon
                name={!showSearchBar ? 'search' : 'close'}
                size={25}
                color="#FFF"
                style={styles.icon}
                onPress={() => setShowSearchBar(!showSearchBar)}
              />
              <Icon
                name="phone"
                size={30}
                color="#FFF"
                style={styles.icon}
                onPress={() => {
                  setCallPhoneModal(!callPhoneModal);
                }}
              />
              <Text style={styles.sendButtonText}>
                {capitalizeWords(chatTitle)}
              </Text>
              <Icon
                name="location-arrow"
                size={30}
                color="#FFF"
                style={styles.icon}
                onPress={handleSendLocation}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <FlatList
              data={messages}
              ref={flatListRef}
              renderItem={renderMessage}
              keyExtractor={(item) => item.timestamp.toString()}
              style={styles.messageContainer}
            />
          </View>
          {!!isTyping?.isAnyoneTyping && (
            <Text style={styles.typingText}>
              {isTyping?.typingUsers?.map((u) => (
                <Avatar.Image
                  size={17}
                  source={{
                    uri: u?.avatar,
                  }}
                />
              ))}

              <Text
                style={{
                  fontSize: 25,
                }}
              >
                💭
              </Text>
            </Text>
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            //  behavior="height"
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.inputContainer}>
              <IconButton
                icon="file"
                iconColor={MD3Colors.primary50}
                size={30}
                onPress={sendFile}
              />
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                mode="outlined"
                value={newMessage}
                onChangeText={(text) => {
                  setNewMessage(text);
                  text.length > 0 ? startTyping() : stopTyping();
                }}
              />

              <IconButton
                icon="send"
                iconColor={MD3Colors.primary50}
                size={30}
                onPress={sendMessage}
              />
            </View>
          </KeyboardAvoidingView>
          {renderDeleteModal()}
          <Modal
            visible={callPhoneModal}
            onDismiss={() => setCallPhoneModal(false)}
            contentContainerStyle={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 20,
            }}
          >
            {users.map((u, key) => (
              <View
                key={key}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 20,
                  alignItems: 'center',
                }}
              >
                <IconButton
                  icon="phone"
                  size={20}
                  onPress={() => Linking.openURL(`tel:${u.phone}`)}
                />
                <Text>
                  {u.lastName ?? ''} {u?.firstName ?? ''}
                </Text>
              </View>
            ))}
          </Modal>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  image: {
    flex: 1,
    height: '100%',
    display: 'flex',
  },
  message: {
    maxWidth: '90%',
    overflow: 'hidden',
    borderRadius: 18,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6ff',
    color: '#eee',
    fontFamily: 'Arial',
  },
  contactMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    margin: 5,
  },
  messageText: {
    fontSize: 17,
  },
  userMessageText: {
    color: '#ffffff',
  },
  contactMessageText: {
    color: '#000000',
  },
  timestampText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'right',
    marginTop: 5,
  },
  navBar: {
    backgroundColor: '#3897f1',
    height: 'auto',
    width: '100%',
    alignItems: 'center',
    borderBottomEndRadius: 25,
    borderBottomStartRadius: 25,
    paddingTop: 35,
  },

  icon: {
    marginRight: 10,
    marginLeft: 10,
  },

  container: {
    flex: 1,
  },
  messageContainer: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopEndRadius: 25,
    borderTopStartRadius: 25,
  },
  input: {
    flex: 1,
    padding: 0,
  },

  sendButtonText: {
    color: '#fff',
    fontFamily: 'Arial',
    fontSize: 25,
  },
  userMessage: {
    backgroundColor: '#007BFF',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    alignSelf: 'flex-end',
    maxWidth: '70%',
  },
  contactMessage: {
    backgroundColor: '#eee',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },

  typingText: {
    marginLeft: 16,
    paddingVertical: 15,
    overflow: 'visible',
    fontStyle: 'italic',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
});

export default Chat;
