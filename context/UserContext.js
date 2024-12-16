import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from 'react';
import firebase from '../config/index';
import { modifyConnectionStatus } from '../utils/connectState';

const UserContext = createContext();

const db = firebase.database();
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [chatInfo, setChatInfo] = useState({});
  const setCurrentUser = (userInfo) => {
    setUser({ ...user, ...userInfo });
  };

  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setCurrentUser(firebase.auth().currentUser);

    if (!!user?.uid) {
      const userRef = db.ref(`/status/${user.uid}`);
      const connectedRef = db.ref('.info/connected');
      const handleConnectionChange = (connected) => {
        if (connected) {
          userRef.set({
            status: 'online',
            lastActive: new Date(),
          });
          userRef.onDisconnect().set({
            status: 'offline',
            lastActive: new Date(),
          });
        } else {
          userRef.set({
            status: 'online',
            lastActive: new Date(),
          });
        }
      };

      connectedRef.on('value', handleConnectionChange);

      return () => {
        connectedRef.off('value', handleConnectionChange);
        userRef.set({
          status: 'online',
          lastActive: new Date(),
        });
      };
    }
  }, []);
  const clearUser = () => {
    setUser(null);
  };
  const logOut = (navigation) => {
    modifyConnectionStatus(user?.uid, 'offline');
    firebase
      .auth()
      .signOut()
      .then(() => {
        clearUser();
        navigation.navigate('Login');
      })
      .catch((error) => {
        console.error(error);
        ToastAndroid.show(
          'Logout failed. Please try again.',
          ToastAndroid.SHORT
        );
      });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setCurrentUser,
        clearUser,
        logOut,
        chatInfo,
        setChatInfo,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
