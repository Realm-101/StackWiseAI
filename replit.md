# TechStack Manager

## Overview

TechStack Manager is a full-stack web application that helps developers and teams discover, manage, and track their technology stacks. The platform enables users to explore various development tools, build their personal tech stacks, track costs, and generate AI-powered business ideas based on their selected tools. Built with React, Express, and PostgreSQL, it features a modern UI using shadcn/ui components and integrates with Google's Gemini AI for intelligent business idea generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with **React 18** and **TypeScript**, utilizing a component-based architecture with modern React patterns. The UI framework leverages **shadcn/ui** components built on top of **Radix UI primitives** for accessibility and **Tailwind CSS** for styling. State management is handled through **TanStack Query** for server state and React's built-in state management for local state. The application uses **wouter** for client-side routing, providing a lightweight alternative to React Router. The build system is powered by **Vite** for fast development and optimized production builds.

### Backend Architecture
The server follows a **RESTful API** design built with **Express.js** and **TypeScript**. The application implements a **session-based authentication** system using **Passport.js** with local strategy for user registration and login. Password security is handled through Node.js's built-in **scrypt** hashing algorithm. The server architecture separates concerns with dedicated modules for authentication, database operations, external API integrations, and route handling.

### Data Storage Solutions
The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations and schema management. The database schema includes tables for users, tools, user-tool relationships, and saved business ideas. **Neon Database** is used as the serverless PostgreSQL provider. Session storage utilizes an in-memory store for development, with the architecture supporting easy migration to persistent storage solutions like Redis or database-backed sessions for production.

### Authentication and Authorization
User authentication implements a **session-based approach** using **express-session** middleware with **Passport.js**. Passwords are hashed using **scrypt** with random salts for security. The system includes protected routes that require authentication, with automatic redirects to the login page for unauthenticated users. User sessions are managed server-side with configurable session stores.

### External Service Integrations
The application integrates with **Google's Gemini AI** (specifically the gemini-2.5-flash model) for generating business ideas based on selected technology tools. The AI integration uses structured JSON responses with defined schemas for consistent data formatting. The system is designed to handle API rate limits and errors gracefully, providing fallback experiences when external services are unavailable.

## External Dependencies

- **Database**: Neon PostgreSQL serverless database for data persistence
- **AI Service**: Google Gemini AI API for business idea generation using the @google/genai SDK
- **Authentication**: Session-based auth with express-session and connect-pg-simple for PostgreSQL session storage
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS for utility-first styling approach
- **Charts**: Chart.js for data visualization and analytics dashboards
- **Development**: Vite for build tooling and development server with HMR support