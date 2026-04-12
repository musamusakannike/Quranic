# Quick Start: Appwrite AI Setup

## TL;DR - What You Need to Do

### 1. Create Appwrite Account & Project
- Sign up at https://cloud.appwrite.io
- Create a new project
- Copy your Project ID

### 2. Install & Login to Appwrite CLI
```bash
npm install -g appwrite-cli
appwrite login
```

### 3. Configure Your Project
```bash
# In mobile directory
cd /path/to/Quranic/mobile

# Update appwrite.config.json - replace <YOUR_PROJECT_ID> with your actual ID
# Then initialize
appwrite init project
```

### 4. Deploy the AI Function
```bash
appwrite push functions --function-id ai-chat
```

### 5. Set Function Environment Variables
In Appwrite Console (https://cloud.appwrite.io):
- Go to **Functions** → **ai-chat** → **Settings** → **Variables**
- Add:
  - `OPENROUTER_API_KEY` = your OpenRouter key
  - `AI_MODEL` = `google/gemini-2.0-flash-lite-001`

### 6. Set Function Permissions
- Go to **Functions** → **ai-chat** → **Settings** → **Permissions**
- Add role: **Any**
- Enable: **Execute**

### 7. Update Mobile App .env
```bash
cp .env.example .env
# Edit .env:
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_APPWRITE_AI_FUNCTION_ID=ai-chat
```

### 8. Run Your App
```bash
npm start
```

## That's It! 🎉

Your AI chat should now work through Appwrite instead of direct OpenRouter calls.

For detailed instructions, see [APPWRITE_SETUP.md](./APPWRITE_SETUP.md)
