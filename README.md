# Rie-chan Cute PT 🌸💪

A full-stack gym & fitness web application with an adorable AI personal trainer mascot named Rie-chan.

## Features

- **Mobile-First Design**: Optimized for mobile devices with responsive layouts
- **AI Personal Trainer**: Chat with Rie-chan for fitness advice and motivation
- **Workout Tracking**: Log exercises, sets, reps, and weight
- **Progress Tracking**: Track weight, measurements, and progress photos
- **Exercise Library**: Browse exercises by category with detailed information
- **Calendar View**: Schedule and view workout history
- **Gamification**: Achievements, streaks, and personal records
- **Dark Mode**: Beautiful dark theme with Rie-chan's signature pink accent colors
- **PWA Support**: Installable as a progressive web app

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- React Router
- React Query
- React Hook Form
- Zod validation
- Framer Motion
- Recharts
- Lucide React icons

### Backend (To be implemented)
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- Supabase (PostgreSQL)
- JWT Authentication

## License

This project is **free and open for personal, non-commercial use**.

- No subscription, paywall, or license fee required for individual users
- Anyone may run, modify, and self-host the app for their own personal fitness tracking
- Attribution appreciated but not required
- Commercial redistribution, resale, or SaaS offering built on top of this codebase is outside the scope of "personal use" and would need separate consideration

## Medical Disclaimer

**Not medical advice** — Consult a doctor or physical therapist before starting any new exercise program, especially with existing injuries or health conditions.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rie-chan-gym.git
   cd rie-chan-gym
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install frontend dependencies
   cd apps/frontend
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in `apps/frontend`:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

4. **Run the development server**
   ```bash
   cd apps/frontend
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Building for Production

```bash
cd apps/frontend
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
rie-chan-gym/
├── apps/
│   ├── frontend/          # React frontend application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── rie-chan/    # Rie-chan mascot components
│   │   │   │   ├── ui/          # UI components (Button, Card, etc.)
│   │   │   │   └── theme-provider.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-toast.ts
│   │   │   ├── layouts/
│   │   │   │   ├── AuthLayout.tsx
│   │   │   │   └── MainLayout.tsx
│   │   │   ├── lib/
│   │   │   │   └── utils.ts
│   │   │   ├── pages/
│   │   │   │   ├── auth/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── WorkoutPage.tsx
│   │   │   │   ├── ExercisesPage.tsx
│   │   │   │   ├── ProgressPage.tsx
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   ├── CalendarPage.tsx
│   │   │   │   └── AICoachPage.tsx
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── backend/           # Express backend (to be implemented)
├── package.json
└── README.md
```

## Pages

- **Login/Register**: User authentication with form validation
- **Dashboard**: Today's workout, streaks, stats, and achievements
- **Workout**: Active workout mode with set logging and rest timer
- **Exercises**: Browse and search exercise library
- **Progress**: Track weight, measurements, and view charts
- **Profile**: User settings, stats, and account management
- **Calendar**: Monthly view of workout schedule
- **AI Coach**: Chat interface with Rie-chan for fitness advice

## Design System

### Colors

- **Primary Pink**: `#ff6b9d` - Rie-chan's signature color
- **Primary Purple**: `#9b6bff` - Secondary accent
- **Dark Background**: Near-black for gym-friendly viewing
- **Light Background**: Clean white/light gray for light mode

### Typography

- **Display Font**: Poppins - For headings and numbers
- **Body Font**: Inter - For body text

### Components

Built with shadcn/ui components customized with Rie-chan's color scheme:
- Button
- Card
- Input
- Label
- Toast
- Dialog (to be added)

## Rie-chan Mascot

Rie-chan is an original cute Japanese-style girl mascot character who acts as your personal trainer. She appears throughout the app with different expressions:
- **Idle**: Default neutral expression
- **Happy**: Cheerful and encouraging
- **Cheer**: Celebrating achievements
- **Point**: Guiding and directing
- **Rest**: During rest periods
- **Celebrate**: For special moments

## Development

### Adding New Components

1. Create component in `src/components/ui/` or appropriate subdirectory
2. Follow existing component patterns
3. Use Tailwind CSS for styling
4. Add TypeScript types
5. Export from component file

### Adding New Pages

1. Create page in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation item in `src/layouts/MainLayout.tsx` if needed

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Ensure touch targets are at least 44x44px
- Use Rie-chan's color palette for brand consistency
- Test in both light and dark modes

## Deployment

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

The frontend is configured for Vercel deployment with PWA support.

## Future Enhancements

- [ ] Complete backend API implementation
- [ ] Add real AI integration (Claude/OpenAI)
- [ ] Implement live exercise movement guidance with pose detection
- [ ] Add more exercise animations
- [ ] Implement social features (community, leaderboards)
- [ ] Add nutrition tracking
- [ ] Implement workout plan generator
- [ ] Add more achievements and gamification elements

## Contributing

This is a personal project. Feel free to fork and modify for your own use!

## Support

For issues or questions, please open an issue on GitHub.

---

Made with 💕 by Rie-chan
