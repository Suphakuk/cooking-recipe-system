# 🚀 คู่มือขึ้น Cloud แบบละเอียด (ฟรีทั้งหมด)

คู่มือนี้จะพาคุณเอาระบบขึ้น cloud ทีละขั้น แบบไม่ต้องมีพื้นฐาน deploy มาก่อน
เมื่อทำเสร็จ คุณจะได้ลิงก์เว็บที่เปิดใช้งานได้จริงจากที่ไหนก็ได้ โดย**ไม่ต้องเปิด XAMPP หรือติดตั้ง MySQL เลย**

## 🧭 ภาพรวม เราจะใช้ 3 บริการ (ฟรีทั้งหมด)

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Vercel    │─────▶│    Render    │─────▶│    Neon     │
│  (หน้าเว็บ)  │      │  (API หลังบ้าน)│      │ (ฐานข้อมูล)  │
│  Next.js    │      │   Express    │      │ PostgreSQL  │
└─────────────┘      └──────────────┘      └─────────────┘
```

1. **Neon** — ฐานข้อมูล PostgreSQL บน cloud
2. **Render** — รัน backend (Express API)
3. **Vercel** — รัน frontend (Next.js)

> ⏱ ใช้เวลารวมประมาณ 30–45 นาที

---

## ✅ สิ่งที่ต้องเตรียมก่อน

1. **บัญชี GitHub** (ฟรี) — https://github.com/signup
2. **โค้ดโปรเจกต์** (โฟลเดอร์ `cooking-recipe-system` ที่ได้ไป)
3. โปรแกรม **Git** ในเครื่อง — เช็คว่ามีไหมโดยเปิด Terminal/Command Prompt พิมพ์ `git --version` ถ้าไม่มีโหลดที่ https://git-scm.com/downloads

---

# 📤 ขั้นที่ 0 — อัปโค้ดขึ้น GitHub

ทั้ง Render และ Vercel ดึงโค้ดจาก GitHub เราเลยต้องเอาโค้ดขึ้นไปก่อน

### 0.1 สร้าง repository ใหม่บน GitHub
1. เข้า https://github.com/new
2. ตั้งชื่อ repo เช่น `cooking-recipe-system`
3. เลือก **Private** หรือ **Public** ก็ได้
4. **อย่า** ติ๊ก "Add a README" (เพราะเรามีไฟล์อยู่แล้ว)
5. กด **Create repository**

### 0.2 อัปโค้ดขึ้นไป
เปิด Terminal ในโฟลเดอร์ `cooking-recipe-system` แล้วรันทีละบรรทัด
(แทนที่ `<YOUR_USERNAME>` และ `<REPO>` ด้วยของคุณ — ดูจากหน้า GitHub ที่เพิ่งสร้าง):

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<REPO>.git
git push -u origin main
```

> 💡 ถ้า push แล้วถาม username/password ให้ใช้ **Personal Access Token** แทนรหัสผ่าน
> (สร้างที่ GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token, ติ๊กสิทธิ์ `repo`)

รีเฟรชหน้า GitHub ควรเห็นไฟล์ทั้งหมดแล้ว ✅

---

# 🗄 ขั้นที่ 1 — สร้างฐานข้อมูลบน Neon

### 1.1 สมัคร Neon
1. เข้า https://neon.tech แล้วกด **Sign up** (ล็อกอินด้วย GitHub ได้เลย — ง่ายสุด)
2. ไม่ต้องใส่บัตรเครดิต

### 1.2 สร้าง Project
1. กด **Create project** (หรือ **New Project**)
2. ตั้งชื่อ project เช่น `cooking-recipe`
3. **Region** — เลือกที่ใกล้ไทยสุด เช่น **Singapore** (`ap-southeast-1`)
4. กด **Create**

### 1.3 คัดลอก Connection String
1. หลังสร้างเสร็จ Neon จะแสดงหน้า **Connection Details** (หรือกดปุ่ม **Connect**)
2. เลือกแบบ **Connection string** และ**คัดลอก**ค่าที่ขึ้นต้นด้วย `postgresql://...`
   ตัวอย่าง:
   ```
   postgresql://neondb_owner:AbCd1234@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
3. **เก็บค่านี้ไว้** เดี๋ยวเอาไปใส่ใน Render (ขั้นที่ 2)

> 📌 สำคัญ: ต้องมี `?sslmode=require` ต่อท้าย ถ้าไม่มีให้เติมเอง

---

# ⚙️ ขั้นที่ 2 — Deploy Backend บน Render

### 2.1 สมัคร Render
1. เข้า https://render.com แล้ว **Sign up** ด้วย GitHub
2. ไม่ต้องใส่บัตรเครดิตสำหรับ free tier

### 2.2 สร้าง Web Service
1. กด **New +** (มุมขวาบน) → เลือก **Web Service**
2. เลือก **Connect a repository** แล้วเลือก repo `cooking-recipe-system` ที่เพิ่ง push
   (ถ้าไม่เห็น กด **Configure account** เพื่อให้สิทธิ์ Render เข้าถึง repo)

### 2.3 ตั้งค่า Service
กรอกตามนี้:

| ช่อง | ค่าที่ใส่ |
|------|----------|
| **Name** | `cooking-recipe-api` (หรือชื่ออะไรก็ได้) |
| **Region** | Singapore (ใกล้ไทยสุด) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

### 2.4 ใส่ Environment Variables
เลื่อนลงไปหาส่วน **Environment Variables** กด **Add Environment Variable** แล้วเพิ่มทีละตัว:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `API_PREFIX` | `/api/v1` |
| `DATABASE_URL` | *(วาง connection string จาก Neon ขั้นที่ 1.3)* |
| `JWT_ACCESS_SECRET` | *(พิมพ์ข้อความสุ่มยาวๆ เช่น `mysupersecret_access_key_9382`)* |
| `JWT_REFRESH_SECRET` | *(พิมพ์ข้อความสุ่มยาวๆ อีกอัน เช่น `myrefresh_key_5521`)* |
| `JWT_ACCESS_EXPIRES` | `15m` |
| `JWT_REFRESH_EXPIRES` | `7d` |
| `MAX_FILE_SIZE_MB` | `5` |
| `MOCK_AI_ENABLED` | `true` |

> `CLIENT_URL` ยังไม่ต้องใส่ตอนนี้ เดี๋ยวเรากลับมาใส่หลัง deploy frontend เสร็จ (ขั้นที่ 4)

### 2.5 กด Deploy
1. กด **Create Web Service** (หรือ **Deploy Web Service**)
2. รอ Render build (~2–4 นาที) ดู log ได้ในหน้านั้น
3. เมื่อขึ้น **"Live"** สีเขียว = สำเร็จ 🎉
4. **คัดลอก URL** ของ service (อยู่บนสุด) เช่น `https://cooking-recipe-api.onrender.com`

### 2.6 สร้างตาราง + ใส่ข้อมูลตัวอย่าง (ทำครั้งเดียว)
ตอนนี้ API รันแล้วแต่ฐานข้อมูลยังว่าง เราต้องสร้างตารางและใส่ข้อมูล
วิธีที่ง่ายที่สุดคือใช้ **Shell** ของ Render:

1. ในหน้า service ของคุณ กดแท็บ **Shell** (เมนูด้านซ้าย)
2. รอ shell โหลด แล้วพิมพ์คำสั่งนี้:
   ```bash
   npm run db:setup
   ```
3. คำสั่งนี้จะ:
   - สร้างตารางทั้งหมดในฐานข้อมูล Neon (`prisma db push`)
   - ใส่ข้อมูลตัวอย่าง: ผู้ใช้, วัตถุดิบ, หมวดหมู่, สูตรอาหาร (`seed`)
4. รอจนขึ้น `🌱 Seeding database...` และ `✅ Done` = เรียบร้อย

> 🔎 **ทดสอบ:** เปิดเบราว์เซอร์ไปที่ `https://<your-api>.onrender.com/api/v1/health`
> ถ้าเห็น `{"success":true,...}` แปลว่า backend + database ทำงานแล้ว ✅

> ⚠️ ถ้าไม่มีแท็บ Shell (บาง free plan ปิดไว้) ดูวิธีสำรองด้านล่างหัวข้อ *"ทางเลือก: รัน db:setup จากเครื่องตัวเอง"*

---

# 🖥 ขั้นที่ 3 — Deploy Frontend บน Vercel

### 3.1 สมัคร Vercel
1. เข้า https://vercel.com แล้ว **Sign up** ด้วย GitHub
2. ฟรี ไม่ต้องใส่บัตร

### 3.2 Import โปรเจกต์
1. กด **Add New...** → **Project**
2. เลือก repo `cooking-recipe-system` แล้วกด **Import**

### 3.3 ตั้งค่า
1. **Framework Preset** — Vercel จะตรวจเจอ **Next.js** อัตโนมัติ ✅
2. **Root Directory** — กด **Edit** แล้วเลือกโฟลเดอร์ **`frontend`** ← สำคัญมาก!
3. เปิดส่วน **Environment Variables** เพิ่ม:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://<your-api>.onrender.com/api/v1` |
   | `NEXT_PUBLIC_SERVER_URL` | `https://<your-api>.onrender.com` |

   *(แทนที่ `<your-api>` ด้วย URL จริงจาก Render ขั้นที่ 2.5 — อย่าลืม `/api/v1` ต่อท้ายตัวแรก)*

### 3.4 กด Deploy
1. กด **Deploy**
2. รอ ~1–2 นาที
3. เมื่อขึ้นหน้า **Congratulations** พร้อมภาพเว็บ = สำเร็จ 🎉
4. **คัดลอก URL** ของเว็บ เช่น `https://cooking-recipe-system.vercel.app`

---

# 🔗 ขั้นที่ 4 — เชื่อม Frontend กับ Backend (CORS)

ตอนนี้ frontend เรียก backend แต่ backend ยังไม่อนุญาต origin ของ Vercel เราต้องบอก backend

1. กลับไปที่ **Render** → service `cooking-recipe-api` → แท็บ **Environment**
2. เพิ่ม/แก้ไข variable:

   | Key | Value |
   |-----|-------|
   | `CLIENT_URL` | `https://<your-app>.vercel.app` |

   *(ใส่ URL จริงจาก Vercel ขั้นที่ 3.4 — ไม่ต้องมี `/` ปิดท้าย)*

   > 💡 อยากให้เปิดจากเครื่องตัวเองตอน dev ได้ด้วย ก็ใส่หลายอันคั่นด้วย comma:
   > `http://localhost:3000,https://<your-app>.vercel.app`

3. กด **Save Changes** — Render จะ redeploy อัตโนมัติ (~2 นาที)

---

# 🎉 เสร็จแล้ว! ทดสอบระบบ

1. เปิด URL ของ Vercel เช่น `https://cooking-recipe-system.vercel.app`
2. ล็อกอินด้วยบัญชีทดลอง:
   - **แอดมิน:** `admin@recipe.com` / `Admin@123`
   - **ผู้ใช้:** `user@recipe.com` / `User@123`
3. ลองเลือกวัตถุดิบ → กดแนะนำเมนู
4. ล็อกอินแอดมิน → เข้า `/dashboard` ดูสถิติและจัดการข้อมูล

> ⏳ **หมายเหตุ:** ครั้งแรกที่เปิดหลังเว็บไม่มีคนใช้นานๆ อาจโหลดช้า ~30 วินาที
> เพราะ Render free tier จะ "หลับ" หลังไม่มีคนเข้า 15 นาที แล้วต้องตื่นก่อน เป็นเรื่องปกติ

---

# 🛠 การแก้ปัญหาที่เจอบ่อย

**เว็บเปิดได้แต่ล็อกอินไม่ได้ / หน้าไม่มีข้อมูล**
- เปิด Developer Tools (F12) → แท็บ Console/Network ดู error
- ถ้าเจอ error เกี่ยวกับ **CORS** → กลับไปเช็คขั้นที่ 4 ว่า `CLIENT_URL` ใน Render ตรงกับ URL ของ Vercel เป๊ะๆ
- ถ้าเจอ **404 / Network Error** → เช็คว่า `NEXT_PUBLIC_API_URL` ใน Vercel ถูกต้องและมี `/api/v1` ต่อท้าย

**API health เปิดไม่ได้ / Render ขึ้น error ตอน build**
- ดู **Logs** ในหน้า Render
- เช็คว่า **Root Directory = `backend`** และ Build/Start command ถูกต้อง

**ล็อกอินขึ้น "Invalid credentials" ทั้งที่รหัสถูก**
- แปลว่ายังไม่ได้ใส่ข้อมูลตัวอย่าง → กลับไปทำขั้นที่ 2.6 (`npm run db:setup`)

**รูปที่อัปโหลดหายหลัง deploy ใหม่**
- ไม่หายแล้ว! ระบบนี้เก็บรูปเป็น base64 ในฐานข้อมูล (ไม่ได้เก็บลงดิสก์) จึงอยู่ถาวร

---

# 🔁 ทางเลือก: รัน db:setup จากเครื่องตัวเอง

ถ้า Render ไม่มีแท็บ Shell คุณรันจากเครื่องตัวเองได้ (ต่อกับ Neon โดยตรง):

```bash
cd backend
npm install

# สร้างไฟล์ .env ชั่วคราว ใส่ connection string ของ Neon
echo 'DATABASE_URL="<Neon connection string ของคุณ>"' > .env

npm run db:setup
```

เสร็จแล้วลบไฟล์ `.env` ทิ้งได้ (ข้อมูลถูกสร้างบน Neon แล้ว)

---

# 📌 อัปเดตโค้ดในอนาคต

เมื่อแก้โค้ดแล้วอยากให้ cloud อัปเดตตาม แค่ push ขึ้น GitHub:

```bash
git add .
git commit -m "อธิบายว่าแก้อะไร"
git push
```

- **Render** และ **Vercel** จะ **redeploy อัตโนมัติ** ทุกครั้งที่ push ขึ้น branch `main`
- ถ้าแก้ **โครงสร้างฐานข้อมูล** (schema.prisma) ต้องรัน `npm run db:push` อีกครั้ง (ผ่าน Render Shell หรือจากเครื่องตัวเอง)

---

## 💰 สรุปเรื่องค่าใช้จ่าย

ทุกอย่างในคู่มือนี้อยู่ใน **free tier**:
- **Neon** — ฟรี 0.5 GB ฐานข้อมูล ไม่พักโปรเจกต์ (พอสำหรับเรียน/ทดลอง/เดโม)
- **Render** — ฟรี แต่ service หลับหลังไม่มีคนใช้ 15 นาที (ตื่นเองเมื่อมีคนเข้า)
- **Vercel** — ฟรี เหมาะกับ Next.js มาก

ไม่มีการตัดเงินอัตโนมัติ ตราบใดที่ไม่ได้กด upgrade เป็น plan เสียเงินเอง
