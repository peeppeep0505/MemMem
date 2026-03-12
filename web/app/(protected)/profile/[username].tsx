import MyProfileScreen from "@/components/Profile/MyProfileScreen";
import { useLocalSearchParams } from "expo-router";

export default function FriendProfilePage() {
  const { username } = useLocalSearchParams<{ username: string }>();

  return (
    <MyProfileScreen
      username={String(username || "")}
      readOnly
    />
  );
}