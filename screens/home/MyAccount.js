import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { default as React, useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  TextInput,
} from 'react-native-paper';
import firebase, { supabase } from '../../config';
import { useUser } from '../../context/UserContext';

const db = firebase.database();
const ref_listprofiles = db.ref('list_profiles');

function MyAccount({ navigation }) {
  const { user, setCurrentUser, logOut } = useUser();
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const { currentId } = user?.uid ?? '';

  const [profileImage, setProfileImage] = useState(
    user?.avatar ?? null
  );
  const [localImageUri, setLocalImageUri] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const onDataChange = (snapshot) => {
          snapshot.forEach((un_profil) => {
            const val = un_profil.val();
            if (val.uid === user?.uid) {
              setFirstName(val.firstName);
              setEmail(val.email);
              setPhone(val.phone || '');
              setLastName(val.lastName);
              setProfileImage(val.avatar);
              setCurrentUser({ ...val, key: un_profil.key });
              return;
            }
          });
        };
        ref_listprofiles.on('value', onDataChange);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [localImageUri]);

  async function updateProfile() {
    try {
      setIsImageLoading(true);
      await ref_listprofiles.child(user.key).update({
        email: email,
        uid: user?.uid,
        phone,
        firstName: firstName ?? '',
        lastName: lastName ?? '',
        avatar: localImageUri ?? profileImage,
      });
    } catch (error) {
      console.error('Error updating data:', error);
    } finally {
      setIsImageLoading(false);
    }
  }

  const pickImage = async () => {
    if (isImageLoading) return null;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (userId) => {
    if (!profileImage) return null;

    try {
      const response = await fetch(profileImage);
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

      const filename = `profile-${userId}-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('profileImage')
        .upload(filename, arrayBuffer, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('profileImage')
        .getPublicUrl(filename);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={styles.image}
      >
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 50,
          }}
        >
          {isImageLoading && (
            <ActivityIndicator animating={true} size="large" />
          )}
          {!isImageLoading && (
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={
                  !!profileImage
                    ? { uri: profileImage }
                    : require('../../assets/img_prof.png')
                }
                style={{
                  marginBottom: 20,
                  width: 100,
                  height: 100,
                  borderRadius: 10,
                }}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text
          style={{
            marginBottom: 20,
            fontSize: 30,
            textAlign: 'center',
            color: 'white',
          }}
        >
          {firstName ?? ''} {lastName ?? ''}
        </Text>
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
              label="First name"
              mode="outlined"
              value={firstName}
              style={styles.input}
              onChangeText={setFirstName}
            />
            <TextInput
              label="Last name"
              mode="outlined"
              value={lastName}
              style={styles.input}
              onChangeText={setLastName}
            />
            <TextInput
              mode="outlined"
              value={email}
              style={styles.input}
              label="Email"
              keyboardType="email-address"
              onChange={setEmail}
            />
            <TextInput
              label="Phone"
              mode="outlined"
              value={phone}
              style={styles.input}
              keyboardType="number-pad"
              onChangeText={setPhone}
            />
          </View>

          <View
            style={{
              display: 'felx',
              gap: 15,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Button
              mode="contained"
              onPress={updateProfile}
              disabled={isImageLoading}
              loading={isImageLoading}
            >
              Update Profile
            </Button>
            <Button
              mode="outlined"
              textColor="#dc3545"
              onPress={() => logOut(navigation)}
              disabled={isImageLoading}
            >
              Logout
            </Button>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
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
  updateText: {
    color: 'white',
    fontSize: 18,

    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
  },
  updateBtn: {
    width: '80%',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#7de5f6',
    color: '#ffffff',
  },
});

export default MyAccount;
