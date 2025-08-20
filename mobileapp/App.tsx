import React from "react";
import { StatusBar } from "react-native";
import HomeScreen from "./screens/HomeScreen";

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />
      <HomeScreen />
    </>
  );
}
