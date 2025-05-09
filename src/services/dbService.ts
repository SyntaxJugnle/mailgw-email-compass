
import mysql from 'mysql2/promise';
import { dbConfig, createTableScripts } from './dbConfig';

export class DbService {
  private static instance: DbService;
  private pool: mysql.Pool;

  private constructor() {
    this.pool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }
    return DbService.instance;
  }

  public async init(): Promise<void> {
    try {
      // Try to create the database if it doesn't exist
      const tempPool = mysql.createPool({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password
      });
      
      await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      await tempPool.end();

      // Create tables
      await this.executeQuery(createTableScripts.users);
      await this.executeQuery(createTableScripts.accounts);
      await this.executeQuery(createTableScripts.emails);
      
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  public async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      const [results] = await this.pool.query(query, params);
      return results;
    } catch (error) {
      console.error("Query execution error:", error);
      throw error;
    }
  }

  // User operations
  public async createUser(username: string, password: string): Promise<number> {
    const [result]: any = await this.executeQuery(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, password]
    );
    return result.insertId;
  }

  public async getUserByUsername(username: string): Promise<any> {
    const results: any = await this.executeQuery(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    return results.length > 0 ? results[0] : null;
  }

  // Account operations
  public async saveAccount(userId: number, mailGwAccountId: string, mailGwAddress: string, mailGwToken: string): Promise<number> {
    const [result]: any = await this.executeQuery(
      `INSERT INTO accounts 
       (user_id, mail_gw_account_id, mail_gw_address, mail_gw_token) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       mail_gw_token = ?, is_active = TRUE`,
      [userId, mailGwAccountId, mailGwAddress, mailGwToken, mailGwToken]
    );
    return result.insertId || result.affectedRows;
  }

  public async getAccountsByUserId(userId: number): Promise<any[]> {
    return await this.executeQuery(
      "SELECT * FROM accounts WHERE user_id = ? AND is_active = TRUE",
      [userId]
    );
  }

  // Email operations
  public async saveEmail(accountId: number, mailGwEmailId: string, fromName: string, 
                        fromAddress: string, subject: string, intro: string, 
                        content: string, hasAttachments: boolean, receivedAt: Date): Promise<number> {
    const [result]: any = await this.executeQuery(
      `INSERT INTO emails 
       (account_id, mail_gw_email_id, from_name, from_address, subject, intro, content, has_attachments, received_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       from_name = ?, from_address = ?, subject = ?, intro = ?, content = ?, has_attachments = ?`,
      [accountId, mailGwEmailId, fromName, fromAddress, subject, intro, content, hasAttachments, receivedAt,
       fromName, fromAddress, subject, intro, content, hasAttachments]
    );
    return result.insertId || result.affectedRows;
  }

  public async getEmailsByAccountId(accountId: number): Promise<any[]> {
    return await this.executeQuery(
      "SELECT * FROM emails WHERE account_id = ? ORDER BY received_at DESC",
      [accountId]
    );
  }

  public async markEmailAsRead(emailId: number): Promise<void> {
    await this.executeQuery(
      "UPDATE emails SET is_read = TRUE WHERE id = ?",
      [emailId]
    );
  }

  public async deleteEmail(emailId: number): Promise<void> {
    await this.executeQuery(
      "DELETE FROM emails WHERE id = ?",
      [emailId]
    );
  }
}

export const dbService = DbService.getInstance();
