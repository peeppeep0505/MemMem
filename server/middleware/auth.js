const jwt = require("jsonwebtoken");
const User = require("../models/User");

const tokenBlacklist = new Map();
const loginTracker = Object.create(null);

const LOGIN_WINDOW_MS = 1 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 3;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
}

function parseCookieToken(req) {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return null;

  const cookies = rawCookie.split(";").map((part) => part.trim());
  const jwtCookie = cookies.find((item) => item.startsWith("jwt="));
  if (!jwtCookie) return null;

  return decodeURIComponent(jwtCookie.split("=")[1] || "");
}

function parseToken(req) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    return authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
  }

  return parseCookieToken(req);
}

function signToken(id) {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: "7d",
  });
}

function sanitizeUser(userDoc) {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  return user;
}

function sendToken(user, statusCode, res) {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(statusCode).json({
    token,
    user: sanitizeUser(user),
  });
}

function getClientIp(req) {
  return req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "unknown";
}

function getTracker(ip) {
  const now = Date.now();
  const current = loginTracker[ip];

  if (!current || now > current.resetAt) {
    loginTracker[ip] = {
      count: 0,
      resetAt: now + LOGIN_WINDOW_MS,
    };
  }

  return loginTracker[ip];
}

function registerFailedLogin(ip) {
  const tracker = getTracker(ip);
  tracker.count += 1;
}

function clearLoginAttempts(ip) {
  delete loginTracker[ip];
}

function cleanupLoginTracker() {
  const now = Date.now();
  Object.keys(loginTracker).forEach((ip) => {
    if (now > loginTracker[ip].resetAt) {
      delete loginTracker[ip];
    }
  });
}

function loginRateLimiter(req, res, next) {
  cleanupLoginTracker();

  const ip = getClientIp(req);
  const tracker = getTracker(ip);

  if (tracker.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((tracker.resetAt - Date.now()) / 1000));

    return res.status(429).json({
      message: "Too many login attempts. Please try again later.",
      retry_after: retryAfter,
    });
  }

  next();
}

function blacklistToken(token) {
  if (!token) return;

  tokenBlacklist.set(token, Date.now() + 7 * 24 * 60 * 60 * 1000);
}

function cleanupBlacklist() {
  const now = Date.now();
  for (const [token, expiresAt] of tokenBlacklist.entries()) {
    if (now > expiresAt) {
      tokenBlacklist.delete(token);
    }
  }
}

async function protect(req, res, next) {
  try {
    cleanupBlacklist();

    const token = parseToken(req);

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ message: "Token has been invalidated" });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    const currentUser = await User.findById(decoded.id).select("+passwordChangedAt");

    if (!currentUser || currentUser.isDeleted) {
      return res
        .status(401)
        .json({ message: "User belonging to this token no longer exist" });
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res
        .status(401)
        .json({ message: "User recently changed password. Please log in again." });
    }

    req.user = currentUser;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function restrictTo(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Please log in first" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}

module.exports = {
  signToken,
  sendToken,
  protect,
  restrictTo,
  loginRateLimiter,
  registerFailedLogin,
  clearLoginAttempts,
  blacklistToken,
  parseToken,
  getClientIp,
};