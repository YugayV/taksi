CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    telegram_id VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    phone VARCHAR(50),
    car_model VARCHAR(100),
    car_number VARCHAR(50),
    car_color VARCHAR(50),
    is_active BOOLEAN DEFAULT false,
    subscription_expires TIMESTAMP,
    is_trial_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id),
    passenger_name VARCHAR(255),
    passenger_phone VARCHAR(50),
    pickup_lat DECIMAL,
    pickup_lng DECIMAL,
    dropoff_lat DECIMAL,
    dropoff_lng DECIMAL,
    price DECIMAL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
