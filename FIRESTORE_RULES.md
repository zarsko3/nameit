# Firestore Security Rules

Go to your Firebase Console → Firestore Database → Rules, and paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Swipes collection - users can read/write swipes in their room
    match /swipes/{swipeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null 
        && resource.data.userId == request.auth.uid;
    }
    
    // Matches collection - users can read/write matches in their room
    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
      allow delete: if false; // Don't allow deleting matches
    }
  }
}
```

## What These Rules Do:

1. **Users Collection (`/users/{userId}`)**:
   - Users can only read and write their own profile
   - No user can access another user's data

2. **Swipes Collection (`/swipes/{swipeId}`)**:
   - Any authenticated user can read swipes (needed to find matches)
   - Users can only create swipes with their own userId
   - Users can only update/delete their own swipes

3. **Matches Collection (`/matches/{matchId}`)**:
   - Any authenticated user can read and create matches
   - Matches cannot be deleted (to preserve history)

## Important Security Notes:

1. **Never expose your Firebase config** in public repositories without proper security rules
2. **Enable Email/Password authentication** in Firebase Console → Authentication → Sign-in method
3. **Enable Firestore** in Firebase Console → Firestore Database → Create database (Start in production mode)
4. **Apply the rules above** immediately after creating the database

## Testing Tips:

- Use Firebase Emulator for local development
- Test rules using the Firebase Console's Rules Playground
- Monitor usage in Firebase Console → Usage and billing


