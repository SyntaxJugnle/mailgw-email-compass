
// Database configuration
export const dbConfig = {
  host: "localhost",
  user: "root", // Change to your MySQL username
  password: "", // Change to your MySQL password
  database: "mail_compass", // The name of your database
  port: 3306 // Default MySQL port
};

// SQL scripts to create the necessary tables
export const createTableScripts = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `,
  
  accounts: `
    CREATE TABLE IF NOT EXISTS accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      mail_gw_account_id VARCHAR(255) NOT NULL,
      mail_gw_address VARCHAR(255) NOT NULL,
      mail_gw_token TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE (user_id, mail_gw_address)
    );
  `,
  
  emails: `
    CREATE TABLE IF NOT EXISTS emails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      account_id INT NOT NULL,
      mail_gw_email_id VARCHAR(255) NOT NULL,
      from_name VARCHAR(255),
      from_address VARCHAR(255) NOT NULL,
      subject TEXT,
      intro TEXT,
      content TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      has_attachments BOOLEAN DEFAULT FALSE,
      received_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      UNIQUE (account_id, mail_gw_email_id)
    );
  `
};

// You can use this sample data to initialize your database
export const sampleData = {
  users: [
    { username: "admin", password: "Kacper11!" }, // Using the existing admin password
    { username: "user1", password: "password1" },
    { username: "user2", password: "password2" }
  ]
};
