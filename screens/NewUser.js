import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import firebase from '../config';
import { useUser } from '../context/UserContext';

const Auth = firebase.auth();

const db = firebase.database();
const ref_listprofiles = db.ref('list_profiles');

const CreateUser = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cpassword, setCPassword] = useState('');
  const [phone, setPhone] = useState('');
  const navigation = useNavigation();

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
            Create User
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ gap: 25 }}
          >
            <TextInput
              onChangeText={(text) => setEmail(text)}
              style={styles.input}
              mode="outlined"
              placeholder="Email"
              keyboardType="email-address"
            />
            <TextInput
              onChangeText={(text) => setFirstName(text)}
              style={styles.input}
              placeholder="first name"
              mode="outlined"
            />
            <TextInput
              onChangeText={(text) => setLastName(text)}
              style={styles.input}
              placeholder="Last name"
              mode="outlined"
            />
            <TextInput
              onChangeText={(text) => setPhone(text)}
              style={styles.input}
              placeholder="Phone"
              mode="outlined"
              keyboardType="number-pad"
            />

            <TextInput
              onChangeText={(text) => setPassword(text)}
              style={styles.input}
              placeholder="Password"
              mode="outlined"
              error={cpassword !== password}
              secureTextEntry={true}
            />
            <TextInput
              onChangeText={(text) => setCPassword(text)}
              style={styles.input}
              placeholder="Confirm Password"
              mode="outlined"
              error={cpassword !== password}
              secureTextEntry={true}
            />
          </KeyboardAvoidingView>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 20,
            }}
          >
            <View
              style={{
                display: 'flex',
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: 20,
              }}
            >
              <Button
                mode="contained"
                onPress={() => {
                  navigation.navigate('Login');
                }}
              >
                Back to login
              </Button>

              <Button
                mode="contained"
                onPress={async () => {
                  Auth.createUserWithEmailAndPassword(email, password)
                    .then(async (userCredential) => {
                      const user = userCredential.user;
                      await ref_listprofiles.push({
                        email,
                        uid: user.uid,
                        firstName,
                        lastName,
                        phone,
                      });

                      setCurrentUser({
                        email,
                        uid: user.uid,
                        firstName,
                        lastName,
                        phone,
                      });

                      navigation.replace('Home');
                    })
                    .catch((err) => {
                      alert(err);
                    });
                }}
              >
                Create
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
    justifyContent: 'center',
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

export default CreateUser;
