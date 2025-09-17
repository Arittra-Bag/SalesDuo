import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const ai = new GoogleGenAI({});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(join(__dirname, 'frontend')));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed'), false);
    }
  }
});

// AI Service for processing meeting notes
class MeetingNotesProcessor {
  constructor(aiClient) {
    this.ai = aiClient;
  }

  async processMeetingNotes(meetingText) {
    try {
      const prompt = `
You are an AI assistant that extracts structured information from meeting notes.

Analyze the following meeting notes and extract:
1. A 2-3 sentence summary
2. Key decisions made (as an array)
3. Action items with task, owner (if mentioned), and deadline (if mentioned)

Return ONLY a valid JSON object with this exact structure:
{
  "summary": "2-3 sentence summary here",
  "decisions": ["decision 1", "decision 2"],
  "actionItems": [
    {
      "task": "task description",
      "owner": "person name or null if not specified",
      "due": "deadline or null if not specified"
    }
  ]
}

Meeting Notes:
${meetingText}

Important: Return ONLY the JSON object, no additional text or formatting.
      `;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const responseText = response.text;
      
      // Clean up the response to ensure it's valid JSON
      let cleanedResponse = responseText;
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/```$/, '');
      }

      const parsedResponse = JSON.parse(cleanedResponse);
      
      // Validate the response structure
      if (!parsedResponse.summary || !Array.isArray(parsedResponse.decisions) || !Array.isArray(parsedResponse.actionItems)) {
        throw new Error('Invalid response structure from AI');
      }

      return parsedResponse;
    } catch (error) {
      console.error('Error processing meeting notes:', error);
      throw new Error(`Failed to process meeting notes: ${error.message}`);
    }
  }
}

const notesProcessor = new MeetingNotesProcessor(ai);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Meeting Minutes Extractor API',
    version: '1.0.0',
    endpoints: {
      'POST /process-meeting': 'Process meeting notes (text body or file upload)'
    }
  });
});

app.post('/process-meeting', upload.single('file'), async (req, res) => {
  try {
    let meetingText = '';

    // Check if file was uploaded
    if (req.file) {
      meetingText = req.file.buffer.toString('utf-8');
    } else if (req.body.text) {
      meetingText = req.body.text;
    } else {
      return res.status(400).json({
        error: 'Missing input',
        message: 'Please provide either a .txt file upload or text in the request body'
      });
    }

    // Validate input
    if (!meetingText.trim()) {
      return res.status(400).json({
        error: 'Empty input',
        message: 'Meeting notes cannot be empty'
      });
    }

    if (meetingText.length > 50000) {
      return res.status(400).json({
        error: 'Input too large',
        message: 'Meeting notes must be less than 50,000 characters'
      });
    }

    // Process the meeting notes
    const result = await notesProcessor.processMeetingNotes(meetingText);

    res.json({
      success: true,
      data: result,
      metadata: {
        processedAt: new Date().toISOString(),
        inputLength: meetingText.length,
        inputType: req.file ? 'file' : 'text'
      }
    });

  } catch (error) {
    console.error('API Error:', error);

    // Handle specific error types
    if (error.message.includes('API key')) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid or missing API key'
      });
    }

    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

    if (error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Request timeout',
        message: 'The AI service took too long to respond'
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Processing failed',
      message: 'An error occurred while processing the meeting notes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
  }

  if (error.message === 'Only .txt files are allowed') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only .txt files are allowed'
    });
  }

  res.status(500).json({
    error: 'Server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Meeting Minutes Extractor API running on port ${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}`);
});

export default app;
