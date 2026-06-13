const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Certificate = require('../models/certificatemodel');

async function seedCertificates() {
    const dataFile = path.join(__dirname, '..', 'data', 'mock-certificates.json');
    const raw = fs.readFileSync(dataFile, 'utf8');
    const mockCertificates = JSON.parse(raw);

    const documents = mockCertificates.map((certificate) => ({
        originalName: certificate.originalName,
        fileName: certificate.fileName,
        mimeType: certificate.mimeType,
        size: certificate.size,
        fileData: Buffer.from(certificate.certificateId, 'utf8'),
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        course: certificate.course,
        extractedText: `${certificate.certificateId} ${certificate.studentName} ${certificate.course}`,
        status: certificate.status,
    }));

    await connectDB();

    try {
        await Certificate.deleteMany({ certificateId: { $in: documents.map((doc) => doc.certificateId) } });
        await Certificate.insertMany(documents);
        console.log(`Seeded ${documents.length} mock certificates.`);
    } catch (error) {
        console.error('Failed to seed certificates:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
}

seedCertificates();