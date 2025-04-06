neuroforge/
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml
│       └── deploy-backend.yml
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   ├── index.js
│   │   │   ├── db.js
│   │   │   └── keys.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── subjectController.js
│   │   │   ├── learningController.js
│   │   │   ├── aiController.js
│   │   │   ├── gamificationController.js
│   │   │   ├── paymentController.js
│   │   │   └── affiliateController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorMiddleware.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validationMiddleware.js
│   │   ├── models/
│   │   │   ├── mongo/
│   │   │   │   ├── User.js
│   │   │   │   ├── Subject.js
│   │   │   │   └── Lesson.js
│   │   │   └── sql/
│   │   │       ├── Subscription.js
│   │   │       ├── Payment.js
│   │   │       └── Affiliate.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── subjectRoutes.js
│   │   │   ├── learningRoutes.js
│   │   │   ├── aiRoutes.js
│   │   │   ├── gamificationRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   └── affiliateRoutes.js
│   │   ├── services/
│   │   │   ├── SubjectOrderingService.js
│   │   │   ├── SrsService.js
│   │   │   ├── AiApiService.js
│   │   │   ├── PaymentService.js
│   │   │   ├── WebSocketService.js
│   │   │   └── AzureStorageService.js
│   │   └── utils/
│   │       ├── logger.js
│   │       ├── encryption.js
│   │       └── apiError.js
│   ├── tests/
│   │   └── example.test.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── subjects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [subjectId]/
│   │   │   │       └── page.tsx
│   │   │   ├── learn/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── ar/
│   │   │   │   └── page.tsx
│   │   │   └── community/
│   │   │       └── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/         # Shadcn UI components live here (added via CLI)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── dashboard/
│   │   │   └── ProgressOverview.tsx
│   │   ├── subjects/
│   │   │   ├── SubjectList.tsx
│   │   │   └── SubjectGraph.tsx
│   │   ├── learning/
│   │   │   ├── MicrolearningModule.tsx
│   │   │   ├── SpacedRepetitionCard.tsx
│   │   │   ├── AiTutorInterface.tsx
│   │   │   └── FocusTimer.tsx
│   │   ├── gamification/
│   │   │   ├── AchievementBadge.tsx
│   │   │   └── XpDisplay.tsx
│   │   ├── audio/
│   │   │   ├── BinauralPlayer.tsx
│   │   │   └── AudioVisualizer.tsx
│   │   ├── ar/
│   │   │   └── ArExperienceLoader.tsx # Placeholder for React Three Fiber / WebXR
│   │   └── common/
│   │       ├── ThemeToggle.tsx
│   │       └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTheme.ts
│   │   └── useBinauralBeats.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts # NextAuth config
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   └── webAudio.ts # Binaural beats logic
│   ├── public/
│   │   ├── fonts/
│   │   ├── images/
│   │   │   └── logo-dark.svg
│   │   │   └── logo-light.svg
│   │   └── assets/ # For AR models, etc.
│   ├── styles/
│   │   └── globals.css
│   ├── types/
│   │   ├── index.ts
│   │   └── next-auth.d.ts
│   ├── .env.local.example
│   ├── .gitignore
│   ├── next.config.mjs
│   ├── package.json
│   ├── postcss.config.js
│   └── tailwind.config.ts
├── .gitignore
└── README.md