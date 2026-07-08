'use client';

import { useParams } from 'next/navigation';
import { RecipeForm } from '@/components/recipe-form';

export default function EditRecipePage() {
  const params = useParams();
  const id = Number(params.id);
  return <RecipeForm recipeId={id} />;
}
