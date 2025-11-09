import ChordService from "../domain/services/ChordService.js";
import BarService from "../domain/services/BarService.js";
import PlaybackService from "../domain/services/PlaybackService.js";
import AudioEngine from "../infrastructure/audio/AudioEngine.js";
import LocalStorageAdapter from "../infrastructure/storage/LocalStorageAdapter.js";
import ChordRepository from "../domain/repositories/ChordRepository.js";
import BarRepository from "../domain/repositories/BarRepository.js";

export function registerServices(container, registry) {
  // Регистрация репозиториев
  registry.register(
    "chordRepository",
    (container) => {
      return new ChordRepository(
        container.get("storageService")
      );
    },
    {
      description: "Repository for managing chords",
      category: "repository",
      tags: ["chords", "repository"],
      singleton: true,
      dependencies: ["storageService"],
    }
  );

  registry.register(
    "barRepository",
    (container) => {
      return new BarRepository(
        container.get("storageService")
      );
    },
    {
      description: "Repository for managing bars",
      category: "repository",
      tags: ["bars", "repository"],
      singleton: true,
      dependencies: ["storageService"],
    }
  );
  // Регистрация сервисов бизнес-логики
  registry.register(
    "chordService",
    (container) => {
      return new ChordService(
        container.get("chordRepository")
      );
    },
    {
      description: "Service for managing chords",
      category: "domain",
      tags: ["chords", "music"],
      singleton: true,
      dependencies: ["chordRepository"],
    }
  );

  registry.register(
    "barService",
    (container) => {
      return new BarService(
        container.get("barRepository")
      );
    },
    {
      description: "Service for managing bars",
      category: "domain",
      tags: ["bars", "music"],
      singleton: true,
      dependencies: ["barRepository"],
    }
  );

  registry.register(
    "playbackService",
    (container) => {
      return new PlaybackService(
        container.get("audioEngine"),
        container.get("barRepository")
      );
    },
    {
      description: "Service for managing playback",
      category: "domain",
      tags: ["playback", "audio"],
      singleton: true,
      dependencies: ["audioEngine", "barRepository"],
    }
  );

  // Регистрация инфраструктурных сервисов
  registry.register(
    "audioEngine",
    (container) => {
      return new AudioEngine();
    },
    {
      description: "Audio engine for playing sounds",
      category: "infrastructure",
      tags: ["audio", "engine"],
      singleton: true,
      dependencies: [],
    }
  );

  registry.register(
    "storageService",
    (container) => {
      return new LocalStorageAdapter();
    },
    {
      description: "Storage service for persisting data",
      category: "infrastructure",
      tags: ["storage", "persistence"],
      singleton: true,
      dependencies: [],
    }
  );

  // Применяем регистраций к контейнеру
  registry.applyToContainer(container);
}