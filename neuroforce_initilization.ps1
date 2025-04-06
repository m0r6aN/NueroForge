# NeuroForge Project Initialization Script
# This script creates the entire project structure for NeuroForge
# Run this in PowerShell to set up the directory structure

# Create root directory
$rootDir = "neuroforge"
New-Item -Path $rootDir -ItemType Directory -Force

# GitHub workflows
$githubDir = Join-Path $rootDir ".github\workflows"
New-Item -Path $githubDir -ItemType Directory -Force
New-Item -Path (Join-Path $githubDir "deploy-frontend.yml") -ItemType File -Force
New-Item -Path (Join-Path $githubDir "deploy-backend.yml") -ItemType File -Force

# Backend structure
$backendDir = Join-Path $rootDir "backend"
New-Item -Path $backendDir -ItemType Directory -Force

# Backend src
$backendSrcDir = Join-Path $backendDir "src"
New-Item -Path $backendSrcDir -ItemType Directory -Force
New-Item -Path (Join-Path $backendSrcDir "app.js") -ItemType File -Force
New-Item -Path (Join-Path $backendSrcDir "server.js") -ItemType File -Force

# Backend config
$backendConfigDir = Join-Path $backendSrcDir "config"
New-Item -Path $backendConfigDir -ItemType Directory -Force
New-Item -Path (Join-Path $backendConfigDir "index.js") -ItemType File -Force
New-Item -Path (Join-Path $backendConfigDir "db.js") -ItemType File -Force
New-Item -Path (Join-Path $backendConfigDir "keys.js") -ItemType File -Force

# Backend controllers
$backendControllersDir = Join-Path $backendSrcDir "controllers"
New-Item -Path $backendControllersDir -ItemType Directory -Force
$controllers = @(
    "authController.js",
    "userController.js",
    "subjectController.js",
    "learningController.js",
    "aiController.js",
    "gamificationController.js",
    "paymentController.js",
    "affiliateController.js"
)
foreach ($controller in $controllers) {
    New-Item -Path (Join-Path $backendControllersDir $controller) -ItemType File -Force
}

# Backend middleware
$backendMiddlewareDir = Join-Path $backendSrcDir "middleware"
New-Item -Path $backendMiddlewareDir -ItemType Directory -Force
$middleware = @(
    "authMiddleware.js",
    "errorMiddleware.js",
    "rateLimiter.js",
    "validationMiddleware.js"
)
foreach ($mw in $middleware) {
    New-Item -Path (Join-Path $backendMiddlewareDir $mw) -ItemType File -Force
}

# Backend models
$backendModelsDir = Join-Path $backendSrcDir "models"
New-Item -Path $backendModelsDir -ItemType Directory -Force

# MongoDB models
$backendMongoModelsDir = Join-Path $backendModelsDir "mongo"
New-Item -Path $backendMongoModelsDir -ItemType Directory -Force
$mongoModels = @(
    "User.js",
    "Subject.js",
    "Lesson.js"
)
foreach ($model in $mongoModels) {
    New-Item -Path (Join-Path $backendMongoModelsDir $model) -ItemType File -Force
}

# SQL models
$backendSqlModelsDir = Join-Path $backendModelsDir "sql"
New-Item -Path $backendSqlModelsDir -ItemType Directory -Force
$sqlModels = @(
    "Subscription.js",
    "Payment.js",
    "Affiliate.js"
)
foreach ($model in $sqlModels) {
    New-Item -Path (Join-Path $backendSqlModelsDir $model) -ItemType File -Force
}

# Backend routes
$backendRoutesDir = Join-Path $backendSrcDir "routes"
New-Item -Path $backendRoutesDir -ItemType Directory -Force
$routes = @(
    "index.js",
    "authRoutes.js",
    "userRoutes.js",
    "subjectRoutes.js",
    "learningRoutes.js",
    "aiRoutes.js",
    "gamificationRoutes.js",
    "paymentRoutes.js",
    "affiliateRoutes.js"
)
foreach ($route in $routes) {
    New-Item -Path (Join-Path $backendRoutesDir $route) -ItemType File -Force
}

# Backend services
$backendServicesDir = Join-Path $backendSrcDir "services"
New-Item -Path $backendServicesDir -ItemType Directory -Force
$services = @(
    "SubjectOrderingService.js",
    "SrsService.js",
    "AiApiService.js",
    "PaymentService.js",
    "WebSocketService.js",
    "AzureStorageService.js"
)
foreach ($service in $services) {
    New-Item -Path (Join-Path $backendServicesDir $service) -ItemType File -Force
}

# Backend utils
$backendUtilsDir = Join-Path $backendSrcDir "utils"
New-Item -Path $backendUtilsDir -ItemType Directory -Force
$utils = @(
    "logger.js",
    "encryption.js",
    "apiError.js"
)
foreach ($util in $utils) {
    New-Item -Path (Join-Path $backendUtilsDir $util) -ItemType File -Force
}

# Backend tests
$backendTestsDir = Join-Path $backendDir "tests"
New-Item -Path $backendTestsDir -ItemType Directory -Force
New-Item -Path (Join-Path $backendTestsDir "example.test.js") -ItemType File -Force

# Backend config files
New-Item -Path (Join-Path $backendDir ".env.example") -ItemType File -Force
New-Item -Path (Join-Path $backendDir ".gitignore") -ItemType File -Force
New-Item -Path (Join-Path $backendDir "package.json") -ItemType File -Force

# Frontend structure
$frontendDir = Join-Path $rootDir "frontend"
New-Item -Path $frontendDir -ItemType Directory -Force

# Frontend app
$frontendAppDir = Join-Path $frontendDir "app"
New-Item -Path $frontendAppDir -ItemType Directory -Force

# Frontend app - main app routes
$frontendAppMainDir = Join-Path $frontendAppDir "(app)"
New-Item -Path $frontendAppMainDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendAppMainDir "layout.tsx") -ItemType File -Force

# Dashboard
$frontendDashboardDir = Join-Path $frontendAppMainDir "dashboard"
New-Item -Path $frontendDashboardDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendDashboardDir "page.tsx") -ItemType File -Force

# Subjects
$frontendSubjectsDir = Join-Path $frontendAppMainDir "subjects"
New-Item -Path $frontendSubjectsDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendSubjectsDir "page.tsx") -ItemType File -Force
$frontendSubjectIdDir = Join-Path $frontendSubjectsDir "[subjectId]"
New-Item -Path $frontendSubjectIdDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendSubjectIdDir "page.tsx") -ItemType File -Force

# Learn
$frontendLearnDir = Join-Path $frontendAppMainDir "learn"
New-Item -Path $frontendLearnDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendLearnDir "page.tsx") -ItemType File -Force

# Profile
$frontendProfileDir = Join-Path $frontendAppMainDir "profile"
New-Item -Path $frontendProfileDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendProfileDir "page.tsx") -ItemType File -Force

# AR
$frontendArDir = Join-Path $frontendAppMainDir "ar"
New-Item -Path $frontendArDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendArDir "page.tsx") -ItemType File -Force

# Community
$frontendCommunityDir = Join-Path $frontendAppMainDir "community"
New-Item -Path $frontendCommunityDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendCommunityDir "page.tsx") -ItemType File -Force

# Auth routes
$frontendAuthDir = Join-Path $frontendAppDir "(auth)"
New-Item -Path $frontendAuthDir -ItemType Directory -Force

# Login
$frontendLoginDir = Join-Path $frontendAuthDir "login"
New-Item -Path $frontendLoginDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendLoginDir "page.tsx") -ItemType File -Force

# Signup
$frontendSignupDir = Join-Path $frontendAuthDir "signup"
New-Item -Path $frontendSignupDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendSignupDir "page.tsx") -ItemType File -Force

# API routes for auth
$frontendApiAuthDir = Join-Path $frontendAppDir "api\auth\[...nextauth]"
New-Item -Path $frontendApiAuthDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendApiAuthDir "route.ts") -ItemType File -Force

# Root app files
New-Item -Path (Join-Path $frontendAppDir "layout.tsx") -ItemType File -Force
New-Item -Path (Join-Path $frontendAppDir "page.tsx") -ItemType File -Force

# Frontend components
$frontendComponentsDir = Join-Path $frontendDir "components"
New-Item -Path $frontendComponentsDir -ItemType Directory -Force

# UI components (for Shadcn)
$frontendUiDir = Join-Path $frontendComponentsDir "ui"
New-Item -Path $frontendUiDir -ItemType Directory -Force

# Layout components
$frontendLayoutDir = Join-Path $frontendComponentsDir "layout"
New-Item -Path $frontendLayoutDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendLayoutDir "Navbar.tsx") -ItemType File -Force
New-Item -Path (Join-Path $frontendLayoutDir "Sidebar.tsx") -ItemType File -Force

# Auth components
$frontendAuthComponentsDir = Join-Path $frontendComponentsDir "auth"
New-Item -Path $frontendAuthComponentsDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendAuthComponentsDir "LoginForm.tsx") -ItemType File -Force
New-Item -Path (Join-Path $frontendAuthComponentsDir "SignupForm.tsx") -ItemType File -Force

# Dashboard components
$frontendDashboardComponentsDir = Join-Path $frontendComponentsDir "dashboard"
New-Item -Path $frontendDashboardComponentsDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendDashboardComponentsDir "ProgressOverview.tsx") -ItemType File -Force

# Subject components
$frontendSubjectComponentsDir = Join-Path $frontendComponentsDir "subjects"
New-Item -Path $frontendSubjectComponentsDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendSubjectComponentsDir "SubjectList.tsx") -ItemType File -Force
New-Item -Path (Join-Path $frontendSubjectComponentsDir "SubjectGraph.tsx") -ItemType File -Force

# Learning components
$frontendLearningComponentsDir = Join-Path $frontendComponentsDir "learning"
New-Item -Path $frontendLearningComponentsDir -ItemType Directory -Force
$learningComponents = @(
    "MicrolearningModule.tsx",
    "SpacedRepetitionCard.tsx",
    "AiTutorInterface.tsx",
    "FocusTimer.tsx"
)
foreach ($component in $learningComponents) {
    New-Item -Path (Join-Path $frontendLearningComponentsDir $component) -ItemType File -Force
}

# Gamification components
$frontendGamificationComponentsDir = Join-Path $frontendComponentsDir "gamification"
New-Item -Path $frontendGamificationComponentsDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendGamificationComponentsDir "AchievementBadge.tsx") -ItemType File -Force
New-Item -Path (Join-Path $frontendGamificationComponentsDir "XpDisplay.tsx") -ItemType File -Force

# Audio components
$frontendAudioComponentsDir = Join-Path $frontendComponentsDir "audio"
New-Item -Path $frontendAudioComponentsDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendAudioComponentsDir "BinauralPlayer.tsx") -ItemType File -Force
New-Item -Path (Join-Path $frontendAudioComponentsDir "AudioVisualizer.tsx") -ItemType File -Force

# AR components
$frontendArComponentsDir = Join-Path $frontendComponentsDir "ar"
New-Item -Path $frontendArComponentsDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendArComponentsDir "ArExperienceLoader.tsx") -ItemType File -Force

# Common components
$frontendCommonComponentsDir = Join-Path $frontendComponentsDir "common"
New-Item -Path $frontendCommonComponentsDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendCommonComponentsDir "ThemeToggle.tsx") -ItemType File -Force
New-Item -Path (Join-Path $frontendCommonComponentsDir "LoadingSpinner.tsx") -ItemType File -Force

# Hooks
$frontendHooksDir = Join-Path $frontendDir "hooks"
New-Item -Path $frontendHooksDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendHooksDir "useAuth.ts") -ItemType File -Force
New-Item -Path (Join-Path $frontendHooksDir "useTheme.ts") -ItemType File -Force
New-Item -Path (Join-Path $frontendHooksDir "useBinauralBeats.ts") -ItemType File -Force

# Lib
$frontendLibDir = Join-Path $frontendDir "lib"
New-Item -Path $frontendLibDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendLibDir "api.ts") -ItemType File -Force
New-Item -Path (Join-Path $frontendLibDir "auth.ts") -ItemType File -Force
New-Item -Path (Join-Path $frontendLibDir "constants.ts") -ItemType File -Force
New-Item -Path (Join-Path $frontendLibDir "utils.ts") -ItemType File -Force
New-Item -Path (Join-Path $frontendLibDir "webAudio.ts") -ItemType File -Force

# Public
$frontendPublicDir = Join-Path $frontendDir "public"
New-Item -Path $frontendPublicDir -ItemType Directory -Force

# Fonts
$frontendFontsDir = Join-Path $frontendPublicDir "fonts"
New-Item -Path $frontendFontsDir -ItemType Directory -Force

# Images
$frontendImagesDir = Join-Path $frontendPublicDir "images"
New-Item -Path $frontendImagesDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendImagesDir "logo-dark.svg") -ItemType File -Force
New-Item -Path (Join-Path $frontendImagesDir "logo-light.svg") -ItemType File -Force

# Assets for AR
$frontendAssetsDir = Join-Path $frontendPublicDir "assets"
New-Item -Path $frontendAssetsDir -ItemType Directory -Force

# Styles
$frontendStylesDir = Join-Path $frontendDir "styles"
New-Item -Path $frontendStylesDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendStylesDir "globals.css") -ItemType File -Force

# Types
$frontendTypesDir = Join-Path $frontendDir "types"
New-Item -Path $frontendTypesDir -ItemType Directory -Force
New-Item -Path (Join-Path $frontendTypesDir "index.ts") -ItemType File -Force
New-Item -Path (Join-Path $frontendTypesDir "next-auth.d.ts") -ItemType File -Force

# Frontend config files
New-Item -Path (Join-Path $frontendDir ".env.local.example") -ItemType File -Force
New-Item -Path (Join-Path $frontendDir ".gitignore") -ItemType File -Force
New-Item -Path (Join-Path $frontendDir "next.config.mjs") -ItemType File -Force
New-Item -Path (Join-Path $frontendDir "package.json") -ItemType File -Force
New-Item -Path (Join-Path $frontendDir "postcss.config.js") -ItemType File -Force
New-Item -Path (Join-Path $frontendDir "tailwind.config.ts") -ItemType File -Force

# Root files
New-Item -Path (Join-Path $rootDir ".gitignore") -ItemType File -Force
New-Item -Path (Join-Path $rootDir "README.md") -ItemType File -Force

Write-Host "NeuroForge project structure created successfully!" -ForegroundColor Green
Write-Host "Directory path: $(Resolve-Path $rootDir)" -ForegroundColor Cyan