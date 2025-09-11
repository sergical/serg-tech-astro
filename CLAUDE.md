# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` or `pnpm start` - Start the development server at localhost:4321
- `pnpm build` - Build production site (runs astro check then astro build)
- `pnpm preview` - Preview production build locally
- `astro check` - TypeScript and Astro file checking

## Architecture Overview

This is an Astro-based personal portfolio site with multi-framework support:

### Framework Integration
- **Astro**: Primary framework for static site generation with SSR capabilities
- **React**: Used for interactive components (ThemeSelect.tsx)
- **Svelte**: Used for animated components (TypewriterName.svelte)
- **Tailwind CSS**: Primary styling framework with custom CSS variables for theming

### Deployment & Runtime
- **Cloudflare adapter**: Configured for server-side rendering with edge deployment
- **Sentry**: Integrated for error monitoring and performance tracking

### Theme System
The site implements a custom theme system with three themes:
- **Light**: Default light theme
- **Dark**: Dark theme variant  
- **Sentry**: Special branded theme with purple/pink color scheme

Theme state is managed through:
- Server-side cookies (set via `/api/theme` endpoint)
- Client-side localStorage persistence
- CSS custom properties in Layout.astro for theme variables
- ThemeSelect.tsx React component for theme switching

### Project Structure
- `src/layouts/Layout.astro` - Base layout with theme system and global styles
- `src/pages/index.astro` - Main homepage content
- `src/pages/api/theme.ts` - Theme switching API endpoint
- `src/components/ui/` - Reusable UI components following shadcn/ui patterns
- `src/lib/utils.ts` - Utility functions including Tailwind class merging
- `components.json` - shadcn/ui configuration

### Key Dependencies
- **@astrojs/react & @astrojs/svelte**: Multi-framework integration
- **@radix-ui/react-select**: Accessible select component for theme switcher
- **class-variance-authority & clsx**: Component variant and class management
- **lucide-react**: Icon library for UI elements
- **@sentry/astro**: Error monitoring integration

### Path Aliases
- `@/*` maps to `./src/*` (configured in tsconfig.json)

### Node Requirements
- Node.js >=20.0.0 required