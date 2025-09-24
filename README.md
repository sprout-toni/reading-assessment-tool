# Reading Assessment Tool

An AI-Powered Mini Reading Test tool for parents to assess their children's reading skills.

## Features

- Interactive reading assessments
- Child-friendly interface using Lexend font for improved readability
- Built with React, Vite, and Tailwind CSS
- Responsive design
- Ready for Vercel deployment

## Development

### Prerequisites

- Node.js 18+ and npm

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code with ESLint
- `npm run typecheck` - Type check with TypeScript

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to a Git repository
2. Import the repository in Vercel
3. Vercel will automatically detect the configuration and deploy

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lexend Font** - Optimized for reading comprehension
- **Vercel** - Deployment platform

## Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.tsx         # Main application component
├── main.tsx        # Application entry point
└── index.css       # Global styles with Tailwind imports
```