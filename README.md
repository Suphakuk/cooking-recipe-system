# 🍳 ครัวเปิดตู้ — Cooking Recipe Recommendation System

ระบบแนะนำเมนูอาหารจากวัตถุดิบที่มีอยู่ ผู้ใช้เลือกวัตถุดิบที่มีในตู้เย็น (หรืออัปโหลดรูปให้ระบบช่วยระบุ) แล้วระบบจะแนะนำเมนูที่ทำได้ พร้อมบอกว่าขาดวัตถุดิบอะไรบ้าง

> **หมายเหตุเรื่อง AI:** ส่วนตรวจจับวัตถุดิบจากรูปภาพ (image detection) เป็น **โมเดลจำลอง (mock)** ตามที่ตกลงไว้ โครงสร้างถูกออกแบบให้เปลี่ยนไปใช้โมเดลจริง (เช่น YOLO/CNN ผ่าน HTTP) ได้โดยแก้ไขไฟล์เดียว ดูรายละเอียดในหัวข้อ [การเชื่อมต่อ AI จริง](#-การเชื่อมต่อ-ai-จริงภายหลัง)

> ☁️ **อยากขึ้น cloud ฟรี (ไม่ต้องเปิด XAMPP/MySQL)?** ดูคู่มือละเอียดทีละขั้นที่ [`docs/DEPLOY.md`](./docs/DEPLOY.md) — ใช้ Neon + Render + Vercel ฟรีทั้งหมด

---

## 📦 เทคโนโลยีที่ใช้

**Frontend**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Shadcn UI (Radix primitives)
- Axios (พร้อมระบบ refresh token อัตโนมัติ)
- React Hook Form + Zod
- Zustand (state management)
- Recharts (กราฟในแดชบอร์ด)

**Backend**
- Node.js + Express.js + TypeScript
- Prisma ORM + PostgreSQL (ใช้ได้ทั้ง local และ cloud เช่น Neon)
- JWT (Access + Refresh Token) + bcrypt
- Multer (อัปโหลดรูป → เก็บเป็น base64 ในฐานข้อมูล ใช้บน cloud ฟรีได้เลย)
- Zod (validation), Helmet, CORS, Rate limiting

---

## 🗂 โครงสร้างโปรเจกต์

```
cooking-recipe-system/
├── backend/          # Express API
│   ├── prisma/       # schema + seed
│   ├── src/
│   │   ├── config/       # env, prisma client
│   │   ├── controllers/  # request handlers
│   │   ├── services/     # business logic
│   │   ├── routes/       # API routes
│   │   ├── middlewares/  # auth, error, upload, validate
│   │   ├── mock/         # 🔴 mock AI detection provider
│   │   ├── utils/        # jwt, helpers, validators, responses
│   │   └── app.ts, server.ts
├── frontend/         # Next.js app
│   └── src/
│       ├── app/          # หน้าเว็บ (App Router)
│       ├── components/   # UI + shared components
│       ├── lib/          # api client, auth store, utils
│       └── types/        # TypeScript types
└── docs/             # ER diagram + API documentation
```

---

## 🚀 การติดตั้งและรัน

### สิ่งที่ต้องมีก่อน
- Node.js 18+ (แนะนำ 20+)
- PostgreSQL (รันในเครื่อง **หรือ** ใช้ cloud ฟรีอย่าง Neon — ไม่ต้องลงเองก็ได้)
- npm

### 1️⃣ ตั้งค่า Backend

```bash
cd backend

# ติดตั้ง dependencies
npm install

# คัดลอกไฟล์ env แล้วแก้ค่าตามเครื่องคุณ
cp .env.example .env
```

แก้ไข `.env` — อย่างน้อยต้องตั้งค่า `DATABASE_URL` ให้ตรงกับ PostgreSQL ของคุณ:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cooking_recipe_db?sslmode=require"
JWT_ACCESS_SECRET="เปลี่ยนเป็นค่าลับของคุณ"
JWT_REFRESH_SECRET="เปลี่ยนเป็นค่าลับอีกอันของคุณ"
PORT=4000
CLIENT_URL="http://localhost:3000"
```

สร้างฐานข้อมูลใน PostgreSQL (ครั้งเดียว) — ข้ามขั้นนี้ได้ถ้าใช้ Neon (มีให้แล้ว):

```sql
CREATE DATABASE cooking_recipe_db;
```

จากนั้นสร้างตารางและ seed ข้อมูลตัวอย่าง:

```bash
# สร้าง Prisma client
npx prisma generate

# สร้างตารางในฐานข้อมูล (ตรงจาก schema — ไม่ต้องใช้ไฟล์ migration)
npm run db:push

# ใส่ข้อมูลตัวอย่าง (roles, ผู้ใช้, วัตถุดิบ, สูตรอาหาร)
npm run seed

# หรือทำ 2 ขั้นบนพร้อมกันด้วยคำสั่งเดียว:
# npm run db:setup

# รันเซิร์ฟเวอร์ (dev)
npm run dev
```

Backend จะรันที่ **http://localhost:4000** (API prefix: `/api/v1`)
ตรวจสุขภาพระบบได้ที่ `http://localhost:4000/api/v1/health`

### 2️⃣ ตั้งค่า Frontend

เปิด terminal อีกหน้าต่าง:

```bash
cd frontend

# ติดตั้ง dependencies
npm install

# คัดลอกไฟล์ env
cp .env.local.example .env.local

# รัน dev server
npm run dev
```

Frontend จะรันที่ **http://localhost:3000**

> ถ้าต้องการ build production: `npm run build && npm start`

---

## 🔑 บัญชีทดลอง (จาก seed)

| บทบาท | อีเมล | รหัสผ่าน |
|-------|-------|----------|
| แอดมิน (Admin) | `admin@recipe.com` | `Admin@123` |
| ผู้ใช้ทั่วไป (User) | `user@recipe.com` | `User@123` |

- **แอดมิน** เข้าถึงแดชบอร์ด `/dashboard` จัดการสูตร วัตถุดิบ หมวดหมู่ และผู้ใช้ได้
- **ผู้ใช้** ใช้ระบบแนะนำเมนู บันทึกรายการโปรด และรีวิวได้

---

## ✨ ฟีเจอร์หลัก

**ฝั่งผู้ใช้**
- 🔍 แนะนำเมนูจากวัตถุดิบ — เลือกวัตถุดิบแบบ chip ลงบน "เขียง" พร้อม match-meter บอก % ความเข้ากัน
- 📷 อัปโหลดรูปวัตถุดิบ (โมเดลจำลองจะระบุวัตถุดิบให้)
- 🍽 เลือกโหมด "มีบางอย่าง" หรือ "ครบทุกอย่าง"
- 📖 ดูสูตรอาหาร กรอง/ค้นหา/เรียงลำดับ พร้อมรายละเอียดครบ
- ❤️ บันทึกรายการโปรด และ ⭐ ให้รีวิว/คะแนน
- 👤 จัดการโปรไฟล์และเปลี่ยนรหัสผ่าน

**ฝั่งแอดมิน**
- 📊 แดชบอร์ดสรุปสถิติ (กราฟผู้ใช้, สูตรตามความยาก/หมวดหมู่, เมนูยอดนิยม)
- 🍲 จัดการสูตรอาหาร (เพิ่ม/แก้ไข/ลบ พร้อมอัปโหลดรูป เลือกวัตถุดิบและหมวดหมู่)
- 🥕 จัดการวัตถุดิบ และ 📁 หมวดหมู่
- 👥 จัดการผู้ใช้ (กำหนดสิทธิ์ ระงับ/เปิดใช้งาน ลบ)

**ความปลอดภัย**
- JWT access + refresh token พร้อม token rotation
- รหัสผ่านเข้ารหัสด้วย bcrypt
- Route guard ทั้งฝั่ง client และ middleware ฝั่ง server
- Rate limiting, Helmet, CORS

---

## 🤖 การเชื่อมต่อ AI จริง (ภายหลัง)

ส่วนตรวจจับวัตถุดิบถูกแยกไว้ที่ **`backend/src/mock/detection.provider.ts`** เบื้องหลัง interface `IDetectionProvider` เพียงตัวเดียว

ปัจจุบัน `MockDetectionProvider` จะสุ่มคืนป้ายวัตถุดิบ (พร้อม confidence + bounding box) เพื่อจำลองผลลัพธ์

เมื่อพร้อมใช้โมเดลจริง:
1. เขียน class ใหม่ที่ implement `IDetectionProvider` (มีตัวอย่าง `YoloHttpProvider` แบบ comment ไว้ให้ในไฟล์เดียวกัน) — ให้ยิง HTTP ไปยัง service ของโมเดล เช่น YOLO/CNN
2. เปลี่ยนบรรทัด export `detectionProvider` ให้ชี้ไปที่ class ใหม่
3. ระบบจะจับคู่ป้ายภาษาอังกฤษที่โมเดลคืนกับฟิลด์ `nameEn` ของวัตถุดิบในฐานข้อมูลโดยอัตโนมัติ

ไม่ต้องแก้ controller, service อื่น หรือ frontend เลย

---

## 📚 เอกสารเพิ่มเติม

- [`docs/DEPLOY.md`](./docs/DEPLOY.md) — ☁️ คู่มือขึ้น cloud ฟรีแบบละเอียด (Neon + Render + Vercel)
- [`docs/ER-DIAGRAM.md`](./docs/ER-DIAGRAM.md) — แผนผังฐานข้อมูล (Mermaid ER diagram)
- [`docs/API.md`](./docs/API.md) — รายการ API endpoints ทั้งหมด

---

## 🛠 คำสั่งที่มีให้ (Backend)

| คำสั่ง | ทำอะไร |
|--------|--------|
| `npm run dev` | รัน dev server (hot reload) |
| `npm run build` | คอมไพล์ TypeScript → `dist/` |
| `npm start` | รันจาก build (production) |
| `npm run seed` | ใส่ข้อมูลตัวอย่าง |
| `npm run prisma:studio` | เปิด Prisma Studio ดูข้อมูล |

---

## 📝 หมายเหตุด้านความปลอดภัย (Security)

- ก่อน deploy จริง ให้รัน `npm audit fix` ทั้งสองฝั่งเพื่ออัปเดตแพ็กเกจที่มีช่องโหว่ และเปลี่ยนค่า `JWT_*_SECRET` เป็นค่าที่สุ่มยาว
- การเก็บรูปเป็น base64 ในฐานข้อมูล ทำให้ใช้บน cloud ฟรี (ที่ไม่มีดิสก์ถาวร) ได้ทันที — ถ้าต้องการประสิทธิภาพสูงขึ้นสำหรับ production ที่มีรูปเยอะ แนะนำต่อ cloud storage (S3, Cloudflare R2 ฯลฯ) โดยแก้ที่ `upload.middleware.ts` (ฟังก์ชัน `fileToDataUrl`)
