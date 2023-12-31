CREATE TABLE IF NOT EXISTS Admin (
  id BIGSERIAL PRIMARY KEY, 
  name text,
  email text,
  password text,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signals (
    signal_id SERIAL PRIMARY KEY,
    title VARCHAR(255) UNIQUE,
    price DECIMAL NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    signal_status VARCHAR(10) CHECK (signal_status IN ('ACTIVE', 'INACTIVE', 'EXPIRED')) NOT NULL,
    action VARCHAR(5) CHECK (action IN ('BUY', 'SELL')) NOT NULL,
    stop_loss DECIMAL,
    -- profit_loss VARCHAR(255) NOT NULL,
    -- trade_result VARCHAR(255) NOT NULL,
    image VARCHAR(255),
    result  BOOLEAN DEFAULT false,
    profit_loss VARCHAR(10) ,
    trade_probability DECIMAL,
    time_frame DECIMAL,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
);

-- CREATE TABLE IF NOT EXISTS signalresult (
--     id SERIAL PRIMARY KEY,
--     signal_id INT NOT NULL,
--     image VARCHAR(255),
--     result VARCHAR(255) ,
--     profit_loss VARCHAR(10)  NOT NULL,
--     FOREIGN KEY (signal_id) REFERENCES signals(signal_id)
-- );

CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    signal_id INTEGER NOT NULL, 
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS take_profit (
    take_profit_id SERIAL PRIMARY KEY,
    signal_id INTEGER NOT NULL, 
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
  token VARCHAR(255),
  signup_type VARCHAR(255), 
  image VARCHAR(255),
  device_id VARCHAR(255),
  verificationCode VARCHAR(255),
  block_status BOOLEAN DEFAULT false, 
  deleted_status BOOLEAN DEFAULT false, 
  deleted_at TIMESTAMP, 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW(),
  vip_status BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS Deletedusers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  password VARCHAR(255),
  confirm_password VARCHAR(255),
  signup_type VARCHAR(255), 
  image VARCHAR(255), 
  last_login timestamp,
  deleted_at timestamp,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Applink (
  id SERIAL PRIMARY KEY,
  link VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS ratelink (
  id SERIAL PRIMARY KEY,
  link VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);  

CREATE TABLE IF NOT EXISTS chatlink (
  id SERIAL PRIMARY KEY,
  link VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);  

CREATE TABLE IF NOT EXISTS notification_info (
    notification_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    signal_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    admin_id VARCHAR(100),
    sender_type VARCHAR(50), -- 'user' or 'admin'
    message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
