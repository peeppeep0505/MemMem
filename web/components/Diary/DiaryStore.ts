export interface DiaryEntry {
  date: string
  title: string
  content: string
  image?: string
  mood: string
}

export const diaryEntries: DiaryEntry[] = [

  {
    date: "2026-03-02",
    title: "Morning Coffee",
    mood: "☕",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
    content:
      "Started the day with a peaceful cup of coffee while planning my week."
  },

  {
    date: "2026-03-04",
    title: "Workout Day",
    mood: "💪",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
    content:
      "Had an intense workout session today. Feeling energized and motivated!"
  },

  {
    date: "2026-03-06",
    title: "Coding Session",
    mood: "💻",
    image: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f",
    content:
      "Worked on my MERN stack diary app today. Finally got the calendar feature working!"
  },

  {
    date: "2026-03-08",
    title: "Relaxing Evening",
    mood: "🌙",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    content:
      "Spent the evening reading a book and reflecting on the day."
  },

  {
    date: "2026-03-10",
    title: "Hanging Out With Friends",
    mood: "🥳",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
    content:
      "Met friends for dinner and had a lot of laughs. A great night!"
  },

  {
    date: "2026-03-12",
    title: "Nature Walk",
    mood: "🌿",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    content:
      "Went for a walk in the park. The weather was perfect and refreshing."
  }

]