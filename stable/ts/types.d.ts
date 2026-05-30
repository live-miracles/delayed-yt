declare global {
  type YouTubePlayerEvent = {
    data: number;
  };

  type YouTubePlayer = {
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number;
    loadVideoById(options: {
      videoId: string;
      startSeconds?: number;
    }): Promise<void> | void;
    seekTo(seconds: number): void;
  };

  type YouTubePlayerConstructor = new (
    elementId: string,
    options: {
      events: {
        onReady: () => void | Promise<void>;
        onStateChange: (event: YouTubePlayerEvent) => void;
      };
    },
  ) => YouTubePlayer;

  const YT: {
    Player: YouTubePlayerConstructor;
    PlayerState: {
      PAUSED: number;
      PLAYING: number;
    };
  };

  interface Window {
    onYouTubeIframeAPIReady: () => void;
  }
}

export {};
