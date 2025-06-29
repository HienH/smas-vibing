# User Flow Documentation
## Send Me a Song (SMAS) - User Journey & Feature Connections

**Document Purpose:** Define the complete user journey through different segments of the SMAS application, serving as a guide for project architecture and UI elements.

**Last Updated:** June 28, 2025

---

## 🚀 Entry Points & User Onboarding

### 1.1 New User Journey (First-Time Visitor)
**Entry Point:** Landing page or direct link from friend

**Flow:**
1. **Landing Page**
   - User discovers SMAS through friend's link or direct visit
   - Sees app description: "Discover new music from your friends favourite song"
   - CTA: "Get Started with Spotify"

2. **Spotify OAuth Authentication**
   - Redirect to Spotify login
   - Request permissions: `user-top-read`, `playlist-modify-public`, `playlist-read-private`, `user-read-email`, `user-library-read`
   - Return to SMAS with authorization code

3. **Account Creation & Setup**
   - Store Spotify ID, tokens, display name, email
   - Fetch user's top 5 songs via Spotify API
   - Create "SMAS" playlist in user's Spotify account
   - Store playlist ID in database
   - Generate unique public sharing link

4. **Welcome Dashboard**
   - Display user's top 5 songs
   - Show newly created SMAS playlist
   - Display sharing link with copy functionality
   - Show empty contributors list (initial state)

### 1.2 Returning User Journey
**Entry Point:** Direct app access or friend's link

**Flow:**
1. **Authentication Check**
   - Verify existing Spotify session
   - If expired, redirect to Spotify OAuth
   - If valid, proceed to dashboard

2. **Dashboard Access**
   - Load user's SMAS playlist
   - Display current contributors and their songs
   - Show sharing link
   - Display user's own top 5 songs

---

## 🎵 Core Feature Flows

### 2.1 Playlist Generation & Management
**Trigger:** New user setup or playlist recreation

**Flow:**
1. **Top 5 Songs Fetch**
   - Call Spotify API: `user-top-read`
   - Handle edge case: User has no top tracks
   - Display songs with artist names

2. **Playlist Creation**
   - Create "SMAS" playlist in user's Spotify account
   - Store playlist ID in database

3. **Playlist Customization** (Phase 2)
   - Handle playlist deletion edge case
   - Allow playlist renaming
   - Custom themes/styling options

### 2.2 Sharing System
**Trigger:** User wants to share their playlist

**Flow:**
1. **Link Generation**
   - Create unique, reusable public link
   - Link format: `smas.app/[unique-id]`
   - Store link in database with user association

2. **Link Sharing**
   - Copy link to clipboard
   - Share via social media, messaging apps
   - Link remains active indefinitely (MVP)

3. **Link Analytics** (Phase 2)
   - Track link usage statistics
   - Show contribution metrics to user

### 2.3 Friend Contribution Flow
**Trigger:** Friend clicks sharing link

**Flow:**
1. **Link Access**
   - Friend visits shared link
   - See playlist owner's name and description
   - CTA: "Add Your Top Songs"

2. **Spotify Authentication**
   - Friend logs in with their Spotify account
   - Same OAuth flow as new users
   - Request same permissions

3. **Contribution Validation**
   - Check if friend has already contributed (within 4 weeks)
   - If yes: Show cooldown message with remaining days
   - If no: Proceed to contribution

4. **Song Addition Process**
   - Fetch friend's top 5 songs
   - Check for duplicates in target playlist
   - Add non-duplicate songs to playlist
   - Tag songs with contributor's Spotify ID
   - Update playlist in real-time via Spotify API

5. **Post-Contribution Experience**
   - Success message: "You've just sent your top songs to [User A] 🎶"
   - CTA: "Want their favorite tracks back in your own playlist?"
   - Option to create their own SMAS account

### 2.4 Dashboard & Playlist Management
**Trigger:** User accesses their account

**Flow:**
1. **Playlist Overview**
   - Display all songs in SMAS playlist
   - Show track name, artist, and contributor attribution
   - List all contributing friends (Spotify usernames)

2. **User's Top 5 Display**
   - Show user's own top 5 songs
   - Allow regeneration/refresh (Phase 2)

3. **Sharing Link Management**
   - Display current sharing link
   - Copy functionality
   - Link regeneration option

4. **Contributor Management**
   - List all contributors with contribution dates
   - Spam indicator for unknown contributors

5. **Playlist Controls** (Phase 2)
   - "Remove songs from [Friend]" functionality
   - Filter songs by contributor
   - Recent activity log
   - Contribution statistics

---

## 🔄 Feature Connections & Dependencies

### 3.1 Authentication → All Features
- **Dependency:** Spotify OAuth required for all core functionality
- **Connection:** User session enables playlist creation, sharing, and contribution
- **Error Handling:** Graceful degradation if permissions revoked

### 3.2 Playlist Generation → Sharing
- **Dependency:** Playlist must exist before sharing link can be generated
- **Connection:** Sharing link directly references the created playlist
- **Error Handling:** Recreate playlist if deleted from Spotify

### 3.3 Sharing → Friend Contribution
- **Dependency:** Sharing link must be valid and active
- **Connection:** Link contains playlist owner's information and playlist ID
- **Error Handling:** Invalid link handling and rate limiting

### 3.4 Friend Contribution → Dashboard
- **Dependency:** Contributions update the playlist in real-time
- **Connection:** Dashboard reflects all contributions immediately
- **Error Handling:** Duplicate prevention and attribution tracking

### 3.5 Dashboard → Playlist Management
- **Dependency:** Dashboard displays current playlist state
- **Connection:** Management actions update both dashboard and Spotify playlist
- **Error Handling:** Sync issues between app and Spotify

---

## 🛡️ Error Handling & Edge Cases

### 4.1 Authentication Errors
- **Spotify permission revoked:** Disable Spotify-linked actions, prompt reconnect
- **OAuth failure:** Clear error message with retry option
- **Session expiration:** Automatic redirect to re-authentication

### 4.2 Playlist Errors
- **No top tracks:** Show encouraging message to use Spotify more
- **Playlist deleted:** Prompt to recreate SMAS playlist
- **API rate limits:** Implement backoff and retry logic

### 4.3 Contribution Errors
- **Already contributed:** Show cooldown window with remaining days
- **Duplicate tracks:** Silently skip and inform user
- **Invalid contributor:** Flag for review, implement spam detection

### 4.4 Link Errors
- **Invalid link:** Clear error message
- **Rate limiting:** Implement 60-second cooldown between contribution attempts
- **Spam prevention:** Track unique Spotify IDs and IP addresses

---

## 📱 User Experience Considerations

### 5.1 Progressive Disclosure
- **New users:** Focus on playlist creation and sharing
- **Returning users:** Emphasize contributions and management
- **Contributors:** Streamline contribution process

### 5.2 Feedback & Notifications
- **Success states:** Clear confirmation messages
- **Error states:** Helpful error messages with next steps
- **Loading states:** Appropriate loading indicators

### 5.3 Mobile Responsiveness
- **Touch-friendly:** Large buttons and touch targets
- **Responsive design:** Works across all device sizes
- **Performance:** Fast loading times and smooth interactions

---

## 🔗 Integration Points

### 6.1 Spotify API Integration
- **Authentication:** OAuth 2.0 flow
- **Playlist management:** Create, read, update playlists
- **User data:** Fetch top tracks and user profile
- **Real-time sync:** Immediate playlist updates

### 6.2 Database Integration
- **User accounts:** Store Spotify IDs and tokens
- **Playlist tracking:** Store playlist IDs and metadata
- **Contribution history:** Track contributors and timestamps
- **Link management:** Store sharing links and usage data

### 6.3 External Sharing
- **Social media:** Direct sharing to platforms
- **Messaging apps:** Copy link for manual sharing
- **Email:** Link sharing via email clients

---

This user flow document serves as the foundation for building the SMAS application architecture and UI elements, ensuring all features are properly connected and the user experience is seamless across all touchpoints. 