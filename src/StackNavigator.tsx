import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Login, SignIn, SignUp } from "./components/login";
import { SimpleChat, ChatUserList } from "./components/simplechat";

interface StackNavigatorProps {}

function StackNavigator(props: StackNavigatorProps) {
  const Stack = createStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator headerMode="none" initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignIn" component={SignIn} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="ChatUserList" component={ChatUserList} />
        <Stack.Screen name="SimpleChat" component={SimpleChat} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default StackNavigator;