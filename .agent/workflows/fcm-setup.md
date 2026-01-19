---
description: Setting up Firebase Cloud Messaging for background push notifications
---

# Firebase Cloud Messaging (FCM) Setup Guide

This guide sets up **true background push notifications** that work even when the app is closed.

## Overview

The system works like this:
1. User sets a reminder in the app → Saved to Firestore with FCM token
2. Firebase Cloud Function runs every minute → Checks for due reminders
3. Cloud Function sends push notification → User receives it even if app is closed

---

## Part 1: Firebase Console Setup

### Step 1.1: Enable Cloud Messaging

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (habit-tracker)
3. Click the **gear icon** ⚙️ → **Project Settings**
4. Go to **Cloud Messaging** tab
5. Under "Web configuration", click **Generate key pair**
6. Copy the **Public VAPID Key** - you'll need this later

### Step 1.2: Get Server Key (for testing)

1. In Project Settings → Cloud Messaging
2. Note down the **Server Key** (used for testing, not in code)

### Step 1.3: Enable Cloud Functions

1. In Firebase Console, go to **Functions** in left sidebar
2. Click **Get Started** if not already enabled
3. You'll need to upgrade to **Blaze plan** (pay-as-you-go) - required for Cloud Functions
   - Note: For small usage, it's essentially free (generous free tier)

---

## Part 2: Install Firebase Functions CLI

// turbo
### Step 2.1: Install Firebase CLI globally
```bash
npm install -g firebase-tools
```

### Step 2.2: Login to Firebase
```bash
firebase login
```

### Step 2.3: Initialize Functions in your project
```bash
cd /Users/shreyaslings/Desktop/My\ Daily\ works/habit-tracker
firebase init functions
```

When prompted:
- Select your existing project
- Choose **JavaScript** (easier setup)
- Say **Yes** to ESLint
- Say **Yes** to install dependencies

This creates a `functions/` folder in your project.

---

## Part 3: Add VAPID Key to Environment

### Step 3.1: Add to .env file

Add the VAPID key from Step 1.1 to your `.env` file:
```
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

---

## Part 4: Update Frontend Code

I will update the following files:
1. `src/services/notificationService.js` - Add FCM token registration
2. `src/services/fcmService.js` - New file for FCM-specific logic
3. `src/firebase/config.js` - Add messaging initialization
4. `public/sw.js` - Update Service Worker for FCM
5. `src/components/Reminders/TaskReminderModal.jsx` - Save reminders to Firestore

---

## Part 5: Create Cloud Function

The Cloud Function will:
1. Run every minute via Cloud Scheduler
2. Query Firestore for reminders due now
3. Send push notifications via FCM
4. Mark reminders as sent to avoid duplicates

File: `functions/index.js`

---

## Part 6: Deploy

### Step 6.1: Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### Step 6.2: Set up Cloud Scheduler
The function uses `pubsub.schedule` which automatically creates a Cloud Scheduler job.

---

## Quick Summary

| Step | What to do |
|------|------------|
| 1 | Generate VAPID key in Firebase Console |
| 2 | Upgrade to Blaze plan for Functions |
| 3 | Install Firebase CLI & init functions |
| 4 | Add VAPID key to .env |
| 5 | Update frontend code (I'll do this) |
| 6 | Create Cloud Function (I'll do this) |
| 7 | Deploy functions |

---

## Ready to Start?

After you complete **Steps 1-4** (console setup), let me know and I'll:
1. Update all the frontend code
2. Create the Cloud Function code
3. Help you deploy

**Tell me when you have:**
- [ ] Generated VAPID key
- [ ] Upgraded to Blaze plan
- [ ] Run `firebase init functions`
- [ ] Added VAPID key to .env
