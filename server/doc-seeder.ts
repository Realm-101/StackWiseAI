import { storage } from "./storage";
import type { InsertDocCategory, InsertDocTag, InsertDocumentationArticle } from "@shared/schema";

export async function seedDocumentationContent() {
  try {
    console.log("🌱 Seeding documentation content...");

    // Create documentation categories (hierarchical structure)
    const categories = await seedDocCategories();
    console.log(`✅ Created ${categories.length} documentation categories`);

    // Create documentation tags
    const tags = await seedDocTags();
    console.log(`✅ Created ${tags.length} documentation tags`);

    // Create sample documentation articles
    const articles = await seedDocArticles(categories, tags);
    console.log(`✅ Created ${articles.length} documentation articles`);

    console.log("🎉 Documentation content seeded successfully!");
    return { categories, tags, articles };
  } catch (error) {
    console.error("❌ Error seeding documentation content:", error);
    throw error;
  }
}

async function seedDocCategories() {
  const categories: InsertDocCategory[] = [
    // Root categories
    {
      id: "getting-started",
      name: "Getting Started",
      slug: "getting-started",
      description: "Essential guides for beginners and onboarding",
      icon: "BookOpen",
      color: "#10b981",
      level: 0,
      sortOrder: 1,
      isVisible: true,
      parentId: null
    },
    {
      id: "frontend-dev",
      name: "Frontend Development",
      slug: "frontend-development", 
      description: "UI/UX development guides and frameworks",
      icon: "Monitor",
      color: "#8b5cf6",
      level: 0,
      sortOrder: 2,
      isVisible: true,
      parentId: null
    },
    {
      id: "backend-dev",
      name: "Backend Development",
      slug: "backend-development",
      description: "Server-side development and APIs",
      icon: "Server",
      color: "#f59e0b", 
      level: 0,
      sortOrder: 3,
      isVisible: true,
      parentId: null
    },
    {
      id: "databases",
      name: "Databases",
      slug: "databases",
      description: "Database design, optimization, and management",
      icon: "Database",
      color: "#06b6d4",
      level: 0,
      sortOrder: 4,
      isVisible: true,
      parentId: null
    },
    {
      id: "devops-deployment",
      name: "DevOps & Deployment",
      slug: "devops-deployment",
      description: "Deployment, CI/CD, and infrastructure",
      icon: "Upload",
      color: "#f97316",
      level: 0,
      sortOrder: 5,
      isVisible: true,
      parentId: null
    },
    {
      id: "best-practices",
      name: "Best Practices",
      slug: "best-practices",
      description: "Industry standards and recommended approaches",
      icon: "CheckCircle",
      color: "#84cc16",
      level: 0,
      sortOrder: 6,
      isVisible: true,
      parentId: null
    },
    {
      id: "integrations",
      name: "Integrations",
      slug: "integrations",
      description: "Third-party services and API integrations",
      icon: "Link",
      color: "#ec4899",
      level: 0,
      sortOrder: 7,
      isVisible: true,
      parentId: null
    },
    {
      id: "troubleshooting",
      name: "Troubleshooting",
      slug: "troubleshooting",
      description: "Common issues and debugging guides",
      icon: "AlertCircle",
      color: "#ef4444",
      level: 0,
      sortOrder: 8,
      isVisible: true,
      parentId: null
    },

    // Frontend subcategories
    {
      id: "react-guides",
      name: "React",
      slug: "react",
      description: "React framework guides and best practices",
      icon: "Code",
      color: "#61dafb",
      level: 1,
      sortOrder: 1,
      isVisible: true,
      parentId: "frontend-dev"
    },
    {
      id: "vue-guides",
      name: "Vue.js",
      slug: "vue",
      description: "Vue.js framework documentation",
      icon: "Code",
      color: "#4fc08d",
      level: 1,
      sortOrder: 2,
      isVisible: true,
      parentId: "frontend-dev"
    },
    {
      id: "css-styling",
      name: "CSS & Styling",
      slug: "css-styling",
      description: "CSS, Tailwind, and styling best practices",
      icon: "Palette",
      color: "#3b82f6",
      level: 1,
      sortOrder: 3,
      isVisible: true,
      parentId: "frontend-dev"
    },

    // Backend subcategories
    {
      id: "node-guides",
      name: "Node.js",
      slug: "nodejs",
      description: "Node.js backend development guides",
      icon: "Code",
      color: "#68a063",
      level: 1,
      sortOrder: 1,
      isVisible: true,
      parentId: "backend-dev"
    },
    {
      id: "python-guides",
      name: "Python",
      slug: "python",
      description: "Python backend development and frameworks",
      icon: "Code",
      color: "#3776ab",
      level: 1,
      sortOrder: 2,
      isVisible: true,
      parentId: "backend-dev"
    },
    {
      id: "api-design",
      name: "API Design",
      slug: "api-design",
      description: "REST APIs, GraphQL, and API best practices",
      icon: "Zap",
      color: "#8b5cf6",
      level: 1,
      sortOrder: 3,
      isVisible: true,
      parentId: "backend-dev"
    },

    // Database subcategories
    {
      id: "postgresql-guides",
      name: "PostgreSQL",
      slug: "postgresql",
      description: "PostgreSQL database guides and optimization",
      icon: "Database",
      color: "#336791",
      level: 1,
      sortOrder: 1,
      isVisible: true,
      parentId: "databases"
    },
    {
      id: "database-design",
      name: "Database Design",
      slug: "database-design",
      description: "Schema design, normalization, and modeling",
      icon: "Layers",
      color: "#06b6d4",
      level: 1,
      sortOrder: 2,
      isVisible: true,
      parentId: "databases"
    }
  ];

  const createdCategories = [];
  for (const category of categories) {
    try {
      const created = await storage.createDocCategory(category);
      createdCategories.push(created);
    } catch (error) {
      console.log(`Category ${category.name} already exists, skipping...`);
    }
  }

  return createdCategories;
}

async function seedDocTags() {
  const tags: InsertDocTag[] = [
    // Difficulty tags
    { id: "beginner", name: "Beginner", slug: "beginner", description: "Suitable for beginners", color: "#10b981", usageCount: 0, isVisible: true },
    { id: "intermediate", name: "Intermediate", slug: "intermediate", description: "For developers with some experience", color: "#f59e0b", usageCount: 0, isVisible: true },
    { id: "advanced", name: "Advanced", slug: "advanced", description: "For experienced developers", color: "#ef4444", usageCount: 0, isVisible: true },
    
    // Technology tags
    { id: "javascript", name: "JavaScript", slug: "javascript", description: "JavaScript programming language", color: "#f7df1e", usageCount: 0, isVisible: true },
    { id: "typescript", name: "TypeScript", slug: "typescript", description: "TypeScript programming language", color: "#3178c6", usageCount: 0, isVisible: true },
    { id: "react", name: "React", slug: "react", description: "React framework", color: "#61dafb", usageCount: 0, isVisible: true },
    { id: "nodejs", name: "Node.js", slug: "nodejs", description: "Node.js runtime", color: "#68a063", usageCount: 0, isVisible: true },
    { id: "python", name: "Python", slug: "python", description: "Python programming language", color: "#3776ab", usageCount: 0, isVisible: true },
    { id: "postgresql", name: "PostgreSQL", slug: "postgresql", description: "PostgreSQL database", color: "#336791", usageCount: 0, isVisible: true },
    { id: "css", name: "CSS", slug: "css", description: "CSS styling", color: "#1572b6", usageCount: 0, isVisible: true },
    { id: "tailwind", name: "Tailwind CSS", slug: "tailwind", description: "Tailwind CSS framework", color: "#06b6d4", usageCount: 0, isVisible: true },
    
    // Content type tags
    { id: "tutorial", name: "Tutorial", slug: "tutorial", description: "Step-by-step tutorial", color: "#8b5cf6", usageCount: 0, isVisible: true },
    { id: "guide", name: "Guide", slug: "guide", description: "Comprehensive guide", color: "#10b981", usageCount: 0, isVisible: true },
    { id: "reference", name: "Reference", slug: "reference", description: "Reference documentation", color: "#6b7280", usageCount: 0, isVisible: true },
    { id: "example", name: "Example", slug: "example", description: "Code examples", color: "#f59e0b", usageCount: 0, isVisible: true },
    { id: "quickstart", name: "Quick Start", slug: "quickstart", description: "Quick start guide", color: "#84cc16", usageCount: 0, isVisible: true },
    
    // Topic tags
    { id: "authentication", name: "Authentication", slug: "authentication", description: "User authentication", color: "#ef4444", usageCount: 0, isVisible: true },
    { id: "deployment", name: "Deployment", slug: "deployment", description: "Application deployment", color: "#f97316", usageCount: 0, isVisible: true },
    { id: "testing", name: "Testing", slug: "testing", description: "Testing strategies", color: "#06b6d4", usageCount: 0, isVisible: true },
    { id: "security", name: "Security", slug: "security", description: "Security best practices", color: "#dc2626", usageCount: 0, isVisible: true },
    { id: "performance", name: "Performance", slug: "performance", description: "Performance optimization", color: "#16a34a", usageCount: 0, isVisible: true },
    { id: "api", name: "API", slug: "api", description: "API development", color: "#8b5cf6", usageCount: 0, isVisible: true }
  ];

  const createdTags = [];
  for (const tag of tags) {
    try {
      const created = await storage.createDocTag(tag);
      createdTags.push(created);
    } catch (error) {
      console.log(`Tag ${tag.name} already exists, skipping...`);
    }
  }

  return createdTags;
}

async function seedDocArticles(categories: any[], tags: any[]) {
  const articles: InsertDocumentationArticle[] = [
    // Getting Started articles
    {
      title: "Welcome to StackWise - Getting Started Guide",
      slug: "welcome-to-stackwise-getting-started",
      excerpt: "Learn how to get started with StackWise and make the most of our tech stack management platform.",
      content: `# Welcome to StackWise!

Welcome to StackWise, your comprehensive tech stack management platform. This guide will help you get started and make the most of our powerful features.

## What is StackWise?

StackWise is a platform designed to help developers and teams manage their technology stack effectively. Whether you're building a new project or optimizing an existing one, StackWise provides insights, recommendations, and tools to make informed decisions about your tech choices.

## Key Features

### 🔧 Stack Management
- Add and organize your current tools and technologies
- Track usage patterns and costs
- Get personalized recommendations for stack optimization

### 💡 Idea Lab
- Generate project ideas based on your skills and interests
- Get AI-powered suggestions for implementation approaches
- Save and organize your favorite concepts

### 📊 Cost Intelligence
- Monitor your tech stack costs
- Identify redundancies and optimization opportunities
- Set budgets and track spending patterns

### 🗺️ Tech Roadmaps
- Create learning paths for new technologies
- Track your progress and milestones
- Get suggestions for skill development

### 📚 Documentation Hub
- Access comprehensive guides and tutorials
- Search through curated technical documentation
- Bookmark and rate helpful resources

## Getting Started

### Step 1: Complete Your Profile
Start by setting up your developer profile. This helps StackWise provide personalized recommendations and content.

1. Navigate to your profile settings
2. Add your programming languages and frameworks
3. Set your experience level and interests
4. Configure your monthly budget (optional)

### Step 2: Add Your Current Stack
Begin by adding the tools and technologies you're currently using:

1. Go to "My Stack" in the main navigation
2. Search for tools in our comprehensive database
3. Add tools with their usage frequency and cost information
4. Organize tools by categories (Frontend, Backend, Database, etc.)

### Step 3: Explore Features
Take some time to explore StackWise's main features:

- **Dashboard**: Get an overview of your stack and recent activity
- **Stack Intelligence**: Discover optimization opportunities
- **Idea Lab**: Generate new project concepts
- **Roadmaps**: Plan your learning journey
- **Documentation**: Access technical guides and tutorials

## Pro Tips for Success

### 🎯 Keep Your Stack Updated
Regularly update your tool usage and costs to get accurate insights and recommendations.

### 🔍 Use Stack Intelligence
Check the Stack Intelligence feature monthly to identify potential optimizations and cost savings.

### 📖 Explore Documentation
Use our documentation hub to find implementation guides for your stack and learn best practices.

### 💰 Monitor Costs
Set up budget tracking to keep your technology costs under control and identify unused or underutilized tools.

## Need Help?

If you have questions or need assistance:

- Check our documentation hub for detailed guides
- Use the search function to find specific information
- Contact our support team for personalized help

Welcome aboard, and happy coding! 🚀`,
      contentType: "guide",
      difficulty: "beginner",
      estimatedReadTime: 8,
      categoryId: "getting-started",
      authorId: null, // System-generated content
      isFeatured: true,
      isPublished: true,
      tags: ["beginner", "quickstart", "guide"],
      frameworks: [],
      languages: [],
      prerequisites: [],
      keyPoints: [
        "Complete your developer profile for personalized recommendations",
        "Add your current tech stack for accurate insights",
        "Explore all features to maximize platform value",
        "Keep your information updated for best results"
      ]
    },

    // React development guide
    {
      title: "Modern React Development: Hooks, Context, and Best Practices",
      slug: "modern-react-development-guide",
      excerpt: "Comprehensive guide to building modern React applications with hooks, context API, and industry best practices.",
      content: `# Modern React Development Guide

React has evolved significantly since its introduction, and modern React development leverages powerful features like hooks, context, and functional components. This comprehensive guide covers everything you need to know to build robust React applications.

## Table of Contents
1. [Setting Up a Modern React Project](#setup)
2. [Understanding React Hooks](#hooks)
3. [State Management with Context API](#context)
4. [Component Patterns and Best Practices](#patterns)
5. [Performance Optimization](#performance)
6. [Testing React Applications](#testing)

## Setting Up a Modern React Project {#setup}

### Using Create React App with TypeScript

\`\`\`bash
npx create-react-app my-app --template typescript
cd my-app
npm start
\`\`\`

### Essential Dependencies

\`\`\`bash
npm install @types/react @types/react-dom
npm install react-router-dom @types/react-router-dom
npm install react-query
npm install styled-components @types/styled-components
\`\`\`

### Project Structure
\`\`\`
src/
├── components/
│   ├── common/
│   └── features/
├── hooks/
├── context/
├── services/
├── types/
└── utils/
\`\`\`

## Understanding React Hooks {#hooks}

### useState Hook
The \`useState\` hook lets you add state to functional components:

\`\`\`tsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

### useEffect Hook
Handle side effects in functional components:

\`\`\`tsx
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(\`/api/users/\${userId}\`);
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return <div>Welcome, {user.name}!</div>;
}
\`\`\`

### Custom Hooks
Create reusable stateful logic:

\`\`\`tsx
import { useState, useEffect } from 'react';

function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}
\`\`\`

## State Management with Context API {#context}

### Creating a Context

\`\`\`tsx
import React, { createContext, useContext, useReducer } from 'react';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
\`\`\`

### Context Provider

\`\`\`tsx
type AppAction = 
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    user: null,
    theme: 'light'
  });

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
\`\`\`

## Component Patterns and Best Practices {#patterns}

### Composition over Inheritance

\`\`\`tsx
// Good: Composition pattern
function Button({ 
  children, 
  variant = 'primary', 
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={clsx('btn', \`btn-\${variant}\`)}
      {...props}
    >
      {children}
    </button>
  );
}

function SubmitButton(props: Omit<ButtonProps, 'type'>) {
  return <Button type="submit" {...props} />;
}
\`\`\`

### Prop Types and TypeScript

\`\`\`tsx
interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  onEdit?: (user: User) => void;
  showActions?: boolean;
}

function UserCard({ user, onEdit, showActions = true }: UserCardProps) {
  return (
    <div className="user-card">
      <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {showActions && onEdit && (
        <button onClick={() => onEdit(user)}>Edit</button>
      )}
    </div>
  );
}
\`\`\`

## Performance Optimization {#performance}

### React.memo for Component Memoization

\`\`\`tsx
const ExpensiveComponent = React.memo(function ExpensiveComponent({ 
  data, 
  onUpdate 
}: {
  data: ComplexData;
  onUpdate: (id: string) => void;
}) {
  // Expensive rendering logic here
  return <div>{/* Complex UI */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.data.id === nextProps.data.id;
});
\`\`\`

### useMemo and useCallback

\`\`\`tsx
function OptimizedComponent({ items, filter }: Props) {
  // Memoize expensive calculations
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  // Memoize event handlers
  const handleItemClick = useCallback((id: string) => {
    // Handle click logic
  }, []);

  return (
    <div>
      {filteredItems.map(item => (
        <ItemCard 
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
}
\`\`\`

## Testing React Applications {#testing}

### Unit Testing with Jest and React Testing Library

\`\`\`tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

test('increments counter when button is clicked', async () => {
  const user = userEvent.setup();
  render(<Counter />);
  
  const button = screen.getByRole('button', { name: /increment/i });
  const count = screen.getByText(/count: 0/i);
  
  expect(count).toBeInTheDocument();
  
  await user.click(button);
  
  expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
});
\`\`\`

### Integration Testing

\`\`\`tsx
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import UserProfile from './UserProfile';

const server = setupServer(
  rest.get('/api/users/:id', (req, res, ctx) => {
    return res(ctx.json({ id: '1', name: 'John Doe', email: 'john@example.com' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('displays user profile', async () => {
  render(<UserProfile userId="1" />);
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText(/welcome, john doe/i)).toBeInTheDocument();
  });
});
\`\`\`

## Conclusion

Modern React development emphasizes functional components, hooks, and strong typing with TypeScript. By following these patterns and best practices, you'll build maintainable, performant, and testable React applications.

### Key Takeaways
- Use functional components with hooks instead of class components
- Leverage TypeScript for better development experience and fewer bugs
- Apply performance optimizations judiciously with React.memo, useMemo, and useCallback
- Write comprehensive tests for your components
- Follow established patterns for state management and component composition

Keep learning and stay updated with the React ecosystem as it continues to evolve!`,
      contentType: "tutorial",
      difficulty: "intermediate",
      estimatedReadTime: 25,
      categoryId: "react-guides",
      authorId: null,
      isFeatured: true,
      isPublished: true,
      tags: ["react", "javascript", "typescript", "intermediate", "tutorial"],
      frameworks: ["React", "TypeScript"],
      languages: ["JavaScript", "TypeScript"],
      prerequisites: ["Basic JavaScript knowledge", "Understanding of HTML and CSS", "Familiarity with ES6+ features"],
      keyPoints: [
        "Modern React uses functional components and hooks",
        "TypeScript provides better development experience and type safety",
        "Context API is great for global state management",
        "Performance optimization should be applied judiciously",
        "Testing ensures component reliability"
      ]
    },

    // Node.js API Development
    {
      title: "Building Secure REST APIs with Node.js and Express",
      slug: "secure-rest-apis-nodejs-express",
      excerpt: "Learn to build production-ready REST APIs with Node.js, Express, authentication, validation, and security best practices.",
      content: `# Building Secure REST APIs with Node.js and Express

This comprehensive guide covers building production-ready REST APIs with Node.js and Express, focusing on security, authentication, validation, and best practices.

## Prerequisites
- Node.js and npm installed
- Basic understanding of JavaScript and HTTP concepts
- Familiarity with databases (we'll use PostgreSQL)

## Project Setup

### Initialize the Project
\`\`\`bash
mkdir secure-api
cd secure-api
npm init -y
\`\`\`

### Install Dependencies
\`\`\`bash
# Core dependencies
npm install express cors helmet morgan compression
npm install bcryptjs jsonwebtoken
npm install express-rate-limit express-validator
npm install pg drizzle-orm

# Development dependencies
npm install -D @types/node @types/express typescript nodemon
npm install -D @types/bcryptjs @types/jsonwebtoken
\`\`\`

## Basic Express Setup

### TypeScript Configuration
\`\`\`json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
\`\`\`

### Main Server File
\`\`\`typescript
// src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/posts', authenticateToken, postRoutes);

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
\`\`\`

## Database Schema with Drizzle ORM

\`\`\`typescript
// src/schema.ts
import { pgTable, uuid, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  published: boolean('published').default(false),
  views: integer('views').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
\`\`\`

## Authentication System

### User Registration
\`\`\`typescript
// src/routes/auth.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../db';
import { users } from '../schema';

const router = express.Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 20 }).isAlphanumeric(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])/),
  body('firstName').optional().isLength({ max: 50 }).trim(),
  body('lastName').optional().isLength({ max: 50 }).trim()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email) || eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      username,
      passwordHash,
      firstName,
      lastName
    }).returning({
      id: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: newUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
\`\`\`

### User Login
\`\`\`typescript
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
\`\`\`

## Middleware for Authentication

\`\`\`typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}
\`\`\`

## CRUD Operations for Posts

\`\`\`typescript
// src/routes/posts.ts
import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { db } from '../db';
import { posts, users } from '../schema';

const router = express.Router();

// Get all posts with pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('published').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const published = req.query.published !== undefined ? 
      req.query.published === 'true' : undefined;

    const offset = (page - 1) * limit;

    let whereClause = published !== undefined ? eq(posts.published, published) : undefined;

    const postsWithAuthors = await db
      .select({
        post: posts,
        author: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(posts.createdAt));

    res.json({
      posts: postsWithAuthors,
      pagination: {
        page,
        limit,
        hasMore: postsWithAuthors.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new post
router.post('/', [
  body('title').isLength({ min: 1, max: 200 }).trim(),
  body('content').isLength({ min: 1 }).trim(),
  body('published').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, published = false } = req.body;
    const authorId = req.user!.userId;

    const [newPost] = await db.insert(posts).values({
      title,
      content,
      published,
      authorId
    }).returning();

    res.status(201).json({
      message: 'Post created successfully',
      post: newPost
    });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
\`\`\`

## Error Handling Middleware

\`\`\`typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  status?: number;
}

export function errorHandler(err: CustomError, req: Request, res: Response, next: NextFunction) {
  console.error(err.stack);

  // Default error
  let error = {
    status: err.status || 500,
    message: err.message || 'Internal Server Error'
  };

  // Specific error handling
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation Error';
  }

  if (err.name === 'CastError') {
    error.status = 400;
    error.message = 'Invalid ID format';
  }

  if (err.name === 'JsonWebTokenError') {
    error.status = 401;
    error.message = 'Invalid token';
  }

  res.status(error.status).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
\`\`\`

## Security Best Practices

### Environment Variables
\`\`\`bash
# .env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/database
JWT_SECRET=your-super-secure-jwt-secret-key
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
\`\`\`

### Additional Security Headers
\`\`\`typescript
// Enhanced helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
\`\`\`

### Input Sanitization
\`\`\`typescript
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';

app.use(mongoSanitize());

// Custom XSS protection middleware
app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});
\`\`\`

## Testing the API

### Unit Tests with Jest
\`\`\`typescript
// tests/auth.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Authentication', () => {
  test('should register a new user', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.message).toBe('User created successfully');
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(userData.email);
  });

  test('should login with valid credentials', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(200);

    expect(response.body.message).toBe('Login successful');
    expect(response.body.token).toBeDefined();
  });
});
\`\`\`

## Conclusion

This guide covered building secure REST APIs with Node.js and Express, including:

- Project setup with TypeScript
- Database integration with Drizzle ORM
- JWT-based authentication
- Input validation and sanitization
- Security best practices with helmet and rate limiting
- Error handling middleware
- CRUD operations with proper authorization
- Testing strategies

### Key Security Considerations
- Always hash passwords with bcrypt
- Use JWT tokens with appropriate expiration times
- Implement rate limiting to prevent abuse
- Validate and sanitize all input data
- Use HTTPS in production
- Keep dependencies updated
- Implement proper error handling without exposing sensitive information

Remember to regularly update your dependencies and follow security advisories for the packages you use.`,
      contentType: "tutorial",
      difficulty: "intermediate",
      estimatedReadTime: 35,
      categoryId: "node-guides",
      authorId: null,
      isFeatured: true,
      isPublished: true,
      tags: ["nodejs", "javascript", "typescript", "api", "security", "intermediate", "tutorial"],
      frameworks: ["Node.js", "Express", "TypeScript"],
      languages: ["JavaScript", "TypeScript"],
      prerequisites: ["Node.js basics", "HTTP protocol understanding", "JavaScript ES6+", "Basic database concepts"],
      keyPoints: [
        "Security should be built into the API from the ground up",
        "Always validate and sanitize user input",
        "Use JWT tokens for stateless authentication",
        "Implement proper error handling and logging",
        "Rate limiting prevents API abuse",
        "TypeScript adds type safety to Node.js development"
      ]
    },

    // Database design guide
    {
      title: "PostgreSQL Database Design: Schema, Optimization, and Best Practices",
      slug: "postgresql-database-design-guide",
      excerpt: "Complete guide to designing efficient PostgreSQL databases with proper normalization, indexing, and performance optimization.",
      content: `# PostgreSQL Database Design Guide

Designing an efficient database is crucial for application performance and maintainability. This comprehensive guide covers PostgreSQL database design principles, optimization techniques, and best practices.

## Database Design Fundamentals

### Normalization Principles

#### First Normal Form (1NF)
- Each column contains atomic (indivisible) values
- No repeating groups or arrays in columns
- Each row is unique

\`\`\`sql
-- Bad: Repeating groups
CREATE TABLE bad_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone1 VARCHAR(15),
    phone2 VARCHAR(15),
    phone3 VARCHAR(15)
);

-- Good: Normalized
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_phones (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    phone VARCHAR(15) NOT NULL,
    type VARCHAR(20) DEFAULT 'mobile'
);
\`\`\`

#### Second Normal Form (2NF)
- Must be in 1NF
- No partial dependencies on composite primary keys

\`\`\`sql
-- Example: Order items table
CREATE TABLE order_items (
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    product_name VARCHAR(200) NOT NULL, -- This creates partial dependency
    PRIMARY KEY (order_id, product_id)
);

-- Better: Remove partial dependency
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE order_items (
    order_id INTEGER,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);
\`\`\`

#### Third Normal Form (3NF)
- Must be in 2NF
- No transitive dependencies

\`\`\`sql
-- Bad: Transitive dependency
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    department_id INTEGER,
    department_name VARCHAR(100), -- Depends on department_id, not employee id
    department_budget DECIMAL(12,2) -- Depends on department_id, not employee id
);

-- Good: Separate concerns
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    budget DECIMAL(12,2)
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id)
);
\`\`\`

## Advanced PostgreSQL Features

### Custom Data Types and Domains

\`\`\`sql
-- Create custom domain for email validation
CREATE DOMAIN email_type AS VARCHAR(255)
CHECK (VALUE ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');

-- Create enum type for user roles
CREATE TYPE user_role_enum AS ENUM ('admin', 'user', 'moderator');

-- Use in table definition
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email email_type UNIQUE NOT NULL,
    role user_role_enum DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### JSONB for Flexible Data

\`\`\`sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    metadata JSONB,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert with JSONB data
INSERT INTO products (name, price, metadata, tags) VALUES 
('Laptop', 999.99, '{"brand": "TechCorp", "specs": {"ram": "16GB", "storage": "512GB SSD"}}', 
 ARRAY['electronics', 'computers']);

-- Query JSONB data
SELECT * FROM products 
WHERE metadata->>'brand' = 'TechCorp'
AND metadata->'specs'->>'ram' = '16GB';

-- Create index on JSONB field
CREATE INDEX idx_product_brand ON products USING GIN ((metadata->>'brand'));
\`\`\`

### Full-Text Search

\`\`\`sql
-- Add tsvector column for search
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_article_search_vector() 
RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.tags, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER article_search_vector_update
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_article_search_vector();

-- Create GIN index for fast search
CREATE INDEX idx_article_search ON articles USING GIN(search_vector);

-- Search query
SELECT title, ts_rank(search_vector, query) as rank
FROM articles, to_tsquery('english', 'postgresql & database') query
WHERE search_vector @@ query
ORDER BY rank DESC;
\`\`\`

## Indexing Strategies

### B-Tree Indexes (Default)

\`\`\`sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Multi-column index (order matters!)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- Partial index
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- Expression index
CREATE INDEX idx_users_lower_email ON users(lower(email));
\`\`\`

### Specialized Indexes

\`\`\`sql
-- GIN index for arrays and JSONB
CREATE INDEX idx_product_tags ON products USING GIN(tags);
CREATE INDEX idx_product_metadata ON products USING GIN(metadata);

-- GiST index for geometric data and full-text search
CREATE INDEX idx_location ON stores USING GIST(location);

-- Hash index for equality comparisons (PostgreSQL 10+)
CREATE INDEX idx_user_role_hash ON users USING HASH(role);
\`\`\`

### Index Monitoring

\`\`\`sql
-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_tup_read = 0 AND idx_tup_fetch = 0;

-- Find missing indexes (queries with high cost)
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE calls > 100
ORDER BY total_time DESC
LIMIT 10;
\`\`\`

## Query Optimization

### Using EXPLAIN and EXPLAIN ANALYZE

\`\`\`sql
-- Show query plan without execution
EXPLAIN 
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2023-01-01'
GROUP BY u.id, u.name
ORDER BY order_count DESC;

-- Show actual execution statistics
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2023-01-01'
GROUP BY u.id, u.name
ORDER BY order_count DESC;
\`\`\`

### Common Query Patterns

\`\`\`sql
-- Efficient pagination with OFFSET/LIMIT
SELECT * FROM products
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 100;

-- Better: Cursor-based pagination
SELECT * FROM products
WHERE (created_at, id) < ('2023-10-01 10:00:00', 12345)
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Window functions for ranking
SELECT 
    name,
    salary,
    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as salary_rank
FROM employees;

-- Common Table Expressions (CTEs)
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(total) as total_sales
    FROM orders
    WHERE created_at >= '2023-01-01'
    GROUP BY DATE_TRUNC('month', created_at)
)
SELECT 
    month,
    total_sales,
    LAG(total_sales) OVER (ORDER BY month) as prev_month_sales
FROM monthly_sales
ORDER BY month;
\`\`\`

## Advanced Constraints and Triggers

### Check Constraints

\`\`\`sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) CHECK (price > 0),
    discount_percentage INTEGER CHECK (discount_percentage BETWEEN 0 AND 100),
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure at least one of these is not null
    CHECK (description IS NOT NULL OR image_url IS NOT NULL)
);
\`\`\`

### Exclusion Constraints

\`\`\`sql
-- Prevent overlapping time periods
CREATE TABLE room_bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    EXCLUDE USING GIST (
        room_id WITH =,
        tsrange(start_time, end_time) WITH &&
    )
);
\`\`\`

### Audit Triggers

\`\`\`sql
-- Create audit table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name, 
        operation, 
        old_values, 
        new_values,
        user_id
    )
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) END,
        current_setting('app.current_user_id')::INTEGER
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
\`\`\`

## Performance Monitoring

### Key Metrics to Monitor

\`\`\`sql
-- Database size and growth
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Long running queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
AND state = 'active';

-- Lock monitoring
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted AND blocking_locks.granted;
\`\`\`

## Backup and Recovery Strategies

### Logical Backups with pg_dump

\`\`\`bash
# Full database backup
pg_dump -h localhost -U postgres -d mydb > backup.sql

# Compressed backup
pg_dump -h localhost -U postgres -d mydb | gzip > backup.sql.gz

# Schema-only backup
pg_dump -h localhost -U postgres -s -d mydb > schema.sql

# Data-only backup
pg_dump -h localhost -U postgres -a -d mydb > data.sql

# Specific table backup
pg_dump -h localhost -U postgres -t users -d mydb > users_backup.sql
\`\`\`

### Point-in-Time Recovery (PITR)

\`\`\`bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /backup/wal/%f && cp %p /backup/wal/%f'

# Create base backup
pg_basebackup -h localhost -U postgres -D /backup/base -P -W

# Recovery configuration
restore_command = 'cp /backup/wal/%f %p'
recovery_target_time = '2023-10-15 14:30:00'
\`\`\`

## Connection Pooling with PgBouncer

\`\`\`ini
# pgbouncer.ini
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
server_round_robin = 1
\`\`\`

## Best Practices Summary

### Schema Design
1. **Normalize appropriately** - Don't over-normalize or under-normalize
2. **Use appropriate data types** - Choose the most specific type possible
3. **Add constraints** - Use CHECK, UNIQUE, and foreign key constraints
4. **Plan for growth** - Consider partitioning for large tables

### Indexing
1. **Index foreign keys** - Always index columns used in JOINs
2. **Multi-column indexes** - Order columns by selectivity
3. **Monitor index usage** - Remove unused indexes
4. **Partial indexes** - Use WHERE clauses for filtered indexes

### Query Performance
1. **Use EXPLAIN ANALYZE** - Always analyze query plans
2. **Avoid SELECT \*** - Only select needed columns
3. **Limit result sets** - Use appropriate LIMIT and WHERE clauses
4. **Use prepared statements** - For repeated queries

### Maintenance
1. **Regular VACUUM and ANALYZE** - Keep statistics up to date
2. **Monitor disk space** - Plan for growth and cleanup
3. **Backup regularly** - Test recovery procedures
4. **Update statistics** - Run ANALYZE after large data changes

### Security
1. **Use least privilege** - Grant minimum necessary permissions
2. **Enable SSL** - Encrypt connections in production
3. **Audit access** - Log connections and queries
4. **Regular updates** - Keep PostgreSQL version current

This comprehensive guide provides the foundation for designing efficient, scalable PostgreSQL databases. Remember to always test performance with realistic data volumes and query patterns.`,
      contentType: "guide",
      difficulty: "advanced",
      estimatedReadTime: 45,
      categoryId: "postgresql-guides",
      authorId: null,
      isFeatured: false,
      isPublished: true,
      tags: ["postgresql", "database", "advanced", "guide", "performance"],
      frameworks: ["PostgreSQL"],
      languages: ["SQL"],
      prerequisites: ["Basic SQL knowledge", "Understanding of database concepts", "PostgreSQL installation"],
      keyPoints: [
        "Proper normalization prevents data anomalies",
        "Indexes are crucial for query performance but have overhead",
        "EXPLAIN ANALYZE is your best friend for optimization",
        "Monitor database performance regularly",
        "Plan for growth with appropriate data types and partitioning"
      ]
    },

    // CSS and Styling guide
    {
      title: "Modern CSS: Flexbox, Grid, and Responsive Design Patterns",
      slug: "modern-css-flexbox-grid-responsive",
      excerpt: "Master modern CSS with flexbox, grid layout, responsive design patterns, and best practices for maintainable stylesheets.",
      content: `# Modern CSS Guide: Flexbox, Grid, and Responsive Design

Modern CSS has evolved significantly with powerful layout systems like Flexbox and Grid, along with responsive design techniques. This guide covers everything you need to build beautiful, responsive websites.

## CSS Flexbox Layout

### Flexbox Basics

Flexbox is perfect for one-dimensional layouts (either horizontal or vertical alignment).

\`\`\`css
/* Flex Container */
.flex-container {
  display: flex;
  flex-direction: row; /* row | row-reverse | column | column-reverse */
  flex-wrap: wrap; /* nowrap | wrap | wrap-reverse */
  justify-content: center; /* flex-start | flex-end | center | space-between | space-around | space-evenly */
  align-items: center; /* stretch | flex-start | flex-end | center | baseline */
  gap: 1rem; /* Modern way to add spacing */
}

/* Flex Items */
.flex-item {
  flex: 1; /* flex-grow | flex-shrink | flex-basis */
  flex-grow: 1; /* How much the item should grow */
  flex-shrink: 0; /* How much the item should shrink */
  flex-basis: auto; /* Initial size before free space is distributed */
}
\`\`\`

### Common Flexbox Patterns

#### Perfect Centering
\`\`\`css
.center-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
\`\`\`

#### Navigation Bar
\`\`\`css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.navbar .logo {
  flex-shrink: 0;
}

.navbar .nav-links {
  display: flex;
  list-style: none;
  gap: 2rem;
  margin: 0;
}

.navbar .auth-buttons {
  display: flex;
  gap: 1rem;
}
\`\`\`

#### Card Layout
\`\`\`css
.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 2rem;
}

.card {
  flex: 1 1 300px; /* grow | shrink | basis */
  min-width: 300px;
  max-width: 400px;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
\`\`\`

## CSS Grid Layout

### Grid Basics

Grid is perfect for two-dimensional layouts with complex alignments.

\`\`\`css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Three equal columns */
  grid-template-rows: auto 1fr auto; /* Auto-sized header, flexible content, auto footer */
  grid-gap: 2rem; /* Older syntax, prefer 'gap' */
  gap: 2rem; /* Modern syntax */
  min-height: 100vh;
}

/* Named Grid Lines */
.grid-with-names {
  display: grid;
  grid-template-columns: [sidebar-start] 250px [sidebar-end main-start] 1fr [main-end];
  grid-template-rows: [header-start] 80px [header-end content-start] 1fr [content-end footer-start] 60px [footer-end];
}
\`\`\`

### Grid Template Areas

\`\`\`css
.layout {
  display: grid;
  grid-template-areas: 
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  grid-template-columns: 250px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  gap: 1rem;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }

/* Responsive Grid Areas */
@media (max-width: 768px) {
  .layout {
    grid-template-areas: 
      "header"
      "main"
      "sidebar"
      "aside"
      "footer";
    grid-template-columns: 1fr;
  }
}
\`\`\`

### Advanced Grid Techniques

#### Auto-fit and Auto-fill
\`\`\`css
/* Auto-fit: Stretches items to fill container */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

/* Auto-fill: Maintains item size, creates empty columns if needed */
.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}
\`\`\`

#### Grid Item Placement
\`\`\`css
.grid-item {
  /* Span multiple columns/rows */
  grid-column: 1 / 3; /* From column 1 to column 3 */
  grid-row: 1 / 3; /* From row 1 to row 3 */
  
  /* Alternative syntax */
  grid-column: span 2; /* Span 2 columns */
  grid-row: span 2; /* Span 2 rows */
  
  /* Start from specific line */
  grid-column-start: 2;
  grid-column-end: 4;
}
\`\`\`

## Responsive Design Patterns

### Mobile-First Approach

\`\`\`css
/* Base styles for mobile */
.container {
  padding: 1rem;
  max-width: 100%;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
  
  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 3rem;
  }
}
\`\`\`

### Container Queries (Modern)

\`\`\`css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .card-image {
    width: 100px;
    height: 100px;
  }
}
\`\`\`

### Responsive Typography

\`\`\`css
/* Fluid Typography */
.heading {
  font-size: clamp(1.5rem, 4vw, 3rem);
  line-height: 1.2;
}

.body-text {
  font-size: clamp(1rem, 2.5vw, 1.125rem);
  line-height: 1.6;
}

/* CSS Custom Properties for Theming */
:root {
  --font-size-sm: clamp(0.875rem, 2vw, 1rem);
  --font-size-base: clamp(1rem, 2.5vw, 1.125rem);
  --font-size-lg: clamp(1.125rem, 3vw, 1.25rem);
  --font-size-xl: clamp(1.25rem, 4vw, 1.5rem);
  --font-size-2xl: clamp(1.5rem, 5vw, 2rem);
  --font-size-3xl: clamp(2rem, 6vw, 3rem);
}
\`\`\`

## Modern CSS Features

### CSS Custom Properties (Variables)

\`\`\`css
:root {
  /* Color System */
  --color-primary: hsl(220, 90%, 56%);
  --color-primary-light: hsl(220, 90%, 76%);
  --color-primary-dark: hsl(220, 90%, 36%);
  
  /* Spacing Scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* Typography */
  --font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: hsl(220, 90%, 76%);
    --color-background: hsl(220, 13%, 18%);
    --color-text: hsl(220, 14%, 96%);
  }
}

.button {
  background-color: var(--color-primary);
  color: white;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
\`\`\`

### Modern Layout with Subgrid

\`\`\`css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
}

.card-header,
.card-content,
.card-footer {
  padding: 1rem;
}
\`\`\`

### Logical Properties

\`\`\`css
.element {
  /* Instead of margin-left and margin-right */
  margin-inline: 1rem;
  
  /* Instead of margin-top and margin-bottom */
  margin-block: 2rem;
  
  /* Instead of padding-left and padding-right */
  padding-inline: 1rem;
  
  /* Instead of border-left */
  border-inline-start: 1px solid #ccc;
  
  /* Instead of text-align: left */
  text-align: start;
}
\`\`\`

## Component Patterns

### Button Components

\`\`\`css
.btn {
  --btn-padding-x: 1rem;
  --btn-padding-y: 0.5rem;
  --btn-font-size: 1rem;
  --btn-border-radius: var(--radius-md);
  --btn-transition: all 0.2s ease-in-out;
  
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: var(--btn-padding-y) var(--btn-padding-x);
  font-size: var(--btn-font-size);
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: var(--btn-border-radius);
  cursor: pointer;
  transition: var(--btn-transition);
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Button Variants */
.btn--primary {
  background-color: var(--color-primary);
  color: white;
}

.btn--primary:hover {
  background-color: var(--color-primary-dark);
}

.btn--outline {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn--outline:hover {
  background-color: var(--color-primary);
  color: white;
}

/* Button Sizes */
.btn--sm {
  --btn-padding-x: 0.75rem;
  --btn-padding-y: 0.375rem;
  --btn-font-size: 0.875rem;
}

.btn--lg {
  --btn-padding-x: 1.5rem;
  --btn-padding-y: 0.75rem;
  --btn-font-size: 1.125rem;
}
\`\`\`

### Card Components

\`\`\`css
.card {
  --card-padding: 1.5rem;
  --card-border-radius: var(--radius-lg);
  --card-shadow: var(--shadow-md);
  
  background-color: white;
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card__header {
  padding: var(--card-padding);
  border-bottom: 1px solid #e5e7eb;
}

.card__content {
  padding: var(--card-padding);
}

.card__footer {
  padding: var(--card-padding);
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

/* Card with image */
.card--with-image .card__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
\`\`\`

## Accessibility in CSS

### Focus Management

\`\`\`css
/* Remove default focus styles and add custom ones */
*:focus {
  outline: none;
}

*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
}

.skip-link:focus {
  top: 6px;
}
\`\`\`

### Reduced Motion

\`\`\`css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.animation {
  animation: slideIn 0.3s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .animation {
    animation: none;
  }
}
\`\`\`

## Performance Best Practices

### CSS Organization

\`\`\`css
/* Use BEM methodology for clear naming */
.header {
  /* Block */
}

.header__logo {
  /* Element */
}

.header__nav {
  /* Element */
}

.header__nav--mobile {
  /* Modifier */
}

/* Use CSS custom properties for consistent values */
:root {
  --header-height: 64px;
  --sidebar-width: 250px;
  --content-max-width: 1200px;
}

/* Avoid deep nesting */
.navigation ul li a {
  /* Avoid this - too specific */
}

.nav-link {
  /* Better - use classes */
}
\`\`\`

### Critical CSS

\`\`\`css
/* Inline critical CSS in <head> */
/* Above-the-fold content styles */
.header,
.hero,
.main-content {
  /* Critical styles */
}

/* Load non-critical CSS asynchronously */
\`\`\`

## Utility Classes

\`\`\`css
/* Layout */
.flex { display: flex; }
.grid { display: grid; }
.hidden { display: none; }
.block { display: block; }
.inline-block { display: inline-block; }

/* Flexbox utilities */
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }

/* Spacing */
.m-0 { margin: 0; }
.m-1 { margin: var(--space-sm); }
.m-2 { margin: var(--space-md); }
.mx-auto { margin-left: auto; margin-right: auto; }

.p-0 { padding: 0; }
.p-1 { padding: var(--space-sm); }
.p-2 { padding: var(--space-md); }

/* Text */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-normal { font-weight: 400; }

/* Colors */
.text-primary { color: var(--color-primary); }
.text-secondary { color: var(--color-secondary); }
.bg-primary { background-color: var(--color-primary); }
.bg-white { background-color: white; }
\`\`\`

## Conclusion

Modern CSS provides powerful tools for creating responsive, maintainable stylesheets:

### Key Takeaways
- **Flexbox** for one-dimensional layouts
- **Grid** for two-dimensional layouts
- **Mobile-first** responsive design
- **CSS Custom Properties** for theming and consistency
- **Logical properties** for internationalization
- **Component-based** architecture
- **Accessibility** considerations from the start
- **Performance** optimization techniques

### Modern CSS Features to Use
- Container queries for responsive components
- Cascade layers for better CSS organization
- CSS nesting for cleaner code structure
- New color functions like \`oklch()\` and \`color-mix()\`
- View transitions for smooth page changes

Stay updated with CSS evolution as new features continue to improve the development experience and user interfaces.`,
      contentType: "guide",
      difficulty: "intermediate",
      estimatedReadTime: 30,
      categoryId: "css-styling",
      authorId: null,
      isFeatured: false,
      isPublished: true,
      tags: ["css", "javascript", "intermediate", "guide", "responsive"],
      frameworks: ["CSS"],
      languages: ["CSS", "HTML"],
      prerequisites: ["HTML basics", "CSS fundamentals", "Understanding of web browsers"],
      keyPoints: [
        "Flexbox is perfect for one-dimensional layouts",
        "CSS Grid excels at complex two-dimensional layouts", 
        "Mobile-first approach ensures better responsive design",
        "CSS custom properties enable powerful theming systems",
        "Modern CSS features improve maintainability and performance"
      ]
    },

    // Troubleshooting articles
    {
      title: "Common StackWise Platform Issues and Solutions",
      slug: "stackwise-troubleshooting-guide",
      excerpt: "Comprehensive guide to diagnosing and fixing common issues with the StackWise platform, from authentication problems to performance optimization.",
      content: `# StackWise Troubleshooting Guide

This guide covers the most common issues users encounter with StackWise and provides step-by-step solutions to resolve them quickly.

## Table of Contents
1. [Authentication Issues](#authentication)
2. [Stack Management Problems](#stack-management)
3. [Performance Issues](#performance)
4. [Cost Tracking Problems](#cost-tracking)
5. [Integration Failures](#integrations)
6. [UI/UX Issues](#ui-issues)
7. [Data Sync Problems](#data-sync)
8. [API Connection Issues](#api-issues)

## Authentication Issues {#authentication}

### Problem: Cannot Log In to StackWise
**Symptoms:**
- Login form shows "Invalid credentials" error
- Login button doesn't respond
- Redirected to login page after successful authentication

**Solutions:**

#### Step 1: Verify Credentials
\`\`\`bash
# Check if you're using the correct email format
# Ensure no extra spaces in email/password
# Try resetting password if unsure
\`\`\`

#### Step 2: Clear Browser Data
\`\`\`javascript
// Clear browser cache and cookies
// In Chrome: Settings > Privacy > Clear browsing data
// Select "All time" and include:
// - Cookies and other site data
// - Cached images and files
\`\`\`

#### Step 3: Check Session Storage
\`\`\`javascript
// Open browser console (F12) and run:
localStorage.clear();
sessionStorage.clear();
// Then refresh the page and try logging in again
\`\`\`

#### Step 4: Verify Network Connection
\`\`\`bash
# Test API connectivity
curl -X GET "https://your-stackwise-domain.com/api/user" \\
  -H "Content-Type: application/json"

# Expected response should be 401 Unauthorized (not 404 or timeout)
\`\`\`

**Common Causes:**
- Expired session tokens
- Browser extension conflicts
- Network firewall blocking API calls
- Outdated cached authentication data

### Problem: Session Expires Too Quickly
**Solutions:**

1. **Check token expiration settings**
\`\`\`javascript
// In browser console, check current token
const token = localStorage.getItem('auth_token');
if (token) {
  console.log('Token payload:', JSON.parse(atob(token.split('.')[1])));
}
\`\`\`

2. **Enable "Remember Me" option**
3. **Contact admin to adjust session timeout**

## Stack Management Problems {#stack-management}

### Problem: Tools Not Saving to My Stack
**Symptoms:**
- Tools appear to be added but disappear after page refresh
- "Save" button shows loading state indefinitely
- Error messages when adding tools

**Solutions:**

#### Step 1: Check Browser Console
\`\`\`javascript
// Open developer tools (F12) and look for errors like:
// - "Failed to fetch"
// - "Network request failed"
// - "Unauthorized" (401 errors)
\`\`\`

#### Step 2: Verify Tool Data Format
\`\`\`javascript
// Ensure you're providing valid data:
const validToolData = {
  toolId: "tool-id-string",
  monthlyCost: 29.99, // Number, not string
  quantity: 1, // Integer
  isActive: true // Boolean
};
\`\`\`

#### Step 3: Test API Endpoints
\`\`\`bash
# Test adding a tool manually
curl -X POST "https://your-domain.com/api/user-tools" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "toolId": "example-tool-id",
    "monthlyCost": 10.00,
    "quantity": 1
  }'
\`\`\`

### Problem: Cost Calculations Are Incorrect
**Common Issues:**
- Monthly costs not updating after changes
- Total cost doesn't match sum of individual tools
- Historical cost data missing

**Solutions:**

1. **Refresh cost snapshots**
\`\`\`sql
-- Admin can run this to recalculate costs
UPDATE user_tools 
SET monthly_cost = CASE 
  WHEN quantity IS NULL THEN 0
  ELSE monthly_cost * quantity 
END
WHERE user_id = 'YOUR_USER_ID';
\`\`\`

2. **Check for duplicate tools**
\`\`\`javascript
// In browser console, check for duplicates:
fetch('/api/user-tools')
  .then(r => r.json())
  .then(tools => {
    const toolIds = tools.map(t => t.toolId);
    const duplicates = toolIds.filter((id, index) => toolIds.indexOf(id) !== index);
    console.log('Duplicate tool IDs:', duplicates);
  });
\`\`\`

## Performance Issues {#performance}

### Problem: StackWise Loads Slowly
**Symptoms:**
- Pages take more than 3 seconds to load
- JavaScript errors in console
- White screen on page load

**Diagnostic Steps:**

#### Step 1: Check Network Performance
\`\`\`javascript
// Run in browser console to measure load times
performance.getEntriesByType('navigation').forEach(entry => {
  console.log('Page load time:', entry.loadEventEnd - entry.fetchStart, 'ms');
  console.log('DOM ready:', entry.domContentLoadedEventEnd - entry.fetchStart, 'ms');
});
\`\`\`

#### Step 2: Identify Slow API Calls
\`\`\`javascript
// Monitor API response times
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const start = performance.now();
  return originalFetch.apply(this, args).then(response => {
    console.log(\`API call to \${args[0]} took \${performance.now() - start}ms\`);
    return response;
  });
};
\`\`\`

#### Step 3: Check Memory Usage
\`\`\`javascript
// Monitor memory usage
console.log('Memory usage:', performance.memory);

// Check for memory leaks
setInterval(() => {
  console.log('Current memory:', performance.memory.usedJSHeapSize);
}, 5000);
\`\`\`

**Solutions:**
1. **Enable browser caching**
2. **Reduce concurrent API calls**
3. **Use pagination for large datasets**
4. **Optimize images and assets**

### Problem: Search Is Slow or Inaccurate
**Solutions:**

1. **Clear search cache**
\`\`\`javascript
// Clear search-related localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('search') || key.includes('filter')) {
    localStorage.removeItem(key);
  }
});
\`\`\`

2. **Use more specific search terms**
3. **Try category-specific searches**

## Cost Tracking Problems {#cost-tracking}

### Problem: Cost History Missing or Inaccurate
**Symptoms:**
- Charts show no data or incorrect trends
- Monthly snapshots are missing
- Cost calculations don't match expectations

**Solutions:**

#### Step 1: Verify Data Collection
\`\`\`javascript
// Check if cost snapshots are being created
fetch('/api/cost-snapshots')
  .then(r => r.json())
  .then(snapshots => {
    console.log('Latest snapshots:', snapshots.slice(0, 5));
    if (snapshots.length === 0) {
      console.log('No cost snapshots found - contact support');
    }
  });
\`\`\`

#### Step 2: Manual Cost Recalculation
\`\`\`javascript
// Trigger manual cost calculation
fetch('/api/tools/recalculate-costs', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${localStorage.getItem('auth_token')}\`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
\`\`\`

## Integration Failures {#integrations}

### Problem: GitHub Integration Not Working
**Common Issues:**
- Repository import fails
- Analysis gets stuck
- Missing detected tools

**Solutions:**

#### Step 1: Verify GitHub Access
\`\`\`bash
# Test GitHub API access
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \\
  https://api.github.com/user/repos
\`\`\`

#### Step 2: Check Repository Permissions
- Ensure repository is public or you have access
- Verify GitHub token has \`repo\` scope
- Check if repository URL is correct

#### Step 3: Retry Import Process
\`\`\`javascript
// Clear any cached analysis data
fetch('/api/repository-analyses', {method: 'DELETE'})
  .then(() => console.log('Cleared cached analyses'));
\`\`\`

### Problem: Third-Party Tool API Limits
**Solutions:**

1. **Check API rate limits**
\`\`\`javascript
// Monitor API response headers
fetch('/api/tools')
  .then(response => {
    console.log('Rate limit:', response.headers.get('X-RateLimit-Remaining'));
    console.log('Reset time:', response.headers.get('X-RateLimit-Reset'));
  });
\`\`\`

2. **Implement request queuing**
3. **Use alternative data sources**

## UI/UX Issues {#ui-issues}

### Problem: Interface Elements Not Responding
**Common Causes:**
- JavaScript errors preventing event handlers
- CSS conflicts affecting clickable areas
- Browser compatibility issues

**Solutions:**

#### Step 1: Check for JavaScript Errors
\`\`\`javascript
// Monitor for errors
window.addEventListener('error', (e) => {
  console.error('JavaScript error:', e.error);
});
\`\`\`

#### Step 2: Verify CSS Loading
\`\`\`javascript
// Check if all stylesheets loaded
const links = document.querySelectorAll('link[rel="stylesheet"]');
links.forEach(link => {
  console.log(\`CSS loaded: \${link.href} - \${link.sheet ? 'Yes' : 'No'}\`);
});
\`\`\`

#### Step 3: Test Different Browsers
- Try Chrome, Firefox, Safari
- Disable browser extensions
- Test in incognito/private mode

### Problem: Mobile Interface Issues
**Solutions:**

1. **Check viewport meta tag**
\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

2. **Test responsive breakpoints**
\`\`\`css
/* Test these breakpoints in browser dev tools */
@media (max-width: 768px) { /* Tablet */ }
@media (max-width: 480px) { /* Mobile */ }
\`\`\`

## Data Sync Problems {#data-sync}

### Problem: Changes Not Persisting
**Diagnostic Steps:**

1. **Check network connectivity**
2. **Verify API responses**
\`\`\`javascript
// Log all API responses
const logResponses = (response) => {
  console.log(\`API \${response.url}: \${response.status}\`);
  return response;
};

// Use with fetch
fetch('/api/endpoint').then(logResponses);
\`\`\`

3. **Test offline/online scenarios**

### Problem: Conflicting Data Between Devices
**Solutions:**

1. **Force data refresh**
\`\`\`javascript
// Clear all caches and reload
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
location.reload(true);
\`\`\`

2. **Check for multiple browser sessions**
3. **Verify account consistency**

## API Connection Issues {#api-issues}

### Problem: API Requests Failing
**Common Status Codes and Solutions:**

#### 401 Unauthorized
- Token expired → Re-login
- Invalid token → Clear localStorage and re-login
- Missing Authorization header → Check client code

#### 403 Forbidden
- Insufficient permissions → Contact admin
- Resource access denied → Verify user role

#### 404 Not Found
- Incorrect API endpoint → Check API documentation
- Resource doesn't exist → Verify resource ID

#### 429 Too Many Requests
- Rate limit exceeded → Implement retry logic
- Too many concurrent requests → Add request queuing

#### 500 Internal Server Error
- Server-side error → Check server logs
- Database connection issues → Contact support

**Generic API Debugging:**

\`\`\`javascript
// Comprehensive API error handler
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${localStorage.getItem('auth_token')}\`,
        ...options.headers
      }
    });

    console.log(\`API Call: \${options.method || 'GET'} \${url}\`);
    console.log(\`Status: \${response.status} \${response.statusText}\`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error:', errorBody);
      throw new Error(\`API Error: \${response.status} - \${errorBody}\`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Usage example
apiCall('/api/tools', { method: 'GET' })
  .then(tools => console.log('Tools loaded:', tools))
  .catch(error => console.error('Failed to load tools:', error));
\`\`\`

## General Debugging Tips

### Browser Developer Tools
1. **Network Tab**: Monitor API calls and response times
2. **Console Tab**: Check for JavaScript errors
3. **Application Tab**: Inspect localStorage, sessionStorage, cookies
4. **Performance Tab**: Analyze page load and runtime performance

### Common Debugging Commands
\`\`\`javascript
// Clear all browser storage
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('stackwise');

// Reset to factory defaults
if (confirm('Reset all StackWise data?')) {
  localStorage.clear();
  sessionStorage.clear();
  location.href = '/login';
}

// Export user data for debugging
const userData = {
  localStorage: {...localStorage},
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString()
};
console.log('User debug data:', JSON.stringify(userData, null, 2));
\`\`\`

### Getting Help

If these solutions don't resolve your issue:

1. **Check the status page** for known outages
2. **Search the community forum** for similar issues
3. **Contact support** with:
   - Browser and OS version
   - Steps to reproduce the issue
   - Screenshots or error messages
   - Browser console logs
   - Network tab information

### Performance Optimization

For optimal StackWise performance:

1. **Use supported browsers** (Chrome 90+, Firefox 88+, Safari 14+)
2. **Enable JavaScript** and disable ad blockers on StackWise
3. **Maintain stable internet connection** (minimum 1 Mbps)
4. **Keep browser updated** to latest version
5. **Close unnecessary browser tabs** to free up memory

Remember: Most issues can be resolved by clearing browser cache and logging in again. If problems persist, contact our support team with detailed information about your setup and the steps you've tried.`,
      contentType: "troubleshooting",
      difficulty: "beginner",
      estimatedReadTime: 25,
      categoryId: "troubleshooting",
      authorId: null,
      isFeatured: true,
      isPublished: true,
      tags: ["troubleshooting", "beginner", "guide", "debugging"],
      frameworks: [],
      languages: ["JavaScript"],
      prerequisites: ["Basic web browser usage", "Basic understanding of web applications"],
      keyPoints: [
        "Most issues can be resolved by clearing browser cache and cookies",
        "Check browser console for JavaScript errors first",
        "Verify API connectivity and authentication status",
        "Test in different browsers to isolate browser-specific issues",
        "Monitor network requests to identify API problems"
      ]
    },

    {
      title: "Performance Troubleshooting: Optimizing Your StackWise Experience",
      slug: "performance-troubleshooting-guide",
      excerpt: "Detailed guide for diagnosing and fixing performance issues in StackWise, including slow loading times, memory leaks, and optimization strategies.",
      content: `# Performance Troubleshooting Guide

Is StackWise running slowly? This comprehensive guide will help you identify and resolve performance bottlenecks for a smooth, fast experience.

## Quick Performance Checks

### 1. Basic Performance Test
Run this in your browser console to get baseline metrics:

\`\`\`javascript
// Performance diagnostic script
const performanceTest = () => {
  const nav = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  
  console.log('=== StackWise Performance Report ===');
  console.log(\`Page Load Time: \${Math.round(nav.loadEventEnd - nav.fetchStart)}ms\`);
  console.log(\`DOM Ready: \${Math.round(nav.domContentLoadedEventEnd - nav.fetchStart)}ms\`);
  console.log(\`First Paint: \${Math.round(paint[0]?.startTime || 0)}ms\`);
  console.log(\`First Contentful Paint: \${Math.round(paint[1]?.startTime || 0)}ms\`);
  
  if (performance.memory) {
    console.log(\`Memory Used: \${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB\`);
    console.log(\`Memory Limit: \${Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)}MB\`);
  }
  
  console.log('==============================');
};

performanceTest();
\`\`\`

### 2. Network Performance Check
\`\`\`javascript
// Monitor API response times
const monitorAPI = () => {
  const originalFetch = window.fetch;
  const apiTimes = [];
  
  window.fetch = function(...args) {
    const start = performance.now();
    const url = args[0];
    
    return originalFetch.apply(this, args).then(response => {
      const duration = Math.round(performance.now() - start);
      apiTimes.push({ url, duration, status: response.status });
      
      if (duration > 1000) {
        console.warn(\`Slow API call: \${url} took \${duration}ms\`);
      }
      
      return response;
    }).catch(error => {
      console.error(\`API call failed: \${url}\`, error);
      throw error;
    });
  };
  
  // Report API performance every 30 seconds
  setInterval(() => {
    if (apiTimes.length > 0) {
      const avgTime = apiTimes.reduce((sum, call) => sum + call.duration, 0) / apiTimes.length;
      console.log(\`Average API response time: \${Math.round(avgTime)}ms\`);
      console.log('Slowest calls:', apiTimes.filter(call => call.duration > 500));
      apiTimes.length = 0; // Clear array
    }
  }, 30000);
};

monitorAPI();
\`\`\`

## Common Performance Issues

### Issue 1: Slow Initial Page Load

**Symptoms:**
- White screen for 3+ seconds
- Progress bar stuck at 0%
- Browser shows "Loading..." for extended time

**Causes & Solutions:**

#### Large Bundle Size
\`\`\`javascript
// Check bundle sizes
const checkBundleSize = () => {
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(async (script) => {
    try {
      const response = await fetch(script.src, { method: 'HEAD' });
      const size = response.headers.get('content-length');
      if (size > 500000) { // 500KB+
        console.warn(\`Large script detected: \${script.src} (\${Math.round(size/1024)}KB)\`);
      }
    } catch (e) {
      console.log(\`Could not check size for: \${script.src}\`);
    }
  });
};

checkBundleSize();
\`\`\`

**Solutions:**
1. Clear browser cache completely
2. Disable browser extensions temporarily
3. Check internet connection speed (minimum 5 Mbps recommended)

#### Slow Database Queries
If you're an admin, check for slow queries:
\`\`\`sql
-- Check for slow queries (PostgreSQL)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE mean_time > 1000 -- queries taking > 1 second
ORDER BY mean_time DESC
LIMIT 10;
\`\`\`

### Issue 2: Slow Navigation Between Pages

**Symptoms:**
- Clicking links takes 2+ seconds to respond
- Page transitions feel sluggish
- Browser freezes briefly during navigation

**Diagnosis:**
\`\`\`javascript
// Monitor route changes
const monitorRouting = () => {
  let routeStartTime;
  
  // Monitor hash changes (if using hash routing)
  window.addEventListener('hashchange', () => {
    if (routeStartTime) {
      console.log(\`Route change took: \${performance.now() - routeStartTime}ms\`);
    }
    routeStartTime = performance.now();
  });
  
  // Monitor history API (if using browser routing)
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    routeStartTime = performance.now();
    return originalPushState.apply(this, args);
  };
};

monitorRouting();
\`\`\`

**Solutions:**
1. **Enable route preloading**
2. **Reduce component re-renders**
3. **Implement lazy loading for heavy components**

### Issue 3: Memory Leaks

**Symptoms:**
- Browser becomes slower over time
- High memory usage in Task Manager
- Eventually browser tab crashes

**Detection:**
\`\`\`javascript
// Memory leak detector
const detectMemoryLeaks = () => {
  const baseline = performance.memory?.usedJSHeapSize || 0;
  let samples = [];
  
  setInterval(() => {
    if (performance.memory) {
      const current = performance.memory.usedJSHeapSize;
      samples.push(current);
      
      // Keep only last 10 samples
      if (samples.length > 10) {
        samples.shift();
      }
      
      // Check if memory is consistently growing
      if (samples.length === 10) {
        const trend = samples[9] - samples[0];
        const avgGrowth = trend / 9;
        
        if (avgGrowth > 1024 * 1024) { // 1MB+ growth per sample
          console.warn('Potential memory leak detected!');
          console.log(\`Memory growing by ~\${Math.round(avgGrowth/1024/1024)}MB per check\`);
          console.log('Current usage:', Math.round(current/1024/1024), 'MB');
        }
      }
    }
  }, 5000); // Check every 5 seconds
};

detectMemoryLeaks();
\`\`\`

**Solutions:**
1. **Refresh the page periodically**
2. **Close unused browser tabs**
3. **Disable heavy browser extensions**
4. **Report to support team if persistent**

### Issue 4: Slow Search and Filtering

**Symptoms:**
- Search results take 3+ seconds to appear
- Typing in search box feels laggy
- Filters don't respond immediately

**Optimization:**
\`\`\`javascript
// Optimize search performance
const optimizeSearch = () => {
  let searchTimeout;
  
  const searchInput = document.querySelector('[data-testid="input-search"]');
  if (searchInput) {
    // Implement debouncing
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        console.log('Searching for:', e.target.value);
        // Actual search logic would go here
      }, 300); // Wait 300ms after user stops typing
    });
  }
  
  // Clear search cache if it gets too large
  const searchCache = JSON.parse(localStorage.getItem('searchCache') || '{}');
  if (Object.keys(searchCache).length > 100) {
    localStorage.removeItem('searchCache');
    console.log('Cleared search cache (too large)');
  }
};

optimizeSearch();
\`\`\`

**Solutions:**
1. **Use more specific search terms**
2. **Apply category filters before searching**
3. **Clear search cache regularly**

### Issue 5: Slow Chart and Graph Rendering

**Symptoms:**
- Charts take a long time to load
- Graphs appear incomplete
- Page becomes unresponsive when viewing analytics

**Diagnosis:**
\`\`\`javascript
// Monitor chart performance
const monitorCharts = () => {
  const chartContainers = document.querySelectorAll('[class*="chart"], [class*="graph"]');
  
  chartContainers.forEach((container, index) => {
    const observer = new MutationObserver((mutations) => {
      const start = performance.now();
      
      setTimeout(() => {
        const duration = performance.now() - start;
        if (duration > 2000) {
          console.warn(\`Chart \${index + 1} took \${Math.round(duration)}ms to render\`);
        }
      }, 100);
    });
    
    observer.observe(container, { childList: true, subtree: true });
  });
};

// Run after page loads
setTimeout(monitorCharts, 1000);
\`\`\`

**Solutions:**
1. **Reduce data points in charts** (use aggregation)
2. **Enable chart lazy loading**
3. **Use simpler chart types for large datasets**

## Browser-Specific Optimizations

### Chrome Optimizations
\`\`\`javascript
// Chrome-specific performance settings
const optimizeChrome = () => {
  // Check if hardware acceleration is enabled
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    console.warn('Hardware acceleration may be disabled. Enable in Chrome settings.');
  }
  
  // Monitor Chrome memory usage
  if (performance.memory) {
    const memoryPressure = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    if (memoryPressure > 0.9) {
      console.warn('High memory pressure detected. Consider closing other tabs.');
    }
  }
};

optimizeChrome();
\`\`\`

### Firefox Optimizations
1. **Enable hardware acceleration** in Firefox settings
2. **Disable unnecessary add-ons**
3. **Set \`dom.ipc.processCount\` to 4-8** in about:config

### Safari Optimizations
1. **Enable "Develop" menu** and disable "Disable JavaScript"
2. **Clear website data** regularly
3. **Disable Safari extensions** that might interfere

## Mobile Performance

### iOS Safari Issues
\`\`\`javascript
// iOS Safari specific fixes
const fixIOSSafari = () => {
  // Prevent viewport zoom on input focus
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      if (window.innerWidth < 768) {
        document.querySelector('meta[name="viewport"]')
          ?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
      }
    });
    
    input.addEventListener('blur', () => {
      document.querySelector('meta[name="viewport"]')
        ?.setAttribute('content', 'width=device-width, initial-scale=1');
    });
  });
  
  // Fix iOS scroll performance
  document.body.style.webkitOverflowScrolling = 'touch';
};

if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
  fixIOSSafari();
}
\`\`\`

### Android Chrome Issues
\`\`\`javascript
// Android Chrome optimizations
const optimizeAndroidChrome = () => {
  // Reduce animations on low-end devices
  const isLowEndDevice = navigator.hardwareConcurrency <= 2 || 
                        (performance.memory && performance.memory.jsHeapSizeLimit < 1073741824);
  
  if (isLowEndDevice) {
    document.body.classList.add('reduced-motion');
    console.log('Reduced motion enabled for low-end device');
  }
  
  // Optimize touch events
  document.addEventListener('touchstart', () => {}, { passive: true });
  document.addEventListener('touchmove', () => {}, { passive: true });
};

if (/Android/.test(navigator.userAgent)) {
  optimizeAndroidChrome();
}
\`\`\`

## Network Optimization

### Enable Compression
Check if gzip compression is working:
\`\`\`javascript
// Check compression
fetch('/api/tools', { method: 'HEAD' })
  .then(response => {
    const encoding = response.headers.get('content-encoding');
    if (encoding && encoding.includes('gzip')) {
      console.log('✓ Gzip compression enabled');
    } else {
      console.warn('⚠ Gzip compression not detected - contact admin');
    }
  });
\`\`\`

### Optimize Image Loading
\`\`\`javascript
// Lazy load images
const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
};

lazyLoadImages();
\`\`\`

## Database Performance (For Admins)

### Slow Query Detection
\`\`\`sql
-- Find slow queries affecting StackWise
SELECT 
  query,
  calls,
  total_time / calls as avg_time_ms,
  rows / calls as avg_rows,
  (shared_blks_hit + shared_blks_read) / calls as avg_buffer_access
FROM pg_stat_statements
WHERE query LIKE '%user_tools%' OR query LIKE '%tools%'
ORDER BY total_time DESC
LIMIT 20;

-- Check for missing indexes
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  seq_tup_read / seq_scan as avg_read_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 1000 AND seq_tup_read / seq_scan > 10000
ORDER BY seq_tup_read DESC;
\`\`\`

### Index Optimization
\`\`\`sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_user_tools_user_active 
ON user_tools(user_id) WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_tools_category_popularity 
ON tools(category, popularity_score DESC);

CREATE INDEX CONCURRENTLY idx_doc_articles_published_featured
ON documentation_articles(is_published, is_featured, created_at DESC);
\`\`\`

## Performance Monitoring Setup

### Long-term Performance Tracking
\`\`\`javascript
// Set up performance monitoring
const setupPerformanceMonitoring = () => {
  const perfData = {
    pageLoads: [],
    apiCalls: [],
    errors: []
  };
  
  // Track page load performance
  window.addEventListener('load', () => {
    const nav = performance.getEntriesByType('navigation')[0];
    perfData.pageLoads.push({
      timestamp: Date.now(),
      loadTime: nav.loadEventEnd - nav.fetchStart,
      domTime: nav.domContentLoadedEventEnd - nav.fetchStart,
      url: location.pathname
    });
    
    // Keep only last 50 entries
    if (perfData.pageLoads.length > 50) {
      perfData.pageLoads.shift();
    }
    
    localStorage.setItem('stackwise_perf', JSON.stringify(perfData));
  });
  
  // Track errors
  window.addEventListener('error', (e) => {
    perfData.errors.push({
      timestamp: Date.now(),
      message: e.message,
      filename: e.filename,
      line: e.lineno
    });
  });
  
  // Report performance weekly
  const lastReport = localStorage.getItem('stackwise_perf_report');
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  if (!lastReport || parseInt(lastReport) < weekAgo) {
    console.log('=== Weekly Performance Report ===');
    if (perfData.pageLoads.length > 0) {
      const avgLoad = perfData.pageLoads.reduce((sum, load) => sum + load.loadTime, 0) / perfData.pageLoads.length;
      console.log(\`Average page load: \${Math.round(avgLoad)}ms\`);
    }
    console.log(\`Errors this week: \${perfData.errors.length}\`);
    localStorage.setItem('stackwise_perf_report', Date.now().toString());
  }
};

setupPerformanceMonitoring();
\`\`\`

## When to Contact Support

Contact the StackWise support team if you experience:

1. **Consistent load times over 5 seconds**
2. **Frequent browser crashes**
3. **Memory usage consistently over 1GB**
4. **API calls timing out regularly**
5. **Performance degradation that persists after trying these solutions**

### Performance Report Template
When contacting support, include:

\`\`\`javascript
// Generate performance report for support
const generateSupportReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    viewport: \`\${window.innerWidth}x\${window.innerHeight}\`,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : 'Unknown',
    memory: performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    } : 'Unknown',
    performance: {
      navigation: performance.getEntriesByType('navigation')[0],
      paint: performance.getEntriesByType('paint')
    },
    localStorage: Object.keys(localStorage).length,
    sessionStorage: Object.keys(sessionStorage).length
  };
  
  console.log('Performance Report for Support:');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
};

// Run this and include the output when contacting support
generateSupportReport();
\`\`\`

## Summary

The key to optimal StackWise performance:

1. **Keep browser updated** and enable hardware acceleration
2. **Clear cache regularly** (weekly recommended)
3. **Monitor memory usage** and close unnecessary tabs
4. **Use supported browsers** with good internet connection
5. **Report persistent issues** to support with detailed information

Most performance issues can be resolved by clearing browser cache and ensuring a stable internet connection. For persistent problems, the diagnostic scripts in this guide will help identify the specific issue.`,
      contentType: "troubleshooting",
      difficulty: "intermediate",
      estimatedReadTime: 30,
      categoryId: "troubleshooting",
      authorId: null,
      isFeatured: false,
      isPublished: true,
      tags: ["troubleshooting", "performance", "intermediate", "optimization"],
      frameworks: [],
      languages: ["JavaScript"],
      prerequisites: ["Browser developer tools knowledge", "Basic understanding of web performance"],
      keyPoints: [
        "Most performance issues stem from browser cache or network problems",
        "Use browser developer tools to identify bottlenecks",
        "Monitor memory usage to detect leaks early",
        "Enable hardware acceleration for better graphics performance",
        "Regular maintenance prevents most performance degradation"
      ]
    },

    // Best Practices articles
    {
      title: "Tech Stack Selection: A Strategic Guide to Building Your Perfect Stack",
      slug: "tech-stack-selection-guide",
      excerpt: "Complete guide to selecting the right technologies for your project, considering factors like team size, budget, scalability, and long-term maintenance.",
      content: `# Tech Stack Selection: Building Your Perfect Stack

Choosing the right technology stack is one of the most important decisions in any project. This guide provides a strategic framework for making informed decisions that align with your goals, constraints, and team capabilities.

## Understanding Stack Selection Criteria

### Project Requirements Analysis

Before diving into specific technologies, evaluate your project requirements systematically:

#### 1. Functional Requirements
\`\`\`typescript
// Example requirements matrix
interface ProjectRequirements {
  userBase: 'small' | 'medium' | 'large' | 'enterprise';
  realTimeFeatures: boolean;
  dataComplexity: 'simple' | 'moderate' | 'complex';
  integrationNeeds: string[];
  complianceRequirements: string[]; // GDPR, HIPAA, SOC2, etc.
  mobileSupport: 'none' | 'responsive' | 'native' | 'hybrid';
  offlineCapabilities: boolean;
}

const projectMatrix: ProjectRequirements = {
  userBase: 'medium',
  realTimeFeatures: true,
  dataComplexity: 'moderate',
  integrationNeeds: ['payment', 'analytics', 'email'],
  complianceRequirements: ['GDPR'],
  mobileSupport: 'responsive',
  offlineCapabilities: false
};
\`\`\`

#### 2. Non-Functional Requirements
- **Performance**: Response time expectations, throughput needs
- **Scalability**: Expected growth patterns, load characteristics
- **Security**: Data sensitivity, authentication requirements
- **Availability**: Uptime requirements, disaster recovery needs
- **Maintainability**: Code quality standards, documentation needs

### Team Considerations

#### Current Team Skills
\`\`\`javascript
// Assess your team's expertise
const teamSkillsAssessment = {
  frontend: {
    javascript: 'expert',
    typescript: 'intermediate',
    react: 'expert',
    vue: 'beginner',
    angular: 'none'
  },
  backend: {
    nodejs: 'expert',
    python: 'intermediate',
    java: 'beginner',
    go: 'none'
  },
  database: {
    postgresql: 'intermediate',
    mongodb: 'beginner',
    redis: 'intermediate'
  },
  devops: {
    docker: 'intermediate',
    kubernetes: 'beginner',
    aws: 'intermediate',
    cicd: 'expert'
  }
};
\`\`\`

#### Learning Capacity
- Time available for learning new technologies
- Training budget and resources
- Risk tolerance for adopting new tools

### Budget Constraints

#### Development Costs
\`\`\`typescript
interface StackCosts {
  tooling: {
    development: number; // IDEs, testing tools, etc.
    ci_cd: number;
    monitoring: number;
  };
  infrastructure: {
    hosting: number;
    databases: number;
    cdn: number;
    third_party_services: number;
  };
  licenses: {
    commercial_tools: number;
    support_contracts: number;
  };
  maintenance: {
    security_updates: number;
    version_upgrades: number;
    dependency_management: number;
  };
}
\`\`\`

#### Hidden Costs to Consider
- Learning curve impact on velocity
- Migration costs if technology needs to change
- Vendor lock-in implications
- Compliance and security tool requirements

## Stack Architecture Patterns

### Monolithic Architecture
**Best For:**
- Small to medium teams (2-8 developers)
- Rapid prototyping and MVP development
- Simple deployment requirements
- Limited scalability needs

**Technology Combinations:**
\`\`\`typescript
// Example monolithic stack
const monolithicStack = {
  frontend: 'React + Next.js',
  backend: 'Node.js + Express',
  database: 'PostgreSQL',
  authentication: 'NextAuth.js',
  deployment: 'Vercel/Netlify + Railway/PlanetScale'
};
\`\`\`

### Microservices Architecture
**Best For:**
- Large teams (10+ developers)
- Complex business domains
- High scalability requirements
- Independent service deployment needs

**Technology Combinations:**
\`\`\`typescript
// Example microservices stack
const microservicesStack = {
  frontend: 'React SPA',
  apiGateway: 'Kong/AWS API Gateway',
  services: {
    userService: 'Node.js + Fastify',
    paymentService: 'Python + FastAPI',
    notificationService: 'Go + Gin'
  },
  databases: {
    users: 'PostgreSQL',
    sessions: 'Redis',
    analytics: 'ClickHouse'
  },
  messageQueue: 'RabbitMQ/Apache Kafka',
  orchestration: 'Kubernetes',
  monitoring: 'Prometheus + Grafana'
};
\`\`\`

### Serverless Architecture
**Best For:**
- Variable or unpredictable traffic
- Event-driven applications
- Minimal operations overhead
- Pay-per-use cost model preference

**Technology Combinations:**
\`\`\`typescript
// Example serverless stack
const serverlessStack = {
  frontend: 'React + Next.js',
  functions: 'AWS Lambda/Vercel Functions',
  database: 'DynamoDB/FaunaDB',
  storage: 'AWS S3',
  authentication: 'Auth0/AWS Cognito',
  api: 'GraphQL + Apollo',
  deployment: 'Serverless Framework/SAM'
};
\`\`\`

## Technology Selection Framework

### Frontend Technology Selection

#### React Ecosystem
**Choose When:**
- Large community and ecosystem needed
- Complex state management requirements
- Team has JavaScript/TypeScript expertise
- Long-term project with evolving requirements

**Stack Example:**
\`\`\`typescript
const reactStack = {
  core: 'React 18+',
  language: 'TypeScript',
  bundler: 'Vite/Next.js',
  stateManagement: 'Zustand/Redux Toolkit',
  styling: 'Tailwind CSS + HeadlessUI',
  testing: 'Jest + React Testing Library',
  routing: 'React Router/Next.js Router'
};
\`\`\`

#### Vue.js Ecosystem
**Choose When:**
- Gentle learning curve preferred
- Progressive adoption needed
- Smaller bundle size important
- Team transitioning from jQuery/vanilla JS

#### Svelte/SvelteKit
**Choose When:**
- Performance is critical
- Minimal bundle size needed
- Simple, readable code preferred
- Small to medium project scope

### Backend Technology Selection

#### Node.js
**Pros:**
- JavaScript expertise reuse
- Large ecosystem (npm)
- Excellent for I/O-intensive applications
- Strong community support

**Cons:**
- Single-threaded limitations
- Memory usage concerns at scale
- Callback complexity (though mitigated by async/await)

**Best Use Cases:**
\`\`\`typescript
const nodejsUseCases = [
  'API development',
  'Real-time applications (Socket.io)',
  'Microservices',
  'Serverless functions',
  'Full-stack JavaScript applications'
];
\`\`\`

#### Python
**Pros:**
- Excellent for data processing
- Machine learning ecosystem
- Readable, maintainable code
- Strong standard library

**Best Use Cases:**
\`\`\`python
# Python excels in:
use_cases = [
    "Data analysis and processing",
    "Machine learning APIs",
    "Scientific computing",
    "Automation and scripting",
    "Backend services with complex logic"
]
\`\`\`

#### Go
**Pros:**
- Excellent performance
- Built-in concurrency
- Fast compilation
- Great for system programming

**Best Use Cases:**
- High-performance APIs
- System tools and CLI applications
- Microservices requiring high throughput
- Container orchestration tools

### Database Selection

#### PostgreSQL
**Choose When:**
\`\`\`sql
-- PostgreSQL excels for:
-- Complex queries and joins
-- ACID compliance requirements
-- JSON/JSONB support needed
-- Strong consistency requirements
-- Advanced indexing needs

-- Example use case
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  profile_data JSONB,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create GIN index for fast JSON queries
CREATE INDEX idx_profile_data ON user_profiles USING GIN (profile_data);
\`\`\`

#### MongoDB
**Choose When:**
- Rapid prototyping needed
- Schema flexibility required
- Document-based data model fits naturally
- Horizontal scaling planned

#### Redis
**Choose When:**
- Caching layer needed
- Session storage required
- Real-time features (pub/sub)
- Fast data access critical

## Decision Matrix Framework

### Technology Evaluation Scorecard
\`\`\`typescript
interface TechnologyScore {
  name: string;
  criteria: {
    teamExpertise: number; // 1-5 scale
    communitySupport: number;
    documentation: number;
    performance: number;
    scalability: number;
    maintenance: number;
    cost: number;
    futureProofing: number;
  };
  weightedScore: number;
}

const evaluateStack = (
  technologies: TechnologyScore[], 
  weights: Record<keyof TechnologyScore['criteria'], number>
): TechnologyScore[] => {
  return technologies.map(tech => ({
    ...tech,
    weightedScore: Object.entries(tech.criteria).reduce((sum, [key, value]) => {
      return sum + (value * weights[key as keyof typeof weights]);
    }, 0)
  })).sort((a, b) => b.weightedScore - a.weightedScore);
};

// Example evaluation
const frontendOptions: TechnologyScore[] = [
  {
    name: 'React',
    criteria: {
      teamExpertise: 5,
      communitySupport: 5,
      documentation: 4,
      performance: 4,
      scalability: 5,
      maintenance: 4,
      cost: 5,
      futureProofing: 5
    },
    weightedScore: 0
  },
  {
    name: 'Vue.js',
    criteria: {
      teamExpertise: 3,
      communitySupport: 4,
      documentation: 5,
      performance: 4,
      scalability: 4,
      maintenance: 5,
      cost: 5,
      futureProofing: 4
    },
    weightedScore: 0
  }
];

const weights = {
  teamExpertise: 0.2,
  communitySupport: 0.15,
  documentation: 0.1,
  performance: 0.15,
  scalability: 0.15,
  maintenance: 0.1,
  cost: 0.1,
  futureProofing: 0.05
};

const rankedOptions = evaluateStack(frontendOptions, weights);
\`\`\`

## Stack Templates by Use Case

### E-commerce Platform
\`\`\`typescript
const ecommerceStack = {
  frontend: {
    customer: 'Next.js + React + Tailwind CSS',
    admin: 'React + TypeScript + Ant Design'
  },
  backend: {
    api: 'Node.js + Express + TypeScript',
    payment: 'Stripe + PayPal integration',
    inventory: 'Python + FastAPI'
  },
  database: {
    primary: 'PostgreSQL',
    cache: 'Redis',
    search: 'Elasticsearch'
  },
  infrastructure: {
    hosting: 'AWS/Google Cloud',
    cdn: 'CloudFlare',
    monitoring: 'DataDog/New Relic'
  },
  estimated_cost: '$500-2000/month',
  team_size: '4-8 developers',
  timeline: '4-8 months'
};
\`\`\`

### SaaS Application
\`\`\`typescript
const saasStack = {
  frontend: 'React + TypeScript + React Query',
  backend: 'Node.js + Fastify + Prisma',
  database: 'PostgreSQL + Redis',
  authentication: 'Auth0/Supabase Auth',
  payments: 'Stripe',
  analytics: 'PostHog/Mixpanel',
  monitoring: 'Sentry + LogRocket',
  deployment: 'Vercel + Railway',
  estimated_cost: '$200-1000/month',
  team_size: '2-5 developers',
  timeline: '3-6 months'
};
\`\`\`

### Real-time Application
\`\`\`typescript
const realtimeStack = {
  frontend: 'React + Socket.io-client',
  backend: 'Node.js + Socket.io + Express',
  database: 'PostgreSQL + Redis Pub/Sub',
  messageQueue: 'Redis/RabbitMQ',
  caching: 'Redis',
  infrastructure: 'Docker + Kubernetes',
  monitoring: 'Prometheus + Grafana',
  estimated_cost: '$300-1500/month',
  team_size: '3-6 developers',
  timeline: '2-4 months'
};
\`\`\`

### Content Management System
\`\`\`typescript
const cmsStack = {
  frontend: 'Next.js + React + Tailwind CSS',
  headlessCMS: 'Strapi/Contentful/Sanity',
  backend: 'Node.js + GraphQL',
  database: 'PostgreSQL',
  media: 'Cloudinary/AWS S3',
  hosting: 'Vercel + Heroku/Railway',
  estimated_cost: '$100-500/month',
  team_size: '2-4 developers',
  timeline: '2-4 months'
};
\`\`\`

## Implementation Strategy

### Phase 1: Core Foundation (Weeks 1-2)
1. **Set up development environment**
2. **Implement basic authentication**
3. **Create core database schema**
4. **Set up CI/CD pipeline**
5. **Implement basic CRUD operations**

### Phase 2: Feature Development (Weeks 3-8)
1. **User interface implementation**
2. **Business logic development**
3. **Integration with third-party services**
4. **Testing implementation**
5. **Performance optimization**

### Phase 3: Production Preparation (Weeks 9-10)
1. **Security hardening**
2. **Performance testing**
3. **Documentation completion**
4. **Deployment automation**
5. **Monitoring setup**

## Risk Mitigation Strategies

### Technology Risk Assessment
\`\`\`typescript
interface TechnologyRisk {
  risk: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string[];
}

const commonRisks: TechnologyRisk[] = [
  {
    risk: 'Framework becomes obsolete',
    probability: 'low',
    impact: 'high',
    mitigation: [
      'Choose frameworks with strong communities',
      'Plan for gradual migration strategies',
      'Keep framework versions updated',
      'Abstract framework-specific code'
    ]
  },
  {
    risk: 'Performance doesn\'t meet requirements',
    probability: 'medium',
    impact: 'high',
    mitigation: [
      'Performance testing early and often',
      'Choose proven technologies for critical paths',
      'Plan caching strategies',
      'Design for horizontal scaling'
    ]
  },
  {
    risk: 'Team learning curve impacts timeline',
    probability: 'medium',
    impact: 'medium',
    mitigation: [
      'Invest in training upfront',
      'Start with proof of concepts',
      'Pair programming for knowledge transfer',
      'Choose technologies similar to current stack'
    ]
  }
];
\`\`\`

### Exit Strategies
Always plan for technology migration:

1. **Database Migration**: Use ORMs and avoid vendor-specific features
2. **Framework Migration**: Keep business logic separate from framework code
3. **Cloud Migration**: Use containerization and infrastructure as code
4. **Service Migration**: Design APIs with versioning and backwards compatibility

## Monitoring and Evaluation

### Success Metrics
\`\`\`typescript
interface StackSuccessMetrics {
  development: {
    velocity: number; // story points per sprint
    bugRate: number; // bugs per feature
    deploymentFrequency: number; // deployments per week
    leadTime: number; // hours from commit to production
  };
  performance: {
    pageLoadTime: number; // milliseconds
    apiResponseTime: number; // milliseconds
    uptime: number; // percentage
    errorRate: number; // percentage
  };
  business: {
    timeToMarket: number; // months
    developmentCost: number; // dollars
    maintenanceCost: number; // dollars per month
    userSatisfaction: number; // 1-10 scale
  };
}
\`\`\`

### Regular Stack Reviews
- **Quarterly**: Review performance metrics and costs
- **Bi-annually**: Assess technology landscape changes
- **Annually**: Complete stack audit and roadmap planning

## Conclusion

Successful tech stack selection requires balancing multiple factors:

### Key Principles
1. **Start with requirements, not preferences**
2. **Consider total cost of ownership**
3. **Plan for change and growth**
4. **Leverage team strengths**
5. **Choose boring technology for critical paths**
6. **Optimize for maintainability**

### Decision Process
1. **Define clear requirements and constraints**
2. **Research and evaluate options systematically**
3. **Create proof of concepts for top choices**
4. **Make data-driven decisions**
5. **Plan implementation strategy**
6. **Monitor and adjust as needed**

Remember: The "best" stack is the one that best fits your specific context, constraints, and goals. There's no one-size-fits-all solution, but following a systematic approach will lead to better decisions and successful outcomes.`,
      contentType: "guide",
      difficulty: "intermediate",
      estimatedReadTime: 25,
      categoryId: "best-practices",
      authorId: null,
      isFeatured: true,
      isPublished: true,
      tags: ["best-practices", "intermediate", "guide", "architecture", "planning"],
      frameworks: [],
      languages: ["JavaScript", "TypeScript"],
      prerequisites: ["Basic understanding of web development", "Familiarity with different technology types"],
      keyPoints: [
        "Start with requirements analysis, not technology preferences",
        "Consider total cost of ownership, not just initial development costs",
        "Balance team expertise with project requirements",
        "Plan for scalability and future changes from the beginning",
        "Use a systematic evaluation framework for decision making"
      ]
    },

    {
      title: "Integration Patterns: Connecting Your Tech Stack Effectively",
      slug: "integration-patterns-guide",
      excerpt: "Comprehensive guide to integrating different technologies in your stack, covering APIs, databases, authentication, and third-party services with real-world patterns.",
      content: `# Integration Patterns: Connecting Your Tech Stack

Building a modern application requires integrating multiple technologies, services, and systems. This guide covers proven patterns and best practices for creating robust, maintainable integrations.

## Integration Architecture Fundamentals

### Types of Integration

#### 1. API Integration
\`\`\`typescript
// RESTful API integration pattern
class APIClient {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(baseURL: string, apiKey?: string) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': \`Bearer \${apiKey}\` })
    };
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = \`\${this.baseURL}\${endpoint}\`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
    }

    return response.json();
  }

  // Wrapper methods for common operations
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Usage example
const apiClient = new APIClient('https://api.example.com', process.env.API_KEY);

// With error handling and retry logic
const fetchUserWithRetry = async (userId: string, maxRetries = 3): Promise<User> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiClient.get<User>(\`/users/\${userId}\`);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};
\`\`\`

#### 2. Database Integration
\`\`\`typescript
// Database integration with connection pooling
import { Pool } from 'pg';
import Redis from 'ioredis';

class DatabaseManager {
  private pgPool: Pool;
  private redis: Redis;

  constructor() {
    // PostgreSQL connection pool
    this.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum number of clients in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Redis connection
    this.redis = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  // PostgreSQL operations with transaction support
  async withTransaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Cache-aside pattern
  async getCachedData<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Try cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const data = await fetchFunction();
    
    // Cache the result
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }

  // Bulk operations for performance
  async batchInsert(table: string, records: any[]): Promise<void> {
    if (records.length === 0) return;

    const columns = Object.keys(records[0]);
    const values = records.map(record => 
      columns.map(col => record[col])
    );

    const placeholders = values.map((_, i) => 
      \`(\${columns.map((_, j) => \`$\${i * columns.length + j + 1}\`).join(', ')})\`
    ).join(', ');

    const query = \`
      INSERT INTO \${table} (\${columns.join(', ')})
      VALUES \${placeholders}
    \`;

    await this.pgPool.query(query, values.flat());
  }
}
\`\`\`

#### 3. Message Queue Integration
\`\`\`typescript
// Event-driven integration with message queues
import amqp from 'amqplib';

class MessageQueue {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect(): Promise<void> {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
  }

  // Publish-Subscribe pattern
  async publish(exchange: string, routingKey: string, message: any): Promise<void> {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    this.channel.publish(exchange, routingKey, messageBuffer, {
      persistent: true,
      timestamp: Date.now(),
      messageId: \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`
    });
  }

  // Worker queue pattern
  async consume(
    queue: string, 
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    await this.channel.assertQueue(queue, { durable: true });
    
    this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await handler(content);
        this.channel.ack(msg);
      } catch (error) {
        console.error('Message processing failed:', error);
        
        // Reject and requeue (with limit to prevent infinite loops)
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
        
        if (retryCount < 3) {
          await this.publish('retry-exchange', queue, {
            ...JSON.parse(msg.content.toString()),
            retryCount
          });
        }
        
        this.channel.nack(msg, false, false);
      }
    });
  }

  async close(): Promise<void> {
    await this.channel.close();
    await this.connection.close();
  }
}

// Usage example
const mq = new MessageQueue();
await mq.connect();

// Publisher
await mq.publish('user-events', 'user.created', {
  userId: '123',
  email: 'user@example.com',
  timestamp: new Date().toISOString()
});

// Consumer
await mq.consume('email-queue', async (message) => {
  await sendWelcomeEmail(message.userId, message.email);
});
\`\`\`

## Authentication Integration Patterns

### Single Sign-On (SSO) Integration
\`\`\`typescript
// OAuth 2.0 / OpenID Connect integration
import jwt from 'jsonwebtoken';
import { Issuer, Client } from 'openid-client';

class SSOIntegration {
  private client: Client;
  private issuer: any;

  async initialize(issuerUrl: string, clientId: string, clientSecret: string): Promise<void> {
    this.issuer = await Issuer.discover(issuerUrl);
    this.client = new this.issuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [process.env.REDIRECT_URI],
      response_types: ['code'],
    });
  }

  // Generate authorization URL
  getAuthUrl(state: string, nonce: string): string {
    return this.client.authorizationUrl({
      scope: 'openid email profile',
      state,
      nonce,
    });
  }

  // Handle callback and exchange code for tokens
  async handleCallback(code: string, state: string, nonce: string): Promise<any> {
    const tokenSet = await this.client.callback(
      process.env.REDIRECT_URI,
      { code, state },
      { nonce }
    );

    const userinfo = await this.client.userinfo(tokenSet.access_token);
    return { tokenSet, userinfo };
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

// Middleware for protecting routes
const authMiddleware = (ssoIntegration: SSOIntegration) => {
  return async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const user = await ssoIntegration.verifyToken(token);
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};
\`\`\`

### Multi-tenant Authentication
\`\`\`typescript
// Multi-tenant authentication pattern
class MultiTenantAuth {
  private tenantConfigs: Map<string, TenantConfig> = new Map();

  async getTenantConfig(domain: string): Promise<TenantConfig> {
    // Check cache first
    if (this.tenantConfigs.has(domain)) {
      return this.tenantConfigs.get(domain)!;
    }

    // Fetch from database
    const config = await this.fetchTenantConfig(domain);
    this.tenantConfigs.set(domain, config);
    return config;
  }

  async authenticateUser(
    domain: string, 
    credentials: any
  ): Promise<AuthResult> {
    const tenantConfig = await this.getTenantConfig(domain);

    switch (tenantConfig.authMethod) {
      case 'local':
        return this.authenticateLocal(credentials, tenantConfig);
      
      case 'saml':
        return this.authenticateSAML(credentials, tenantConfig);
      
      case 'oauth':
        return this.authenticateOAuth(credentials, tenantConfig);
      
      default:
        throw new Error('Unsupported authentication method');
    }
  }

  private async authenticateLocal(
    credentials: any, 
    config: TenantConfig
  ): Promise<AuthResult> {
    // Local authentication logic
    const user = await this.validateLocalCredentials(credentials, config.tenantId);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    return {
      user,
      token: this.generateToken(user, config.tenantId),
      tenantId: config.tenantId
    };
  }

  private generateToken(user: any, tenantId: string): string {
    return jwt.sign(
      { 
        userId: user.id, 
        tenantId, 
        roles: user.roles 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}
\`\`\`

## Third-Party Service Integration

### Payment Processing Integration
\`\`\`typescript
// Payment gateway integration with multiple providers
interface PaymentProvider {
  createPayment(amount: number, currency: string, metadata?: any): Promise<PaymentResult>;
  confirmPayment(paymentId: string): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount?: number): Promise<PaymentResult>;
}

class StripePaymentProvider implements PaymentProvider {
  private stripe: any;

  constructor(secretKey: string) {
    this.stripe = require('stripe')(secretKey);
  }

  async createPayment(
    amount: number, 
    currency: string, 
    metadata?: any
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // Stripe uses cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      };
    } catch (error) {
      throw new Error(\`Stripe payment creation failed: \${error.message}\`);
    }
  }

  async confirmPayment(paymentId: string): Promise<PaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
    
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentId,
      ...(amount && { amount: amount * 100 })
    });

    return {
      id: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
      currency: refund.currency
    };
  }
}

// Payment service with provider abstraction
class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map();

  addProvider(name: string, provider: PaymentProvider): void {
    this.providers.set(name, provider);
  }

  async processPayment(
    providerName: string,
    amount: number,
    currency: string,
    metadata?: any
  ): Promise<PaymentResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(\`Payment provider '\${providerName}' not found\`);
    }

    // Add audit logging
    console.log(\`Processing payment: \${amount} \${currency} via \${providerName}\`);

    try {
      const result = await provider.createPayment(amount, currency, metadata);
      
      // Log successful payment
      await this.logPaymentEvent('payment_created', {
        provider: providerName,
        paymentId: result.id,
        amount,
        currency
      });

      return result;
    } catch (error) {
      // Log failed payment
      await this.logPaymentEvent('payment_failed', {
        provider: providerName,
        error: error.message,
        amount,
        currency
      });

      throw error;
    }
  }

  private async logPaymentEvent(event: string, data: any): Promise<void> {
    // Implementation for payment audit logging
    console.log(\`Payment Event: \${event}\`, data);
  }
}
\`\`\`

### Email Service Integration
\`\`\`typescript
// Email service integration with templating
interface EmailProvider {
  sendEmail(to: string, subject: string, content: EmailContent): Promise<void>;
  sendBulkEmail(recipients: EmailRecipient[], template: string, data: any): Promise<void>;
}

class EmailService {
  private provider: EmailProvider;
  private templates: Map<string, EmailTemplate> = new Map();

  constructor(provider: EmailProvider) {
    this.provider = provider;
    this.loadTemplates();
  }

  async sendTransactionalEmail(
    templateName: string,
    to: string,
    data: any
  ): Promise<void> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(\`Email template '\${templateName}' not found\`);
    }

    const subject = this.renderTemplate(template.subject, data);
    const html = this.renderTemplate(template.html, data);
    const text = this.renderTemplate(template.text || '', data);

    await this.provider.sendEmail(to, subject, { html, text });

    // Track email metrics
    await this.trackEmailEvent('sent', {
      template: templateName,
      recipient: to,
      timestamp: new Date().toISOString()
    });
  }

  private renderTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private async loadTemplates(): Promise<void> {
    // Load email templates from database or files
    this.templates.set('welcome', {
      subject: 'Welcome to {{appName}}, {{userName}}!',
      html: \`
        <h1>Welcome {{userName}}!</h1>
        <p>Thanks for joining {{appName}}. We're excited to have you on board.</p>
        <a href="{{activationUrl}}">Activate your account</a>
      \`,
      text: 'Welcome {{userName}}! Thanks for joining {{appName}}.'
    });

    this.templates.set('password-reset', {
      subject: 'Reset your {{appName}} password',
      html: \`
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="{{resetUrl}}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      \`,
      text: 'Reset your password: {{resetUrl}} (expires in 1 hour)'
    });
  }

  private async trackEmailEvent(event: string, data: any): Promise<void> {
    // Implementation for email analytics
    console.log(\`Email Event: \${event}\`, data);
  }
}
\`\`\`

## Real-time Integration Patterns

### WebSocket Integration
\`\`\`typescript
// WebSocket integration for real-time features
import WebSocket from 'ws';
import { Server } from 'http';

class WebSocketManager {
  private wss: WebSocket.Server;
  private connections: Map<string, WebSocket> = new Map();
  private rooms: Map<string, Set<string>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocket.Server({ server });
    this.setupConnectionHandling();
  }

  private setupConnectionHandling(): void {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const connectionId = this.generateConnectionId();
      this.connections.set(connectionId, ws);

      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(connectionId, message);
        } catch (error) {
          this.sendError(connectionId, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(connectionId);
      });

      // Send connection confirmation
      this.sendToConnection(connectionId, {
        type: 'connected',
        connectionId
      });
    });
  }

  private async handleMessage(connectionId: string, message: any): Promise<void> {
    switch (message.type) {
      case 'join_room':
        this.joinRoom(connectionId, message.room);
        break;
      
      case 'leave_room':
        this.leaveRoom(connectionId, message.room);
        break;
      
      case 'send_message':
        await this.broadcastToRoom(message.room, {
          type: 'new_message',
          from: connectionId,
          content: message.content,
          timestamp: new Date().toISOString()
        });
        break;
      
      default:
        this.sendError(connectionId, 'Unknown message type');
    }
  }

  private joinRoom(connectionId: string, room: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    
    this.rooms.get(room)!.add(connectionId);
    
    this.sendToConnection(connectionId, {
      type: 'joined_room',
      room
    });

    // Notify others in the room
    this.broadcastToRoom(room, {
      type: 'user_joined',
      connectionId
    }, connectionId);
  }

  private leaveRoom(connectionId: string, room: string): void {
    const roomConnections = this.rooms.get(room);
    if (roomConnections) {
      roomConnections.delete(connectionId);
      
      if (roomConnections.size === 0) {
        this.rooms.delete(room);
      } else {
        this.broadcastToRoom(room, {
          type: 'user_left',
          connectionId
        });
      }
    }
  }

  private sendToConnection(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
    }
  }

  private async broadcastToRoom(
    room: string, 
    message: any, 
    excludeConnection?: string
  ): Promise<void> {
    const roomConnections = this.rooms.get(room);
    if (!roomConnections) return;

    const promises = Array.from(roomConnections)
      .filter(connId => connId !== excludeConnection)
      .map(connId => {
        return new Promise<void>((resolve) => {
          this.sendToConnection(connId, message);
          resolve();
        });
      });

    await Promise.all(promises);
  }

  private sendError(connectionId: string, error: string): void {
    this.sendToConnection(connectionId, {
      type: 'error',
      message: error
    });
  }

  private handleDisconnection(connectionId: string): void {
    // Remove from all rooms
    for (const [room, connections] of this.rooms.entries()) {
      if (connections.has(connectionId)) {
        this.leaveRoom(connectionId, room);
      }
    }

    // Remove connection
    this.connections.delete(connectionId);
  }

  private generateConnectionId(): string {
    return \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  }
}

// Usage with Express server
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wsManager = new WebSocketManager(server);

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
\`\`\`

## Error Handling and Resilience

### Circuit Breaker Pattern
\`\`\`typescript
// Circuit breaker for external service integration
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private retryTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.retryTimeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

// Integration service with circuit breaker
class ExternalServiceIntegration {
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker(3, 5000, 30000);
  }

  async fetchData(url: string): Promise<any> {
    return this.circuitBreaker.execute(async () => {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      return response.json();
    });
  }

  async getData(id: string): Promise<any> {
    try {
      return await this.fetchData(\`https://api.example.com/data/\${id}\`);
    } catch (error) {
      // Fallback to cached data or default values
      console.error('External service failed, using fallback:', error.message);
      return this.getFallbackData(id);
    }
  }

  private async getFallbackData(id: string): Promise<any> {
    // Return cached data or default values
    return { id, data: 'fallback', timestamp: new Date().toISOString() };
  }
}
\`\`\`

## Integration Testing

### Testing Integration Points
\`\`\`typescript
// Integration testing with mocks and stubs
import { jest } from '@jest/globals';

describe('Payment Integration', () => {
  let paymentService: PaymentService;
  let mockStripeProvider: jest.Mocked<StripePaymentProvider>;

  beforeEach(() => {
    mockStripeProvider = {
      createPayment: jest.fn(),
      confirmPayment: jest.fn(),
      refundPayment: jest.fn(),
    } as any;

    paymentService = new PaymentService();
    paymentService.addProvider('stripe', mockStripeProvider);
  });

  test('should process payment successfully', async () => {
    const mockResult: PaymentResult = {
      id: 'pi_test123',
      status: 'requires_payment_method',
      clientSecret: 'pi_test123_secret',
      amount: 100,
      currency: 'usd'
    };

    mockStripeProvider.createPayment.mockResolvedValue(mockResult);

    const result = await paymentService.processPayment('stripe', 100, 'usd');

    expect(result).toEqual(mockResult);
    expect(mockStripeProvider.createPayment).toHaveBeenCalledWith(100, 'usd', undefined);
  });

  test('should handle payment failure gracefully', async () => {
    mockStripeProvider.createPayment.mockRejectedValue(new Error('Payment failed'));

    await expect(
      paymentService.processPayment('stripe', 100, 'usd')
    ).rejects.toThrow('Payment failed');
  });
});

// Integration test with real services (for staging/test environments)
describe('Email Integration (E2E)', () => {
  let emailService: EmailService;

  beforeAll(() => {
    // Use test email provider
    const testProvider = new TestEmailProvider();
    emailService = new EmailService(testProvider);
  });

  test('should send welcome email', async () => {
    await emailService.sendTransactionalEmail('welcome', 'test@example.com', {
      userName: 'Test User',
      appName: 'TestApp',
      activationUrl: 'https://test.example.com/activate'
    });

    // Verify email was sent (implementation depends on test provider)
    const sentEmails = await TestEmailProvider.getSentEmails();
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe('test@example.com');
    expect(sentEmails[0].subject).toBe('Welcome to TestApp, Test User!');
  });
});
\`\`\`

## Monitoring and Observability

### Integration Monitoring
\`\`\`typescript
// Integration monitoring and metrics
class IntegrationMonitor {
  private metrics: Map<string, IntegrationMetrics> = new Map();

  async recordOperation(
    integration: string,
    operation: string,
    duration: number,
    success: boolean,
    metadata?: any
  ): Promise<void> {
    const key = \`\${integration}:\${operation}\`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        totalCalls: 0,
        successCount: 0,
        errorCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        lastCall: new Date()
      });
    }

    const metric = this.metrics.get(key)!;
    metric.totalCalls++;
    metric.totalDuration += duration;
    metric.averageDuration = metric.totalDuration / metric.totalCalls;
    metric.lastCall = new Date();

    if (success) {
      metric.successCount++;
    } else {
      metric.errorCount++;
    }

    // Send metrics to monitoring service
    await this.sendMetrics(integration, operation, {
      duration,
      success,
      metadata
    });
  }

  private async sendMetrics(
    integration: string,
    operation: string,
    data: any
  ): Promise<void> {
    // Send to monitoring service (e.g., DataDog, New Relic, Prometheus)
    console.log(\`Metric: \${integration}.\${operation}\`, data);
  }

  getMetrics(integration?: string): Map<string, IntegrationMetrics> {
    if (integration) {
      const filtered = new Map();
      for (const [key, value] of this.metrics) {
        if (key.startsWith(\`\${integration}:\`)) {
          filtered.set(key, value);
        }
      }
      return filtered;
    }
    return this.metrics;
  }
}

// Wrapper for monitored integrations
function withMonitoring<T extends any[], R>(
  integration: string,
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  const monitor = new IntegrationMonitor();
  
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    let success = false;
    let result: R;

    try {
      result = await fn(...args);
      success = true;
      return result;
    } catch (error) {
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      await monitor.recordOperation(integration, operation, duration, success);
    }
  };
}

// Usage example
const monitoredFetchUser = withMonitoring(
  'user-service',
  'fetch-user',
  async (userId: string) => {
    return await apiClient.get(\`/users/\${userId}\`);
  }
);
\`\`\`

## Conclusion

Successful integration requires careful planning, robust error handling, and continuous monitoring. Key principles:

1. **Design for failure** - assume external services will fail
2. **Implement proper retry logic** with exponential backoff
3. **Use circuit breakers** to protect your system
4. **Monitor everything** - track performance and errors
5. **Test integration points** thoroughly
6. **Plan for scalability** from the beginning
7. **Document integration patterns** for team consistency

By following these patterns and best practices, you can build resilient, maintainable integrations that scale with your application.`,
      contentType: "guide",
      difficulty: "advanced",
      estimatedReadTime: 35,
      categoryId: "integrations",
      authorId: null,
      isFeatured: true,
      isPublished: true,
      tags: ["integrations", "advanced", "guide", "api", "architecture"],
      frameworks: ["Node.js", "Express", "TypeScript"],
      languages: ["JavaScript", "TypeScript"],
      prerequisites: ["API development experience", "Understanding of async programming", "Database knowledge"],
      keyPoints: [
        "Design integrations with failure scenarios in mind",
        "Implement circuit breakers and retry logic for resilience",
        "Use proper abstraction layers for easy provider switching",
        "Monitor and log all integration points for debugging",
        "Test integration points thoroughly with mocks and real services"
      ]
    },

    // DevOps & Deployment articles
    {
      title: "Production Deployment Guide: From Development to Live",
      slug: "production-deployment-guide", 
      excerpt: "Complete guide to deploying modern web applications to production, covering CI/CD pipelines, containerization, monitoring, and scalable infrastructure.",
      content: `# Production Deployment Guide: From Development to Live

Deploying applications to production requires careful planning, proper automation, and robust monitoring. This guide covers everything you need to know to deploy your application safely and efficiently.

## Deployment Planning

### Pre-Deployment Checklist

Before deploying to production, ensure you've completed these essential steps:

\`\`\`typescript
interface DeploymentChecklistItem {
  category: string;
  item: string;
  completed: boolean;
  notes?: string;
}

const deploymentChecklist: DeploymentChecklistItem[] = [
  // Code Quality
  { category: 'Code Quality', item: 'All tests passing (unit, integration, e2e)', completed: false },
  { category: 'Code Quality', item: 'Code review completed and approved', completed: false },
  { category: 'Code Quality', item: 'Security vulnerabilities scanned and resolved', completed: false },
  { category: 'Code Quality', item: 'Performance testing completed', completed: false },
  
  // Configuration
  { category: 'Configuration', item: 'Environment variables configured', completed: false },
  { category: 'Configuration', item: 'Database migrations ready', completed: false },
  { category: 'Configuration', item: 'SSL certificates configured', completed: false },
  { category: 'Configuration', item: 'Domain DNS configured', completed: false },
  
  // Infrastructure
  { category: 'Infrastructure', item: 'Production environment provisioned', completed: false },
  { category: 'Infrastructure', item: 'Load balancers configured', completed: false },
  { category: 'Infrastructure', item: 'CDN configured for static assets', completed: false },
  { category: 'Infrastructure', item: 'Database backups configured', completed: false },
  
  // Monitoring
  { category: 'Monitoring', item: 'Application monitoring setup', completed: false },
  { category: 'Monitoring', item: 'Error tracking configured', completed: false },
  { category: 'Monitoring', item: 'Performance monitoring enabled', completed: false },
  { category: 'Monitoring', item: 'Alerting rules configured', completed: false },
  
  // Security
  { category: 'Security', item: 'Security headers configured', completed: false },
  { category: 'Security', item: 'Rate limiting implemented', completed: false },
  { category: 'Security', item: 'CORS properly configured', completed: false },
  { category: 'Security', item: 'Authentication/authorization tested', completed: false }
];

// Validate deployment readiness
const validateDeploymentReadiness = (checklist: DeploymentChecklistItem[]): boolean => {
  const incomplete = checklist.filter(item => !item.completed);
  
  if (incomplete.length > 0) {
    console.log('⚠️  Deployment blocked. Incomplete items:');
    incomplete.forEach(item => {
      console.log(\`- \${item.category}: \${item.item}\`);
    });
    return false;
  }
  
  console.log('✅ All deployment requirements satisfied');
  return true;
};
\`\`\`

## CI/CD Pipeline Setup

### GitHub Actions Workflow

Create a comprehensive CI/CD pipeline that automates testing, building, and deployment:

\`\`\`yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Run e2e tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Security audit
        run: npm audit --audit-level=high
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            dist/
            client/dist/
          retention-days: 1

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  build-and-push-image:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build-and-push-image
    if: github.ref == 'refs/heads/main'
    environment: staging
    
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          # Add your staging deployment commands here
          
      - name: Run smoke tests
        run: |
          echo "Running smoke tests against staging..."
          # Add smoke test commands

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production environment..."
          # Add your production deployment commands here
          
      - name: Run post-deployment tests
        run: |
          echo "Running post-deployment tests..."
          # Add post-deployment validation

  notify:
    runs-on: ubuntu-latest
    needs: [deploy-production]
    if: always()
    
    steps:
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: \${{ job.status }}
          text: |
            Deployment to production: \${{ job.status }}
            Branch: \${{ github.ref }}
            Commit: \${{ github.sha }}
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}
\`\`\`

## Containerization with Docker

### Multi-stage Dockerfile

Create an optimized Docker image for production:

\`\`\`dockerfile
# Dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/client/dist ./client/dist

# Copy other necessary files
COPY --chown=nodejs:nodejs ./server ./server

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node ./dist/health-check.js

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "./dist/server.js"]
\`\`\`

### Docker Compose for Local Development

\`\`\`yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/stackwise
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: stackwise
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
\`\`\`

## Infrastructure as Code

### Terraform Configuration

\`\`\`hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "stackwise/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "\${var.project_name}-vpc"
  }
}

# Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "\${var.project_name}-public-\${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "\${var.project_name}-private-\${count.index + 1}"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = var.project_name
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = var.project_name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = var.enable_deletion_protection
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier     = var.project_name
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "\${var.project_name}-final-snapshot"
  
  tags = {
    Name = "\${var.project_name}-db"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = var.project_name
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = var.project_name
  description                = "Redis cluster for \${var.project_name}"
  
  node_type                  = var.redis_node_type
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = var.redis_num_cache_clusters
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Name = "\${var.project_name}-redis"
  }
}
\`\`\`

### Variables Configuration

\`\`\`hcl
# infrastructure/variables.tf
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "stackwise"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_clusters" {
  description = "Number of cache clusters"
  type        = number
  default     = 2
}
\`\`\`

## Deployment Strategies

### Blue-Green Deployment

\`\`\`typescript
// scripts/blue-green-deploy.ts
interface DeploymentEnvironment {
  name: 'blue' | 'green';
  url: string;
  healthy: boolean;
  version: string;
}

class BlueGreenDeployment {
  private environments: Map<string, DeploymentEnvironment> = new Map();
  private currentActive: 'blue' | 'green' = 'blue';
  
  constructor() {
    this.environments.set('blue', {
      name: 'blue',
      url: 'https://blue.stackwise.com',
      healthy: false,
      version: ''
    });
    
    this.environments.set('green', {
      name: 'green', 
      url: 'https://green.stackwise.com',
      healthy: false,
      version: ''
    });
  }
  
  async deploy(version: string): Promise<void> {
    const inactive = this.currentActive === 'blue' ? 'green' : 'blue';
    const inactiveEnv = this.environments.get(inactive)!;
    
    console.log(\`Deploying version \${version} to \${inactive} environment...\`);
    
    try {
      // Deploy to inactive environment
      await this.deployToEnvironment(inactiveEnv, version);
      
      // Run health checks
      await this.healthCheck(inactiveEnv);
      
      // Run smoke tests
      await this.runSmokeTests(inactiveEnv);
      
      // Switch traffic
      await this.switchTraffic(inactive);
      
      console.log(\`✅ Successfully deployed version \${version} to production\`);
      
    } catch (error) {
      console.error(\`❌ Deployment failed: \${error.message}\`);
      await this.rollback();
      throw error;
    }
  }
  
  private async deployToEnvironment(
    env: DeploymentEnvironment, 
    version: string
  ): Promise<void> {
    // Implementation for deploying to specific environment
    // This could involve updating ECS service, Kubernetes deployment, etc.
    
    const deployCommand = \`
      aws ecs update-service \\
        --cluster stackwise \\
        --service stackwise-\${env.name} \\
        --task-definition stackwise:\${version} \\
        --force-new-deployment
    \`;
    
    await this.executeCommand(deployCommand);
    
    // Wait for deployment to stabilize
    await this.waitForDeploymentStability(env);
    
    env.version = version;
  }
  
  private async healthCheck(env: DeploymentEnvironment): Promise<void> {
    const maxRetries = 30;
    const retryDelay = 10000; // 10 seconds
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(\`\${env.url}/health\`);
        
        if (response.ok) {
          const health = await response.json();
          
          if (health.status === 'healthy') {
            env.healthy = true;
            console.log(\`✅ \${env.name} environment is healthy\`);
            return;
          }
        }
      } catch (error) {
        console.log(\`Health check attempt \${i + 1}/\${maxRetries} failed\`);
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw new Error(\`Health check failed for \${env.name} environment\`);
  }
  
  private async runSmokeTests(env: DeploymentEnvironment): Promise<void> {
    console.log(\`Running smoke tests against \${env.name} environment...\`);
    
    const tests = [
      { name: 'Homepage', url: \`\${env.url}/\` },
      { name: 'API Health', url: \`\${env.url}/api/health\` },
      { name: 'User Login', url: \`\${env.url}/api/auth/login\` },
      { name: 'Tools API', url: \`\${env.url}/api/tools\` }
    ];
    
    for (const test of tests) {
      try {
        const response = await fetch(test.url);
        
        if (!response.ok && response.status !== 401) {
          throw new Error(\`Test \${test.name} failed with status \${response.status}\`);
        }
        
        console.log(\`✅ \${test.name} test passed\`);
      } catch (error) {
        throw new Error(\`Smoke test failed: \${test.name} - \${error.message}\`);
      }
    }
  }
  
  private async switchTraffic(newActive: 'blue' | 'green'): Promise<void> {
    console.log(\`Switching traffic from \${this.currentActive} to \${newActive}...\`);
    
    // Update load balancer to point to new environment
    const updateCommand = \`
      aws elbv2 modify-listener \\
        --listener-arn \${process.env.ALB_LISTENER_ARN} \\
        --default-actions Type=forward,TargetGroupArn=\${process.env[\`TARGET_GROUP_\${newActive.toUpperCase()}\`]}
    \`;
    
    await this.executeCommand(updateCommand);
    
    // Wait for traffic to stabilize
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Verify traffic is flowing correctly
    await this.verifyTrafficSwitch(newActive);
    
    this.currentActive = newActive;
  }
  
  private async rollback(): Promise<void> {
    console.log('Rolling back deployment...');
    
    // Switch traffic back to previous active environment
    const rollbackTarget = this.currentActive === 'blue' ? 'green' : 'blue';
    
    try {
      await this.switchTraffic(rollbackTarget);
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw new Error('Critical: Both deployment and rollback failed');
    }
  }
  
  private async executeCommand(command: string): Promise<void> {
    // Implementation for executing shell commands
    console.log(\`Executing: \${command}\`);
  }
  
  private async waitForDeploymentStability(env: DeploymentEnvironment): Promise<void> {
    // Wait for ECS/Kubernetes deployment to stabilize
    const stabilityCommand = \`
      aws ecs wait services-stable \\
        --cluster stackwise \\
        --services stackwise-\${env.name}
    \`;
    
    await this.executeCommand(stabilityCommand);
  }
  
  private async verifyTrafficSwitch(env: 'blue' | 'green'): Promise<void> {
    // Verify that traffic is flowing to the correct environment
    const testRequests = 5;
    
    for (let i = 0; i < testRequests; i++) {
      const response = await fetch('https://stackwise.com/api/health');
      const health = await response.json();
      
      if (health.environment !== env) {
        throw new Error(\`Traffic not switched correctly. Expected \${env}, got \${health.environment}\`);
      }
    }
    
    console.log(\`✅ Traffic successfully switched to \${env}\`);
  }
}

// Usage
const deployment = new BlueGreenDeployment();
await deployment.deploy(process.env.BUILD_VERSION);
\`\`\`

## Monitoring and Observability

### Application Performance Monitoring

\`\`\`typescript
// monitoring/apm.ts
import { createPrometheusMetrics } from 'prom-client';

class ApplicationMonitoring {
  private metrics: any;
  
  constructor() {
    this.initializeMetrics();
  }
  
  private initializeMetrics(): void {
    const promClient = require('prom-client');
    
    // Collect default metrics
    promClient.collectDefaultMetrics();
    
    this.metrics = {
      httpRequestDuration: new promClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.5, 1, 2, 5]
      }),
      
      httpRequestsTotal: new promClient.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code']
      }),
      
      activeConnections: new promClient.Gauge({
        name: 'websocket_connections_active',
        help: 'Number of active WebSocket connections'
      }),
      
      databaseConnections: new promClient.Gauge({
        name: 'database_connections_active',
        help: 'Number of active database connections'
      }),
      
      databaseQueryDuration: new promClient.Histogram({
        name: 'database_query_duration_seconds',
        help: 'Duration of database queries in seconds',
        labelNames: ['query_type', 'table'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
      })
    };
  }
  
  // Express middleware for HTTP metrics
  httpMetricsMiddleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;
        
        this.metrics.httpRequestDuration
          .labels(req.method, route, res.statusCode.toString())
          .observe(duration);
          
        this.metrics.httpRequestsTotal
          .labels(req.method, route, res.statusCode.toString())
          .inc();
      });
      
      next();
    };
  }
  
  // Database monitoring
  recordDatabaseQuery(queryType: string, table: string, duration: number): void {
    this.metrics.databaseQueryDuration
      .labels(queryType, table)
      .observe(duration / 1000);
  }
  
  // WebSocket monitoring
  updateActiveConnections(count: number): void {
    this.metrics.activeConnections.set(count);
  }
  
  // Export metrics for Prometheus
  getMetrics(): Promise<string> {
    const promClient = require('prom-client');
    return promClient.register.metrics();
  }
}

// Health check endpoint
export const createHealthCheck = (dependencies: any[]) => {
  return async (req: any, res: any) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      uptime: process.uptime(),
      dependencies: {}
    };
    
    // Check each dependency
    for (const dep of dependencies) {
      try {
        await dep.healthCheck();
        health.dependencies[dep.name] = 'healthy';
      } catch (error) {
        health.dependencies[dep.name] = 'unhealthy';
        health.status = 'degraded';
      }
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  };
};
\`\`\`

### Logging Configuration

\`\`\`typescript
// logging/logger.ts
import winston from 'winston';

const createLogger = () => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: 'stackwise',
      version: process.env.APP_VERSION,
      environment: process.env.NODE_ENV
    },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
  
  // Add file transport for production
  if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }));
    
    logger.add(new winston.transports.File({
      filename: 'logs/combined.log'
    }));
  }
  
  return logger;
};

export const logger = createLogger();

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });
  });
  
  next();
};
\`\`\`

## Security in Production

### Security Headers and Configuration

\`\`\`typescript
// security/headers.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// Rate limiting
import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// API rate limiting
export const apiRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5);   // 5 login attempts per 15 minutes
\`\`\`

## Conclusion

Successful production deployment requires:

1. **Comprehensive testing** at every stage
2. **Automated CI/CD pipelines** for consistency
3. **Infrastructure as Code** for reproducibility
4. **Proper monitoring and alerting** for visibility
5. **Security best practices** built-in
6. **Rollback strategies** for quick recovery
7. **Regular maintenance** and updates

Following these practices ensures reliable, secure, and scalable production deployments that can handle real-world traffic and requirements.`,
      contentType: "tutorial",
      difficulty: "advanced",
      estimatedReadTime: 40,
      categoryId: "devops-deployment",
      authorId: null,
      isFeatured: true,
      isPublished: true,
      tags: ["devops", "deployment", "advanced", "tutorial", "production"],
      frameworks: ["Docker", "AWS", "Terraform", "GitHub Actions"],
      languages: ["JavaScript", "TypeScript", "YAML", "HCL"],
      prerequisites: ["Docker knowledge", "Cloud platform familiarity", "CI/CD understanding", "Infrastructure basics"],
      keyPoints: [
        "Automate everything with comprehensive CI/CD pipelines",
        "Use Infrastructure as Code for reproducible deployments",
        "Implement proper monitoring and alerting from day one",
        "Always have a rollback strategy ready",
        "Security should be built into the deployment process"
      ]
    },

    // Security best practices article
    {
      title: "Web Application Security: Essential Practices for Modern Apps",
      slug: "web-application-security-guide",
      excerpt: "Comprehensive security guide covering authentication, authorization, data protection, and common vulnerabilities with practical implementation examples.",
      content: `# Web Application Security: Essential Practices for Modern Apps

Security is not an afterthought—it must be built into every layer of your application. This guide covers essential security practices for modern web applications with practical implementation examples.

## Security Fundamentals

### The Security Mindset

Security is about defense in depth—multiple layers of protection working together:

\`\`\`typescript
// Security principles to follow
const securityPrinciples = {
  principleOfLeastPrivilege: 'Grant minimum necessary permissions',
  failSecure: 'Default to deny when systems fail',
  defenseInDepth: 'Multiple layers of security controls',
  zeroTrust: 'Never trust, always verify',
  regularAudits: 'Continuously assess and improve security'
};

interface SecurityLayer {
  layer: string;
  controls: string[];
  implementation: string;
}

const securityLayers: SecurityLayer[] = [
  {
    layer: 'Network',
    controls: ['Firewalls', 'VPN', 'SSL/TLS', 'DDoS protection'],
    implementation: 'Infrastructure level'
  },
  {
    layer: 'Application',
    controls: ['Input validation', 'Authentication', 'Authorization', 'Session management'],
    implementation: 'Code level'
  },
  {
    layer: 'Data',
    controls: ['Encryption at rest', 'Encryption in transit', 'Access controls', 'Backup security'],
    implementation: 'Database and storage level'
  }
];
\`\`\`

## Authentication and Authorization

### Secure Authentication Implementation

\`\`\`typescript
// Secure password hashing
import bcrypt from 'bcrypt';
import crypto from 'crypto';

class SecureAuth {
  private readonly saltRounds = 12;
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes
  
  async hashPassword(password: string): Promise<string> {
    // Validate password strength first
    this.validatePasswordStrength(password);
    
    return bcrypt.hash(password, this.saltRounds);
  }
  
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  validatePasswordStrength(password: string): void {
    const requirements = {
      minLength: 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      notCommon: !this.isCommonPassword(password)
    };
    
    const failures = [];
    
    if (password.length < requirements.minLength) {
      failures.push(\`Password must be at least \${requirements.minLength} characters\`);
    }
    
    if (!requirements.hasUppercase) failures.push('Password must contain uppercase letters');
    if (!requirements.hasLowercase) failures.push('Password must contain lowercase letters');
    if (!requirements.hasNumbers) failures.push('Password must contain numbers');
    if (!requirements.hasSpecialChars) failures.push('Password must contain special characters');
    if (!requirements.notCommon) failures.push('Password is too common');
    
    if (failures.length > 0) {
      throw new Error(\`Password requirements not met: \${failures.join(', ')}\`);
    }
  }
  
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }
  
  // Account lockout mechanism
  async checkAccountLockout(userId: string): Promise<boolean> {
    const attempts = await this.getFailedAttempts(userId);
    
    if (attempts.count >= this.maxLoginAttempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      return timeSinceLastAttempt < this.lockoutDuration;
    }
    
    return false;
  }
  
  async recordFailedAttempt(userId: string): Promise<void> {
    // Implementation to record failed login attempts
    // Could use Redis or database to track attempts
  }
  
  async clearFailedAttempts(userId: string): Promise<void> {
    // Clear failed attempts on successful login
  }
  
  private async getFailedAttempts(userId: string): Promise<{count: number, lastAttempt: number}> {
    // Implementation to retrieve failed attempt count and timestamp
    return { count: 0, lastAttempt: 0 };
  }
}
\`\`\`

### JWT Security Best Practices

\`\`\`typescript
// Secure JWT implementation
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
}

class SecureJWT {
  private readonly accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';
  private revokedTokens = new Set<string>(); // In production, use Redis
  
  generateTokenPair(user: any): { accessToken: string; refreshToken: string } {
    const jti = crypto.randomUUID();
    
    const accessPayload: Partial<JWTPayload> = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      jti
    };
    
    const refreshPayload = {
      userId: user.id,
      jti: crypto.randomUUID(),
      type: 'refresh'
    };
    
    const accessToken = jwt.sign(accessPayload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'stackwise',
      audience: 'stackwise-api'
    });
    
    const refreshToken = jwt.sign(refreshPayload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'stackwise',
      audience: 'stackwise-refresh'
    });
    
    return { accessToken, refreshToken };
  }
  
  verifyAccessToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'stackwise',
        audience: 'stackwise-api'
      }) as JWTPayload;
      
      // Check if token is revoked
      if (this.revokedTokens.has(payload.jti)) {
        throw new Error('Token has been revoked');
      }
      
      return payload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
  
  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'stackwise',
        audience: 'stackwise-refresh'
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
  
  revokeToken(jti: string): void {
    this.revokedTokens.add(jti);
    // In production, store in Redis with expiration
  }
  
  // Middleware for token validation
  authenticateToken() {
    return (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }
      
      try {
        const payload = this.verifyAccessToken(token);
        req.user = payload;
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    };
  }
  
  // Role-based authorization middleware
  requireRole(...roles: string[]) {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userRoles = req.user.roles || [];
      const hasRequiredRole = roles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: roles,
          current: userRoles
        });
      }
      
      next();
    };
  }
}
\`\`\`

### Multi-Factor Authentication (MFA)

\`\`\`typescript
// TOTP-based MFA implementation
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

class MFAService {
  generateSecret(userEmail: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: 'StackWise',
      length: 32
    });
    
    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url
    };
  }
  
  async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }
  
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time periods (past/future) for clock drift
    });
  }
  
  // Backup codes generation
  generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
  
  // MFA setup workflow
  async setupMFA(userId: string, email: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    const { secret, qrCode } = this.generateSecret(email);
    const qrCodeUrl = await this.generateQRCode(qrCode);
    const backupCodes = this.generateBackupCodes();
    
    // Store encrypted secret and backup codes in database
    await this.storeMFASecret(userId, secret, backupCodes);
    
    return { secret, qrCodeUrl, backupCodes };
  }
  
  private async storeMFASecret(
    userId: string, 
    secret: string, 
    backupCodes: string[]
  ): Promise<void> {
    // Encrypt secret before storing
    const encryptedSecret = this.encrypt(secret);
    const hashedBackupCodes = backupCodes.map(code => bcrypt.hashSync(code, 10));
    
    // Store in database
    // Implementation depends on your database setup
  }
  
  private encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
}
\`\`\`

## Input Validation and Sanitization

### Comprehensive Input Validation

\`\`\`typescript
// Input validation and sanitization
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

class InputValidator {
  // Email validation
  static validateEmail(email: string): { valid: boolean; message?: string } {
    if (!email) {
      return { valid: false, message: 'Email is required' };
    }
    
    if (!validator.isEmail(email)) {
      return { valid: false, message: 'Invalid email format' };
    }
    
    // Additional checks
    if (email.length > 254) {
      return { valid: false, message: 'Email too long' };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\\.\\./,  // Double dots
      /^\\./,    // Starting with dot
      /\\.$$/    // Ending with dot
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(email))) {
      return { valid: false, message: 'Email contains invalid characters' };
    }
    
    return { valid: true };
  }
  
  // URL validation
  static validateURL(url: string): { valid: boolean; message?: string } {
    if (!url) {
      return { valid: false, message: 'URL is required' };
    }
    
    if (!validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true
    })) {
      return { valid: false, message: 'Invalid URL format' };
    }
    
    // Check against blacklisted domains
    const blacklistedDomains = [
      'malicious-site.com',
      'phishing-example.net'
    ];
    
    try {
      const urlObj = new URL(url);
      if (blacklistedDomains.includes(urlObj.hostname)) {
        return { valid: false, message: 'Domain not allowed' };
      }
    } catch {
      return { valid: false, message: 'Malformed URL' };
    }
    
    return { valid: true };
  }
  
  // File upload validation
  static validateFile(file: any): { valid: boolean; message?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain'
    ];
    
    if (!file) {
      return { valid: false, message: 'File is required' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, message: 'File size exceeds 10MB limit' };
    }
    
    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, message: 'File type not allowed' };
    }
    
    // Validate file extension matches MIME type
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const mimeTypeExtensions = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'application/pdf': ['pdf'],
      'text/plain': ['txt']
    };
    
    const expectedExtensions = mimeTypeExtensions[file.mimetype];
    if (expectedExtensions && !expectedExtensions.includes(extension)) {
      return { valid: false, message: 'File extension does not match content type' };
    }
    
    return { valid: true };
  }
  
  // HTML sanitization
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      ALLOWED_ATTR: []
    });
  }
  
  // SQL injection prevention (use with parameterized queries)
  static validateSQLInput(input: string): { valid: boolean; message?: string } {
    // Detect potential SQL injection patterns
    const sqlPatterns = [
      /('|(\\-\\-)|(;)|(\\|)|(\\*)|(%))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror)/i
    ];
    
    if (sqlPatterns.some(pattern => pattern.test(input))) {
      return { valid: false, message: 'Input contains potentially dangerous characters' };
    }
    
    return { valid: true };
  }
  
  // XSS prevention
  static preventXSS(input: string): string {
    return validator.escape(input);
  }
}

// Express middleware for input validation
export const validateInput = (schema: any) => {
  return (req: any, res: any, next: any) => {
    const errors: string[] = [];
    
    // Validate request body against schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      if (rules.required && !value) {
        errors.push(\`\${field} is required\`);
        continue;
      }
      
      if (value) {
        // Apply validation rules
        if (rules.type === 'email') {
          const result = InputValidator.validateEmail(value);
          if (!result.valid) errors.push(\`\${field}: \${result.message}\`);
        }
        
        if (rules.type === 'url') {
          const result = InputValidator.validateURL(value);
          if (!result.valid) errors.push(\`\${field}: \${result.message}\`);
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(\`\${field} exceeds maximum length of \${rules.maxLength}\`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(\`\${field} format is invalid\`);
        }
        
        // Sanitize input
        if (rules.sanitize) {
          req.body[field] = InputValidator.preventXSS(value);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};
\`\`\`

## Data Protection and Encryption

### Encryption Service

\`\`\`typescript
// Data encryption and decryption
import crypto from 'crypto';

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;  // 128 bits
  private readonly tagLength = 16; // 128 bits
  
  constructor(private masterKey: string) {
    if (!masterKey || masterKey.length < 32) {
      throw new Error('Master key must be at least 32 characters');
    }
  }
  
  // Encrypt sensitive data
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, this.masterKey);
    cipher.setAAD(Buffer.from('stackwise-app'));
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV, auth tag, and encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  }
  
  // Decrypt sensitive data
  decrypt(encryptedData: string): string {
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const iv = combined.slice(0, this.ivLength);
    const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
    const encrypted = combined.slice(this.ivLength + this.tagLength);
    
    const decipher = crypto.createDecipher(this.algorithm, this.masterKey);
    decipher.setAAD(Buffer.from('stackwise-app'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Hash sensitive data (one-way)
  hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512');
    return \`\${actualSalt}:\${hash.toString('hex')}\`;
  }
  
  // Verify hashed data
  verifyHash(data: string, hashedData: string): boolean {
    const [salt, originalHash] = hashedData.split(':');
    const hash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
    return hash.toString('hex') === originalHash;
  }
  
  // Generate secure random tokens
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  // Encrypt database fields
  encryptPII(data: { [key: string]: any }): { [key: string]: any } {
    const piiFields = ['ssn', 'creditCard', 'bankAccount', 'phone'];
    const encrypted = { ...data };
    
    for (const field of piiFields) {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    }
    
    return encrypted;
  }
  
  // Decrypt database fields
  decryptPII(data: { [key: string]: any }): { [key: string]: any } {
    const piiFields = ['ssn', 'creditCard', 'bankAccount', 'phone'];
    const decrypted = { ...data };
    
    for (const field of piiFields) {
      if (decrypted[field]) {
        try {
          decrypted[field] = this.decrypt(decrypted[field]);
        } catch (error) {
          console.error(\`Failed to decrypt \${field}\`, error);
          decrypted[field] = '[ENCRYPTED]';
        }
      }
    }
    
    return decrypted;
  }
}

// Usage example
const encryptionService = new EncryptionService(process.env.MASTER_ENCRYPTION_KEY);

// Middleware for automatic PII encryption
export const encryptPIIMiddleware = (req: any, res: any, next: any) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    req.body = encryptionService.encryptPII(req.body);
  }
  next();
};
\`\`\`

## Security Headers and Configuration

### Security Middleware

\`\`\`typescript
// Comprehensive security middleware
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

class SecurityMiddleware {
  // Content Security Policy
  static cspMiddleware() {
    return helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Only if absolutely necessary
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:"
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'", // Remove in production if possible
          "https://cdn.jsdelivr.net"
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        connectSrc: [
          "'self'",
          "https://api.stackwise.com",
          "wss://ws.stackwise.com"
        ],
        workerSrc: ["'self'", "blob:"],
        upgradeInsecureRequests: [],
        blockAllMixedContent: []
      },
    });
  }
  
  // Rate limiting with different tiers
  static createRateLimiter(options: {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
  }) {
    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      message: {
        error: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(options.windowMs / 1000)
        });
      }
    });
  }
  
  // Speed limiting (gradual slowdown)
  static speedLimiter() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // Allow 50 requests per window at full speed
      delayMs: 500 // Add 500ms delay per request after delayAfter
    });
  }
  
  // API-specific rate limiting
  static apiRateLimits = {
    general: this.createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      skipSuccessfulRequests: true
    }),
    
    auth: this.createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit login attempts
      message: 'Too many login attempts, please try again later.'
    }),
    
    passwordReset: this.createRateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 password reset attempts per hour
      message: 'Too many password reset attempts, please try again later.'
    }),
    
    upload: this.createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 file uploads per 15 minutes
      message: 'Upload limit exceeded, please try again later.'
    })
  };
  
  // Security headers
  static securityHeaders() {
    return helmet({
      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      
      // X-Frame-Options
      frameguard: {
        action: 'deny'
      },
      
      // X-Content-Type-Options
      noSniff: true,
      
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      },
      
      // Permissions Policy
      permissionsPolicy: {
        features: {
          geolocation: ["'none'"],
          microphone: ["'none'"],
          camera: ["'none'"],
          payment: ["'none'"],
          usb: ["'none'"]
        }
      }
    });
  }
  
  // CORS configuration
  static corsOptions = {
    origin: (origin: string, callback: Function) => {
      const allowedOrigins = [
        'https://stackwise.com',
        'https://www.stackwise.com',
        'https://app.stackwise.com'
      ];
      
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With', 
      'Content-Type',
      'Accept',
      'Authorization'
    ]
  };
  
  // Request size limiting
  static requestSizeLimiter() {
    return (req: any, res: any, next: any) => {
      const maxSize = {
        '/api/upload': 10 * 1024 * 1024, // 10MB for uploads
        '/api/': 1024 * 1024, // 1MB for regular API calls
        default: 100 * 1024 // 100KB for other requests
      };
      
      let limit = maxSize.default;
      
      for (const [path, size] of Object.entries(maxSize)) {
        if (req.path.startsWith(path)) {
          limit = size;
          break;
        }
      }
      
      const contentLength = parseInt(req.headers['content-length'] || '0');
      
      if (contentLength > limit) {
        return res.status(413).json({
          error: 'Request entity too large',
          maxSize: limit,
          received: contentLength
        });
      }
      
      next();
    };
  }
}

// Apply all security middleware
export const applySecurityMiddleware = (app: any) => {
  // Basic security headers
  app.use(SecurityMiddleware.securityHeaders());
  
  // Content Security Policy
  app.use(SecurityMiddleware.cspMiddleware());
  
  // Rate limiting
  app.use('/api/', SecurityMiddleware.apiRateLimits.general);
  app.use('/api/auth/login', SecurityMiddleware.apiRateLimits.auth);
  app.use('/api/auth/reset-password', SecurityMiddleware.apiRateLimits.passwordReset);
  app.use('/api/upload', SecurityMiddleware.apiRateLimits.upload);
  
  // Speed limiting
  app.use(SecurityMiddleware.speedLimiter());
  
  // Request size limiting
  app.use(SecurityMiddleware.requestSizeLimiter());
  
  // CORS
  app.use(cors(SecurityMiddleware.corsOptions));
};
\`\`\`

## Security Monitoring and Incident Response

### Security Event Logging

\`\`\`typescript
// Security event monitoring
interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'input_validation' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent: string;
  event: string;
  details: any;
  timestamp: Date;
}

class SecurityMonitor {
  private suspiciousActivities = new Map<string, number>();
  
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // Log to security system
    console.log('Security Event:', JSON.stringify(event, null, 2));
    
    // Store in secure audit log
    await this.storeAuditLog(event);
    
    // Check for suspicious patterns
    if (this.isSuspiciousActivity(event)) {
      await this.handleSuspiciousActivity(event);
    }
    
    // Alert on critical events
    if (event.severity === 'critical') {
      await this.sendSecurityAlert(event);
    }
  }
  
  private isSuspiciousActivity(event: SecurityEvent): boolean {
    const suspiciousPatterns = [
      // Multiple failed login attempts
      event.type === 'authentication' && event.event.includes('failed'),
      
      // SQL injection attempts
      event.type === 'input_validation' && event.details?.includes('sql'),
      
      // XSS attempts
      event.type === 'input_validation' && event.details?.includes('script'),
      
      // Unusual access patterns
      event.type === 'authorization' && event.event.includes('denied')
    ];
    
    return suspiciousPatterns.some(pattern => pattern);
  }
  
  private async handleSuspiciousActivity(event: SecurityEvent): Promise<void> {
    const key = event.ip;
    const count = (this.suspiciousActivities.get(key) || 0) + 1;
    this.suspiciousActivities.set(key, count);
    
    // Escalate based on activity count
    if (count >= 5) {
      await this.blockIP(event.ip, '1 hour');
      await this.sendSecurityAlert({
        ...event,
        severity: 'critical',
        event: \`IP blocked due to suspicious activity: \${event.ip}\`
      });
    } else if (count >= 3) {
      await this.sendSecurityAlert({
        ...event,
        severity: 'high',
        event: \`Repeated suspicious activity from IP: \${event.ip}\`
      });
    }
  }
  
  private async blockIP(ip: string, duration: string): Promise<void> {
    // Implementation to block IP address
    // Could use firewall rules, rate limiting, etc.
    console.log(\`Blocking IP \${ip} for \${duration}\`);
  }
  
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // Send alert to security team
    const alert = {
      subject: \`Security Alert: \${event.severity.toUpperCase()}\`,
      message: \`
        Security Event Detected:
        Type: \${event.type}
        Severity: \${event.severity}
        Event: \${event.event}
        IP: \${event.ip}
        User: \${event.userId || 'Anonymous'}
        Time: \${event.timestamp}
        Details: \${JSON.stringify(event.details)}
      \`
    };
    
    // Send via email, Slack, PagerDuty, etc.
    console.log('Security Alert:', alert);
  }
  
  private async storeAuditLog(event: SecurityEvent): Promise<void> {
    // Store in tamper-evident audit log
    // Implementation depends on your logging infrastructure
  }
  
  // Security middleware
  securityEventMiddleware() {
    return (req: any, res: any, next: any) => {
      // Log authentication events
      if (req.path.includes('/auth/')) {
        res.on('finish', () => {
          this.logSecurityEvent({
            type: 'authentication',
            severity: res.statusCode >= 400 ? 'medium' : 'low',
            userId: req.user?.id,
            ip: req.ip,
            userAgent: req.get('User-Agent') || '',
            event: \`\${req.method} \${req.path} - \${res.statusCode}\`,
            details: { body: req.body, headers: req.headers },
            timestamp: new Date()
          });
        });
      }
      
      next();
    };
  }
}

export const securityMonitor = new SecurityMonitor();
\`\`\`

## Conclusion

Web application security requires a comprehensive approach covering:

### Key Security Principles
1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimal necessary permissions
3. **Fail Secure** - Secure defaults when systems fail
4. **Security by Design** - Built-in from the start
5. **Continuous Monitoring** - Ongoing threat detection

### Essential Security Measures
- **Strong authentication** with MFA
- **Comprehensive input validation** and sanitization
- **Proper encryption** for data at rest and in transit
- **Security headers** and CORS configuration
- **Rate limiting** and DDoS protection
- **Security monitoring** and incident response
- **Regular security audits** and penetration testing

### Implementation Checklist
- [ ] Implement secure authentication with MFA
- [ ] Add comprehensive input validation
- [ ] Configure security headers and CSP
- [ ] Set up rate limiting and DDoS protection
- [ ] Implement data encryption and secure storage
- [ ] Add security monitoring and alerting
- [ ] Conduct regular security audits
- [ ] Train team on security best practices

Remember: Security is an ongoing process, not a one-time implementation. Regularly update your security measures as new threats emerge and your application evolves.`,
      contentType: "guide",
      difficulty: "advanced",
      estimatedReadTime: 45,
      categoryId: "security",
      authorId: null,
      isFeatured: true,
      isPublished: true,
      tags: ["security", "advanced", "guide", "authentication", "encryption"],
      frameworks: ["Node.js", "Express"],
      languages: ["JavaScript", "TypeScript"],
      prerequisites: ["Web development experience", "Understanding of HTTP", "Basic cryptography knowledge", "Authentication concepts"],
      keyPoints: [
        "Security must be built into every layer of your application",
        "Implement strong authentication with multi-factor authentication",
        "Always validate and sanitize user input to prevent injection attacks",
        "Use encryption for sensitive data both at rest and in transit",
        "Monitor security events and respond to threats quickly"
      ]
    }
  ];

  const createdArticles = [];
  for (const article of articles) {
    try {
      const created = await storage.createDocumentationArticle(article);
      createdArticles.push(created);
    } catch (error) {
      console.log(`Article "${article.title}" may already exist, skipping...`);
    }
  }

  return createdArticles;
}