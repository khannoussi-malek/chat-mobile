import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import React from 'react';
import Groups from './Groups';
import List_Profil from './home/List_Profile';
import MyAccount from './home/MyAccount';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createMaterialBottomTabNavigator();
function Home() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="List_Profile"
        component={List_Profil}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="list-outline" color={color} size={27} />
          ),
        }}
      />
      <Tab.Screen
        name="MyAccount"
        component={MyAccount}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person-outline" color={color} size={27} />
          ),
        }}
      />
      <Tab.Screen
        name="Groups"
        component={Groups}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="people-outline" color={color} size={27} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default Home;
