CREATE TABLE IF NOT EXISTS Admin (
   id SERIAL PRIMARY KEY,
  name text,
  email text,
  password text,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signals (
    signal_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    price DECIMAL NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    signal_status VARCHAR(10) CHECK (signal_status IN ('ACTIVE', 'INACTIVE', 'EXPIRED')) NOT NULL,
    action VARCHAR(5) CHECK (action IN ('BUY', 'SELL')) NOT NULL,
    stop_loss DECIMAL,
    trade_result DECIMAL,
    trade_probability DECIMAL,
    created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS take_profit (
    take_profit_id SERIAL PRIMARY KEY,
    signal_id DECIMAL NOT NULL,
    open_price DECIMAL NOT NULL,
    take_profit DECIMAL NOT NULL,
    created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broker (
  broker_id SERIAL PRIMARY KEY,
  image VARCHAR(255) NOT NULL, 
  name VARCHAR(255) NOT NULL, 
  email VARCHAR(255) NOT NULL, 
  profit DECIMAL,
  loss DECIMAL,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  password VARCHAR(255),
  confirm_password VARCHAR(255),
  signup_type VARCHAR(255), 
  image VARCHAR(255),
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);