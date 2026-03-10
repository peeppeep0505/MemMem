// server/controllers/diaryController.js

const Diary = require("../models/Diary");
// diaryController.js — แก้ createDiary และ updateDiary
exports.createDiary = async (req, res) => {
  const imgBase64 = req.file
    ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
    : undefined;

  const diary = await Diary.create({
    ...req.body,
    img: imgBase64,   // เก็บเป็น base64 string ใน MongoDB
  });
  res.json(diary);
};

exports.getUserDiary = async (req, res) => {
  const diaries = await Diary.find({ userId: req.params.userId });
  res.json(diaries);
};

// ✅ ใหม่ — ดึง diary เดี่ยวสำหรับหน้า Edit
exports.getDiaryById = async (req, res) => {
  const diary = await Diary.findById(req.params.id);
  if (!diary) return res.status(404).json("Diary not found");
  res.json(diary);
};

exports.updateDiary = async (req, res) => {
  const updateData = {
    ...req.body,
    ...(req.file ? { img: req.file.filename } : {}), // ✅ อัปเดตรูปถ้าส่งมาใหม่
  };
  const diary = await Diary.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(diary);
};

exports.deleteDiary = async (req, res) => {
  await Diary.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};

exports.getDiaryByMonth = async (req, res) => {
  const { userId } = req.params;
  const { month }  = req.query; // "YYYY-MM"

  const start = new Date(`${month}-01`);
  const end   = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const diaries = await Diary.find({
    userId,
    date: { $gte: start, $lt: end },
  });

  res.json(diaries);
};