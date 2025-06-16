# Goagain's Canada IRCC Tracker

[![GitHub Stars](https://img.shields.io/github/stars/goagain/ircc-tracker?style=social)](https://github.com/goagain/ircc-tracker)
[![Latest Release](https://img.shields.io/github/v/release/goagain/ircc-tracker?style=flat-square)](https://github.com/goagain/ircc-tracker/releases)
[![Live Site](https://img.shields.io/badge/Live%20Site-tracker.goagain.me-2ea44f?style=flat-square)](https://tracker.goagain.me/)

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
- Python 3.13+
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
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017/  # MongoDB connection URL
DATABASE_NAME=ircc_tracker              # Database name

# Flask Configuration
SECRET_KEY=your-secret-key              # Flask secret key for session management
DEBUG=True                              # Debug mode (set to False in production)

# AES Encryption
ENCRYPTION_KEY=your-32-byte-key         # 32-byte key for AES encryption

# Email Configuration
SMTP_SERVER=smtp.gmail.com              # SMTP server address
SMTP_PORT=587                           # SMTP server port
SMTP_USERNAME=your-email@gmail.com      # SMTP username
SMTP_PASSWORD=your-app-password         # SMTP password (use app password for Gmail)
FROM_EMAIL=your-email@gmail.com         # Sender email address

# Scheduled Task Configuration
CHECK_INTERVAL_MINUTES=10               # Interval for checking IRCC status

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret          # Secret key for JWT tokens
JWT_EXPIRATION_HOURS=24                 # JWT token expiration time

# Admin Configuration
ADMIN_EMAIL=admin@example.com           # Admin user email
ADMIN_PASSWORD=secure-password          # Admin user password

# IRCC URLs
IRCC_CITIZEN_CHECK_URL=https://tracker-suivi.apps.cic.gc.ca/en/login
IRCC_IMMIGRANT_CHECK_URL=https://ircc-tracker-suivi.apps.cic.gc.ca/en/login
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

## Docker Deployment

1. Build the Docker image:
```bash
docker build -t ircc-tracker .
```

2. Run the container:
```bash
docker run -d \
  -p 5000:5000 \
  -e MONGODB_URL=mongodb://mongodb:27017/ircc_tracker \
  -e SMTP_SERVER=smtp.gmail.com \
  -e SMTP_PORT=587 \
  -e SMTP_USERNAME=your-email@gmail.com \
  -e SMTP_PASSWORD=your-app-password \
  -e FROM_EMAIL=your-email@gmail.com \
  -e SECRET_KEY=your-secret-key \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=admin-password \
  --name ircc-tracker \
  ircc-tracker
```

Or use Docker Compose:
```yaml
version: '3.8'
services:
  app:
    image: ircc-tracker
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URL=mongodb://mongodb:27017/ircc_tracker
      - SMTP_SERVER=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USERNAME=${SMTP_USERNAME}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - FROM_EMAIL=${FROM_EMAIL}
      - SECRET_KEY=${SECRET_KEY}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

## License

This project is licensed under the MIT License with additional conditions:

1. The GitHub star button and Buy Me a Coffee button must remain intact and functional in all copies of the Software.
2. The name "Goagain" must be preserved in all copies of the Software.

See the [LICENSE](LICENSE) file for full details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

If you find this project helpful, please consider:

- Star this project

- Sponsor via [![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/goagain)

- Sponsor via [![GitHub Sponsor](https://img.shields.io/badge/Sponsor%20on%20GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/goagain) 