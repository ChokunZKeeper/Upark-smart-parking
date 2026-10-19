const express = require("express");
const app = express();
const cors = require("cors");

// Middleware
app.use(cors());
// กฎของเบราว์เซอร์ที่ป้องกัน เว็บอื่น ไม่ให้ดึงข้อมูล API ของเราไป จนกว่าคุณจะอนุญาต origin นั้นด้วยตัวเอง
// แต่ไม่กันคนที่เรียก API ตรงๆ (Postman, curl) ถ้าต้องการกันจริงต้องใช้ authentication

app.use(express.json());

app.listen(
  (port = 5000),
  (callback = () => {
    console.log("server has stated on :" + port);
  }),
);
