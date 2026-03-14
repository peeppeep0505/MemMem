import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import WebLayout from "../common/WebLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
  type TodoItem,
} from "@/services/todoService";

type Filter = "all" | "active" | "completed";
type ProcessState = "idle" | "loading" | "complete";

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

const C = {
  pink: "#ec4899",
  pinkLight: "#fce7f3",
  pinkMid: "#fbcfe8",
  black: "#0a0a0a",
  charcoal: "#1f2937",
  muted: "#9ca3af",
  faint: "#f9fafb",
  white: "#ffffff",
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function TodoPage() {
  const { user } = useAuth() as any;
  const userId = user?._id || user?.id;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [processingAll, setProcessingAll] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [recentCompletedIds, setRecentCompletedIds] = useState<string[]>([]);

  const mountedRef = useRef(true);

  const FILTERS: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
  ];

  const mapTodoToTask = (todo: TodoItem): Task => ({
    id: todo._id,
    text: todo.text,
    completed: todo.status === "complete",
  });

  const loadTodos = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getTodos(userId);
      if (!mountedRef.current) return;
      setTasks(Array.isArray(data) ? data.map(mapTodoToTask) : []);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load tasks");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    loadTodos();

    return () => {
      mountedRef.current = false;
    };
  }, [userId]);

  const addBusy = (id: string) =>
    setBusyIds((p) => (p.includes(id) ? p : [...p, id]));

  const removeBusy = (id: string) =>
    setBusyIds((p) => p.filter((x) => x !== id));

  const addTask = async () => {
    const text = input.trim();
    if (!text || !userId || submitting || processingAll) return;

    try {
      setSubmitting(true);
      const created = await createTodo(userId, text);
      if (!mountedRef.current) return;
      setTasks((p) => [...p, mapTodoToTask(created)]);
      setInput("");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to add task");
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  const toggleTask = async (id: string) => {
    if (processingAll) return;

    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    try {
      addBusy(id);
      const updated = await updateTodo(id, {
        status: target.completed ? "active" : "complete",
      });
      if (!mountedRef.current) return;
      setTasks((p) => p.map((t) => (t.id === id ? mapTodoToTask(updated) : t)));
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update task");
    } finally {
      if (mountedRef.current) removeBusy(id);
    }
  };

  const deleteTask = async (id: string) => {
    if (processingAll) return;

    try {
      addBusy(id);
      await deleteTodo(id);
      if (!mountedRef.current) return;
      setTasks((p) => p.filter((t) => t.id !== id));
      setRecentCompletedIds((p) => p.filter((x) => x !== id));
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to delete task");
    } finally {
      if (mountedRef.current) removeBusy(id);
    }
  };

  const clearCompleted = async () => {
    if (processingAll) return;

    const done = tasks.filter((t) => t.completed);
    if (!done.length) return;

    try {
      const ids = done.map((t) => t.id);
      setBusyIds((p) => [...new Set([...p, ...ids])]);
      await Promise.all(ids.map((id) => deleteTodo(id)));

      if (!mountedRef.current) return;
      setTasks((p) => p.filter((t) => !t.completed));
      setRecentCompletedIds((p) => p.filter((id) => !ids.includes(id)));
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to clear completed tasks");
    } finally {
      if (mountedRef.current) {
        setBusyIds((p) =>
          p.filter((id) => !done.some((t) => t.id === id))
        );
      }
    }
  };

  const completeAllSequentially = async () => {
    if (processingAll) return;

    const pendingTasks = tasks.filter((t) => !t.completed);
    if (!pendingTasks.length) {
      Alert.alert("Done", "All tasks are already completed");
      return;
    }

    try {
      setProcessingAll(true);
      setRecentCompletedIds([]);

      for (const task of pendingTasks) {
        if (!mountedRef.current) return;

        setProcessingId(task.id);
        addBusy(task.id);

        // ให้เห็นสถานะ active -> loading ก่อน
        await wait(350);

        const updated = await updateTodo(task.id, { status: "complete" });

        if (!mountedRef.current) return;

        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? mapTodoToTask(updated) : t))
        );
        setRecentCompletedIds((prev) =>
          prev.includes(task.id) ? prev : [...prev, task.id]
        );

        removeBusy(task.id);

        // ให้เห็น complete ทีละอันชัดขึ้น
        await wait(220);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to complete all tasks");
    } finally {
      if (mountedRef.current) {
        setProcessingId(null);
        setProcessingAll(false);

        setTimeout(() => {
          if (mountedRef.current) {
            setRecentCompletedIds([]);
          }
        }, 900);
      }
    }
  };

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (filter === "active") return !t.completed;
        if (filter === "completed") return t.completed;
        return true;
      }),
    [tasks, filter]
  );

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const getTaskProcessState = (task: Task): ProcessState => {
    if (processingId === task.id && busyIds.includes(task.id)) return "loading";
    if (recentCompletedIds.includes(task.id)) return "complete";
    return "idle";
  };

  return (
    <WebLayout>
      <View style={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
        {/* ── Header ── */}
        <View style={{ marginBottom: 36 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 4,
                height: 38,
                borderRadius: 99,
                backgroundColor: C.pink,
              }}
            />
            <Text
              style={{
                fontSize: 36,
                fontWeight: "800",
                color: C.black,
                letterSpacing: -1.2,
                lineHeight: 42,
              }}
            >
              My Tasks
            </Text>
          </View>

          {/* Stat badges */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginBottom: 14,
              paddingLeft: 16,
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                backgroundColor: C.pinkLight,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 5,
              }}
            >
              <Text style={{ fontSize: 12, color: C.pink, fontWeight: "700" }}>
                {activeCount} active
              </Text>
            </View>

            <View
              style={{
                backgroundColor: C.faint,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 5,
              }}
            >
              <Text style={{ fontSize: 12, color: C.muted, fontWeight: "600" }}>
                {completedCount} done
              </Text>
            </View>

            {processingAll && (
              <View
                style={{
                  backgroundColor: C.black,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ fontSize: 12, color: C.white, fontWeight: "700" }}>
                  Processing...
                </Text>
              </View>
            )}
          </View>

          {/* Progress bar */}
          <View style={{ paddingLeft: 16 }}>
            <View
              style={{
                height: 6,
                backgroundColor: C.pinkLight,
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${progress}%` as any,
                  borderRadius: 99,
                  backgroundColor: C.pink,
                }}
              />
            </View>
          </View>
        </View>

        {/* ── Input ── */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 20,
            borderRadius: 14,
            overflow: "hidden",
            backgroundColor: C.white,
            borderWidth: 2,
            borderColor: C.pinkMid,
            shadowColor: C.pink,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 18,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="What needs to be done?"
            placeholderTextColor="#f9a8d4"
            onSubmitEditing={addTask}
            editable={!submitting && !processingAll}
            style={
              {
                flex: 1,
                paddingHorizontal: 18,
                paddingVertical: 15,
                fontSize: 15,
                color: C.charcoal,
                outline: "none",
              } as any
            }
          />

          <TouchableOpacity
            onPress={addTask}
            disabled={submitting || processingAll}
            style={{
              backgroundColor:
                submitting || processingAll ? C.pinkMid : C.black,
              paddingHorizontal: 22,
              alignItems: "center",
              justifyContent: "center",
              minWidth: 68,
            }}
          >
            {submitting ? (
              <ActivityIndicator color={C.pink} size="small" />
            ) : (
              <Text
                style={{
                  color: C.white,
                  fontSize: 22,
                  lineHeight: 24,
                  fontWeight: "300",
                }}
              >
                +
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Filter + action row ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              backgroundColor: C.pinkLight,
              borderRadius: 12,
              padding: 4,
              alignSelf: "flex-start",
            }}
          >
            {FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  disabled={processingAll}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 9,
                    backgroundColor: active ? C.white : "transparent",
                    shadowColor: active ? C.pink : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: active ? 0.1 : 0,
                    shadowRadius: 4,
                    opacity: processingAll ? 0.7 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: active ? C.pink : "#f472b6",
                    }}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {activeCount > 0 && (
            <TouchableOpacity
              onPress={completeAllSequentially}
              disabled={processingAll || loading}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 99,
                backgroundColor: processingAll ? C.pinkMid : C.black,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: C.white,
                  fontWeight: "700",
                }}
              >
                {processingAll ? "Completing..." : "Set complete all"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Task list ── */}
        <View
          style={{
            backgroundColor: C.white,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: C.pinkMid,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: "center" }}>
              <ActivityIndicator color={C.pink} />
              <Text style={{ color: C.muted, fontSize: 13, marginTop: 10 }}>
                Loading…
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ paddingVertical: 60, alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 28 }}>
                {filter === "completed" ? "🎀" : "✿"}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#f9a8d4",
                  fontWeight: "600",
                }}
              >
                {filter === "completed"
                  ? "No completed tasks yet"
                  : "Nothing here — add something!"}
              </Text>
            </View>
          ) : (
            filtered.map((task, index) => {
              const isBusy = busyIds.includes(task.id);
              const isLast = index === filtered.length - 1;
              const processState = getTaskProcessState(task);
              const isProcessingThis = processingId === task.id;

              return (
                <View
                  key={task.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: C.pinkLight,
                    opacity: isBusy ? 0.55 : 1,
                    backgroundColor: task.completed ? "#fff5f9" : C.white,
                  }}
                >
                  {/* Checkbox / loader */}
                  <TouchableOpacity
                    onPress={() => toggleTask(task.id)}
                    disabled={isBusy || processingAll}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 99,
                      borderWidth: 2,
                      borderColor: task.completed ? C.pink : C.pinkMid,
                      backgroundColor: task.completed ? C.pink : C.white,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                      flexShrink: 0,
                    }}
                  >
                    {processState === "loading" ? (
                      <ActivityIndicator size="small" color={C.pink} />
                    ) : task.completed ? (
                      <Text
                        style={{
                          color: C.white,
                          fontSize: 11,
                          fontWeight: "900",
                          lineHeight: 13,
                        }}
                      >
                        ✓
                      </Text>
                    ) : null}
                  </TouchableOpacity>

                  {/* Task text + small status */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        color: task.completed ? "#f9a8d4" : C.charcoal,
                        textDecorationLine: task.completed
                          ? "line-through"
                          : "none",
                        letterSpacing: -0.1,
                      }}
                    >
                      {task.text}
                    </Text>

                    {(isProcessingThis || processState === "complete") && (
                      <Text
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          fontWeight: "700",
                          color:
                            processState === "loading" ? C.muted : C.pink,
                        }}
                      >
                        {processState === "loading"
                          ? "loading..."
                          : "complete"}
                      </Text>
                    )}
                  </View>

                  {/* Delete */}
                  <TouchableOpacity
                    onPress={() => deleteTask(task.id)}
                    disabled={isBusy || processingAll}
                    style={{
                      marginLeft: 10,
                      width: 28,
                      height: 28,
                      borderRadius: 99,
                      borderWidth: 1.5,
                      borderColor: C.pinkMid,
                      backgroundColor: C.white,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isBusy && !isProcessingThis ? (
                      <ActivityIndicator size="small" color={C.pink} />
                    ) : (
                      <Text
                        style={{
                          color: C.pinkMid,
                          fontSize: 16,
                          lineHeight: 18,
                        }}
                      >
                        ×
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* ── Footer actions ── */}
        {completedCount > 0 && (
          <View
            style={{
              marginTop: 12,
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <TouchableOpacity
              onPress={clearCompleted}
              disabled={processingAll}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 99,
                backgroundColor: processingAll ? C.pinkMid : C.black,
              }}
            >
              <Text
                style={{ fontSize: 12, color: C.white, fontWeight: "600" }}
              >
                Clear {completedCount} completed
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </WebLayout>
  );
}