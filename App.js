import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import Chat from './screens/Chat';
import CreateUser from './screens/NewUser';
import Home from './screens/Home';
import Login from './screens/login';
import { PaperProvider } from 'react-native-paper';
import { UserProvider } from './context/UserContext';
import firebase from './config';

const Stack = createNativeStackNavigator();
const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <UserProvider>
          <Stack.Navigator
            initialRouteName={
              !firebase.auth().currentUser ? 'Login' : 'Home'
            }
          >
            <Stack.Screen
              options={{ headerShown: false }}
              name="Login"
              component={Login}
            />
            <Stack.Screen
              options={{ headerShown: false }}
              name="CreateUser"
              component={CreateUser}
            />
            <Stack.Screen
              options={{ headerShown: false }}
              name="Home"
              component={Home}
            />

            <Stack.Screen
              options={{ headerShown: false }}
              name="Chat"
              component={Chat}
            />
            {
              // to do add conversation betwenn every one or more then 3 pp | add view or not vew | show last messagex
            }
          </Stack.Navigator>
        </UserProvider>
      </NavigationContainer>
    </PaperProvider>
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
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

export default App;
