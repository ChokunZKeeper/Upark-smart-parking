const path = require("path");
// ต้องโหลด .env ก่อนอย่างอื่น ไม่งั้น process.env.mail_user / mail_pass จะเป็น undefined ตอนสร้าง transporter
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { randomUUID } = require("node:crypto");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
// multer ใช้รับไฟล์รูปโปรไฟล์ ถ้ายังไม่ได้ติดตั้ง (npm i multer) server ก็ยังสตาร์ตได้ แค่อัปโหลดรูปไม่ได้
let multer = null;
try {
  multer = require("multer");
} catch (_) {
  console.warn("[warn] multer ยังไม่ได้ติดตั้ง: อัปโหลดรูปโปรไฟล์จะใช้ไม่ได้ (รัน npm i multer)");
}
const pool = require("../db/databasepg");
const { otpEmail, generateOtp } = require("../templates/otp");

// Render กำหนดพอร์ตผ่าน process.env.PORT
const port = process.env.PORT || 5000;
const app = express();
const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.mail_user,
    pass: process.env.mail_pass,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

/* ─────────────────────────────────────────────────────────────────
   Avatar – รูปโปรไฟล์
   เก็บตัวรูปใน Postgres (users.avatar_data / avatar_mime) เพราะดิสก์ของ Render ถูกลบเมื่อ restart/deploy
   users.avatar_url เก็บแค่ path สำหรับดึงรูป เช่น /profile/avatar/<uuid>?v=<timestamp>
   ─────────────────────────────────────────────────────────────── */
const AVATAR_COLORS = ["red", "orange", "green", "blue", "purple", "dark"];

/* ─────────────────────────────────────────────────────────────────
   Permission Middleware
   ใช้ตรวจสิทธิ์ฝั่ง Backend ก่อนให้ทำการเปลี่ยนแปลงข้อมูล
   ─────────────────────────────────────────────────────────────── */

/**
 * ดึง role + permissions ของ user จาก DB โดยใช้ uuid
 * คืน { roleName, permissions: string[] } หรือ null ถ้าไม่พบ
 */
async function getUserPermissions(userUuid) {
  try {
    const result = await pool.query(
      `SELECT r.name AS role_name, p.key AS permission_key
       FROM users u
       JOIN user_roles ur ON u.employee_id = ur.employee_id
       JOIN roles r ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.id
       WHERE u.uuid = $1`,
      [userUuid]
    );

    if (result.rows.length === 0) return null;

    const roleName = result.rows[0].role_name;
    const permissions = result.rows
      .map((row) => row.permission_key)
      .filter(Boolean);

    return { roleName, permissions };
  } catch (err) {
    console.error("getUserPermissions error:", err);
    return null;
  }
}

/**
 * Middleware: ตรวจว่า user มีสิทธิ์ permissions_manage
 * ใช้กับ endpoint ที่จัดการสมาชิก (เพิ่ม/แก้ไข/ลบ) และจัดการ Role
 * Header ที่ต้องส่งมา: x-user-uuid: <uuid ของ user ที่ล็อกอิน>
 */
async function requireManagePermission(req, res, next) {
  const userUuid = req.headers["x-user-uuid"];
  if (!userUuid) {
    return res.status(401).json({ message: "Unauthorized: missing user UUID" });
  }

  const userPerms = await getUserPermissions(userUuid);
  if (!userPerms) {
    return res.status(403).json({ message: "Forbidden: user not found" });
  }

  // ถ้า role มี permissions_manage → ถูกจำกัดการจัดการสิทธิ์
  if (userPerms.permissions.includes("permissions_manage")) {
    return res.status(403).json({
      message: "Forbidden: role with Manage Permission cannot modify members or roles",
    });
  }

  req.userPerms = userPerms;
  next();
}

/**
 * Middleware: ตรวจว่า user มีสิทธิ์ can_edit
 * ใช้กับ endpoint ที่สร้าง/แก้ไข/ลบ QR Code
 * Header ที่ต้องส่งมา: x-user-uuid: <uuid ของ user ที่ล็อกอิน>
 */
async function requireCanEdit(req, res, next) {
  const userUuid = req.headers["x-user-uuid"];
  if (!userUuid) {
    return res.status(401).json({ message: "Unauthorized: missing user UUID" });
  }

  const userPerms = await getUserPermissions(userUuid);
  if (!userPerms) {
    return res.status(403).json({ message: "Forbidden: user not found" });
  }

  // ต้องมี can_edit จึงจะแก้ไขได้
  if (!userPerms.permissions.includes("can_edit")) {
    return res.status(403).json({
      message: "Forbidden: role does not have Can Edit permission",
    });
  }

  req.userPerms = userPerms;
  next();
}

/* ─────────────────────────────────────────────────────────────────
   OTP
   ─────────────────────────────────────────────────────────────── */

app.post("/otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email field is missing" });
    }

    const key = email.toLowerCase();
    const { otp, expiresAt } = generateOtp(6, 5);

    await transporter.sendMail({
      from: `Upark <${process.env.mail_user}>`,
      to: email,
      subject: "Your Upark verification code",
      text: `Your OTP verification code is ${otp}. It will expire in 5 minutes`,
      html: otpEmail(otp),
    });

    // ขอ OTP ใหม่ทุกครั้ง = เริ่มนับ attempts ใหม่
    otpStore.set(key, { otp, expiresAt, attempts: 1 });

    return res.json({ message: "Email sent" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.post("/verifyotp", async (req, res) => {
  try {
    const round = 5;
    const { email, myotp } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email field is missing" });
    }

    const iter = otpStore.get(email.toLowerCase());

    // ไม่เคยขอ OTP หรือ OTP ถูกล้างไปแล้ว
    if (!iter || iter.otp === "Empty") {
      return res.json({ check: "otp expired" });
    }

    if (Date.now() > iter.expiresAt) {
      iter.otp = "Empty";
      return res.json({ check: "otp expired" });
    }

    if (myotp === iter.otp) {
      return res.json({ check: "otp completed" });
    } else if (iter.attempts >= round) {
      iter.otp = "Empty";
      return res.json({ check: "max attempts reached" });
    } else {
      iter.attempts++;
      return res.json({ check: "otp failed" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   Auth / User
   ─────────────────────────────────────────────────────────────── */

app.post("/checkemail", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email field is missing" });
    }

    const result = await pool.query(
      `select email from users where email = $1`,
      [email],
    );

    const exists = result.rowCount > 0;
    return res.json({ exists });
  } catch (err) {
    console.log("check error:" + err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/getuuid", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email field is missing" });
    }

    const result = await pool.query(
      `select uuid from users where email = $1`,
      [email],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }
    const systemid = result.rows[0].uuid;
    return res.json({ systemid });
  } catch (err) {
    console.log("getuuid error:" + err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/systemuuid", async (req, res) => {
  const { user_uuid } = req.body;

  if (!user_uuid) {
    return res.status(400).json({ message: "UUID is required" });
  }

  try {
    const queries = {
      // เพิ่ม avatar_url เพื่อให้ Sidebar แสดงรูปโปรไฟล์ที่อัปโหลดได้หลังรีเฟรช
      user:             pool.query(`select employee_id, first_name, last_name, email, is_active, created_at, avatar_color, avatar_url from users where uuid = $1`, [user_uuid]),
      parkings:         pool.query(`select * from parkings`),
      parkingAnalytics: pool.query(`select * from parking_analytics`),
      dashboards:       pool.query(`select * from dashboards`),
      reports:          pool.query(`select * from reports`),
      qrcodes:          pool.query(`select * from qrcodes`),
    };

    const results = await Promise.all(Object.values(queries));
    const keys = Object.keys(queries);

    const data = Object.fromEntries(keys.map((key, i) => [key, results[i].rows]));
    if (data.user.length === 0) {
      return res.status(404).json({ message: "user not found" });
    }

    return res.json({
      ...data,
      user: data.user[0],
      parkingAnalytics: data.parkingAnalytics[0],
      dashboards: data.dashboards[0],
      parkings: data.parkings[0],
      reports: data.reports[0],
      qrcodes: data.qrcodes[0],
    });
  } catch (err) {
    console.error("systemuuid error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/checkpassword", async (req, res) => {
  const { password, email } = req.body;
  if (!password || !email) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await pool.query(
      `select password_hash from users where email = $1`,
      [email],
    );

    // ไม่พบอีเมล → ไม่ตรง (ไม่ crash)
    if (result.rowCount === 0) {
      return res.json({ isMatch: false });
    }

    const isMatch = await bcrypt.compare(password, result.rows[0].password_hash);
    return res.json({ isMatch });
  } catch (err) {
    console.error("checkpassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, gradientProfile } = req.body;
  const Default_Role_ID = 1;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Required field is missing" });
  }

  let client;
  try {
    const passwordhash = await bcrypt.hash(password, 10);
    const userUUID = randomUUID();
    client = await pool.connect();

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, uuid, avatar_color)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING employee_id, first_name, last_name, email`,
      [firstName, lastName, email, passwordhash, userUUID, gradientProfile],
    );

    await client.query(
      `INSERT INTO user_roles (employee_id, role_id)
        VALUES ($1, $2)
        RETURNING employee_id, role_id`,
      [result.rows[0].employee_id, Default_Role_ID],
    );

    await client.query("COMMIT");

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (client) {
      try { await client.query("ROLLBACK"); } catch (_) {}
    }
    switch (err.code) {
      case "23505":
        return res.status(409).json({ message: "Duplicate value" });
      case "23502":
        return res.status(400).json({ message: "Required field is missing" });
      case "23503":
        return res
          .status(400)
          .json({ message: "Referenced record does not exist" });
      default:
        return res.status(500).json({ message: "Server error" });
    }
  } finally {
    if (client) client.release();
  }
});

/* ─────────────────────────────────────────────────────────────────
   Profile – ดึง/แก้ไขโปรไฟล์ของตัวเอง (หน้า Edit Profile)
   ต้องรัน SQL เพิ่มคอลัมน์ avatar_data (bytea) และ avatar_mime (text) ใน users ก่อน
   ─────────────────────────────────────────────────────────────── */

const PROFILE_COLS = `employee_id, uuid, first_name, last_name, email,
  phone_dial_code, phone,
  avatar_color, avatar_url`;

// รับไฟล์รูปชื่อ field "avatar" (JPG/PNG ไม่เกิน 2 MB) เก็บไว้ในหน่วยความจำ แล้วบันทึกลง DB
const avatarUpload = multer
  ? multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, cb) =>
        ["image/jpeg", "image/png"].includes(file.mimetype) ? cb(null, true) : cb(new Error("INVALID_TYPE")),
    })
  : null;

// ครอบ multer เพื่อแปลง error เป็นข้อความที่อ่านรู้เรื่อง
const handleAvatarUpload = (req, res, next) => {
  if (!avatarUpload) {
    return res.status(503).json({ message: "Profile upload unavailable: run npm i multer on the server" });
  }
  return avatarUpload.single("avatar")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ message: "Picture must be under 2 MB" });
    if (err.message === "INVALID_TYPE") return res.status(415).json({ message: "Use a JPG or PNG file" });
    console.error("upload error:", err);
    return res.status(400).json({ message: "Upload failed" });
  });
};

// ตัดช่องว่าง/จำกัดความยาว คืน null ถ้าว่าง
function cleanText(value, max) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim().slice(0, max);
  return s === "" ? null : s;
}

// ดึงโปรไฟล์ของตัวเอง
app.get("/profile", async (req, res) => {
  const userUuid = req.headers["x-user-uuid"];
  if (!userUuid) return res.status(401).json({ message: "Unauthorized: missing user UUID" });

  try {
    const result = await pool.query(`SELECT ${PROFILE_COLS} FROM users WHERE uuid = $1`, [userUuid]);
    if (result.rowCount === 0) return res.status(404).json({ message: "user not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("get profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// แก้โปรไฟล์ของตัวเอง (multipart/form-data, ไฟล์รูปไม่บังคับ)
// อีเมลไม่ให้แก้ตรงนี้ เพราะต้องผ่าน OTP
app.put("/profile", handleAvatarUpload, async (req, res) => {
  const userUuid = req.headers["x-user-uuid"];
  if (!userUuid) return res.status(401).json({ message: "Unauthorized: missing user UUID" });

  const b = req.body || {};
  const firstName = cleanText(b.firstName, 50);
  const lastName = cleanText(b.lastName, 50);
  if (!firstName || !lastName) {
    return res.status(400).json({ message: "First name and last name are required" });
  }

  try {
    const cur = await pool.query(
      `SELECT avatar_url, avatar_color FROM users WHERE uuid = $1`,
      [userUuid]
    );
    if (cur.rowCount === 0) return res.status(404).json({ message: "user not found" });

    let newColor = cur.rows[0].avatar_color;
    let newUrl = cur.rows[0].avatar_url;

    if (req.file) {
      // อัปโหลดรูปใหม่ (?v= เปลี่ยนทุกครั้ง เพื่อไม่ให้เบราว์เซอร์ใช้รูปเก่าจาก cache)
      newUrl = `/profile/avatar/${userUuid}?v=${Date.now()}`;
    } else if (b.avatarMode === "gradient") {
      // เลือกสี gradient: ล้างรูปเดิม
      if (!AVATAR_COLORS.includes(b.avatarColor)) {
        return res.status(400).json({ message: "Invalid avatar color" });
      }
      newColor = b.avatarColor;
      newUrl = null;
    }
    // avatarMode === "image" และไม่มีไฟล์ใหม่ = คงรูปเดิม

    const result = await pool.query(
      `UPDATE users SET
         first_name = $1, last_name = $2,
         phone_dial_code = $3, phone = $4,
         avatar_color = $5, avatar_url = $6, update_at = NOW()
       WHERE uuid = $7
       RETURNING ${PROFILE_COLS}`,
      [
        firstName, lastName,
        cleanText(b.dialCode, 8) || "+66", cleanText(b.phone, 20),
        newColor, newUrl, userUuid,
      ]
    );

    if (req.file) {
      await pool.query(
        `UPDATE users SET avatar_data = $1, avatar_mime = $2 WHERE uuid = $3`,
        [req.file.buffer, req.file.mimetype, userUuid]
      );
    } else if (newUrl === null) {
      await pool.query(
        `UPDATE users SET avatar_data = NULL, avatar_mime = NULL WHERE uuid = $1`,
        [userUuid]
      );
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("update profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// เสิร์ฟรูปโปรไฟล์จาก DB (<img>/CSS url ส่ง header ไม่ได้ จึงใช้ uuid ใน path)
app.get("/profile/avatar/:uuid", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT avatar_data, avatar_mime FROM users WHERE uuid = $1`,
      [req.params.uuid]
    );
    if (!r.rows[0]?.avatar_data) return res.sendStatus(404);
    res.set("Content-Type", r.rows[0].avatar_mime);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(r.rows[0].avatar_data);
  } catch (err) {
    console.error("get avatar error:", err);
    return res.sendStatus(500);
  }
});

/* ─────────────────────────────────────────────────────────────────
   Protected Endpoints – Permissions (ต้องไม่มีสิทธิ์ permissions_manage)
   ─────────────────────────────────────────────────────────────── */

// เพิ่มสมาชิก (invite)
app.post("/members/invite", requireManagePermission, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ message: "email and role are required" });
    }
    // TODO: implement actual DB insert when members table is ready
    return res.status(201).json({ message: "Member invited", name, email, role });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// แก้ไขสมาชิก
app.put("/members/:id", requireManagePermission, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: "name, email and role are required" });
    }
    // TODO: implement actual DB update when members table is ready
    return res.json({ message: "Member updated", id, name, email, role });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ลบสมาชิก
app.delete("/members/:id", requireManagePermission, async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: implement actual DB delete when members table is ready
    return res.json({ message: "Member removed", id });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// เข้าถึงหน้า Manage Role (ตรวจสิทธิ์ก่อน redirect)
app.post("/roles/access-check", requireManagePermission, async (req, res) => {
  return res.json({ allowed: true, role: req.userPerms.roleName });
});

/* ─────────────────────────────────────────────────────────────────
   Protected Endpoints – QR Code (ต้องมีสิทธิ์ can_edit)
   ─────────────────────────────────────────────────────────────── */

// สร้าง QR Code ใหม่
app.post("/qrcodes/create", requireCanEdit, async (req, res) => {
  try {
    const { name, url, zone, floor, note, active, format, ecc } = req.body;
    if (!name || !url || !zone || !floor) {
      return res.status(400).json({ message: "name, url, zone and floor are required" });
    }
    const result = await pool.query(
      `INSERT INTO qrcodes (name, url, zone, floor, note, active, format, ecc, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [name, url, zone, floor, note ?? null, active ?? true, format ?? "PNG", ecc ?? "M"]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Zone already has a QR code" });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// แก้ไข QR Code
app.put("/qrcodes/:id", requireCanEdit, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, zone, floor, note, active, format, ecc } = req.body;
    if (!name || !url || !zone || !floor) {
      return res.status(400).json({ message: "name, url, zone and floor are required" });
    }
    const result = await pool.query(
      `UPDATE qrcodes SET name=$1, url=$2, zone=$3, floor=$4, note=$5, active=$6, format=$7, ecc=$8
       WHERE id=$9 RETURNING *`,
      [name, url, zone, floor, note ?? null, active ?? true, format ?? "PNG", ecc ?? "M", id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "QR code not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ลบ QR Code
app.delete("/qrcodes/:id", requireCanEdit, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM qrcodes WHERE id=$1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "QR code not found" });
    }
    return res.json({ message: "QR code deleted", id });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// เริ่ม server หลังประกาศ route ครบทุกตัว
app.listen(port, () => console.log("server has started on :" + port));