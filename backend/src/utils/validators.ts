import { z } from 'zod';

// ---------------- Auth ----------------
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required'),
});

// ---------------- User ----------------
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(72),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  // Accept either a role name ("ADMIN"/"USER") or a numeric roleId
  role: z.enum(['ADMIN', 'USER']).optional(),
  roleId: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

// ---------------- Ingredient ----------------
export const createIngredientSchema = z.object({
  name: z.string().min(1).max(120),
  nameEn: z.string().max(120).optional(),
  unit: z.string().max(30).optional(),
  imageUrl: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const updateIngredientSchema = createIngredientSchema.partial();

// ---------------- Category ----------------
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ---------------- Recipe ----------------
const recipeIngredientInput = z.object({
  ingredientId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().nonnegative().default(0),
  unit: z.string().max(30).optional(),
  optional: z.boolean().optional().default(false),
  note: z.string().max(255).optional(),
});

// When a recipe is submitted as multipart/form-data (because it may carry an
// image file), array fields arrive as JSON strings and booleans as "true"/"false".
// This helper normalizes those before Zod validation so the same schema works for
// both JSON and multipart requests.
const jsonArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, z.array(schema));

const coercedBoolean = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true' || val === '1';
  return val;
}, z.boolean());

export const createRecipeSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  instructions: z.string().min(1),
  imageUrl: z.string().max(500).optional(),
  servings: z.coerce.number().int().positive().default(1),
  cookMinutes: z.coerce.number().int().nonnegative().default(0),
  prepMinutes: z.coerce.number().int().nonnegative().default(0),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('EASY'),
  calories: z.coerce.number().int().nonnegative().optional(),
  isPublished: coercedBoolean.optional().default(true),
  categoryIds: jsonArray(z.coerce.number().int().positive()).optional().default([]),
  ingredients: jsonArray(recipeIngredientInput).optional().default([]),
});

export const updateRecipeSchema = createRecipeSchema.partial();

// ---------------- Review ----------------
export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ---------------- Recommend / Detection ----------------
export const recommendSchema = z.object({
  ingredientIds: z.array(z.coerce.number().int().positive()).min(1, 'Select at least one ingredient'),
  matchMode: z.enum(['any', 'all']).optional().default('any'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});
