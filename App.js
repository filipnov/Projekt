import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import RegistrationScreen from './RegistrationScreen';
import Dashboard from './Dashboard';
import ForgetPass from "./ForgetPass";
import ResetPass from "./ResetPass";
import ProfileCompletition from './ProfileCompletition';    
import AsyncStorage from '@react-native-async-storage/async-storage';
import CameraScreen from './CameraScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeScreen">
          {(props) => <HomeScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
        </Stack.Screen>
        <Stack.Screen name="RegistrationScreen" component={RegistrationScreen} />
        <Stack.Screen name="Dashboard">
          {(props) => <Dashboard {...props} setIsLoggedIn={setIsLoggedIn} />}
        </Stack.Screen>
        <Stack.Screen name="CameraScreen" component={CameraScreen}></Stack.Screen>
        <Stack.Screen name="ForgetPass" component={ForgetPass} />
        <Stack.Screen name="ResetPass" component={ResetPass} />
        <Stack.Screen name="ProfileCompletition">
          {(props) => (
            <ProfileCompletition {...props} setIsLoggedIn={setIsLoggedIn} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
