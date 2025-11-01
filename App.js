import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import RegistrationScreen from './RegistrationScreen';
import Dashboard from './Dashboard';

const Stack = createNativeStackNavigator();

export default function App() {
const [isLoggedIn, setIsLoggedIn] = useState(false);

return ( <NavigationContainer>
<Stack.Navigator screenOptions={{ headerShown: false }}>
<Stack.Screen name="HomeScreen">
{(props) => <HomeScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
</Stack.Screen>
<Stack.Screen name="RegistrationScreen" component={RegistrationScreen} />
<Stack.Screen name="Dashboard">
{(props) => <Dashboard {...props} setIsLoggedIn={setIsLoggedIn} />}
</Stack.Screen>
</Stack.Navigator> </NavigationContainer>
)}
