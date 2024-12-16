import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
} from 'react-native';

import firebase, { supabase } from '../../config';
const db = firebase.database();

const handleLogout = (navigation) => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      navigation.navigate('Auth');
    })
    .catch((error) => {
      console.error('Error logging out: ', error);
    });
};

export default function MyProfile(props) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');

  const [isDefaultImage, setisDefaultImage] = useState(true);
  const [uriImage, seturiImage] = useState('');

  const pickImage = async (camera) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      seturiImage(result.assets[0].uri);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/me2.jpg')}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.textstyle}>My Account</Text>
      <TouchableHighlight
        onPress={async () => {
          pickImage();
          setisDefaultImage(false);
        }}
      >
        <Image
          source={
            isDefaultImage
              ? require('../../assets/me.jpg')
              : { uri: uriImage }
          }
          style={{
            height: 200,
            width: 200,
          }}
        />
      </TouchableHighlight>

      <TextInput
        onChangeText={(text) => {
          setNom(text);
        }}
        textAlign="center"
        placeholderTextColor="#fff"
        placeholder="Nom"
        keyboardType="name-phone-pad"
        style={styles.textinputstyle}
      ></TextInput>
      <TextInput
        onChangeText={(text) => {
          setPrenom(text);
        }}
        textAlign="center"
        placeholderTextColor="#fff"
        placeholder="Prenom"
        keyboardType="name-phone-pad"
        style={styles.textinputstyle}
      ></TextInput>
      <TextInput
        onChangeText={(text) => {
          setTelephone(text);
        }}
        placeholderTextColor="#fff"
        textAlign="center"
        placeholder="Numero"
        style={styles.textinputstyle}
      ></TextInput>
      <TouchableHighlight
        activeOpacity={0.5}
        underlayColor="#DDDDDD"
        onPress={async () => {
          try {
            const ref_listprofiles = db.ref('list_profiles/');

            ref_listprofiles.push({
              nom: nom,
              prenom: prenom,
              telephone: telephone,
            });
          } catch (error) {
            console.error(
              'Error uploading image or saving profile:',
              error
            );
          }
        }}
        style={{
          marginBottom: 10,
          borderColor: '#00f',
          borderWidth: 2,
          backgroundColor: '#08f6',
          height: 60,
          width: '50%',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 5,
          marginTop: 20,
        }}
      >
        <Text
          style={{
            color: '#FFF',
            fontSize: 24,
          }}
        >
          Save
        </Text>
      </TouchableHighlight>
      <TouchableHighlight
        activeOpacity={0.5}
        underlayColor="#DDDDDD"
        onPress={() => handleLogout(props.navigation)}
        style={{
          marginBottom: 10,
          borderColor: '#00f',
          borderWidth: 2,
          backgroundColor: '#f00',
          height: 60,
          width: '50%',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 5,
          marginTop: 20,
        }}
      >
        <Text
          style={{
            color: '#FFF',
            fontSize: 24,
          }}
        >
          Logout
        </Text>
      </TouchableHighlight>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  textinputstyle: {
    fontWeight: 'bold',
    backgroundColor: '#0004',
    fontSize: 20,
    color: '#fff',
    width: '75%',
    height: 50,
    borderRadius: 10,
    margin: 5,
  },
  textstyle: {
    fontSize: 40,
    fontFamily: 'serif',
    color: '#07f',
    fontWeight: 'bold',
  },
  container: {
    color: 'blue',
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
