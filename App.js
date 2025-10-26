import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen'; // tvoj login screen (export default)
import RegistrationScreen from './RegistrationScreen'; // jednoduchá registračná stránka
import Dashboard from './Dashboard';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="RegistrationScreen" component={RegistrationScreen} />
        <Stack.Screen name ="Dashboard" component ={Dashboard}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

