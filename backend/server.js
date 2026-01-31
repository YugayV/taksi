const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');
const db = require('./db');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;

// Initialize Gemini
// WARNING: In production, use process.env.GOOGLE_API_KEY
// For this demo, we assume the user will provide it or we use a placeholder that will fail if not set.
// User must set GOOGLE_API_KEY in .env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "YOUR_API_KEY_HERE");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

app.use(cors());
app.use(bodyParser.json());

// --- Mock Database (Fallback) ---
// ... existing code ...let drivers = [
    { id: 1, telegram_id: "12345", name: "Aziz", phone: "+998901234567", car: "Chevrolet Cobalt (White)", lat: 41.2995, lng: 69.2401, subscriptionExpires: null },
    { id: 2, telegram_id: "67890", name: "Bekzod", phone: "+998909876543", car: "Chevrolet Gentra (Black)", lat: 41.3000, lng: 69.2450, subscriptionExpires: "2026-12-31T23:59:59Z" },
    { id: 3, telegram_id: "11223", name: "Sherzod", phone: "+998901112233", car: "Chevrolet Spark (Grey)", lat: 41.2950, lng: 69.2350, subscriptionExpires: "2026-12-31T23:59:59Z" }
];

const SUBSCRIPTION_COST = 200000; // UZS

// --- Routes ---

// Auth / Registration via Telegram
app.post('/api/auth/telegram', async (req, res) => {
    const { telegram_id, first_name, username, photo_url } = req.body;

    if (!telegram_id) {
        return res.status(400).json({ error: "Telegram ID required" });
    }

    if (db.isConnected()) {
        try {
            // Check if driver exists
            const checkRes = await db.query('SELECT * FROM drivers WHERE telegram_id = $1', [telegram_id]);
            let driver = checkRes.rows[0];

            if (!driver) {
                // Register new driver with 1 MONTH FREE TRIAL
                const trialExpires = moment().add(1, 'month').toISOString();
                const insertRes = await db.query(
                    'INSERT INTO drivers (telegram_id, name, subscription_expires, is_trial_used, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [telegram_id, first_name || username, trialExpires, true, true]
                );
                driver = insertRes.rows[0];
            }
            
            // Format for frontend
            return res.json({
                ...driver,
                subscriptionExpires: driver.subscription_expires, // Map DB column to frontend expected prop
                isSubscribed: driver.subscription_expires && moment(driver.subscription_expires).isAfter(moment())
            });
        } catch (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ error: "Database error during auth" });
        }
    } else {
        // Fallback to Mock Data
        let driver = drivers.find(d => d.telegram_id === telegram_id);
        if (!driver) {
            const trialExpires = moment().add(1, 'month').toISOString();
            driver = {
                id: drivers.length + 1,
                telegram_id,
                name: first_name || username || `Driver ${drivers.length + 1}`,
                subscriptionExpires: trialExpires,
                is_trial_used: true
            };
            drivers.push(driver);
        }
        
        const isSubscribed = driver.subscriptionExpires && moment(driver.subscriptionExpires).isAfter(moment());
        return res.json({ ...driver, isSubscribed });
    }
});

// 5. Poisk blizhayshikh voditeley
app.post('/api/drivers/nearby', async (req, res) => {
    const { lat, lng } = req.body;
    
    let activeDrivers = [];

    if (db.isConnected()) {
        try {
            // In real DB, use PostGIS. Here fetching all active and filtering in code for simplicity or checking subscription
            const result = await db.query("SELECT * FROM drivers WHERE subscription_expires > NOW()");
            // Map DB columns to frontend structure
            activeDrivers = result.rows.map(d => ({
                ...d,
                subscriptionExpires: d.subscription_expires
            }));
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: "DB Error" });
        }
    } else {
        activeDrivers = drivers.filter(d => 
            d.subscriptionExpires && moment(d.subscriptionExpires).isAfter(moment())
        );
    }

    // V real'nosti zdes' dolzhna byt' geolokatsionnaya logika (Haversine formula)
    // Dlya primera vozvrashchayem vsekh aktivnykh voditeley s randomnym rasstoyaniyem
    
    const driversWithDistance = activeDrivers.map(d => ({
        ...d,
        distanceKm: (Math.random() * 5).toFixed(1), // Mock distance 0-5 km
        eta: Math.floor(Math.random() * 10) + 2 // Mock ETA 2-12 min
    }));

    res.json(driversWithDistance);
});

// 1. Proverka statusa voditelya
app.get('/api/driver/:id', async (req, res) => {
    let driver;
    
    if (db.isConnected()) {
        try {
            const result = await db.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
            if (result.rows.length > 0) {
                const d = result.rows[0];
                driver = { ...d, subscriptionExpires: d.subscription_expires };
            }
        } catch(e) { console.error(e); }
    } else {
        driver = drivers.find(d => d.id == req.params.id);
    }

    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const isSubscribed = driver.subscriptionExpires && moment(driver.subscriptionExpires).isAfter(moment());
    
    res.json({
        ...driver,
        isSubscribed,
        message: isSubscribed ? "Podpiska aktivna" : "Podpiska istekla ili otsutstvuyet"
    });
});

// 2. Pokupka podpiski (200,000 UZS)
app.post('/api/driver/:id/subscribe', async (req, res) => {
    const { paymentMethod } = req.body; // 'telegram_wallet' or 'crypto'
    
    if (!paymentMethod) {
        return res.status(400).json({ error: "Metod oplaty ne ukazan (Payment method required)" });
    }

    const newExpiry = moment().add(1, 'month').toISOString();

    if (db.isConnected()) {
        try {
            await db.query('UPDATE drivers SET subscription_expires = $1 WHERE id = $2', [newExpiry, req.params.id]);
             res.json({
                success: true,
                message: `Podpiska oformlena cherez ${paymentMethod}`,
                expiresAt: newExpiry
            });
        } catch(e) {
            console.error(e);
            res.status(500).json({ error: "DB Error" });
        }
    } else {
        const driver = drivers.find(d => d.id == req.params.id);
        if (!driver) return res.status(404).json({ error: "Driver not found" });

        driver.subscriptionExpires = newExpiry;
        
        res.json({
            success: true,
            message: `Podpiska oformlena cherez ${paymentMethod}`,
            expiresAt: newExpiry
        });
    }
});

// 4. Poluchit' rekvizity dlya oplaty
app.get('/api/payment-info', (req, res) => {
    res.json({
        telegram_wallet: "ton://transfer/UQ...", // Mock TON wallet
        crypto_wallet: "TRC20: T...", // Mock USDT wallet
        amount: SUBSCRIPTION_COST,
        currency: "UZS"
    });
});

// 3. Raschet fiksirovannoy tseny dlya passazhira
app.post('/api/ride/calculate', (req, res) => {
    const { distanceKm, trafficFactor } = req.body;
    
    const BASE_FARE = 5000; // Posadka
    const RATE_PER_KM = 3000; // Sum/km
    
    let price = BASE_FARE + (distanceKm * RATE_PER_KM * (trafficFactor || 1));
    price = Math.ceil(price / 100) * 100; // Okrugleniye

    res.json({
        price: price,
        currency: "UZS",
        details: { distanceKm, rate: RATE_PER_KM }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Subscription cost: ${SUBSCRIPTION_COST} UZS`);
});
