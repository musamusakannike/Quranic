# Appwrite Setup Guide for Quranic Mobile App

This guide will walk you through setting up Appwrite for your mobile app's AI functionality.

## Prerequisites

- Node.js and npm installed
- An Appwrite account (sign up at https://cloud.appwrite.io)
- OpenRouter API key (get one at https://openrouter.ai/keys)

## Step 1: Create an Appwrite Project

1. Go to https://cloud.appwrite.io and sign in
2. Click **"Create Project"**
3. Name your project (e.g., "Quranic App")
4. Copy your **Project ID** - you'll need this later

## Step 2: Install Appwrite CLI

```bash
# Install globally via npm
npm install -g appwrite-cli

# Or on macOS via Homebrew
brew install appwrite

# Verify installation
appwrite -v
```

## Step 3: Login to Appwrite CLI

```bash
# Login to your Appwrite account
appwrite login

# This will open a browser window for authentication
# Follow the prompts to complete login
```

## Step 4: Initialize Appwrite in Your Project

```bash
# Navigate to your mobile project directory
cd /path/to/Quranic/mobile

# Initialize Appwrite project
appwrite init project

# When prompted:
# - Select your project from the list
# - Confirm the endpoint (https://cloud.appwrite.io/v1)
```

This will update your `appwrite.config.json` file with your project ID.

## Step 5: Deploy the AI Chat Function

1. **Update the appwrite.config.json** - Replace `<YOUR_PROJECT_ID>` with your actual project ID

2. **Deploy the function:**

```bash
# Deploy the AI chat function to Appwrite
appwrite push functions --function-id ai-chat

# This will:
# - Upload the function code
# - Install dependencies (node-appwrite)
# - Create the function in your Appwrite project
```

3. **Set environment variables in Appwrite Console:**
   - Go to https://cloud.appwrite.io
   - Navigate to **Functions** → **ai-chat**
   - Click on **Settings** → **Variables**
   - Add the following variables:
     - `OPENROUTER_API_KEY`: Your OpenRouter API key
     - `AI_MODEL`: `google/gemini-2.0-flash-lite-001` (or your preferred model)

## Step 6: Configure Your Mobile App

1. **Update your `.env` file:**

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your values:
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_actual_project_id_here
EXPO_PUBLIC_APPWRITE_AI_FUNCTION_ID=ai-chat
```

2. **Install dependencies:**

```bash
# Install the Appwrite SDK
sudo npm install react-native-appwrite react-native-url-polyfill
```

## Step 7: Configure Function Permissions

1. Go to Appwrite Console → **Functions** → **ai-chat**
2. Click on **Settings** → **Permissions**
3. Add execution permission:
   - Click **Add Role**
   - Select **Any** (allows any authenticated or guest user to execute)
   - Enable **Execute** permission

## Step 8: Test the Function

You can test the function directly from the Appwrite Console:

1. Go to **Functions** → **ai-chat** → **Execute**
2. Add test body:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What does the Quran say about patience?"
    }
  ]
}
```
3. Click **Execute**
4. Check the response and logs

## Step 9: Run Your Mobile App

```bash
# Start the Expo development server
npm start

# Or run on specific platform
npm run ios
npm run android
```

## Architecture Overview

### How It Works

1. **Client Side** (`mobile/lib/AppwriteAIService.ts`):
   - User sends a message through the AI chat UI
   - Service calls Appwrite Function with conversation history
   - Receives structured AI response
   - Displays response with verse references

2. **Server Side** (`mobile/functions/ai-chat/src/main.js`):
   - Appwrite Function receives the request
   - Calls OpenRouter API with Islamic knowledge system prompt
   - Processes AI response with structured JSON schema
   - Returns formatted response with Quran references

### Benefits of Using Appwrite

- ✅ **API Key Security**: Your OpenRouter API key is stored securely in Appwrite, not exposed in the mobile app
- ✅ **Serverless**: No need to manage servers - Appwrite handles scaling automatically
- ✅ **Rate Limiting**: Built-in rate limiting and abuse prevention
- ✅ **Logging**: All function executions are logged for debugging
- ✅ **Easy Updates**: Update AI logic without releasing a new app version

## Troubleshooting

### Function Execution Fails

1. Check function logs in Appwrite Console → Functions → ai-chat → Executions
2. Verify environment variables are set correctly
3. Ensure OpenRouter API key is valid

### "AI service not configured" Error

- Make sure `OPENROUTER_API_KEY` is set in function variables
- Redeploy the function after adding variables

### Permission Denied

- Check function execution permissions (Step 7)
- Ensure the function is enabled and live

### Network Errors in Mobile App

- Verify `.env` file has correct values
- Check that `EXPO_PUBLIC_APPWRITE_PROJECT_ID` matches your project
- Ensure internet connection is available

## Optional: Enable Authentication

If you want to add user authentication later:

1. Go to Appwrite Console → **Auth**
2. Enable desired auth methods (Email/Password, OAuth, etc.)
3. Update function permissions to require authenticated users
4. Implement login in your mobile app using `appwriteAccount` from `lib/appwrite.ts`

## Monitoring and Analytics

- **View Function Logs**: Console → Functions → ai-chat → Executions
- **Monitor Usage**: Console → Overview → Usage statistics
- **Set Alerts**: Console → Settings → Webhooks (for production monitoring)

## Next Steps

- [ ] Test the AI chat functionality thoroughly
- [ ] Consider adding user authentication
- [ ] Set up production environment variables
- [ ] Configure rate limiting if needed
- [ ] Add error tracking (e.g., Sentry)
- [ ] Monitor API costs on OpenRouter dashboard

## Support

- Appwrite Documentation: https://appwrite.io/docs
- Appwrite Discord: https://appwrite.io/discord
- OpenRouter Documentation: https://openrouter.ai/docs

---

**Note**: Keep your API keys secure and never commit them to version control. The `.env` file is already in `.gitignore`.
