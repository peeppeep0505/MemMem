const express = require("express");
const router = express.Router();
const { streamFile } = require("../controllers/fileStreamController");

router.get("/stream/:filename", streamFile);

module.exports = router;