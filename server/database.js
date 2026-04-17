import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, 'sandclock.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    balance REAL DEFAULT 0,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    min_investment REAL NOT NULL,
    max_investment REAL,
    roi_percentage REAL NOT NULL,
    duration_days INTEGER NOT NULL,
    clauses TEXT,
    gradient TEXT DEFAULT 'from-cyan-400 via-teal-300 to-blue-500',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    expected_return REAL NOT NULL,
    status TEXT DEFAULT 'active',
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (package_id) REFERENCES packages(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Add status column if it doesn't exist (for existing databases)
try {
  db.exec(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`);
} catch (e) {
  // Column already exists
}

// Create default admin if not exists
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@sandclock.com');
if (!adminExists) {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = bcrypt.default.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (email, password, name, role, balance, status) VALUES (?, ?, ?, ?, ?, ?)').run(
    'admin@sandclock.com',
    hashedPassword,
    'Admin',
    'admin',
    0,
    'active'
  );
  console.log('Default admin created: admin@sandclock.com / admin123');
}

// Create or update default packages
const defaultPackages = [
  {
    name: 'ETH Real Yield',
    description: 'Capital-efficient ETH strategy to amplify staking yield via recursive leveraged staking.',
    min_investment: 600,
    max_investment: 10000,
    roi_percentage: 12,
    duration_days: 30,
    clauses: 'Minimum lock period: 30 days. Early withdrawal fee: 5%. Returns paid at maturity.',
    gradient: 'from-cyan-400 via-teal-300 to-blue-500'
  },
  {
    name: 'USDC Stable Yield',
    description: "Multi-pronged strategy utilizing Aave and Ethereum's Proof-of-Stake yield to generate a return on USDC deposits.",
    min_investment: 750,
    max_investment: 50000,
    roi_percentage: 8,
    duration_days: 14,
    clauses: 'Stable returns with minimal risk. Flexible withdrawal after 14 days.',
    gradient: 'from-yellow-200 via-green-200 to-yellow-300'
  },
  {
    name: 'High Yield DeFi',
    description: 'Aggressive yield farming strategy across multiple DeFi protocols for maximum returns.',
    min_investment: 900,
    max_investment: 100000,
    roi_percentage: 25,
    duration_days: 90,
    clauses: 'Higher risk, higher reward. 90-day lock period. No early withdrawals.',
    gradient: 'from-purple-400 via-pink-500 to-red-500'
  }
];

const insertPackage = db.prepare(`
  INSERT INTO packages (name, description, min_investment, max_investment, roi_percentage, duration_days, clauses, gradient)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const updatePackage = db.prepare(`
  UPDATE packages 
  SET description = ?, min_investment = ?, max_investment = ?, roi_percentage = ?, 
      duration_days = ?, clauses = ?, gradient = ?
  WHERE name = ?
`);

for (const pkg of defaultPackages) {
  const existing = db.prepare('SELECT id FROM packages WHERE name = ?').get(pkg.name);
  if (existing) {
    // Update existing package
    updatePackage.run(
      pkg.description,
      pkg.min_investment,
      pkg.max_investment,
      pkg.roi_percentage,
      pkg.duration_days,
      pkg.clauses,
      pkg.gradient,
      pkg.name
    );
    console.log(`Updated package: ${pkg.name}`);
  } else {
    // Create new package
    insertPackage.run(
      pkg.name,
      pkg.description,
      pkg.min_investment,
      pkg.max_investment,
      pkg.roi_percentage,
      pkg.duration_days,
      pkg.clauses,
      pkg.gradient
    );
    console.log(`Created package: ${pkg.name}`);
  }
}

export default db;
