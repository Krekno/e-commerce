# Pazar - Microservices Marketplace

A modern, scalable, and fully containerized e-commerce platform built using a microservices architecture. It features a robust Spring Boot backend ecosystem and a sleek, responsive Next.js frontend, fully orchestrated with Docker Compose.

## Architecture

The system consists of several independent microservices communicating via REST APIs and an event-driven architecture using Apache Kafka.

- **Config Server (`config`)**: Centralized configuration management for all services using Spring Cloud Config.
- **Discovery Server (`discovery`)**: Service registry using Netflix Eureka.
- **API Gateway (`gateway`)**: Single entry point for all client requests using Spring Cloud Gateway.
- **Frontend (`frontend`)**: Next.js (React) application with Tailwind CSS.
- **User Service (`user`)**: Manages users, roles (Buyer/Seller), and authentication via JWT.
- **Product Service (`product`)**: Manages the product catalog and categories. Uses PostgreSQL for persistence, Elasticsearch for high-performance searching, and Cloudinary for image storage.
- **Cart Service (`cart`)**: Manages user shopping carts and sessions using Redis.
- **Order Service (`order`)**: Handles order processing, status tracking, and refund requests.
- **Payment Service (`payment`)**: Processes payments and coordinates refunds securely via the Iyzico Sandbox API.
- **Notification Service (`notification`)**: Listens to Kafka events and handles user notifications (SMTP Emails for orders, payments, and refunds).

## Tech Stack

### Backend
- **Java 26** & **Spring Boot 4.x**
- **Spring Cloud** (Netflix Eureka, Config, Gateway)
- **Databases**: PostgreSQL (Relational), Elasticsearch (Search), Redis (Caching/Sessions)
- **Messaging**: Apache Kafka (Event-driven asynchronous communication)
- **Security**: JWT (JSON Web Tokens) in HttpOnly Cookies
- **Payments**: Iyzico API

### Frontend
- **Next.js 16** & **React 19**
- **Tailwind CSS v4**
- **TypeScript**

### Infrastructure
- **Docker** & **Docker Compose**

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (For running backend services and databases)
- [Node.js 20+](https://nodejs.org/) (For running the frontend)

## Getting Started

### 1. Environment Configuration
The project uses a **centralized `.env` file** at the root of the repository to manage configurations across all microservices and the frontend.

Create a `.env` file in the root directory and ensure it contains your credentials:
```env
# External APIs (Iyzico Sandbox)
IYZICO_API_KEY=your_sandbox_api_key
IYZICO_SECRET_KEY=your_sandbox_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# SMTP settings (Notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Cloudinary (Image Uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 2. Start Backend Services
The entire backend infrastructure, including databases and microservices, is dockerized. Simply run:

```bash
docker compose up -d
```

*(Note: It may take a minute for the Config and Discovery servers to fully initialize before the dependent microservices come online.)*

### 3. Run the Frontend
Navigate to the `frontend` directory, install dependencies, and start the development server. The frontend scripts are configured to automatically load the centralized root `.env` file using `dotenv-cli`.

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

## Core Features

- **Event-Driven Workflows**: Product creations, order placements, and payment successes trigger Kafka events that decouple service logic and ensure fault tolerance.
- **Robust Searching & Filtering**: Products initialized from the database are automatically synchronized to Elasticsearch on startup. Features intuitive category filtering directly on the storefront.
- **Automated Refunds**: Seamless refund workflow. When a seller marks an item as returned, the system automatically processes the refund via the Payment service without requiring manual demand from the buyer.
- **Secure Authentication**: Utilizing HttpOnly cookies to securely store JWTs against XSS attacks.
- **Dynamic Notifications**: Email receipts and status updates delivered reliably via SMTP.
