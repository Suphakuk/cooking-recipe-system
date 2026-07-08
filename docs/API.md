# 📡 API Documentation

Base URL: `http://localhost:4000/api/v1`

ทุก endpoint ที่ต้องล็อกอินให้ส่ง header:
```
Authorization: Bearer <accessToken>
```

## รูปแบบ Response มาตรฐาน

**สำเร็จ**
```json
{ "success": true, "message": "...", "data": { }, "meta": { } }
```
`meta` จะมีเฉพาะ endpoint ที่แบ่งหน้า:
```json
{ "page": 1, "limit": 12, "total": 42, "totalPages": 4 }
```

**ผิดพลาด**
```json
{ "success": false, "message": "คำอธิบายข้อผิดพลาด", "errors": [ ] }
```

**Roles:** 🟢 = สาธารณะ · 🔵 = ต้องล็อกอิน · 🔴 = แอดมินเท่านั้น

---

## 🔐 Auth — `/auth`

| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| POST | `/auth/register` | 🟢 | สมัครสมาชิก |
| POST | `/auth/login` | 🟢 | เข้าสู่ระบบ |
| POST | `/auth/refresh` | 🟢 | ต่ออายุ token ด้วย refresh token |
| POST | `/auth/logout` | 🟢 | ออกจากระบบ (ยกเลิก refresh token) |
| GET | `/auth/me` | 🔵 | ข้อมูลผู้ใช้ปัจจุบัน |

**POST /auth/register**
```json
{ "name": "สมชาย", "email": "somchai@example.com", "password": "secret123" }
```

**POST /auth/login**
```json
{ "email": "user@recipe.com", "password": "User@123" }
```
→ คืน `{ user, accessToken, refreshToken }`

**POST /auth/refresh** / **POST /auth/logout**
```json
{ "refreshToken": "<token>" }
```

---

## 👤 Users — `/users`

| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| PATCH | `/users/profile` | 🔵 | แก้ไขโปรไฟล์ตัวเอง (`name`, `avatarUrl`) |
| PATCH | `/users/change-password` | 🔵 | เปลี่ยนรหัสผ่าน (`currentPassword`, `newPassword`) |
| GET | `/users` | 🔴 | รายชื่อผู้ใช้ (query: `page`, `limit`, `search`) |
| GET | `/users/:id` | 🔴 | ข้อมูลผู้ใช้รายคน |
| PATCH | `/users/:id` | 🔴 | แก้ไขผู้ใช้ (`name`, `role` = "ADMIN"/"USER", `isActive`) |
| DELETE | `/users/:id` | 🔴 | ลบผู้ใช้ |

---

## 🥕 Ingredients — `/ingredients`

| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| GET | `/ingredients` | 🟢 | รายการวัตถุดิบ (query: `page`, `limit`, `search`, `activeOnly`) |
| GET | `/ingredients/:id` | 🟢 | วัตถุดิบรายตัว |
| POST | `/ingredients` | 🔴 | เพิ่มวัตถุดิบ (multipart: fields + optional `image`) |
| PATCH | `/ingredients/:id` | 🔴 | แก้ไขวัตถุดิบ |
| DELETE | `/ingredients/:id` | 🔴 | ลบวัตถุดิบ |

**Body (POST/PATCH):** `name`, `nameEn` (ชื่ออังกฤษ — ใช้จับคู่ผล AI), `unit`, และไฟล์ `image` (ถ้ามี)

---

## 📁 Categories — `/categories`

| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| GET | `/categories` | 🟢 | รายการหมวดหมู่ (พร้อมจำนวนสูตรในแต่ละหมวด) |
| GET | `/categories/:id` | 🟢 | หมวดหมู่รายตัว |
| POST | `/categories` | 🔴 | เพิ่มหมวดหมู่ (`name`, `description`) |
| PATCH | `/categories/:id` | 🔴 | แก้ไขหมวดหมู่ |
| DELETE | `/categories/:id` | 🔴 | ลบหมวดหมู่ |

---

## 🍲 Recipes — `/recipes`

| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| POST | `/recipes/recommend` | 🟢 | **แนะนำเมนูจากวัตถุดิบ** |
| GET | `/recipes` | 🟢 | รายการสูตร (query ด้านล่าง) |
| GET | `/recipes/:slug` | 🟢 | รายละเอียดสูตร (นับ view + รวมรีวิว) |
| GET | `/recipes/id/:id` | 🔴 | ดึงสูตรตาม id (สำหรับฟอร์มแก้ไข) |
| GET | `/recipes/me/favorites` | 🔵 | รายการโปรดของผู้ใช้ |
| POST | `/recipes` | 🔴 | เพิ่มสูตร (multipart) |
| PATCH | `/recipes/:id` | 🔴 | แก้ไขสูตร (multipart) |
| DELETE | `/recipes/:id` | 🔴 | ลบสูตร |
| POST | `/recipes/:id/favorite` | 🔵 | สลับสถานะรายการโปรด |
| POST | `/recipes/:id/reviews` | 🔵 | เพิ่ม/แก้รีวิว (`rating` 1-5, `comment`) |

**Query สำหรับ GET /recipes:** `page`, `limit`, `search`, `difficulty` (EASY/MEDIUM/HARD), `categoryId`, `sort` (`newest` / `popular` / `fastest`), `includeUnpublished` (แอดมิน)

**POST /recipes/recommend**
```json
{ "ingredientIds": [1, 3, 5], "matchMode": "any", "limit": 12 }
```
- `matchMode: "any"` — เมนูที่มีวัตถุดิบอย่างน้อยหนึ่งอย่าง
- `matchMode: "all"` — เฉพาะเมนูที่มีวัตถุดิบครบ

→ คืน array เรียงตามคะแนน แต่ละรายการ:
```json
{
  "recipe": { },
  "matchedCount": 2,
  "requiredCount": 3,
  "coverage": 0.667,
  "missingIngredients": [{ "id": 7, "name": "น้ำปลา" }],
  "score": 68.7
}
```

**POST/PATCH /recipes (multipart/form-data):**
| field | ชนิด | หมายเหตุ |
|-------|------|----------|
| `title` | string | จำเป็น |
| `description` | string | |
| `instructions` | string | บรรทัดละ 1 ขั้นตอน |
| `servings`, `prepMinutes`, `cookMinutes`, `calories` | number | |
| `difficulty` | string | EASY/MEDIUM/HARD |
| `isPublished` | boolean | |
| `categoryIds` | JSON string | เช่น `"[1,2]"` |
| `ingredients` | JSON string | เช่น `"[{\"ingredientId\":1,\"quantity\":2,\"unit\":\"ช้อนโต๊ะ\",\"optional\":false}]"` |
| `image` | file | รูปเมนู (ถ้ามี) |

---

## 📷 Detections — `/detections` (Mock AI)

| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| POST | `/detections` | 🟢* | อัปโหลดรูป → ตรวจจับวัตถุดิบ (โมเดลจำลอง) |
| GET | `/detections/history` | 🔵 | ประวัติการตรวจจับของผู้ใช้ |

\* ใช้ได้แม้ไม่ล็อกอิน (ถ้าล็อกอินจะบันทึกประวัติให้)

**POST /detections** — `multipart/form-data`, field ชื่อ `image`
→ คืน:
```json
{
  "detectionId": 12,
  "imageUrl": "/uploads/xxx.jpg",
  "modelName": "mock-detector-v1",
  "processMs": 320,
  "matchedIngredients": [
    { "id": 1, "name": "ไข่ไก่", "nameEn": "egg", "confidence": 0.92 }
  ],
  "unmatchedLabels": [
    { "label": "plate", "confidence": 0.61 }
  ]
}
```

> ผลลัพธ์มาจาก `MockDetectionProvider` — เปลี่ยนเป็นโมเดลจริงได้โดยแก้เฉพาะ `backend/src/mock/detection.provider.ts` (ดู README)

---

## 📊 Dashboard — `/dashboard`

| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| GET | `/dashboard/stats` | 🔴 | สถิติภาพรวมสำหรับแดชบอร์ดแอดมิน |

→ คืน: `totals` (users, recipes, ingredients, detections, reviews, favorites), `recipesByDifficulty`, `recipesByCategory`, `topRecipes`, `usersPerDay` (7 วัน)

---

## ❤️ Health Check

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/health` | ตรวจสอบว่า API ทำงาน |
