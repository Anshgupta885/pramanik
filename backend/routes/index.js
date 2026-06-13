const express = require('express');
const multer = require('multer');
const path = require('path');
const { processCertificate } = require('../ocr');
const {
    loginUser,
    registerUser,
    logoutUser,
    saveUploadedFile,
    verifyToken,
} = require('../middlewares/authmiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/logout', logoutUser);

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/login.html'));
});

router.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/signup.html'));
});

router.get('/verify-page', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/verify.html'));
});

router.get('/wallet', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/wallet.html'));
});

router.get('/auth/me', verifyToken, (req, res) => {
    return res.json({
        userId: req.user._id,
        email: req.user.email,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
    });
});

router.get('/certificates', verifyToken, async (req, res) => {
    try {
        const Certificate = require('../models/certificatemodel');
        const certificates = await Certificate.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select('originalName fileName mimeType size certificateId studentName course extractedText status uploadedAt createdAt');

        return res.json(
            certificates.map((certificate) => ({
                _id: certificate._id,
                originalName: certificate.originalName,
                fileName: certificate.fileName,
                mimeType: certificate.mimeType,
                size: certificate.size,
                certificateId: certificate.certificateId,
                studentName: certificate.studentName,
                course: certificate.course,
                extractedText: certificate.extractedText,
                status: certificate.status,
                uploadedAt: certificate.uploadedAt,
                createdAt: certificate.createdAt,
            }))
        );
    } catch (error) {
        console.error('Failed to fetch certificates:', error);
        return res.status(500).json({ message: 'Failed to fetch certificates' });
    }
});

router.post('/verify', verifyToken, upload.single('certificate'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'Error', message: 'No file uploaded.' });
    }

    try {
        const result = await processCertificate(req.file.buffer);
        await saveUploadedFile(
            {
                ...req,
                body: {
                    ...req.body,
                    certificateId: result.roll_no,
                    studentName: result.student_name,
                    status: result.status,
                },
            },
            {
                status: () => ({ json: () => null }),
                json: () => null,
            }
        );
        return res.json(result);
    } catch (error) {
        console.error('An error occurred:', error);
        return res.status(500).json({
            status: 'Error',
            message: 'Failed to process the document using the OCR engine.',
        });
    }
});

router.get('/', (req, res) => {
    res.sendFile(require('path').join(__dirname, '../../frontend/public/home.html'));
});

module.exports = router;