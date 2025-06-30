/**
 * @fileoverview Mock data for Spotify API responses in tests.
 *
 * Provides realistic mock data for Spotify API endpoints.
 */

export const mockSpotifyData = {
  topTracks: {
    items: [
      {
        id: '1',
        name: 'Test Song 1',
        artists: [{ name: 'Test Artist 1' }],
        album: {
          name: 'Test Album 1',
          images: [{ url: 'https://example.com/image1.jpg' }]
        },
        external_urls: { spotify: 'https://open.spotify.com/track/1' }
      },
      {
        id: '2',
        name: 'Test Song 2',
        artists: [{ name: 'Test Artist 2' }],
        album: {
          name: 'Test Album 2',
          images: [{ url: 'https://example.com/image2.jpg' }]
        },
        external_urls: { spotify: 'https://open.spotify.com/track/2' }
      }
    ]
  },

  playlists: {
    items: [
      {
        id: 'playlist1',
        name: 'My Playlist 1',
        description: 'Test playlist 1',
        public: true,
        owner: { id: 'user1' }
      },
      {
        id: 'playlist2',
        name: 'My Playlist 2',
        description: 'Test playlist 2',
        public: false,
        owner: { id: 'user1' }
      }
    ]
  },

  createdPlaylist: {
    id: 'new-playlist-id',
    name: 'SMAS Playlist',
    description: 'Songs from Send Me a Song',
    public: true,
    owner: { id: 'user1' },
    external_urls: { spotify: 'https://open.spotify.com/playlist/new-playlist-id' }
  },

  playlistTracks: {
    items: [
      {
        track: {
          id: '1',
          name: 'Test Song 1',
          artists: [{ name: 'Test Artist 1' }],
          album: {
            name: 'Test Album 1',
            images: [{ url: 'https://example.com/image1.jpg' }]
          }
        }
      }
    ]
  },

  topSongs: [
    {
      id: '1',
      name: 'Test Song 1',
      artist: 'Test Artist 1',
      album: 'Test Album 1',
      imageUrl: 'https://example.com/image1.jpg'
    },
    {
      id: '2',
      name: 'Test Song 2',
      artist: 'Test Artist 2',
      album: 'Test Album 2',
      imageUrl: 'https://example.com/image2.jpg'
    }
  ],

  smasPlaylist: {
    id: 'smas-playlist-id',
    name: 'SMAS Playlist',
    songs: [],
    contributors: [],
    shareLink: 'https://smas.app/share/smas-playlist-id'
  }
} 