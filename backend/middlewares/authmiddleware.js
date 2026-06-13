const User = require('../models/usermodels');
const Certificate = require('../models/certificatemodel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Use a consistent secret with a fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ message: 'Login required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        return next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
}

async function registerUser(req, res) {
    try {
        const { firstname, lastname, email, password, gender, age, contact } = req.body;
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const emailPrefix = String(email || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
        const nameParts = emailPrefix.trim().split(/\s+/).filter(Boolean);
        const fallbackFirstName = nameParts[0] ? nameParts[0][0].toUpperCase() + nameParts[0].slice(1) : 'User';
        const fallbackLastName = nameParts[1] ? nameParts[1][0].toUpperCase() + nameParts[1].slice(1) : 'Account';

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            firstname: firstname || fallbackFirstName,
            lastname: lastname || fallbackLastName,
            email,
            password: hashedPassword,
            gender: gender || 'Not specified',
            age: Number.isFinite(Number(age)) ? Number(age) : 18,
            contact: contact || email
        });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
}

async function logoutUser(req, res) {
    res.json({ message: 'User logged out successfully' });
}

async function saveUploadedFile(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const savedCertificate = await Certificate.create({
            user: req.user?._id || req.body.userId,
            originalName: req.file.originalname,
            fileName: req.file.filename || req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            fileData: req.file.buffer,
            certificateId: req.body.certificateId || '',
            studentName: req.body.studentName || '',
            course: req.body.course || '',
            extractedText: req.body.extractedText || '',
            status: req.body.status || 'Pending'
        });

        return res.status(201).json({
            message: 'Uploaded file saved successfully',
            certificate: savedCertificate
        });
    } catch (error) {
        console.error('Failed to save uploaded file:', error);
        return res.status(500).json({ message: 'Failed to save uploaded file' });
    }

}

module.exports = {
    loginUser,
    registerUser,
    logoutUser,
    saveUploadedFile,
    verifyToken,
};
