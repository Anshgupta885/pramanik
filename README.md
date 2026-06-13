# Pramaanik 🛡️

**Pramaanik** (meaning *Authentic* in Sanskrit) is an AI-powered certificate verification platform designed to instantly validate the authenticity of academic and professional documents. By leveraging advanced OCR (Optical Character Recognition) and cross-referencing secure databases, Pramaanik provides a seamless and trusted environment for institutions and individuals.

---

## 🌟 Key Features

- **AI-Powered OCR**: Automatically extracts Certificate IDs and Student Names from images (JPG, PNG) and PDFs using `Tesseract.js` and `Sharp`.
- **Instant Validation**: Cross-references extracted data against a secure mock database in under 10 seconds.
- **Secure Certificate Vault**: Verified certificates are automatically saved to a personalized digital vault for easy access.
- **Robust Authentication**: JWT-based secure login and registration system with Bcrypt password hashing.
- **Modern SPA Architecture**: A smooth, Single Page Application experience built with Vanilla JS.
- **Dark Mode Support**: Fully responsive UI with a built-in theme toggle for comfortable viewing.
- **Real-time Feedback**: Interactive loading steps and toast notifications for a polished user experience.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 & Vanilla CSS3**: Custom styles with advanced CSS variables and animations.
- **Vanilla JavaScript**: Custom SPA routing and event-driven logic.
- **Lucide Icons / SVG**: High-quality vector icons for a modern look.

### Backend
- **Node.js & Express.js**: High-performance server-side environment.
- **MongoDB & Mongoose**: Scalable NoSQL database for user and certificate records.
- **Tesseract.js**: Browser and Node.js-based OCR engine.
- **Sharp**: High-speed image processing for OCR pre-processing (grayscale, sharpening, median blur).
- **JWT**: Secure token-based authentication.

---

## 📁 Project Structure

```text
pramanik/
├── backend/
│   ├── config/             # Database connection setup
│   ├── data/               # Mock certificate datasets (JSON)
│   ├── middlewares/        # Auth and Token verification logic
│   ├── models/             # Mongoose schemas (User, Certificate)
│   ├── routes/             # Express API endpoints
│   ├── ocr.js              # Tesseract.js & Sharp processing logic
│   └── server.js           # Main server entry point
├── frontend/
│   └── public/             # Static assets, HTML, JS, and CSS
├── eng.traineddata         # OCR training data
├── package.json            # Dependencies and scripts
└── .env                    # Configuration (JWT Secret, MongoDB URI)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally OR a MongoDB Atlas URI.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/pramanik.git
   cd pramanik
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pramanik
   JWT_SECRET=your_super_secret_key
   ```

4. **Seed Mock Data (Optional)**
   If you want to populate the database with initial certificates:
   ```bash
   npm run seed:certificates
   ```

5. **Start the Server**
   ```bash
   npm start
   ```
   Open `http://localhost:5000` in your browser.

---

## 💡 How it Works

1. **Upload**: Users upload a certificate image or PDF via the "Verify" page.
2. **Preprocessing**: The backend uses `Sharp` to convert the image to grayscale and sharpen it to improve OCR accuracy.
3. **Extraction**: `Tesseract.js` reads the text and identifies the **Certificate ID** and **Student Name**.
4. **Verification**: The system matches the extracted data against the records in the database.
5. **Result**: A "Verified ✅" or "Suspicious ⚠️" status is returned, and verified documents are stored in the user's **Vault**.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the ISC License. See `package.json` for more information.

---

*Built with ❤️ by the Pramaanik Team*
