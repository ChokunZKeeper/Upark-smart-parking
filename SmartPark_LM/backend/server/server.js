const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("../db/databasepg")

const port = 5000;
const app = express();

// Middleware
app.use(cors());
// กฎของเบราว์เซอร์ที่ป้องกัน เว็บอื่น ไม่ให้ดึงข้อมูล API ของเราไป จนกว่าคุณจะอนุญาต origin นั้นด้วยตัวเอง
// แต่ไม่กันคนที่เรียก API ตรงๆ (Postman, curl) ถ้าต้องการกันจริงต้องใช้ authentication

app.use(express.json());



app.get("/", async(req, res) => {
  // res.send("hello")
}) 

// Frontend -> server 
// app.post() = กำหนดว่า เมื่อมี Request จากสั่กที ส่งมา ที่ตรงเงื่อนไข (method: "POST", Path"/register")เข้ามา ให้ Server ทำอะไร
app.post("/register", async(req , res) => { // 
  try {
    const {firstName, lastName, email, password} = req.body;

    if (!firstName || !lastName || !email || !password){
      return res.status(400).json({ message: "Required field is missing" });
    }

    const passwordhash = await bcrypt.hash(password, 10)
    const result = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING employee_id, first_name, last_name, email`,
        [firstName, lastName, email, passwordhash]
    );

    return res.status(201).json(result.rows[0]);

  } catch (err){
    switch (err.code) {
      case "23505": return res.status(409).json({ message: "Duplicate value" });
      case "23502": return res.status(400).json({ message: "Required field is missing" });
      case "23503": return res.status(400).json({ message: "Referenced record does not exist" });
      default:
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
  }

})


app.listen(port, () => console.log("server has stated on :" + port));
