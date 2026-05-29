import { STORAGE_KEYS } from '../data/storageKeys';
import { setAudioSettings } from '../sound';
import { StorageService } from './StorageService';

export class AudioSettingsService {
  private static soundFxEnabled = true;
  private static musicEnabled = true;
  private static audioVolume = 0.8;

  static load() {
    AudioSettingsService.soundFxEnabled = StorageService.getString(STORAGE_KEYS.soundFx, 'true') !== 'false';
    AudioSettingsService.musicEnabled = StorageService.getString(STORAGE_KEYS.music, 'true') !== 'false';
    AudioSettingsService.audioVolume = Math.max(0, Math.min(1, StorageService.getNumber(STORAGE_KEYS.audioVolume, 0.8)));
  }

  static save() {
    StorageService.setString(STORAGE_KEYS.soundFx, String(AudioSettingsService.soundFxEnabled));
    StorageService.setString(STORAGE_KEYS.music, String(AudioSettingsService.musicEnabled));
    StorageService.setNumber(STORAGE_KEYS.audioVolume, AudioSettingsService.audioVolume);
  }

  static loadAndApply() {
    AudioSettingsService.load();
    AudioSettingsService.apply();
  }

  static apply() {
    setAudioSettings({
      soundFxEnabled: AudioSettingsService.soundFxEnabled,
      musicEnabled: AudioSettingsService.musicEnabled,
      volume: AudioSettingsService.audioVolume
    });
  }

  static toggleSoundFx() {
    AudioSettingsService.soundFxEnabled = !AudioSettingsService.soundFxEnabled;
    AudioSettingsService.save();
    AudioSettingsService.apply();
  }

  static toggleMusic() {
    AudioSettingsService.musicEnabled = !AudioSettingsService.musicEnabled;
    AudioSettingsService.save();
    AudioSettingsService.apply();
  }

  static setVolume(value: number) {
    AudioSettingsService.audioVolume = Math.max(0, Math.min(1, value));
    AudioSettingsService.save();
    AudioSettingsService.apply();
  }

  static isSoundFxEnabled() {
    return AudioSettingsService.soundFxEnabled;
  }

  static isMusicEnabled() {
    return AudioSettingsService.musicEnabled;
  }

  static getVolume() {
    return AudioSettingsService.audioVolume;
  }
}
