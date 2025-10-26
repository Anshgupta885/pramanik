// 1. Import necessary libraries
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createWorker } = require('tesseract.js');

const sharp = require('sharp');

// 2. Initialize Express App and Middleware
const app = express();
app.use(cors());
app.use(express.static('public'));

// Configure Multer to handle file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// --- MOCK DATABASE ---
const mock_db = {
    "CERT_2024_001": { student_name: "Rahul Sharma", course: "Bachelor of Technology" },
    "CERT_2024_002": { student_name: "Priya Patel", course: "Data Science Professional" },
    "CERT_2024_003": { student_name: "Amit Singh", course: "Master of Business Administration" },
    "CERT_2024_004": { student_name: "Sneha Reddy", course: "Bachelor of Arts" },
    "CERT_2024_005": { student_name: "Vikram Kumar", course: "Certified Blockchain Developer" }
};
// --------------------

// NEW, CORRECTED FUNCTION
function verifyCredentials(extractedText) {
    // Looks for "CERT_" followed by numbers and underscores, case-insensitive
    const idMatch = extractedText.match(/CERT_\d{4}_\d{3}/i);

    if (!idMatch) {
        return {
            status: "Suspicious ⚠️",
            message: "Could not find a valid Certificate ID in the document.",
            student_name: "N/A",
            roll_no: "N/A"
        };
    }

    const certificateId = idMatch[0].toUpperCase(); // Ensure it's uppercase to match DB

    if (mock_db[certificateId]) {
        const dbRecord = mock_db[certificateId];
        const studentNameFromDb = dbRecord.student_name;

        if (extractedText.toLowerCase().includes(studentNameFromDb.toLowerCase())) {
            return {
                status: "Verified ✅",
                message: "The certificate ID and student name match our records.",
                student_name: studentNameFromDb,
                roll_no: certificateId
            };
        } else {
            return {
                status: "Suspicious ⚠️",
                message: "Certificate ID found, but the name does not match our records.",
                student_name: "Mismatch",
                roll_no: certificateId
            };
        }
    } else {
        return {
            status: "Suspicious ⚠️",
            message: "This Certificate ID does not exist in our database.",
            student_name: "N/A",
            roll_no: certificateId
        };
    }
}

// ----- THE LEFTOVER CODE FROM THE OLD FUNCTION HAS BEEN DELETED FROM HERE -----

// 3. Define the API Endpoint for Verification
let worker; // Define worker variable in a broader scope

(async () => {
  worker = await createWorker('eng'); // Create a single worker instance
})();

app.post('/verify', upload.single('certificate'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: "Error", message: "No file uploaded." });
    }

    try {
        console.log('Processing file:', req.file.originalname);

        const processedImageBuffer = await sharp(req.file.buffer)
            .grayscale()
            .median(3) // Kernel size for median filter
            .sharpen()
            .toBuffer();

        const ret = await worker.recognize(processedImageBuffer);
        const extractedText = ret.data.text;
        
        console.log('Extracted Text:', extractedText);

        if (!extractedText) {
            return res.status(400).json({
                status: "Error",
                message: "OCR could not extract any text from the document."
            });
        }
        
        const verificationResult = verifyCredentials(extractedText);
        return res.json(verificationResult);

    } catch (error) {
        console.error("An error occurred:", error);
        return res.status(500).json({ status: "Error", message: "Failed to process the document." });
    }
});

// 4. Start the Server
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});