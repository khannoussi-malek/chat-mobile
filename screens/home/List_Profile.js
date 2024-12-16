import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  SafeAreaView,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firebase from '../../config';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../context/UserContext';

const database = firebase.database();
const auth = firebase.auth();
export default function ListProfil({ route }) {
  const [profiles, setProfiles] = useState([]);
  const navigation = useNavigation();
  const { user, setCurrentUser, setChatInfo } = useUser();
  const [onlineStatus, setOnlineStatus] = useState({});
  useEffect(() => {
    setCurrentUser({
      email: auth.currentUser?.email,
      uid: auth.currentUser?.uid,
    });
    if (!!user?.email) {
      const refProfiles = database.ref('list_profiles');
      const refStatus = database.ref('status');

      const onDataChange = (snapshot) => {
        const profileList = snapshot.val()
          ? Object.entries(snapshot.val())
              .map(([key, value]) => ({ key, ...value }))
              .filter((profile) => profile.email !== user.email)
          : [];

        setCurrentUser(
          Object.entries(snapshot.val())
            .map(([key, value]) => ({ key, ...value }))
            .find((profile) => profile.email === user.email)
        );
        setProfiles(profileList);
      };

      const onStatusChange = (snapshot) => {
        const status = snapshot.val();
        setOnlineStatus(status || {});
      };

      refProfiles.on('value', onDataChange);
      refStatus.on('value', onStatusChange);

      return () => {
        refProfiles.off('value', onDataChange);
        refStatus.off('value', onStatusChange);
      };
    }
  }, []);

  const renderItem = ({ item }) => {
    const isOnline =
      onlineStatus?.[item.uid]?.connectionState == 'online' || false;
    return (
      <Card
        style={{
          marginBottom: 15,
        }}
        onPress={() => {
          setChatInfo({
            fierbaseKey: 'chat',
            users: [item, user],
            chatTitle: `${item.firstName ?? ''} ${
              item.lastName ?? ''
            }`,
          });
          navigation.navigate('Chat');
        }}
      >
        <Card.Title
          title={`${item.firstName ?? ''} ${item.lastName ?? ''}`}
          subtitle={`Email: ${item.email ?? ''}`}
          left={() => (
            <Image
              source={
                item.avatar
                  ? {
                      uri: item.avatar,
                    }
                  : require('../../assets/img_prof.png')
              }
              style={{ width: 'auto', height: 50, borderRadius: 5 }}
            />
          )}
          right={() => (
            <Icon
              name={isOnline ? 'check-circle' : 'cancel'}
              size={25}
              color={isOnline ? 'green' : 'red'}
              style={{ marginRight: 10 }}
            />
          )}
        />
      </Card>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/background.jpg')}
        resizeMode="cover"
        style={{ flex: 1 }}
      >
        <View
          style={{
            height: 200,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 35,
              textAlign: 'center',
              color: 'white',
            }}
          >
            List Profiles
          </Text>
        </View>

        <View
          style={{
            backgroundColor: '#fff',
            borderTopEndRadius: 40,
            borderTopStartRadius: 40,
            padding: 20,
            flex: 1,
          }}
        >
          <ScrollView>
            <FlatList
              data={profiles}
              renderItem={renderItem}
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
