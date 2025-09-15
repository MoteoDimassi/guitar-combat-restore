import { AudioPolyfill } from '../utils/AudioPolyfill.js';
import { ChordAnalyzer } from '../components/ChordAnalyzer.js';

/**
 * AudioManager - manages AudioContext for the metronome and guitar.
 * Responsible for creating, initializing, and managing AudioContext state.
 * Handles Web Audio API context lifecycle and state transitions.
 */
export class AudioManager {
  /**
   * Creates a new AudioManager instance.
   */
  constructor() {
    /** @type {AudioContext|null} */
    this.audioCtx = null;
    /** @type {ChordAnalyzer} */
    this.chordAnalyzer = new ChordAnalyzer();
  }

  /**
   * Creates and initializes the AudioContext.
   * Uses AudioPolyfill to ensure cross-browser compatibility.
   * @async
   * @returns {Promise<boolean>} True if initialization successful, false otherwise
   * @throws {Error} If AudioContext creation fails
   * @example
   * const audioManager = new AudioManager();
   * const success = await audioManager.initialize();
   * if (success) {
   *   console.log('AudioContext ready');
   * }
   */
  async initialize() {
    if (!this.audioCtx) {
      this.audioCtx = AudioPolyfill.createAudioContext();
      if (!this.audioCtx) {
        console.error('AudioManager: Failed to create AudioContext');
        return false;
      }
    }

    const isReady = await AudioPolyfill.ensureAudioContextReady(this.audioCtx);
    if (!isReady) {
      console.error('AudioManager: AudioContext not ready');
      return false;
    }

    return true;
  }

  /**
   * Resumes AudioContext if it is suspended.
   * Required for audio playback after user interaction in some browsers.
   * @async
   * @returns {Promise<boolean>} True if resume successful or already running, false otherwise
   * @example
   * const resumed = await audioManager.resume();
   * console.log('AudioContext state:', audioManager.getAudioContext()?.state);
   */
  async resume() {
    if (!this.audioCtx) return false;

    if (this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
        return true;
      } catch (error) {
        console.error('AudioManager: Failed to resume AudioContext:', error);
        return false;
      }
    }

    return this.audioCtx.state === 'running';
  }

  /**
   * Checks if AudioContext is ready for audio operations.
   * @returns {boolean} True if AudioContext exists and is running, false otherwise
   */
  isReady() {
    return this.audioCtx && this.audioCtx.state === 'running';
  }

  /**
   * Gets the current AudioContext instance.
   * @returns {AudioContext|null} The AudioContext instance or null if not initialized
   */
  getAudioContext() {
    return this.audioCtx;
  }

  /**
   * Gets the current time of the AudioContext.
   * Used for scheduling audio events with precise timing.
   * @returns {number} Current AudioContext time in seconds, 0 if not initialized
   */
  getCurrentTime() {
    return this.audioCtx ? this.audioCtx.currentTime : 0;
  }

  /**
   * Disposes of the AudioContext and cleans up resources.
   * Should be called when the AudioManager is no longer needed.
   */
  dispose() {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    this.audioCtx = null;
  }
}