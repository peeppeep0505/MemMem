const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "../uploads");

function isBrowserUserAgent(userAgent = "") {
  const ua = String(userAgent).toLowerCase();

  return (
    ua.includes("mozilla") ||
    ua.includes("chrome") ||
    ua.includes("safari") ||
    ua.includes("firefox") ||
    ua.includes("edg")
  );
}

function getContentType(fileName = "") {
  const ext = path.extname(fileName).toLowerCase();

  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

exports.streamFile = (req, res) => {
  try {
    const userAgent = req.get("User-Agent") || "";
    const fileName = req.params.filename;

    // C2: block browser direct access
    if (isBrowserUserAgent(userAgent)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!fileName) {
      return res.status(400).json({ error: "Filename is required" });
    }

    // กัน path traversal เช่น ../../.env
    const safeFileName = path.basename(fileName);
    const filePath = path.join(UPLOAD_DIR, safeFileName);

    // C3: 404 if file missing
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
      return res.status(404).json({ error: "File not found" });
    }

    // C5: proper content type
    res.setHeader("Content-Type", getContentType(safeFileName));
    res.setHeader("Content-Length", stat.size);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(safeFileName)}"`
    );

    // C1: streaming via pipe
    const readStream = fs.createReadStream(filePath);

    readStream.on("error", () => {
      if (!res.headersSent) {
        return res.status(500).json({ error: "Failed to stream file" });
      }
      res.end();
    });

    readStream.pipe(res);
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};