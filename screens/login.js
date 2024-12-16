import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import firebase from '../config';
import { useUser } from '../context/UserContext';
import {
  initiateConnectionMonitor,
  modifyConnectionStatus,
} from '../utils/connectState';

const Login = () => {
  const [login, setlogin] = useState('khannoussimalek@gmail.com');
  const [password, setpassword] = useState('123456');
  const navigation = useNavigation();
  const auth = firebase.auth();
  const [isLoading, setIsLoading] = useState(false);

  const { setCurrentUser } = useUser();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/background.jpg')}
        resizeMode="cover"
        style={styles.image}
      >
        <View
          style={{
            height: 200,
            display: 'flex',
            alignContent: 'center',
            flex: 0.4,
          }}
        >
          <Text
            style={{
              fontSize: 40,
              textAlign: 'center',
              color: 'white',
              marginTop: 100,
            }}
          >
            Authentification
          </Text>
        </View>
        <View
          style={{
            backgroundColor: '#fff',
            borderTopEndRadius: 40,
            borderTopStartRadius: 40,
            padding: 20,
            justifyContent: 'space-between',
            flex: 1,
          }}
        >
          <View
            style={{
              gap: 25,
            }}
          >
            <TextInput
              onChangeText={(text) => setlogin(text)}
              style={styles.input}
              defaultValue={login}
              mode="outlined"
              cursorColor="red"
              label="Email "
            />
            <TextInput
              onChangeText={(text) => setpassword(text)}
              style={styles.input}
              label="Password"
              mode="outlined"
              secureTextEntry={true}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 20,
            }}
          >
            <View style={{ flex: 0.4, paddingRight: 15 }}>
              <Button
                mode="elevated"
                onPress={() => {
                  navigation.navigate('CreateUser');
                }}
                disabled={isLoading}
              >
                Create User
              </Button>
            </View>
            <View style={{ flex: 0.4, paddingLeft: 15 }}>
              <Button
                mode="contained"
                disabled={isLoading}
                loading={isLoading}
                onPress={() => {
                  setIsLoading(true);
                  auth
                    .signInWithEmailAndPassword(login, password)
                    .then((userCredential) => {
                      const user = userCredential.user;
                      const currentId = user.uid;
                      setCurrentUser({
                        uid: user.uid,
                        email: user.email,
                      });
                      initiateConnectionMonitor(currentId);
                      modifyConnectionStatus(currentId, 'online');

                      navigation.navigate('Home', { currentId });
                    })
                    .catch((err) => {
                      alert('Invalid Password or Email ');
                    })
                    .finally(() => {
                      setIsLoading(false);
                    });
                }}
              >
                Login
              </Button>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    backgroundColor: 'red',
    height: '100%',
    display: 'flex',
  },
  text: {
    color: 'white',
    fontSize: 42,

    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
  },
  btn: {},
});
export default Login;
