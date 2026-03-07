import "../global.css";
// import { Stack } from "expo-router";
// import { useEffect } from "react";
// import * as SplashScreen from "expo-splash-screen";

// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   useEffect(() => {
//     SplashScreen.hideAsync();
//   }, []);

//   return (
//     <Stack
//       screenOptions={{
//         headerShown: false, 
//         animation: "slide_from_right", 
//       }}
//     >
//       {/* 1. กลุ่มหน้าจอที่มี Tab Bar ด้านล่าง (Home, Diary Main, Todo) */}
//       <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

//       {/* 2. กลุ่มหน้าจอสำหรับเขียน Diary (Nested Stack ในโฟลเดอร์ diary) */}
//       <Stack.Screen 
//         name="diary" 
//         options={{ 
//           presentation: "card", 
//         }} 
//       />
//     </Stack>
//   );
// }

import { Stack } from "expo-router";

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}