import { PrismaClient, Difficulty } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slug(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

async function main() {
  console.log('🌱 Seeding database...');

  // ---------- Roles ----------
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrator with full access' },
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER', description: 'Standard user' },
  });
  console.log('✔ Roles created');

  // ---------- Users ----------
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@recipe.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@recipe.com',
      password: adminPassword,
      roleId: adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@recipe.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'user@recipe.com',
      password: userPassword,
      roleId: userRole.id,
    },
  });
  console.log('✔ Users created (admin@recipe.com / Admin@123, user@recipe.com / User@123)');

  // ---------- Categories ----------
  const categoryNames = ['อาหารจานเดียว', 'ต้ม/แกง', 'ผัด', 'ทอด', 'ยำ/สลัด', 'ของหวาน', 'อาหารเช้า'];
  const categories = [];
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug: slug(name) },
    });
    categories.push(cat);
  }
  console.log('✔ Categories created');

  // ---------- Ingredients ----------
  const ingredientData = [
    { name: 'มะเขือเทศ', nameEn: 'tomato', unit: 'ลูก' },
    { name: 'ไข่ไก่', nameEn: 'egg', unit: 'ฟอง' },
    { name: 'หัวหอมใหญ่', nameEn: 'onion', unit: 'หัว' },
    { name: 'กระเทียม', nameEn: 'garlic', unit: 'กลีบ' },
    { name: 'เนื้อไก่', nameEn: 'chicken', unit: 'กรัม' },
    { name: 'เนื้อหมู', nameEn: 'pork', unit: 'กรัม' },
    { name: 'แครอท', nameEn: 'carrot', unit: 'หัว' },
    { name: 'พริก', nameEn: 'chili', unit: 'เม็ด' },
    { name: 'พริกหวาน', nameEn: 'bell pepper', unit: 'ลูก' },
    { name: 'เห็ด', nameEn: 'mushroom', unit: 'กรัม' },
    { name: 'ใบโหระพา', nameEn: 'basil', unit: 'กรัม' },
    { name: 'ข้าวสวย', nameEn: 'rice', unit: 'ถ้วย' },
    { name: 'กุ้ง', nameEn: 'shrimp', unit: 'กรัม' },
    { name: 'มะนาว', nameEn: 'lime', unit: 'ลูก' },
    { name: 'แตงกวา', nameEn: 'cucumber', unit: 'ลูก' },
    { name: 'น้ำปลา', nameEn: 'fish sauce', unit: 'ช้อนโต๊ะ' },
    { name: 'น้ำตาล', nameEn: 'sugar', unit: 'ช้อนโต๊ะ' },
    { name: 'ซีอิ๊วขาว', nameEn: 'soy sauce', unit: 'ช้อนโต๊ะ' },
    { name: 'น้ำมันพืช', nameEn: 'vegetable oil', unit: 'ช้อนโต๊ะ' },
    { name: 'ต้นหอม', nameEn: 'green onion', unit: 'ต้น' },
  ];

  const ingredients: Record<string, number> = {};
  for (const ing of ingredientData) {
    const created = await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: {},
      create: ing,
    });
    ingredients[ing.nameEn] = created.id;
  }
  console.log(`✔ ${ingredientData.length} ingredients created`);

  // ---------- Sample Recipes ----------
  interface SeedRecipe {
    title: string;
    description: string;
    instructions: string;
    difficulty: Difficulty;
    cookMinutes: number;
    prepMinutes: number;
    servings: number;
    calories: number;
    categoryIdx: number[];
    items: { key: string; quantity: number; unit: string; optional?: boolean }[];
  }

  const recipes: SeedRecipe[] = [
    {
      title: 'ข้าวผัดกุ้ง',
      description: 'ข้าวผัดกุ้งหอมๆ ทำง่าย อร่อยทุกคำ',
      instructions:
        '1. ตั้งกระทะใส่น้ำมัน เจียวกระเทียมให้หอม\n2. ใส่กุ้งลงผัดจนสุก\n3. ใส่ไข่ลงยีให้สุก\n4. ใส่ข้าวสวยลงผัด ปรุงรสด้วยน้ำปลา ซีอิ๊ว น้ำตาล\n5. ใส่ต้นหอม ผัดให้เข้ากัน ตักเสิร์ฟ',
      difficulty: 'EASY',
      cookMinutes: 15,
      prepMinutes: 10,
      servings: 2,
      calories: 550,
      categoryIdx: [0, 2],
      items: [
        { key: 'rice', quantity: 2, unit: 'ถ้วย' },
        { key: 'shrimp', quantity: 150, unit: 'กรัม' },
        { key: 'egg', quantity: 2, unit: 'ฟอง' },
        { key: 'garlic', quantity: 3, unit: 'กลีบ' },
        { key: 'fish sauce', quantity: 1, unit: 'ช้อนโต๊ะ' },
        { key: 'soy sauce', quantity: 1, unit: 'ช้อนโต๊ะ' },
        { key: 'vegetable oil', quantity: 2, unit: 'ช้อนโต๊ะ' },
        { key: 'green onion', quantity: 1, unit: 'ต้น', optional: true },
      ],
    },
    {
      title: 'ผัดกะเพราหมูสับ',
      description: 'เมนูยอดฮิตของคนไทย เผ็ดร้อนกลมกล่อม',
      instructions:
        '1. โขลกกระเทียมกับพริกให้พอหยาบ\n2. ตั้งกระทะใส่น้ำมัน ผัดกระเทียมพริกให้หอม\n3. ใส่หมูสับลงผัดจนสุก\n4. ปรุงรสด้วยน้ำปลา ซีอิ๊ว น้ำตาล\n5. ใส่ใบกะเพรา ผัดให้เข้ากัน ตักราดข้าว',
      difficulty: 'EASY',
      cookMinutes: 10,
      prepMinutes: 5,
      servings: 1,
      calories: 480,
      categoryIdx: [0, 2],
      items: [
        { key: 'pork', quantity: 150, unit: 'กรัม' },
        { key: 'garlic', quantity: 4, unit: 'กลีบ' },
        { key: 'chili', quantity: 5, unit: 'เม็ด' },
        { key: 'basil', quantity: 20, unit: 'กรัม' },
        { key: 'fish sauce', quantity: 1, unit: 'ช้อนโต๊ะ' },
        { key: 'soy sauce', quantity: 1, unit: 'ช้อนโต๊ะ' },
        { key: 'vegetable oil', quantity: 2, unit: 'ช้อนโต๊ะ' },
      ],
    },
    {
      title: 'ไข่เจียวหมูสับ',
      description: 'ไข่เจียวฟูๆ กินกับข้าวสวยร้อนๆ',
      instructions:
        '1. ตอกไข่ใส่ชาม ใส่หมูสับ\n2. ปรุงรสด้วยน้ำปลา ตีให้เข้ากัน\n3. ตั้งกระทะใส่น้ำมันให้ร้อนจัด\n4. เทไข่ลงทอดให้ฟู กลับด้านให้สุกทั้งสองด้าน\n5. ตักขึ้น เสิร์ฟกับข้าว',
      difficulty: 'EASY',
      cookMinutes: 8,
      prepMinutes: 5,
      servings: 1,
      calories: 400,
      categoryIdx: [0, 3],
      items: [
        { key: 'egg', quantity: 3, unit: 'ฟอง' },
        { key: 'pork', quantity: 80, unit: 'กรัม' },
        { key: 'fish sauce', quantity: 1, unit: 'ช้อนโต๊ะ' },
        { key: 'vegetable oil', quantity: 3, unit: 'ช้อนโต๊ะ' },
        { key: 'green onion', quantity: 1, unit: 'ต้น', optional: true },
      ],
    },
    {
      title: 'ต้มยำกุ้ง',
      description: 'ต้มยำกุ้งน้ำใส เปรี้ยวเผ็ดจัดจ้าน',
      instructions:
        '1. ต้มน้ำให้เดือด ใส่ข่า ตะไคร้ ใบมะกรูด\n2. ใส่เห็ดและกุ้ง ต้มจนสุก\n3. ปรุงรสด้วยน้ำปลา น้ำมะนาว พริก\n4. ชิมรสให้เปรี้ยวเผ็ดกลมกล่อม\n5. ตักเสิร์ฟร้อนๆ',
      difficulty: 'MEDIUM',
      cookMinutes: 20,
      prepMinutes: 15,
      servings: 3,
      calories: 320,
      categoryIdx: [1],
      items: [
        { key: 'shrimp', quantity: 300, unit: 'กรัม' },
        { key: 'mushroom', quantity: 150, unit: 'กรัม' },
        { key: 'chili', quantity: 6, unit: 'เม็ด' },
        { key: 'lime', quantity: 2, unit: 'ลูก' },
        { key: 'fish sauce', quantity: 2, unit: 'ช้อนโต๊ะ' },
      ],
    },
    {
      title: 'ยำแตงกวา',
      description: 'ยำแตงกวากรอบๆ เปรี้ยวหวานเผ็ด',
      instructions:
        '1. หั่นแตงกวาเป็นชิ้นพอคำ\n2. ทำน้ำยำ: ผสมน้ำปลา น้ำมะนาว น้ำตาล พริก\n3. คลุกแตงกวากับน้ำยำ\n4. ใส่หัวหอมซอย คลุกเบาๆ\n5. ตักใส่จาน เสิร์ฟ',
      difficulty: 'EASY',
      cookMinutes: 0,
      prepMinutes: 15,
      servings: 2,
      calories: 120,
      categoryIdx: [4],
      items: [
        { key: 'cucumber', quantity: 2, unit: 'ลูก' },
        { key: 'onion', quantity: 1, unit: 'หัว' },
        { key: 'chili', quantity: 3, unit: 'เม็ด' },
        { key: 'lime', quantity: 1, unit: 'ลูก' },
        { key: 'fish sauce', quantity: 1, unit: 'ช้อนโต๊ะ' },
        { key: 'sugar', quantity: 1, unit: 'ช้อนโต๊ะ' },
      ],
    },
    {
      title: 'ผัดผักรวมมิตร',
      description: 'ผัดผักหลากสี สุขภาพดี ทำง่าย',
      instructions:
        '1. ตั้งกระทะใส่น้ำมัน เจียวกระเทียม\n2. ใส่แครอท ผัดพอนุ่ม\n3. ใส่พริกหวาน เห็ด ผัดต่อ\n4. ปรุงรสด้วยซีอิ๊ว น้ำตาล\n5. ผัดให้สุกทั่ว ตักเสิร์ฟ',
      difficulty: 'EASY',
      cookMinutes: 12,
      prepMinutes: 10,
      servings: 2,
      calories: 180,
      categoryIdx: [2],
      items: [
        { key: 'carrot', quantity: 1, unit: 'หัว' },
        { key: 'bell pepper', quantity: 1, unit: 'ลูก' },
        { key: 'mushroom', quantity: 100, unit: 'กรัม' },
        { key: 'garlic', quantity: 3, unit: 'กลีบ' },
        { key: 'soy sauce', quantity: 2, unit: 'ช้อนโต๊ะ' },
        { key: 'vegetable oil', quantity: 2, unit: 'ช้อนโต๊ะ' },
      ],
    },
    {
      title: 'ไก่ผัดเม็ดมะม่วง',
      description: 'ไก่ผัดหวานๆ เข้ากับพริกแห้ง',
      instructions:
        '1. หั่นไก่เป็นชิ้นพอคำ หมักด้วยซีอิ๊ว\n2. ตั้งกระทะผัดไก่จนสุก พักไว้\n3. ผัดหัวหอม พริกหวาน\n4. ใส่ไก่กลับลงไป ปรุงรส\n5. ผัดให้เข้ากัน ตักเสิร์ฟ',
      difficulty: 'MEDIUM',
      cookMinutes: 18,
      prepMinutes: 15,
      servings: 2,
      calories: 420,
      categoryIdx: [2],
      items: [
        { key: 'chicken', quantity: 250, unit: 'กรัม' },
        { key: 'onion', quantity: 1, unit: 'หัว' },
        { key: 'bell pepper', quantity: 1, unit: 'ลูก' },
        { key: 'chili', quantity: 3, unit: 'เม็ด', optional: true },
        { key: 'soy sauce', quantity: 2, unit: 'ช้อนโต๊ะ' },
        { key: 'sugar', quantity: 1, unit: 'ช้อนโต๊ะ' },
      ],
    },
    {
      title: 'ข้าวไข่ข้น',
      description: 'ไข่ข้นนุ่มๆ ราดข้าวสวยร้อนๆ',
      instructions:
        '1. ตีไข่กับซีอิ๊วให้เข้ากัน\n2. ตั้งกระทะไฟอ่อน ใส่น้ำมัน\n3. เทไข่ลง คนเบาๆ ให้ข้น\n4. ยกลงตอนไข่ยังนุ่ม\n5. ราดบนข้าวสวย โรยต้นหอม',
      difficulty: 'EASY',
      cookMinutes: 7,
      prepMinutes: 5,
      servings: 1,
      calories: 380,
      categoryIdx: [0, 6],
      items: [
        { key: 'egg', quantity: 3, unit: 'ฟอง' },
        { key: 'rice', quantity: 1, unit: 'ถ้วย' },
        { key: 'soy sauce', quantity: 1, unit: 'ช้อนโต๊ะ' },
        { key: 'vegetable oil', quantity: 2, unit: 'ช้อนโต๊ะ' },
        { key: 'green onion', quantity: 1, unit: 'ต้น', optional: true },
      ],
    },
  ];

  for (const r of recipes) {
    const existing = await prisma.recipe.findFirst({ where: { title: r.title } });
    if (existing) continue;

    await prisma.recipe.create({
      data: {
        title: r.title,
        slug: slug(r.title),
        description: r.description,
        instructions: r.instructions,
        difficulty: r.difficulty,
        cookMinutes: r.cookMinutes,
        prepMinutes: r.prepMinutes,
        servings: r.servings,
        calories: r.calories,
        authorId: admin.id,
        views: Math.floor(Math.random() * 200),
        categories: {
          create: r.categoryIdx.map((idx) => ({ categoryId: categories[idx].id })),
        },
        ingredients: {
          create: r.items.map((it) => ({
            ingredientId: ingredients[it.key],
            quantity: it.quantity,
            unit: it.unit,
            optional: it.optional ?? false,
          })),
        },
      },
    });
  }
  console.log(`✔ ${recipes.length} sample recipes created`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
