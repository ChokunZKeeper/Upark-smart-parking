const { randomUUID } = require("node:crypto")
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const pool = require("../db/databasepg");
const path = require("path");
const { otpEmail, generateOtp } = require("../templates/otp");

const port = 5000;
const app = express();
const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.mail_user,
    pass: process.env.mail_pass,
  },
});

require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Middleware
app.use(cors());
app.use(express.json());

app.post("/otp", async (req, res) => {
  try {
    const { email } = req.body;
    const { otp, expiresAt } = generateOtp(6, 5);
    const iter = otpStore.get(email.toLowerCase());

    await transporter.sendMail({
      from: `Upark <${process.env.mail_user}>`,
      to: email,
      subject: "Your Upark verification code",
      text: `Your OTP verification code is ${otp}. It will expire in 5 minutes`,
      html: otpEmail(otp),
    });

    if (iter && iter.otp === "Empty") {
      iter.otp = otp;
      iter.expiresAt = expiresAt;
      iter.attempts = 1;
    } else otpStore.set(email.toLowerCase(), { otp, expiresAt, attempts: 1 });

    return res.json({ message: "Email sent" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});




app.post("/verifyotp", async (req, res) => {
  try {
    const round = 5;
    const { email, myotp } = req.body;
    const iter = otpStore.get(email.toLowerCase());

    if (Date.now() > iter.expiresAt) {
      iter.otp = "Empty";
      return res.json({ check: "otp expired" });
    }

    if (myotp === iter.otp) {
      return res.json({ check: "otp completed" });
    } else if (iter.attempts === round) {
      iter.otp = "Empty";
      return res.json({ check: "max attempts reached" });
    } else {
      iter.attempts++;
      return res.json({ check: "otp failed" });
    }
  } catch (err) {
    res.status(500).json({ massage: err.massage });
  }
});

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

app.post("/getuuid", async(req,res)=>{
  try{
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email field is missing" });
    }

    const result = await pool.query(
        `select uuid from users where email = $1`,
        [email],
      );
    if(result.rows.length === 0){
      return res.status(404).json({massage: "Email not found"})
    }
    const systemid = result.rows[0].uuid
    return res.json({systemid})

  }catch(err){
    console.log("getuuid error:" + err);
    return res.status(500).json({ message: "Server error" });
  }
})




app.post("/systemuuid",async(req,res)=>{
    const { user_uuid } = req.body
    
    if (!user_uuid) {
      return res.status(400).json({ message: "UUID is required" })
    }

  try{
    const result = await pool.query(
      `select employee_id, first_name, last_name, email, is_active, created_at from users where uuid = $1`,[user_uuid]
    )
    if(result.rows.length === 0){
      return res.status(404).json({message: "no information"})
    }
    const userInfo = result.rows[0]
    return res.json({userInfo})
    
  }catch(err){
    return res.status(500).json({message: "Server error"})
  }
})


app.post("/checkpassword",async (req,res) => {
  const { password, email } = req.body
  try{
    const result = await pool.query(`select password_hash from users where email = $1`,[email])
    const isMatch = await bcrypt.compare(password,result.rows[0].password_hash)
    return(res.json({isMatch}))
  }catch(err){
      return res.status(500).json({ message: "Server error" });
  }
})

app.post("/register", async (req, res) => {
  //
  const { firstName, lastName, email, password } = req.body;
  const Default_Role_ID  = 1;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Required field is missing" });
  }
  
  let client
  try {

    const passwordhash = await bcrypt.hash(password, 10);
    const userUUID =  randomUUID()
    client = await pool.connect();
    
    await client.query("BEGIN")

    const result = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, uuid)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING employee_id, first_name, last_name, email`,
      [firstName, lastName, email, passwordhash, userUUID],
    );

    await client.query(
      `INSERT INTO user_roles (employee_id, role_id)
        VALUES ($1, $2)
        RETURNING employee_id, role_id`,
      [result.rows[0].employee_id, Default_Role_ID],
    );

    await client.query("COMMIT")

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    if(client){
      try {await client.query("ROLLBACK");} catch(_) {}
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
  }finally{
    if(client){client.release()}
  }
});

app.listen(port, () => console.log("server has stated on :" + port));
