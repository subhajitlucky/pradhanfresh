const prisma = require('../../../prisma/client');

/**
 * Generate unique order number
 * Format: PF-YYYY-XXXXXX (e.g., PF-2024-000001)
 * @returns {Promise<string>} Generated order number
 */
const generateOrderNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `PF-${currentYear}-`;
  
  // Get the latest order number for current year
  const latestOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      orderNumber: 'desc'
    }
  });

  let nextNumber = 1;
  if (latestOrder) {
    // Extract number from order number (e.g., "PF-2024-000123" -> 123)
    const lastNumber = parseInt(latestOrder.orderNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  // Format with leading zeros (6 digits)
  const formattedNumber = nextNumber.toString().padStart(6, '0');
  return `${prefix}${formattedNumber}`;
};

module.exports = {
  generateOrderNumber
};

/*
=== ORDER NUMBER GENERATION MODULE ===

This module handles the generation of unique order numbers for the e-commerce system.

KEY FEATURES:
1. **Unique Number Generation**: Creates sequential order numbers for each year
2. **Year-based Prefixing**: Uses format PF-YYYY-XXXXXX (e.g., PF-2024-000001)
3. **Auto-increment Logic**: Automatically finds the next available number
4. **Zero-padding**: Ensures consistent 6-digit formatting for order numbers

HOW IT WORKS:
- The generateOrderNumber() function queries the database for the latest order number of the current year
- It extracts the numeric part, increments it, and formats it with leading zeros
- This ensures each year starts fresh from 000001 and provides easy identification by year

USAGE EXAMPLE:
```javascript
const { generateOrderNumber } = require('./orderNumber');
const orderNumber = await generateOrderNumber(); // Returns: "PF-2024-000123"
```

DATABASE INTERACTION:
- Queries the 'order' table to find the highest order number for current year
- Uses Prisma ORM for database operations
- Sorts in descending order to get the latest order number efficiently

ERROR HANDLING:
- If no orders exist for the current year, starts from 000001
- Handles parseInt safely for numeric extraction
- Database errors will bubble up to calling function

SCALABILITY CONSIDERATIONS:
- This approach works well for moderate transaction volumes
- For high-volume systems, consider using database sequences or atomic counters
- The year-based reset helps manage number growth over time
*/
