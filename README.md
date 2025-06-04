# Canada IRCC Tracker

A web application for tracking Canada IRCC (Immigration, Refugees and Citizenship Canada) status updates.

## Features

- 🔐 AES encrypted credential storage
- 📊 MongoDB database storage
- ⏰ Automated checking every 10 minutes
- 📧 Email notifications for status changes
- 🌐 React frontend interface
- 👥 User permission management (Admin/Regular users)
- 🔄 Multi-threaded background worker process

## Technology Stack

### Backend
- Python 3.8+
- Flask (Web framework)
- MongoDB (Database)
- Cryptography (AES encryption)
- APScheduler (Scheduled tasks)
- SMTP (Email sending)

### Frontend
- React 18
- Axios (API requests)
- Bootstrap 5 (UI framework)
- React Router (Routing)

## Project Structure

```
ircc-tracker/
├── backend/
│   ├── app.py              # Main application entry
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── config.py           # Configuration file
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── requirements.txt
└── README.md
```

## Installation and Setup

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
```bash
cp backend/config.py.example backend/config.py
# Edit config.py to configure database and email settings
```

3. Start backend service:
```bash
cd backend
python app.py
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start frontend development server:
```bash
npm start
```

## Configuration

### MongoDB Configuration
- Ensure MongoDB service is running
- Default connection: `mongodb://localhost:27017/ircc_tracker`

### Email Configuration
- Supports SMTP email service
- Configure SMTP server information

### Encryption Configuration
- Automatically generates AES key
- Key is securely stored in configuration file

## Usage

1. **Admin Features**:
   - View all users' tracking data
   - Manage system configuration
   - View system logs

2. **Regular User Features**:
   - Upload IRCC username and password
   - View personal tracking status
   - Receive status update emails

## Security Considerations

- All user credentials are stored with AES-256 encryption
- Passwords are encrypted during transmission
- Regular encryption key updates
- Use HTTPS for production deployment

## License

MIT License 