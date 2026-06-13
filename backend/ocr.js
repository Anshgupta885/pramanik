const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const CERTIFICATE_ID_PATTERN = /CERT_\d{4}_\d{3}/i;

async function loadMockDb() {
    try {
        const dataPath = path.join(__dirname, 'data', 'mock-certificates.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        const records = JSON.parse(data);
        const db = {};
        records.forEach(record => {
            if (record.certificateId) {
                db[record.certificateId.toUpperCase()] = {
                    studentName: record.studentName,
                    course: record.course
                };
            }
        });
        return db;
    } catch (error) {
        console.warn('Could not load mock DB, using defaults:', error.message);
        return {
            "CERT_2024_001": { studentName: "Rahul Sharma", course: "Bachelor of Technology" },
            "CERT_2024_002": { studentName: "Priya Patel", course: "Data Science Professional" },
            "CERT_2024_003": { studentName: "Amit Singh", course: "Master of Business Administration" },
            "CERT_2024_004": { studentName: "Sneha Reddy", course: "Bachelor of Arts" },
            "CERT_2024_005": { studentName: "Vikram Kumar", course: "Certified Blockchain Developer" },
        };
    }
}

async function processCertificate(imageBuffer) {
    try {
        // 1. Pre-process image with sharp
        const processedImageBuffer = await sharp(imageBuffer)
            .grayscale()
            .median(3)
            .sharpen()
            .toBuffer();

        // 2. Run OCR with tesseract.js
        const { data: { text } } = await Tesseract.recognize(processedImageBuffer, 'eng');
        const extractedText = text.trim();

        if (!extractedText) {
            return {
                status: 'Error',
                message: 'OCR could not extract any text from the document.',
                student_name: 'N/A',
                roll_no: 'N/A'
            };
        }

        // 3. Verify credentials
        const idMatch = extractedText.match(CERTIFICATE_ID_PATTERN);
        if (!idMatch) {
            return {
                status: 'Suspicious ⚠️',
                message: 'Could not find a valid Certificate ID in the document.',
                student_name: 'N/A',
                roll_no: 'N/A'
            };
        }

        const certificateId = idMatch[0].toUpperCase();
        const MOCK_DB = await loadMockDb();
        const dbRecord = MOCK_DB[certificateId];

        if (!dbRecord) {
            return {
                status: 'Suspicious ⚠️',
                message: 'This Certificate ID does not exist in our database.',
                student_name: 'N/A',
                roll_no: certificateId
            };
        }

        const studentName = dbRecord.studentName;
        if (extractedText.toLowerCase().includes(studentName.toLowerCase())) {
            return {
                status: 'Verified ✅',
                message: 'The certificate ID and student name match our records.',
                student_name: studentName,
                roll_no: certificateId
            };
        }

        return {
            status: 'Suspicious ⚠️',
            message: 'Certificate ID found, but the name does not match our records.',
            student_name: 'Mismatch',
            roll_no: certificateId
        };

    } catch (error) {
        console.error('OCR Processing Error:', error);
        throw error;
    }
}

module.exports = { processCertificate };
