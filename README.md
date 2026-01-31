# 🚕 Taxi Uzbekistan App

Loyihaning to'liq deploys va o'rnatish bo'yicha qo'llanma.
(Full deployment and implementation guide).

## 📋 Loyiha Haqida (About)
Ushbu loyiha O'zbekiston uchun taksi ilovasi bo'lib, quyidagi imkoniyatlarga ega:
- **Haydovchilar uchun**: Oylik obuna tizimi (200,000 so'm/oy), komissiya 0%. Birinchi oy bepul (Trial).
- **Yo'lovchilar uchun**: Xarita orqali taksi chaqirish, AI operator (ovozli yordamchi).
- **Integratsiyalar**: Telegram Login, Gemini AI, Google Maps (React Native Maps).

## 🛠 Texnologiyalar (Tech Stack)
- **Mobile**: React Native (Expo SDK 49), Expo Speech, React Native Maps.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL.
- **AI**: Google Gemini Pro (Generative AI).
- **Deployment**: Railway (Backend & DB), EAS Build (Mobile).

---

## 🚀 1. Backendni Sozlash (Backend Setup)

Backend Railway yoki VPS serverda ishlashi mumkin. Biz **Railway** ni tavsiya qilamiz.

### Talablar:
- Node.js v18+
- PostgreSQL database

### O'rnatish (Installation):
1. **Repository** ni yuklab oling.
2. `backend` papkasiga kiring:
   ```bash
   cd backend
   npm install
   ```
3. `.env` faylini yarating (namuna `.env.example` da):
   ```env
   PORT=3000
   DATABASE_URL=postgresql://user:password@host:port/database
   GEMINI_API_KEY=sizning_google_gemini_kalitingiz
   TELEGRAM_BOT_TOKEN=sizning_telegram_bot_tokeningiz
   ```

### Ma'lumotlar bazasini yaratish (Database Schema):
PostgreSQL bazasiga ulanganda `schema.sql` faylidagi kodni ishga tushiring:
```sql
-- Drivers table
CREATE TABLE drivers (...);
-- Orders table
CREATE TABLE orders (...);
```
*(Fayl: `backend/schema.sql`)*

### Railway-ga Deploy qilish:
1. [Railway.app](https://railway.app/) saytiga kiring.
2. "New Project" -> "Deploy from GitHub repo".
3. `taksi` reposini tanlang.
4. **Variables** bo'limida quyidagilarni qo'shing:
   - `GEMINI_API_KEY`
   - `DATABASE_URL` (Railway o'zi PostgreSQL qo'shganda avtomatik beradi).
5. **PostgreSQL** qo'shish: "New" -> "Database" -> "PostgreSQL".
1
---

## 📱 2. Mobil Ilovani Sozlash (Mobile Setup)

Ilova Android uchun mo'ljallangan.

### O'rnatish:
1. `mobile` papkasiga kiring:
   ```bash
   cd mobile
   npm install
   ```

### API Manzilini o'zgartirish:
`mobile/App.js` faylini oching va `API_URL` ni o'zgartiring:
```javascript
// Agar lokal (emulator) bo'lsa:
const API_URL = 'http://10.0.2.2:3000/api'; 

// Agar Railway-ga deploy qilingan bo'lsa:
// const API_URL = 'https://sizning-railway-url.app/api';
```

### Android APK yaratish (Build):
APK fayl yaratish uchun **EAS Build** ishlatiladi.
1. `eas-cli` o'rnatilganligiga ishonch hosil qiling: `npm install -g eas-cli`.
2. Expo hisobiga kiring: `eas login`.
3. Buildni boshlash:
   ```bash
   npm run build:android
   ```
   Yoki:
   ```bash
   npx eas-cli build -p android --profile preview
   ```
4. Jarayon tugagach, yuklab olish havolasi beriladi.

---

## 🤖 3. AI va Telegram Integratsiyasi

### Gemini AI (Operator):
1. [Google AI Studio](https://makersuite.google.com/) dan API Key oling.
2. Backend `.env` fayliga `GEMINI_API_KEY` sifatida qo'shing.

### Telegram Login:
1. Telegramda `@BotFather` orqali yangi bot yarating.
2. Bot tokenini oling.
3. Backendda tekshirish uchun ishlatiladi (hozirgi versiyada soddalashtirilgan `telegram_id` tekshiruvi mavjud).

---

## 🏃‍♂️ 4. Lokal Ishga Tushirish (Running Locally)

Server va Ilovani kompyuterda sinash uchun:

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```
*Server http://localhost:3000 da ishlaydi.*

**Terminal 2 (Mobile):**
```bash
cd mobile
npx expo start --android
```
*Android Emulator ochiladi.*

---

## 📂 Fayllar Tuzilishi (Structure)
- `backend/server.js` - Asosiy server logikasi (Auth, Driver, AI).
- `backend/db.js` - PostgreSQL ulanishi.
- `mobile/App.js` - Asosiy mobil ilova kodi (UI, Map, Logic).
- `mobile/assets/` - Rasmlar va ikonkalar.

---

## ❓ Muammolar va Yechimlar (Troubleshooting)
- **Xatolik**: `Connection refused` (Mobile).
  - **Yechim**: `API_URL` to'g'ri ekanligini tekshiring. Emulatorda `10.0.2.2`, real qurilmada kompyuter IP manzili (masalan `192.168.1.15`) kerak.
- **Xatolik**: `Build failed` (Gradle).
  - **Yechim**: `android` papkasini o'chirib, `npx expo prebuild -p android --clean` qiling.

---
**Developed by Trae AI & User**
