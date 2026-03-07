import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import WebLayout from "../common/WebLayout";

type Task = {
  id: number;
  text: string;
  completed: boolean;
};

type Filter = "all" | "active" | "completed";

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Review design mockups", completed: true },
    { id: 2, text: "Update project documentation", completed: false },
    { id: 3, text: "Schedule team sync meeting", completed: false },
  ]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const addTask = () => {
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: input.trim(), completed: false }]);
    setInput("");
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter((t) => !t.completed));
  };

  const filtered = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const FILTERS: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <WebLayout>
      <View className="max-w-2xl mx-auto w-full">

        {/* Header */}
        <View className="mb-8">
          <Text className="text-4xl font-bold text-gray-900 tracking-tight">
            My Tasks
          </Text>
          <Text className="text-gray-400 mt-1 text-sm">
            {activeCount} remaining · {completedCount} completed
          </Text>
        </View>

        {/* Input */}
        <View className="flex-row mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Add a new task..."
            placeholderTextColor="#9ca3af"
            onSubmitEditing={addTask}
            className="flex-1 px-5 py-4 text-gray-800 text-base"
            style={{ outline: "none" } as any}
          />
          <TouchableOpacity
            onPress={addTask}
            className="bg-pink-500 px-6 items-center justify-center"
            style={{ minWidth: 80 }}
          >
            <Text className="text-white font-semibold text-sm tracking-wide">
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row bg-gray-100 rounded-xl p-1 mb-5 self-start">
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg ${filter === f.value ? "bg-white shadow-sm" : ""}`}
            >
              <Text
                className={`text-sm font-medium ${
                  filter === f.value ? "text-gray-800" : "text-gray-400"
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Task List */}
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <View className="py-16 items-center">
              <Text className="text-4xl mb-3">✓</Text>
              <Text className="text-gray-400 text-sm">
                {filter === "completed" ? "No completed tasks yet" : "All clear! Add a task above."}
              </Text>
            </View>
          ) : (
            filtered.map((task, index) => (
              <View
                key={task.id}
                className={`flex-row items-center px-5 py-4 ${
                  index < filtered.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                {/* Checkbox */}
                <TouchableOpacity
                  onPress={() => toggleTask(task.id)}
                  className={`w-5 h-5 rounded-full border-2 mr-4 items-center justify-center flex-shrink-0 ${
                    task.completed ? "bg-pink-500 border-pink-500" : "border-gray-300"
                  }`}
                >
                  {task.completed && (
                    <Text className="text-white" style={{ fontSize: 10, lineHeight: 12 }}>✓</Text>
                  )}
                </TouchableOpacity>

                {/* Text */}
                <Text
                  className={`flex-1 text-base ${
                    task.completed ? "line-through text-gray-300" : "text-gray-700"
                  }`}
                >
                  {task.text}
                </Text>

                {/* Delete */}
                <TouchableOpacity
                  onPress={() => deleteTask(task.id)}
                  className="ml-3 w-7 h-7 rounded-full bg-gray-50 items-center justify-center"
                >
                  <Text className="text-gray-300 text-base leading-none">×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        {completedCount > 0 && (
          <View className="mt-4 flex-row justify-end">
            <TouchableOpacity onPress={clearCompleted}>
              <Text className="text-xs text-gray-400 underline">
                Clear {completedCount} completed
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </WebLayout>
  );
}