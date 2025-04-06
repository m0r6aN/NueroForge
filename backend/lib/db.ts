import { MongoClient, Collection, Db } from 'mongodb';

/**
 * Database service for NeuroForge
 * Uses MongoDB with Azure Cosmos DB (MongoDB API) for scalability
 */
class DatabaseService {
  private client: MongoClient | null = null;
  private database: Db | null = null;
  private static instance: DatabaseService;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Gets the singleton instance of the DatabaseService
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initializes the database connection
   */
  public async connect(): Promise<void> {
    if (this.client) return;

    try {
      // Get connection string from environment variables
      const connectionString = process.env.MONGODB_URI;
      
      if (!connectionString) {
        throw new Error('Database connection string not found in environment variables');
      }

      // Create a new MongoClient
      this.client = new MongoClient(connectionString);
      
      // Connect to the MongoDB server
      await this.client.connect();
      
      // Get reference to the database
      this.database = this.client.db(process.env.MONGODB_DB_NAME || 'neuroforge');
      
      console.log('Connected to MongoDB database');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Gets a collection from the database
   * 
   * @param name Name of the collection
   * @returns The MongoDB collection
   */
  public collection(name: string): Collection {
    if (!this.database) {
      throw new Error('Database not connected. Call connect() first.');
    }
    
    return this.database.collection(name);
  }

  /**
   * Closes the database connection
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.database = null;
      console.log('Disconnected from MongoDB database');
    }
  }
}

// Export the singleton instance
export const db = DatabaseService.getInstance();