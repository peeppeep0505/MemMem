// services/diaryService.ts

import { apiFetch, apiFetchForm, base64ToBlob } from "./api";
import type { Diary, CreateDiaryInput, UpdateDiaryInput } from "@/types/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDiaryForm(input: CreateDiaryInput): FormData {
  const form = new FormData();
  form.append("userId", input.userId);
  form.append("date", input.date);
  if (input.mood)        form.append("mood",        input.mood);
  if (input.title)       form.append("title",       input.title);
  if (input.description) form.append("description", input.description);
  if (input.imageBase64) {
    // แปลง base64 → Blob ก่อนส่ง multer ถึงจะรับได้
    const blob = base64ToBlob(input.imageBase64);
    form.append("image", blob, "diary.jpg"); // "image" ตรงกับ upload.single("image")
  }
  return form;
}

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * POST /diary/create
 * router.post("/create", upload.single("image"), diaryController.createDiary)
 */
export const createDiary = (input: CreateDiaryInput): Promise<Diary> => {
  const form = buildDiaryForm(input);
  return apiFetchForm<Diary>("/diary/create", form, "POST");
};

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * GET /diary/user/:userId
 * router.get("/user/:userId", diaryController.getUserDiary)
 */
export const getUserDiary = (userId: string): Promise<Diary[]> => {
  return apiFetch<Diary[]>(`/diary/user/${userId}`);
};

/**
 * GET /diary/user/:userId/month?month=YYYY-MM
 * router.get("/user/:userId/month", diaryController.getDiaryByMonth)
 *
 * ⚠️ route จริงคือ /user/:userId/month ไม่ใช่ /user/:userId?month=
 */
export const getUserDiaryByMonth = (
  userId: string,
  month: string // "YYYY-MM"
): Promise<Diary[]> => {
  return apiFetch<Diary[]>(`/diary/user/${userId}/month?month=${month}`);
};

/**
 * GET /diary/:id — ดึง diary เดี่ยวสำหรับหน้า Edit
 * ถ้า server ยังไม่มี route นี้ ให้เพิ่มใน diaryRoutes.js:
 *   router.get("/:id", diaryController.getDiaryById)
 * และใน diaryController.js:
 *   exports.getDiaryById = async (req, res) => {
 *     const diary = await Diary.findById(req.params.id);
 *     if (!diary) return res.status(404).json("Not found");
 *     res.json(diary);
 *   };
 */
export const getDiaryById = (diaryId: string): Promise<Diary> => {
  return apiFetch<Diary>(`/diary/${diaryId}`);
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * PUT /diary/update/:id
 * router.put("/update/:id", upload.single("image"), diaryController.updateDiary)
 */
export const updateDiary = (
  diaryId: string,
  input: UpdateDiaryInput
): Promise<Diary> => {
  const form = new FormData();
  if (input.mood)        form.append("mood",        input.mood);
  if (input.title)       form.append("title",       input.title);
  if (input.description) form.append("description", input.description);
  if (input.imageBase64) {
    const blob = base64ToBlob(input.imageBase64);
    form.append("image", blob, "diary.jpg");
  }
  return apiFetchForm<Diary>(`/diary/update/${diaryId}`, form, "PUT");
};

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * DELETE /diary/delete/:id
 * router.delete("/delete/:id", diaryController.deleteDiary)
 */
export const deleteDiary = (diaryId: string): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>(`/diary/delete/${diaryId}`, {
    method: "DELETE",
  });
};