Product Name: Send Me a Song (SMAS)
Version: MVP v1.0
Owner: Hien Hang
Prepared by: ChatGPT acting as Sr. Product Manager
Last Updated: June 28, 2025

📌 1. Product Summary
Send Me a Song (SMAS) is a social music discovery web app that allows users to create a Spotify playlist from their top 5 favorite songs and grow it by receiving songs from friends. Users log in with their Spotify accounts, generate a public link, and receive top songs from friends who also use Spotify. Contributors are tracked, and users can reciprocate. Songs from all contributors are added to the same SMAS playlist.

🎯 2. Goals & Objectives
Primary Goals:
Make music sharing fun, personal, and frictionless.

Build a viral loop around personalized playlists.

Leverage Spotify’s API for song discovery and playlist generation.

Success Metrics:
% of users who receive at least 1 friend contribution.

Avg. number of contributors per playlist.

% of contributors who create their own SMAS account.

Retention after 4-week reshare cycle.

👥 3. Target Users
Gen Z and Millennial Spotify users.

Music lovers looking to discover new tracks through friends.

Social sharers who enjoy interactive, aesthetic, and playlist-based platforms.

🛠 4. Tech Stack (Recommended)
Frontend: Next.js or React

Backend: Node.js with Express / serverless functions

Auth: Spotify OAuth 2.0

Database: Supabase or Firebase

Hosting: Vercel or Netlify

Spotify API Scopes:

user-top-read

playlist-modify-public

playlist-read-private

user-read-email

user-library-read

📦 5. Core Features (Progressively Built)
✅ 5.1. Spotify Authentication & Account Creation
MVP:
Spotify OAuth login.

Store Spotify ID, tokens securely.

Fetch display name + email.

✅ 5.2. Generate SMAS Playlist
MVP:
Fetch user’s top 5 via user-top-read.

Create one playlist named "SMAS" in their Spotify.

Store playlist ID in DB.

Phase 2:
Playlist rename/customization.

Playlist theme/styling.

✅ 5.3. Share Link System
MVP:
Generate public reusable link.

Tracks Spotify IDs of contributors.

Allows 1 contribution per contributor per playlist every 4 weeks.

No daily cap for MVP.

Store contribution timestamp to calculate 4-week cooldown.

✅ Anti-spam: Track unique Spotify IDs. Block repeat contributions within cooldown window. Optionally require basic rate limiting by IP/user (e.g. 1 contribution attempt every 60 seconds).

Phase 2:
Single-use or private links.

Link usage stats & analytics.

✅ 5.4. Friend Contribution Flow
MVP:
Friend logs in via link.

Fetch their top 5.

Check if they’ve already contributed (within 4 weeks).

Add songs to inviter’s existing SMAS playlist.

Filter out any duplicate tracks already in that playlist.

✅ At end:
“You've just sent your top songs to [User A] 🎶 Want their favorite tracks back in your own playlist?”

Phase 2:
Friend match preview.

Suggest songs from inviter’s playlist.

✅ 5.5. Dashboard
MVP:
Show SMAS playlist:

Track name, artist, and contributor (if account exists).

List of contributing friends (Spotify usernames).

Show user’s own top 5.

Generate invite link.

“Remove songs from [Friend]” button.

Soft spam indicator (e.g., flag unknown contributors for review).

Phase 2:
Playlist filter by contributor.

Recent activity log.

UI stats on contributions (non-essential in MVP).

✅ 5.6. Contributor Attribution & Deduplication
MVP:
Tag each added track by contributor Spotify ID.

Prevent duplicate track additions (from self or others).

Filter new songs on every friend contribution.

Phase 2:
Contributor profile with playlist summary.

✅ 5.7. Playlist Syncing & Permissions Handling
MVP:
Add/remove tracks in real time via Spotify API.

Recreate playlist if deleted from Spotify.

If user revokes Spotify permission:

Block sync/link generation.

Warn user to reconnect Spotify.

✅ Friends can resend their top 5 after 4 weeks.
Duplicate tracks will still be filtered out during resubmission.

❌ 6. Deferred Features (Post-MVP)
Group SMAS playlists.

Weekly or monthly digest emails.

Mobile experience with push notifications.

Leaderboards, badges, or other gamification.

Apple Music support.

📋 7. Edge Cases & Error Handling
Case	Handling
User has no top tracks	Show message encouraging more Spotify activity.
Contributor has already sent songs	Block and show cooldown window (e.g., “Try again in 18 days”).
Contributor adds duplicate tracks	Silently skip duplicates.
Playlist deleted	Prompt: “Recreate your SMAS playlist?”
Spotify permission revoked	Disable Spotify-linked actions; prompt reconnect.
Spam or misuse (MVP level)	Limit by Spotify ID; rate-limit requests server-side.

📈 8. Analytics & Metrics (Post-MVP)
Contributions per playlist

Reshare after 4-week interval

Number of generated vs. used links

Contribution-to-account conversion

🧠 9. Final Clarified Decisions
Question	Answer
Are all songs added to one playlist per user?	✅ Yes — always to the same SMAS playlist
Can contributors resend their top songs?	✅ Yes — once every 4 weeks, with deduplication
Will you show link stats to users?	🚫 Not in MVP; deferred to later
Spam protection needed?	✅ Yes — deduplicate by Spotify ID, add cooldowns + basic rate limit


