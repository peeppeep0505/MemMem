// components/Diary/DiaryStore.ts
// Simple module-level store to pass selected date from Calendar → Editor
// ไม่ใช้ AsyncStorage เพราะแค่ navigation ในครั้งเดียว

let _selectedDate: string | null = null;

export function setSelectedDate(date: string) {
  _selectedDate = date;
}

export function getSelectedDate(): string | null {
  return _selectedDate;
}

export function clearSelectedDate() {
  _selectedDate = null;
}