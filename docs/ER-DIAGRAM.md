# 🗄 ER Diagram — Cooking Recipe Recommendation System

แผนผังความสัมพันธ์ของฐานข้อมูล (Prisma + PostgreSQL) แสดงด้วย Mermaid
สามารถดูภาพได้บน GitHub, VS Code (ติดตั้ง Mermaid extension) หรือ https://mermaid.live

```mermaid
erDiagram
    Role ||--o{ User : "มี"
    User ||--o{ RefreshToken : "ถือ"
    User ||--o{ Recipe : "สร้าง (author)"
    User ||--o{ Favorite : "บันทึก"
    User ||--o{ Review : "เขียน"
    User ||--o{ Detection : "อัปโหลด"

    Recipe ||--o{ RecipeIngredient : "ประกอบด้วย"
    Recipe ||--o{ RecipeCategory : "อยู่ในหมวด"
    Recipe ||--o{ Favorite : "ถูกบันทึกเป็น"
    Recipe ||--o{ Review : "ได้รับ"

    Ingredient ||--o{ RecipeIngredient : "ถูกใช้ใน"
    Ingredient ||--o{ DetectionItem : "จับคู่กับ"

    Category ||--o{ RecipeCategory : "จัดกลุ่ม"

    Detection ||--o{ DetectionItem : "ให้ผล"

    Role {
        int id PK
        string name UK "ADMIN / USER"
    }

    User {
        int id PK
        string name
        string email UK
        string password "bcrypt hash"
        string avatarUrl "nullable"
        boolean isActive
        datetime lastLoginAt "nullable"
        int roleId FK
        datetime createdAt
        datetime updatedAt
    }

    RefreshToken {
        int id PK
        string token UK
        int userId FK
        datetime expiresAt
        datetime createdAt
    }

    Category {
        int id PK
        string name
        string slug UK
        string description "nullable"
        datetime createdAt
    }

    Ingredient {
        int id PK
        string name
        string nameEn "nullable — ใช้จับคู่ผล AI"
        string unit "nullable"
        string imageUrl "nullable"
        boolean isActive
        datetime createdAt
    }

    Recipe {
        int id PK
        string title
        string slug UK
        string description "nullable"
        string instructions "TEXT"
        string imageUrl "nullable"
        int servings
        int cookMinutes
        int prepMinutes
        enum difficulty "EASY/MEDIUM/HARD"
        int calories "nullable"
        boolean isPublished
        int views
        int authorId FK "nullable"
        datetime createdAt
        datetime updatedAt
    }

    RecipeIngredient {
        int id PK
        int recipeId FK
        int ingredientId FK
        float quantity
        string unit "nullable"
        boolean optional
        string note "nullable"
    }

    RecipeCategory {
        int id PK
        int recipeId FK
        int categoryId FK
    }

    Favorite {
        int id PK
        int userId FK
        int recipeId FK
        datetime createdAt
    }

    Review {
        int id PK
        int userId FK
        int recipeId FK
        int rating "1-5"
        string comment "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Detection {
        int id PK
        int userId FK "nullable"
        string imageUrl
        string modelName "ชื่อโมเดล (mock)"
        int processMs
        enum status "PENDING/COMPLETED/FAILED"
        datetime createdAt
    }

    DetectionItem {
        int id PK
        int detectionId FK
        int ingredientId FK "nullable — ถ้าจับคู่ได้"
        string label "ป้ายที่โมเดลคืน"
        float confidence
        string bbox "nullable — bounding box JSON"
    }
```

## ความสัมพันธ์สำคัญ

- **User ↔ Role** — ผู้ใช้แต่ละคนมี 1 บทบาท (ADMIN หรือ USER)
- **Recipe ↔ Ingredient** — ความสัมพันธ์แบบ many-to-many ผ่าน `RecipeIngredient` (เก็บปริมาณ หน่วย และว่าเป็นวัตถุดิบเสริมหรือไม่)
- **Recipe ↔ Category** — many-to-many ผ่าน `RecipeCategory`
- **Favorite / Review** — เชื่อม User กับ Recipe (มี unique constraint กัน 1 user ต่อ 1 recipe)
- **Detection ↔ DetectionItem** — การอัปโหลดรูป 1 ครั้งให้ผลได้หลายวัตถุดิบ โดย `DetectionItem.ingredientId` จะถูกเติมเมื่อจับคู่ `label` (อังกฤษ) กับ `Ingredient.nameEn` ได้

## หมายเหตุการออกแบบเพื่อรองรับ AI จริง

ฟิลด์ `Ingredient.nameEn` และตาราง `Detection` / `DetectionItem` ถูกออกแบบไว้ล่วงหน้าเพื่อรองรับโมเดลตรวจจับจริง เมื่อสลับจาก mock เป็นโมเดลจริง โครงสร้างตารางไม่ต้องเปลี่ยน — เพียงแค่ผลลัพธ์ใน `DetectionItem` จะมาจากโมเดลจริงแทน
