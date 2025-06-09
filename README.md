# DeepHeart

A comprehensive heart monitoring application with AI-powered ECG analysis and prediction capabilities.

## Overview

DeepHeart is an end-to-end cardiac health monitoring system that combines modern web technologies with machine learning to provide intelligent ECG analysis. The system allows healthcare professionals to upload ECG data, analyze patterns using deep learning models, and manage patient information through an intuitive web interface.

## Architecture

```
deepheart/
├── frontend/          # Angular web application
├── backend/           # Spring Boot REST API
├── ai_models/         # Machine learning models for ECG analysis
├── db/               # Database files
└── uploads/          # Uploaded ECG files storage
```

## Features

### Frontend (Angular)

- 🔐 **Authentication System** - Secure login and signup functionality
- 📊 **Dashboard** - Real-time overview of patient data and analytics
- 👥 **Patient Management** - Add, edit, and view patient information
- 📈 **Analytics** - Comprehensive ECG data visualization
- 📁 **File Upload** - Easy ECG file upload with validation
- 🎨 **Modern UI** - Responsive design with intuitive user experience

### Backend (Spring Boot)

- 🚀 **RESTful API** - Complete REST endpoints for all operations
- 🔒 **Security Configuration** - JWT-based authentication and authorization
- 👤 **User Management** - User registration, authentication, and profile management
- 📋 **ECG Record Management** - Store and retrieve ECG data
- 🤖 **AI Integration** - Seamless integration with machine learning models
- 🗄️ **Database Integration** - Efficient data persistence and retrieval

### AI Models

- 🧠 **Deep Learning** - Advanced neural networks for ECG analysis
- 🔍 **Pattern Recognition** - Automated detection of cardiac abnormalities
- 📊 **Prediction Engine** - Risk assessment and health predictions
- 🎯 **High Accuracy** - Trained on extensive cardiac datasets

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Java** (JDK 17 or higher)
- **Python** (3.8 or higher)
- **Angular CLI** (`npm install -g @angular/cli`)
- **Maven** (included with Spring Boot)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/anatatar10/DeepHeart.git
cd DeepHeart
```

#### 2. Setup Frontend
```bash
cd frontend
npm install
ng serve
```
The frontend will be available at `http://localhost:4200`

#### 3. Setup Backend
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```
The backend API will be available at `http://localhost:8080`

#### 4. Setup AI Models
```bash
cd ai_models
pip install -r requirements.txt
python predict.py
```

### Development Workflow

#### Frontend Development
```bash
cd frontend
ng serve                    # Development server
ng build                    # Production build
ng test                     # Run unit tests
ng generate component name  # Generate new component
```

#### Backend Development
```bash
cd backend
./mvnw spring-boot:run      # Run development server
./mvnw test                 # Run unit tests
./mvnw clean package        # Build JAR file
```

#### AI Model Development
```bash
cd ai_models
python train.py             # Train models
python predict.py           # Run predictions
python evaluate.py          # Evaluate model performance
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (admin only)

### ECG Records
- `POST /api/ecg/upload` - Upload ECG file
- `GET /api/ecg/records` - Get user's ECG records
- `GET /api/ecg/records/{id}` - Get specific ECG record
- `DELETE /api/ecg/records/{id}` - Delete ECG record

### AI Predictions
- `POST /api/predictions/analyze` - Analyze ECG data
- `GET /api/predictions/{id}` - Get prediction results
- `GET /api/predictions/history` - Get prediction history

## Technologies Used

### Frontend
- **Angular 19** - Modern web framework
- **TypeScript** - Type-safe JavaScript
- **SCSS** - Enhanced CSS with variables and mixins
- **Angular Material** - UI component library
- **RxJS** - Reactive programming
- **Chart.js** - Data visualization

### Backend
- **Spring Boot 3** - Java application framework
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Data persistence
- **Maven** - Dependency management
- **H2/PostgreSQL** - Database options
- **JWT** - Token-based authentication

### AI/ML
- **Python** - Primary programming language
- **TensorFlow/PyTorch** - Deep learning frameworks
- **NumPy** - Numerical computing
- **Pandas** - Data manipulation
- **Scikit-learn** - Machine learning utilities
- **Matplotlib** - Data visualization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Project Structure Details

### Frontend Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── auth/              # Authentication components
│   │   ├── ecg/               # ECG-related components
│   │   │   ├── components/    # Shared ECG components
│   │   │   └── pages/         # ECG feature pages
│   │   ├── guards/            # Route guards
│   │   └── services/          # Angular services
│   ├── assets/                # Static assets
│   └── environments/          # Environment configurations
```

### Backend Structure
```
backend/
├── src/
│   └── main/
│       ├── java/org/example/backend/
│       │   ├── config/        # Configuration classes
│       │   ├── controller/    # REST controllers
│       │   ├── dto/           # Data transfer objects
│       │   ├── model/         # Entity models
│       │   ├── repository/    # Data repositories
│       │   └── service/       # Business logic
│       └── resources/         # Application properties
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

**Developer**: Anatatar10  
**Project Link**: [https://github.com/anatatar10/DeepHeart](https://github.com/anatatar10/DeepHeart)

---

⭐ **Star this repository if you found it helpful!**
