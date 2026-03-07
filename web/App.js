import React from "react";
import RootLayout from "./app/(tabs)/_layout";
import Home from "./app/(tabs)/profile";
import "./global.css";

export default function App() {
  return (
    <RootLayout>
      <Home />
    </RootLayout>
  );
}
