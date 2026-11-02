import { CST } from "../CST";
import { StatsModel } from "../model/StatsModel";

export class SoundPlayer {
  private static instance: SoundPlayer;
  private currentScene?: Phaser.Scene;
  private music?: Phaser.Sound.BaseSound;
  public musicEnabled = true;
  public soundEnabled = true;
  private focusListenersAdded = false;
  private firstInteractionListenerAdded = false;
  private hasUserInteracted = false;
  private sceneGeneration = 0;

  public static getInstance(): SoundPlayer {
    if (!SoundPlayer.instance) {
      SoundPlayer.instance = new SoundPlayer();
    }
    return SoundPlayer.instance;
  }

  public create(scene: Phaser.Scene): void {
    this.sceneGeneration++;
    this.currentScene = scene;
    const stats = StatsModel.getInstance().getStats();
    this.musicEnabled = stats.musicEnabled;
    this.soundEnabled = stats.soundEnabled;
    this.initVisibilityHandler();
    this.initFirstInteractionHandler();
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    StatsModel.getInstance().setSoundEnabled(enabled);
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    StatsModel.getInstance().setMusicEnabled(enabled);
    if (enabled) {
      this.playMapMusic();
    } else {
      this.pauseMapMusic();
    }
  }

  public playMapMusic(): void {
    const scene = this.currentScene;
    if (!this.musicEnabled || !scene) return;
    if (!scene.cache.audio.exists(CST.AUDIO.MUSIC_BGM)) return;
    if (!this.hasUserInteracted) return;

    this.runWhenAudioReady(scene, () => this.playLoadedMapMusic(scene));
  }

  public play(soundName: string): void {
    const scene = this.currentScene;
    if (!this.soundEnabled || !scene) return;
    if (!scene.cache.audio.exists(soundName)) return;

    this.runWhenAudioReady(scene, () => this.playLoadedSound(scene, soundName));
  }

  public onFocusMute(): void {
    const context = this.getAudioContext();
    if (context?.state === "running") {
      void context.suspend().catch((error) => console.warn("Audio suspension failed", error));
    }
  }

  public onFocusResumeUnmute(): void {
    const context = this.getAudioContext();
    if (context?.state === "suspended") {
      void context.resume().catch((error) => console.warn("Audio resume failed", error));
    }
  }

  private initVisibilityHandler(): void {
    if (this.focusListenersAdded) return;
    this.focusListenersAdded = true;

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.onFocusMute();
      else this.onFocusResumeUnmute();
    });
  }

  private initFirstInteractionHandler(): void {
    if (this.firstInteractionListenerAdded) return;
    this.firstInteractionListenerAdded = true;

    const onFirstInteraction = () => {
      if (this.hasUserInteracted) return;
      this.hasUserInteracted = true;
      this.playMapMusic();
    };
    const options = { capture: true, once: true };
    document.addEventListener("pointerdown", onFirstInteraction, options);
    document.addEventListener("touchstart", onFirstInteraction, options);
    document.addEventListener("mousedown", onFirstInteraction, options);
    document.addEventListener("click", onFirstInteraction, options);
  }

  private runWhenAudioReady(scene: Phaser.Scene, callback: () => void): void {
    const generation = this.sceneGeneration;
    const context = this.getAudioContext();
    const contextState = context?.state as string | undefined;
    if (context && (contextState === "suspended" || contextState === "interrupted")) {
      void context.resume().then(() => {
        if (generation === this.sceneGeneration && scene.scene.isActive()) callback();
      }).catch((error) => console.warn("Audio resume failed", error));
      return;
    }

    callback();
  }

  private getAudioContext(): AudioContext | undefined {
    const sound = this.currentScene?.game.sound;
    return sound && "context" in sound ? sound.context as AudioContext : undefined;
  }

  private playLoadedSound(scene: Phaser.Scene, soundName: string): void {
    if (!this.soundEnabled || this.currentScene !== scene) return;
    if (!scene.cache.audio.exists(soundName)) return;
    scene.sound.play(soundName, { volume: 0.8 });
  }

  private playLoadedMapMusic(scene: Phaser.Scene): void {
    if (!this.musicEnabled || this.currentScene !== scene) return;
    if (!scene.cache.audio.exists(CST.AUDIO.MUSIC_BGM)) return;

    if (!this.music) {
      this.music = scene.sound.add(CST.AUDIO.MUSIC_BGM, {
        loop: true,
        volume: 0.36
      });
    }

    if (this.music.isPlaying) return;
    if (this.music.isPaused) {
      this.music.resume();
      return;
    }

    this.music.play();
  }

  private pauseMapMusic(): void {
    if (this.music?.isPlaying) {
      this.music.pause();
    }
  }

}
