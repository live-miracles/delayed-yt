declare global {
  type YouTubePlayerEvent = {
    data: number;
  };

  type YouTubePlayer = {
    getCurrentTime(): number;
    getDuration(): number;
    loadVideoById(options: { videoId: string }): Promise<void> | void;
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
      PLAYING: number;
    };
  };

  interface Window {
    onYouTubeIframeAPIReady: () => void;
  }
}

export {};
