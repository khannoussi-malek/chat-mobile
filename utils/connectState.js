import firebase from '../config/index';

export const modifyConnectionStatus = (
  identifier,
  connectionState
) => {
  firebase.database().ref(`status/${identifier}`).update({
    connectionState: connectionState,
    lastSeen: new Date(),
  });
};

export const initiateConnectionMonitor = (identifier) => {
  const userConnectionRef = firebase
    .database()
    .ref(`/status/${identifier}`);
  const offlineState = {
    connectionState: 'offline',
    lastSeen: new Date(),
  };
  const onlineState = {
    connectionState: 'online',
    lastSeen: new Date(),
  };
  firebase
    .database()
    .ref('.info/connected')
    .on('value', (snapshot) => {
      if (snapshot.val() === false) {
        return;
      }

      userConnectionRef.onDisconnect().update(offlineState);
      userConnectionRef.update(onlineState);
    });
};
