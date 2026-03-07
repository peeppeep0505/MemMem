import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const HomeScreen = () => {
  const router = useRouter();

  // ข้อมูลสมมติ (Mock Data)
  const todayProgress = 65; // เปอร์เซ็นต์ความคืบหน้า
  const recentMood = { label: 'Happy', icon: 'happy-outline', color: '#22c55e' };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* 1. Header & Welcome */}
      <View className="px-6 pt-16 pb-8 bg-slate-50 rounded-b-[40px] shadow-sm">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-slate-400 font-medium">Welcome back,</Text>
            <Text className="text-3xl font-bold text-slate-900">John Doe 👋</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile' as any)}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/50' }} 
              className="w-12 h-12 rounded-full border-2 border-blue-500" // รูปโปรไฟล์วงกลมสมบูรณ์
            />
          </TouchableOpacity>
        </View>

        {/* 2. Progress Card */}
        <View className="bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-200">
          <Text className="text-blue-100 font-semibold mb-1"> Today&apos;s Progress</Text>
          <Text className="text-white text-2xl font-bold mb-4">You&apos;re doing great!</Text>
          <View className="w-full bg-blue-400/30 h-2 rounded-full overflow-hidden">
            <View 
              style={{ width: `${todayProgress}%` }} 
              className="bg-white h-full rounded-full" 
            />
          </View>
          <Text className="text-blue-100 mt-2 text-xs font-medium">{todayProgress}% of tasks completed</Text>
        </View>
      </View>

      <View className="px-6 py-8">
        {/* 3. Quick Actions */}
        <Text className="text-lg font-bold text-slate-800 mb-4">Quick Shortcuts</Text>
        <View className="flex-row justify-between mb-8">
          {[
            { label: 'Diary', icon: 'book', color: 'bg-blue-100', text: 'text-blue-600', path: '/diary' },
            { label: 'To-do', icon: 'list', color: 'bg-slate-100', text: 'text-slate-600', path: '/explore' },
            { label: 'Feed', icon: 'people', color: 'bg-indigo-100', text: 'text-indigo-600', path: '/feed' },
          ].map((item) => (
            <TouchableOpacity 
              key={item.label}
              onPress={() => router.push(item.path as any)}
              className="items-center w-[30%]"
            >
              <View className={`${item.color} p-4 rounded-2xl mb-2 w-full items-center`}>
                <Ionicons name={item.icon as any} size={28} color={item.text.replace('text-', '')} />
              </View>
              <Text className={`font-bold ${item.text}`}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. Recent Mood Section */}
        <Text className="text-lg font-bold text-slate-800 mb-4">Current Mood</Text>
        <TouchableOpacity className="flex-row items-center bg-slate-50 p-5 rounded-3xl border border-slate-100 mb-8">
          <Ionicons name={recentMood.icon as any} size={40} color={recentMood.color} />
          <View className="ml-4">
            <Text className="text-slate-900 font-bold text-lg">Feeling {recentMood.label}</Text>
            <Text className="text-slate-500 text-sm">Last updated: 2 hours ago</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" className="ml-auto" />
        </TouchableOpacity>

        {/* 5. Community Teaser */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-slate-800">Community Feed</Text>
          <TouchableOpacity onPress={() => router.push('/feed' as any)}>
            <Text className="text-blue-600 font-semibold">See all</Text>
          </TouchableOpacity>
        </View>
        <View className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm italic">
          <Text className="text-slate-400">&quot;Believe you can and you&apos;re halfway there...&quot;</Text>
          <Text className="text-blue-500 font-bold mt-2">— Shared by Sarah</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;