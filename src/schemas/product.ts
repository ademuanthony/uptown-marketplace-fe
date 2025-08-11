import { z } from 'zod';

// Product condition enum
export const productConditions = ['new', 'used', 'refurbished'] as const;

// Location schema
export const locationSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  country: z.string().min(1, 'Country is required'),
  postal_code: z.string().optional(),
});

// Product creation schema
export const createProductSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  price: z
    .string()
    .min(1, 'Price is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
    .refine(val => parseFloat(val) > 0, 'Price must be greater than 0'),
  currency: z.string().default('USD'),
  category_id: z.string().min(1, 'Category is required'),
  condition: z.enum(productConditions, {
    errorMap: () => ({ message: 'Please select a condition' }),
  }),
  location: locationSchema,
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// Product update schema (similar but all fields optional except ID)
export const updateProductSchema = createProductSchema.partial();

// Type exports
export type LocationFormData = z.infer<typeof locationSchema>;
export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
export type ProductCondition = (typeof productConditions)[number];
