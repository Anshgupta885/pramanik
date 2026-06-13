const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        originalName: {
            type: String,
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
        },
        fileData: {
            type: Buffer,
            required: true,
        },
        certificateId: {
            type: String,
            index: true,
        },
        studentName: {
            type: String,
            default: '',
        },
        course: {
            type: String,
            default: '',
        },
        extractedText: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['Pending', 'Verified', 'Suspicious', 'Error'],
            default: 'Pending',
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;