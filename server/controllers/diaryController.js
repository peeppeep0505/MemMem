const Diary = require("../models/Diary");

exports.createDiary = async (req, res) => {
  const diary = await Diary.create({
    ...req.body,
    img: req.file?.filename,
  });

  res.json(diary);
};

exports.getUserDiary = async (req, res) => {
  const diaries = await Diary.find({ userId: req.params.userId });

  res.json(diaries);
};

exports.updateDiary = async (req, res) => {
  const diary = await Diary.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(diary);
};

exports.deleteDiary = async (req, res) => {
  await Diary.findByIdAndDelete(req.params.id);

  res.json({ message: "Deleted" });
};