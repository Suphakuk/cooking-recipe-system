export interface Role {
  id: number;
  name: 'ADMIN' | 'USER';
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  role: Role;
}

export interface Ingredient {
  id: number;
  name: string;
  nameEn?: string | null;
  unit?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { recipes: number };
}

export interface RecipeIngredient {
  id: number;
  quantity: number;
  unit?: string | null;
  optional: boolean;
  note?: string | null;
  ingredient: Ingredient;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export interface Recipe {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  instructions: string;
  imageUrl?: string | null;
  servings: number;
  cookMinutes: number;
  prepMinutes: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  calories?: number | null;
  isPublished: boolean;
  views: number;
  createdAt: string;
  author?: Pick<User, 'id' | 'name' | 'avatarUrl'> | null;
  categories: { category: Category }[];
  ingredients: RecipeIngredient[];
  reviews?: Review[];
  _count?: { favorites: number; reviews: number };
}

export interface RecommendResult {
  recipe: Recipe;
  matchedCount: number;
  requiredCount: number;
  coverage: number;
  missingIngredients: { id: number; name: string }[];
  score: number;
}

export interface DetectionResult {
  detectionId: number;
  imageUrl: string;
  modelName: string;
  processMs: number;
  matchedIngredients: {
    id: number;
    name: string;
    nameEn?: string | null;
    confidence: number;
  }[];
  unmatchedLabels: { label: string; confidence: number }[];
}

export interface DashboardStats {
  totals: {
    users: number;
    recipes: number;
    ingredients: number;
    detections: number;
    reviews: number;
    favorites: number;
  };
  recipesByDifficulty: { difficulty: string; count: number }[];
  recipesByCategory: { category: string; count: number }[];
  topRecipes: { id: number; title: string; views: number; slug: string }[];
  usersPerDay: { date: string; count: number }[];
}

export interface Paginated<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
