import { apiFetch } from "./api";

export const createDiary = (
  userId: string,
  date: string,
  mood: string,
  title: string,
  description: string,
  img?: string
) => {
  return apiFetch("/diary", {
    method: "POST",
    body: JSON.stringify({
      userId,
      date,
      mood,
      title,
      description,
      img,
    }),
  });
};

export const getUserDiary = (userId: string) => {
  return apiFetch(`/diary/${userId}`);
};

export const updateDiary = (
  diaryId: string,
  data: {
    mood?: string;
    title?: string;
    description?: string;
    img?: string;
  }
) => {
  return apiFetch(`/diary/${diaryId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteDiary = (diaryId: string) => {
  return apiFetch(`/diary/${diaryId}`, {
    method: "DELETE",
  });
};