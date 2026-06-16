import { z } from 'zod';

export const xfoodiCatalogDefinitions = {
  /**
   * Component: RestaurantMenuTable
   * Displays an interactive table of dishes with details and ordering options.
   */
  RestaurantMenuTable: {
    description: 'Displays a structured table listing dishes with name, price, category, vegetarian/spicy status, and descriptions.',
    props: z.object({
      title: z.string().describe('The title of the menu table (e.g. Vegetarian Dishes, Today Highlights)'),
      dishes: z.array(
        z.object({
          name: z.string().describe('Name of the dish'),
          price: z.string().describe('Price formatted in VND (e.g. 89.000đ)'),
          category: z.string().describe('Dish category'),
          isVegetarian: z.boolean().default(false).describe('Is the dish vegetarian?'),
          isSpicy: z.boolean().default(false).describe('Is the dish spicy?'),
          description: z.string().optional().describe('Description of the dish'),
        })
      ),
    }),
  },

  /**
   * Component: ReservationPreviewCard
   * Shows details of a reservation request for user confirmation.
   */
  ReservationPreviewCard: {
    description: 'Shows a summary of a reservation detail card for booking confirmation.',
    props: z.object({
      tableName: z.string().describe('Name/Code of the reserved table'),
      capacity: z.number().describe('Table seating capacity'),
      timeSlot: z.string().describe('Reserved date and time slot (e.g. 2026-06-15 19:00)'),
      depositAmount: z.string().describe('Required deposit amount formatted in VND'),
    }),
  },
};

export type XFoodiCatalog = typeof xfoodiCatalogDefinitions;
