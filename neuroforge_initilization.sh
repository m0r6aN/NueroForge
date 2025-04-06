#!/bin/bash
# NeuroForge Project Initialization Script for Linux/macOS
# This script creates the entire project structure for NeuroForge
# Run with: bash setup-neuroforge.sh

# Create root directory
mkdir -p neuroforge

# GitHub workflows
mkdir -p neuroforge/.github/workflows
touch neuroforge/.github/workflows/deploy-frontend.yml
touch neuroforge/.github/workflows/deploy-backend.yml

# Backend structure
mkdir -p neuroforge/backend/src
touch neuroforge/backend/src/app.js
touch neuroforge/backend/src/server.js

# Backend config
mkdir -p neuroforge/backend/src/config
touch neuroforge/backend/src/config/index.js
touch neuroforge/backend/src/config/db.js
touch neuroforge/backend/src/config/keys.js

# Backend controllers
mkdir -p neuroforge/backend/src/controllers
for controller in authController.js userController.js subjectController.js learningController.js aiController.js gamificationController.js paymentController.js affiliateController.js; do
    touch "neuroforge/backend/src/controllers/$controller"
done

# Backend middleware
mkdir -p neuroforge/backend/src/middleware
for middleware in authMiddleware.js errorMiddleware.js rateLimiter.js validationMiddleware.js; do
    touch "neuroforge/backend/src/middleware/$middleware"
done

# Backend models
mkdir -p neuroforge/backend/src/models/mongo
for model in User.js Subject.js Lesson.js; do
    touch "neuroforge/backend/src/models/mongo/$model"
done

mkdir -p neuroforge/backend/src/models/sql
for model in Subscription.js Payment.js Affiliate.js; do
    touch "neuroforge/backend/src/models/sql/$model"
done

# Backend routes
mkdir -p neuroforge/backend/src/routes
for route in index.js authRoutes.js userRoutes.js subjectRoutes.js learningRoutes.js aiRoutes.js gamificationRoutes.js paymentRoutes.js affiliateRoutes.js; do
    touch "neuroforge/backend/src/routes/$route"
done

# Backend services
mkdir -p neuroforge/backend/src/services
for service in SubjectOrderingService.js SrsService.js AiApiService.js PaymentService.js WebSocketService.js AzureStorageService.js; do
    touch "neuroforge/backend/src/services/$service"
done

# Backend utils
mkdir -p neuroforge/backend/src/utils
for util in logger.js encryption.js apiError.js; do
    touch "neuroforge/backend/src/utils/$util"
done

# Backend tests
mkdir -p neuroforge/backend/tests
touch neuroforge/backend/tests/example.test.js

# Backend config files
touch neuroforge/backend/.env.example
touch neuroforge/backend/.gitignore
touch neuroforge/backend/package.json

# Frontend structure
mkdir -p neuroforge/frontend/app

# Frontend app routes
mkdir -p neuroforge/frontend/app/\(app\)
touch neuroforge/frontend/app/\(app\)/layout.tsx

# Dashboard
mkdir -p neuroforge/frontend/app/\(app\)/dashboard
touch neuroforge/frontend/app/\(app\)/dashboard/page.tsx

# Subjects
mkdir -p neuroforge/frontend/app/\(app\)/subjects/\[subjectId\]
touch neuroforge/frontend/app/\(app\)/subjects/page.tsx
touch neuroforge/frontend/app/\(app\)/subjects/\[subjectId\]/page.tsx

# Learn
mkdir -p neuroforge/frontend/app/\(app\)/learn
touch neuroforge/frontend/app/\(app\)/learn/page.tsx

# Profile
mkdir -p neuroforge/frontend/app/\(app\)/profile
touch neuroforge/frontend/app/\(app\)/profile/page.tsx

# AR
mkdir -p neuroforge/frontend/app/\(app\)/ar
touch neuroforge/frontend/app/\(app\)/ar/page.tsx

# Community
mkdir -p neuroforge/frontend/app/\(app\)/community
touch neuroforge/frontend/app/\(app\)/community/page.tsx

# Auth routes
mkdir -p neuroforge/frontend/app/\(auth\)/login
mkdir -p neuroforge/frontend/app/\(auth\)/signup
touch neuroforge/frontend/app/\(auth\)/login/page.tsx
touch neuroforge/frontend/app/\(auth\)/signup/page.tsx

# API routes for auth
mkdir -p neuroforge/frontend/app/api/auth/\[...nextauth\]
touch neuroforge/frontend/app/api/auth/\[...nextauth\]/route.ts

# Root app files
touch neuroforge/frontend/app/layout.tsx
touch neuroforge/frontend/app/page.tsx

# Frontend components
mkdir -p neuroforge/frontend/components/ui

# Layout components
mkdir -p neuroforge/frontend/components/layout
touch neuroforge/frontend/components/layout/Navbar.tsx
touch neuroforge/frontend/components/layout/Sidebar.tsx

# Auth components
mkdir -p neuroforge/frontend/components/auth
touch neuroforge/frontend/components/auth/LoginForm.tsx
touch neuroforge/frontend/components/auth/SignupForm.tsx

# Dashboard components
mkdir -p neuroforge/frontend/components/dashboard
touch neuroforge/frontend/components/dashboard/ProgressOverview.tsx

# Subject components
mkdir -p neuroforge/frontend/components/subjects
touch neuroforge/frontend/components/subjects/SubjectList.tsx
touch neuroforge/frontend/components/subjects/SubjectGraph.tsx

# Learning components
mkdir -p neuroforge/frontend/components/learning
for component in MicrolearningModule.tsx SpacedRepetitionCard.tsx AiTutorInterface.tsx FocusTimer.tsx; do
    touch "neuroforge/frontend/components/learning/$component"
done

# Gamification components
mkdir -p neuroforge/frontend/components/gamification
touch neuroforge/frontend/components/gamification/AchievementBadge.tsx
touch neuroforge/frontend/components/gamification/XpDisplay.tsx

# Audio components
mkdir -p neuroforge/frontend/components/audio
touch neuroforge/frontend/components/audio/BinauralPlayer.tsx
touch neuroforge/frontend/components/audio/AudioVisualizer.tsx

# AR components
mkdir -p neuroforge/frontend/components/ar
touch neuroforge/frontend/components/ar/ArExperienceLoader.tsx

# Common components
mkdir -p neuroforge/frontend/components/common
touch neuroforge/frontend/components/common/ThemeToggle.tsx
touch neuroforge/frontend/components/common/LoadingSpinner.tsx

# Hooks
mkdir -p neuroforge/frontend/hooks
touch neuroforge/frontend/hooks/useAuth.ts
touch neuroforge/frontend/hooks/useTheme.ts
touch neuroforge/frontend/hooks/useBinauralBeats.ts

# Lib
mkdir -p neuroforge/frontend/lib
touch neuroforge/frontend/lib/api.ts
touch neuroforge/frontend/lib/auth.ts
touch neuroforge/frontend/lib/constants.ts
touch neuroforge/frontend/lib/utils.ts
touch neuroforge/frontend/lib/webAudio.ts

# Public
mkdir -p neuroforge/frontend/public/fonts
mkdir -p neuroforge/frontend/public/images
mkdir -p neuroforge/frontend/public/assets
touch neuroforge/frontend/public/images/logo-dark.svg
touch neuroforge/frontend/public/images/logo-light.svg

# Styles
mkdir -p neuroforge/frontend/styles
touch neuroforge/frontend/styles/globals.css

# Types
mkdir -p neuroforge/frontend/types
touch neuroforge/frontend/types/index.ts
touch neuroforge/frontend/types/next-auth.d.ts

# Frontend config files
touch neuroforge/frontend/.env.local.example
touch neuroforge/frontend/.gitignore
touch neuroforge/frontend/next.config.mjs
touch neuroforge/frontend/package.json
touch neuroforge/frontend/postcss.config.js
touch neuroforge/frontend/tailwind.config.ts

# Root files
touch neuroforge/.gitignore
touch neuroforge/README.md

echo -e "\e[32mNeuroForge project structure created successfully!\e[0m"
echo -e "\e[36mDirectory path: $(pwd)/neuroforge\e[0m"