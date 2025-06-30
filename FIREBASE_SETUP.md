# Firebase Setup Guide for SMAS

This guide provides instructions for setting up Firebase Firestore for the SMAS application.

## 🔥 Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `smas-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location close to your users
5. Click "Done"

### 3. Get Firebase Configuration
1. In Firebase Console, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select "Web"
4. Register app with name "SMAS Web App"
5. Copy the configuration object

## 🔧 Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Spotify API Configuration
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id

# Firebase Emulator (Development Only)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

## 🗄️ Database Schema

The Firestore database uses the following collections:

### Users Collection (`users`)
- **Document ID**: Spotify user ID
- **Fields**:
  - `id`: Spotify user ID
  - `displayName`: User's display name
  - `email`: User's email address
  - `imageUrl`: User's profile image URL
  - `spotifyAccessToken`: Spotify access token
  - `spotifyRefreshToken`: Spotify refresh token
  - `spotifyTokenExpiresAt`: Token expiration timestamp
  - `createdAt`: Account creation timestamp
  - `updatedAt`: Last update timestamp

### Playlists Collection (`playlists`)
- **Document ID**: Auto-generated Firestore ID
- **Fields**:
  - `id`: Firestore document ID
  - `spotifyPlaylistId`: Spotify playlist ID
  - `ownerId`: Spotify user ID of playlist owner
  - `name`: Playlist name
  - `description`: Playlist description
  - `imageUrl`: Playlist cover image URL
  - `trackCount`: Number of tracks in playlist
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last update timestamp
  - `isActive`: Whether playlist is active

### Contributions Collection (`contributions`)
- **Document ID**: Auto-generated Firestore ID
- **Fields**:
  - `id`: Firestore document ID
  - `playlistId`: Firestore playlist ID
  - `contributorId`: Spotify user ID of contributor
  - `contributorName`: Contributor's display name
  - `contributorEmail`: Contributor's email
  - `tracks`: Array of contributed tracks
  - `createdAt`: Contribution timestamp
  - `expiresAt`: Expiration timestamp (4 weeks from creation)

### Sharing Links Collection (`sharing_links`)
- **Document ID**: Auto-generated Firestore ID
- **Fields**:
  - `id`: Firestore document ID
  - `playlistId`: Firestore playlist ID
  - `ownerId`: Spotify user ID of link owner
  - `ownerName`: Link owner's display name
  - `linkSlug`: Unique link identifier
  - `isActive`: Whether link is active
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last update timestamp
  - `usageCount`: Number of times link was used
  - `lastUsedAt`: Last usage timestamp

### User Top Songs Collection (`user_top_songs`)
- **Document ID**: Spotify user ID
- **Fields**:
  - `userId`: Spotify user ID
  - `songs`: Array of top songs
  - `lastFetched`: Last fetch timestamp

## 🔒 Security Rules

For development, use test mode. For production, implement proper security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Playlists can be read by anyone, written by owner
    match /playlists/{playlistId} {
      allow read: if true;
      allow write: if request.auth != null && resource.data.ownerId == request.auth.uid;
    }
    
    // Contributions can be read by anyone, written by authenticated users
    match /contributions/{contributionId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Sharing links can be read by anyone, written by owner
    match /sharing_links/{linkId} {
      allow read: if true;
      allow write: if request.auth != null && resource.data.ownerId == request.auth.uid;
    }
    
    // User top songs can be read/written by the user
    match /user_top_songs/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Development with Emulators

For local development, you can use Firebase emulators:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init emulators`
4. Start emulators: `firebase emulators:start`
5. Set environment variable: `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`

## 🚀 Deployment

For production deployment:

1. Update environment variables with production Firebase project
2. Set up proper security rules
3. Configure Firebase project settings for production
4. Deploy to Vercel with production environment variables

## 📊 Monitoring

Monitor your Firebase usage in the Firebase Console:
- Firestore usage and costs
- Authentication usage
- Performance metrics
- Error logs 