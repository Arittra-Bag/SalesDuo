# AI-Powered Meeting Minutes Extractor

A Node.js backend service that uses Google's Gemini AI to extract structured information from meeting notes, including summaries, key decisions, and action items.

## Features

- **AI-Powered Extraction**: Uses Gemini AI to intelligently parse meeting notes
- **Modern Web Interface**: Beautiful, responsive frontend for easy interaction
- **Flexible Input**: Accepts both raw text and `.txt` file uploads
- **Structured Output**: Returns clean JSON with summary, decisions, and action items
- **Comprehensive Error Handling**: Handles API timeouts, rate limits, and validation errors
- **Export Options**: Copy results to clipboard or download as JSON

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Gemini API key

### Installation

1. **Clone or download this project**
```bash
git clone https://github.com/Arittra-Bag/SalesDuo.git
cd SalesDuo
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
   - The `.env` file should be configured with a Gemini API key
   - Get your own API key from [Google AI Studio](https://aistudio.google.com/apikey)

4. **Start the server**
```bash
npm start
```

Open `http://localhost:3000` in your browser

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

## Testing the API

### Option 1: Use the Web Interface
Open `http://localhost:3000` and use the web interface

### Option 2: Test with cURL

**Raw Text:**
```bash
curl -X POST http://localhost:3000/process-meeting \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Team Sync – May 26\n\n- We will launch the new product on June 10.\n- Ravi to prepare onboarding docs by June 5.\n- Priya will follow up with logistics team on packaging delay.\n- Beta users requested a mobile-first dashboard."
  }'
```

**File Upload:**
```bash
curl -X POST http://localhost:3000/process-meeting \
  -F "file=@samples/meeting1.txt"
```

### Option 3: Test with PowerShell (Windows)

**Raw Text:**
```powershell
$body = @{
    text = @"
Team Sync – May 26

- We'll launch the new product on June 10.
- Ravi to prepare onboarding docs by June 5.
- Priya will follow up with logistics team on packaging delay.
- Beta users requested a mobile-first dashboard.
"@
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/process-meeting" -Method POST -Body $body -ContentType "application/json"
```

**File Upload:**
```powershell
$form = @{
    file = Get-Item "samples/meeting1.txt"
}

Invoke-RestMethod -Uri "http://localhost:3000/process-meeting" -Method POST -Form $form
```

### Option 4: Test with Postman
1. **Method**: POST
2. **URL**: `http://localhost:3000/process-meeting`
3. **Headers**: `Content-Type: application/json`
4. **Body** (raw JSON):
```json
{
  "text": "Team Sync – May 26\n\n- We'll launch the new product on June 10.\n- Ravi to prepare onboarding docs by June 5.\n- Priya will follow up with logistics team on packaging delay.\n- Beta users requested a mobile-first dashboard."
}
```

**For File Upload in Postman:**
- **Body**: form-data
- **Key**: `file`
- **Type**: File
- **Value**: Select `samples/meeting1.txt` or `samples/meeting2.txt`

## Sample Output

```json
{
  "success": true,
  "data": {
    "summary": "The team decided to launch the new product on June 10. Ravi was assigned to prepare onboarding documentation, and Priya will follow up with the logistics team regarding a packaging delay. Feedback from beta users highlighted a request for a mobile-first dashboard.",
    "decisions": [
      "The new product will launch on June 10."
    ],
    "actionItems": [
      {
        "task": "Prepare onboarding docs",
        "owner": "Ravi",
        "due": "June 5"
      },
      {
        "task": "Follow up with logistics team on packaging delay",
        "owner": "Priya",
        "due": null
      }
    ]
  },
  "metadata": {
    "processedAt": "2025-09-17T22:26:52.871Z",
    "inputLength": 220,
    "inputType": "text"
  }
}
```

## Error Responses

### 400 - Bad Request
```json
{
  "error": "Missing input",
  "message": "Please provide either a .txt file upload or text in the request body"
}
```

### 401 - Authentication Failed
```json
{
  "error": "Authentication failed",
  "message": "Invalid or missing API key"
}
```

### 429 - Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later."
}
```

### 500 - Server Error
```json
{
  "error": "Processing failed",
  "message": "An error occurred while processing the meeting notes"
}
```

## Additional Testing

### Automated Tests
```bash
npm test
```

### Sample Files
- `samples/meeting1.txt` - Simple team sync meeting
- `samples/meeting2.txt` - Detailed project status meeting

### Stress Testing
```bash
k6 run stress-test.py
```

## ENV Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Pre-configured |
| `PORT` | Server port | 3000 |

### Limits
- **File Size**: Max 10MB
- **File Type**: Only `.txt` files
- **Text Length**: Max 50,000 characters

## Project Structure

```
meeting-minutes-extractor/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── test.js               # Automated test suite
├── stress-test.py        # Performance testing
├── README.md             # This documentation
├── frontend/             # Web interface
│   ├── index.html        # Main HTML page
│   ├── styles.css        # Styling and responsive design
│   └── script.js         # Frontend JavaScript
└── samples/              # Sample meeting notes
    ├── meeting1.txt      # Simple meeting example
    └── meeting2.txt      # Complex meeting example
```

## Key Features Demonstrated

- **Full-Stack Development**: Backend API + Frontend Interface (Deployed)
- **AI Integration**: Google Gemini API implementation  
- **Modern UX**: Responsive design with loading states  
- **Production Ready**: Error handling, validation, testing  
- **Performance**: Stress tested for 6-10 second AI processing using Grafana K6
