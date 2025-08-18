/**
 * Category seed data for database initialization
 * Categories define the main product groupings in the system
 */

const productionCategories = [
  {
    name: 'Fruits',
    slug: 'fruits',
    description: 'Fresh seasonal fruits rich in vitamins and minerals',
    image: '/src/assets/images/fresh-fruits.jpg',
    isActive: true
  },
  {
    name: 'Vegetables',
    slug: 'vegetables',
    description: 'Organic vegetables for healthy living',
    image: '/src/assets/images/fresh-v.png',
    isActive: true
  },
  {
    name: 'Leafy Greens',
    slug: 'leafy-greens',
    description: 'Fresh leafy vegetables packed with nutrients',
    image: '/src/assets/images/organic.jpg',
    isActive: true
  }
];

module.exports = {
  productionCategories
};
