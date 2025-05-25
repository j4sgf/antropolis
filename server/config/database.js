const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase;
let isDevelopmentMode = false;

// Mock data store for development
const mockData = {
  buildings: [],
  colonies: [
    {
      id: 'mock-id',
      name: 'Test Colony',
      population: 100,
      type: 'builder',
      created_at: new Date().toISOString()
    }
  ],
  resources: [
    {
      id: 1,
      colony_id: 'mock-id',
      resource_type: 'food',
      amount: 1000,
      capacity: 2000
    },
    {
      id: 2,
      colony_id: 'mock-id',
      resource_type: 'wood',
      amount: 500,
      capacity: 1000
    },
    {
      id: 3,
      colony_id: 'mock-id',
      resource_type: 'stone',
      amount: 300,
      capacity: 800
    },
    {
      id: 4,
      colony_id: 'mock-id',
      resource_type: 'minerals',
      amount: 150,
      capacity: 500
    },
    {
      id: 5,
      colony_id: 'mock-id',
      resource_type: 'water',
      amount: 200,
      capacity: 400
    }
  ],
  colony_resources: [
    {
      id: 1,
      colony_id: 'mock-id',
      resource_type: 'food',
      amount: 1000,
      capacity: 2000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      colony_id: 'mock-id',
      resource_type: 'wood',
      amount: 500,
      capacity: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      colony_id: 'mock-id',
      resource_type: 'stone',
      amount: 300,
      capacity: 800,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      colony_id: 'mock-id',
      resource_type: 'minerals',
      amount: 150,
      capacity: 500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      colony_id: 'mock-id',
      resource_type: 'water',
      amount: 200,
      capacity: 400,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
  console.log('⚠️  Supabase configuration missing or using placeholders. Running in development mode.');
  console.log('Required for production: SUPABASE_URL, SUPABASE_ANON_KEY');
  
  // Create a mock Supabase client for development
  isDevelopmentMode = true;
  
  // Mock query builder
  class MockQueryBuilder {
    constructor(table, data = []) {
      this.table = table;
      this.data = [...data];
      this.conditions = [];
      this.selectedFields = '*';
      this.limitValue = null;
      this.orderField = null;
      this.orderAsc = true;
    }

    select(fields = '*') {
      this.selectedFields = fields;
      return this;
    }

    insert(newData) {
      const id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const record = Array.isArray(newData) 
        ? newData.map((item, index) => ({ id: `${id}-${index}`, ...item, created_at: new Date().toISOString() }))
        : { id, ...newData, created_at: new Date().toISOString() };
      
      if (Array.isArray(record)) {
        mockData[this.table].push(...record);
        // Return a new query builder for chaining
        const chainBuilder = new MockQueryBuilder(this.table, record);
        chainBuilder.insertedData = record;
        return chainBuilder;
      } else {
        mockData[this.table].push(record);
        // Return a new query builder for chaining
        const chainBuilder = new MockQueryBuilder(this.table, [record]);
        chainBuilder.insertedData = [record];
        return chainBuilder;
      }
    }

    update(updateData) {
      this.updateData = updateData;
      this.isUpdate = true;
      return this;
    }

    delete() {
      const deletedRecords = mockData[this.table].filter(item => this.matchesConditions(item));
      mockData[this.table] = mockData[this.table].filter(item => !this.matchesConditions(item));
      return { data: deletedRecords, error: null };
    }

    eq(field, value) {
      this.conditions.push({ field, operator: 'eq', value });
      return this;
    }

    neq(field, value) {
      this.conditions.push({ field, operator: 'neq', value });
      return this;
    }

    order(field, options = { ascending: true }) {
      this.orderField = field;
      this.orderAsc = options.ascending;
      return this;
    }

    limit(count) {
      this.limitValue = count;
      return this;
    }

    single() {
      const result = this.executeQuery();
      if (result.data.length === 0) {
        return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
      }
      return { data: result.data[0], error: null };
    }

    matchesConditions(item) {
      if (this.conditions.length === 0) return true;
      
      return this.conditions.every(condition => {
        const { field, operator, value } = condition;
        switch (operator) {
          case 'eq':
            return item[field] === value;
          case 'neq':
            return item[field] !== value;
          default:
            return true;
        }
      });
    }

    executeQuery() {
      // Handle update operations
      if (this.isUpdate && this.updateData) {
        let updatedRecords = [];
        mockData[this.table] = mockData[this.table].map(item => {
          if (this.matchesConditions(item)) {
            const updated = { ...item, updated_at: new Date().toISOString() };
            
            // Handle the updateData which might contain raw SQL expressions
            for (const [key, value] of Object.entries(this.updateData)) {
              if (value && typeof value === 'object' && value.__isRaw) {
                // Handle raw SQL expressions like "amount - 50"
                const expression = value.expression;
                if (expression.includes('amount -')) {
                  const subtractAmount = parseInt(expression.split('amount - ')[1]);
                  updated[key] = Math.max(0, item[key] - subtractAmount);
                } else {
                  updated[key] = value;
                }
              } else {
                updated[key] = value;
              }
            }
            
            updatedRecords.push(updated);
            return updated;
          }
          return item;
        });
        return { data: updatedRecords, error: null };
      }
      
      // If this is from an insert operation, use the inserted data
      if (this.insertedData) {
        let filteredData = this.insertedData.filter(item => this.matchesConditions(item));
        
        // Apply ordering
        if (this.orderField) {
          filteredData.sort((a, b) => {
            const aVal = a[this.orderField];
            const bVal = b[this.orderField];
            if (aVal < bVal) return this.orderAsc ? -1 : 1;
            if (aVal > bVal) return this.orderAsc ? 1 : -1;
            return 0;
          });
        }
        
        // Apply limit
        if (this.limitValue) {
          filteredData = filteredData.slice(0, this.limitValue);
        }
        
        return { data: filteredData, error: null };
      }
      
      // Normal query execution
      let filteredData = mockData[this.table].filter(item => this.matchesConditions(item));
      
      // Apply ordering
      if (this.orderField) {
        filteredData.sort((a, b) => {
          const aVal = a[this.orderField];
          const bVal = b[this.orderField];
          if (aVal < bVal) return this.orderAsc ? -1 : 1;
          if (aVal > bVal) return this.orderAsc ? 1 : -1;
          return 0;
        });
      }
      
      // Apply limit
      if (this.limitValue) {
        filteredData = filteredData.slice(0, this.limitValue);
      }
      
      return { data: filteredData, error: null };
    }

    // Make it awaitable
    then(resolve, reject) {
      try {
        const result = this.executeQuery();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
  }

  supabase = {
    from: (table) => new MockQueryBuilder(table, mockData[table] || []),
    raw: (expression) => ({
      __isRaw: true,
      expression: expression
    })
  };
} else {
  // Create real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Test database connection
async function testConnection() {
  if (isDevelopmentMode) {
    console.log('✅ Running in development mode (mock database)');
    return true;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Database tables not yet created. Run schema.sql to set up the database.');
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

// Helper function to handle database errors
function handleDatabaseError(error, operation = 'database operation') {
  if (isDevelopmentMode) {
    console.log(`Mock database operation: ${operation}`);
    return { success: true, data: { id: 'mock-id' } };
  }

  console.error(`Database error during ${operation}:`, error);
  
  if (error.code === '23505') {
    return { error: 'Duplicate entry. This record already exists.' };
  } else if (error.code === '23503') {
    return { error: 'Invalid reference. Related record not found.' };
  } else if (error.code === '42P01') {
    return { error: 'Database table not found. Please run the database schema setup.' };
  }
  
  return { error: 'Database operation failed. Please try again.' };
}

// Export the client and utilities
module.exports = {
  supabase,
  testConnection,
  handleDatabaseError,
  isDevelopmentMode
}; 