import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  IconButton,
  Text,
  TextInput,
} from 'react-native-paper';
import { PaperSelect } from 'react-native-paper-select';
import firebase from '../config/index';
import { useUser } from '../context/UserContext';

const database = firebase.database();
const auth = firebase.auth();

const Groups = () => {
  const navigation = useNavigation();

  const [profiles, setProfiles] = useState([]);
  const [groupChates, setGroupchates] = useState([]);
  const { user, setCurrentUser, setChatInfo } = useUser();
  const [chatTitle, setChatTitle] = useState('');

  const [selectedProflies, setSelectedProflies] = useState({
    value: '',
    list: profiles.map((profile) => ({
      _id: profile.key,
      value: `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`,
    })),
    selectedList: [],
    error: '',
  });

  useEffect(() => {
    setCurrentUser({
      email: auth.currentUser?.email,
      uid: auth.currentUser?.uid,
    });
    if (!!user?.email) {
      const refProfiles = database.ref('list_profiles');

      const onDataChange = (snapshot) => {
        const profileList = snapshot.val()
          ? Object.entries(snapshot.val()).map(([key, value]) => ({
              key,
              ...value,
            }))
          : [];

        setCurrentUser(
          Object.entries(snapshot.val())
            .map(([key, value]) => ({ key, ...value }))
            .find((profile) => profile.email === user.email)
        );
        setProfiles(profileList);
      };

      refProfiles.on('value', onDataChange);

      return () => {
        refProfiles.off('value', onDataChange);
      };
    }
  }, []);

  useEffect(() => {
    if (!!user?.email) {
      const refchatGroup = database.ref('chat-group');

      const onDataChange = (snapshot) => {
        const chatG = snapshot.val()
          ? Object.entries(snapshot.val())
              .map(([key, value]) => ({
                key,
                ...value,
              }))
              .filter((cg) =>
                cg?.users?.some((u) => u.email == user.email)
              )
          : [];

        // .filter((cg) =>
        //   cg?.users?.some((u) => u.email == user.email)
        // )
        setGroupchates(chatG);
      };

      refchatGroup.on('value', onDataChange);

      return () => {
        refchatGroup.off('value', onDataChange);
      };
    }
  }, []);

  useEffect(() => {
    setSelectedProflies((prevColors) => ({
      ...prevColors,
      list: profiles.map((profile) => ({
        _id: profile.key,
        value: `${profile?.firstName ?? ''} ${
          profile?.lastName ?? ''
        }`,
        ...profile,
      })),
    }));
  }, [profiles]);

  const renderItem = ({ item }) => {
    return (
      <Card
        style={{
          marginBottom: 15,
        }}
        onPress={() => {
          setChatInfo({
            fierbaseKey: 'chat-group',
            users: selectedProflies.selectedList,
            ...item,
          });
          navigation.navigate('Chat');
        }}
      >
        <Card.Title
          title={`${item.chatTitle ?? ''}`}
          subtitle={
            <View>
              <Text>Email</Text>
              {item.users?.map((u, key) => (
                <Text key={key}>{u.email}</Text>
              ))}
            </View>
          }
        />
      </Card>
    );
  };

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={styles.backgroundImage}
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
          Multi chat
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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!!profiles.length && (
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <PaperSelect
                value={selectedProflies.value}
                label="users"
                onSelection={(value) => {
                  setSelectedProflies({
                    ...selectedProflies,
                    value: value.text,
                    selectedList: value.selectedList,
                    error: '',
                  });
                }}
                arrayList={[...selectedProflies.list]}
                selectedArrayList={selectedProflies.selectedList}
                errorText={
                  !!selectedProflies.selectedList.length
                    ? ''
                    : 'thats required'
                }
                multiEnable={true}
                textInputMode="outlined"
                searchStyle={{ iconColor: 'red' }}
              />
              <TextInput
                mode="outlined"
                label="Name of chat"
                style={{ height: 45, padding: 0 }}
                onChangeText={(v) => setChatTitle(v)}
                error={!chatTitle}
              />
            </View>
            {!chatTitle ||
              (!!selectedProflies.selectedList.length && (
                <IconButton
                  mode="contained"
                  icon="plus"
                  onPress={() => {
                    setChatInfo({
                      fierbaseKey: 'chat-group',
                      users: selectedProflies.selectedList,
                      chatTitle,
                    });
                    navigation.navigate('Chat');
                  }}
                />
              ))}
          </View>
        )}
        <ScrollView>
          <FlatList
            data={groupChates}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{
              paddingBottom: 20,
              flex: 1,
              marginTop: 20,
            }}
          />
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
});

export default Groups;
