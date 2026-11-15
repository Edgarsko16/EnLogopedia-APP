import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/storage/keyValue';
import { addMemoryBest, addResult, loadProgress, saveProgress } from '@/storage/progressStorage';
import { loadSettings, sanitizeSettings, saveSettings } from '@/storage/settingsStorage';
import { EMPTY_PROGRESS } from '@/types/progress';
import { DEFAULT_SETTINGS } from '@/types/settings';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('preferencias', () => {
  it('devuelve los valores por defecto si no hay nada guardado', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('guarda y recupera las preferencias', async () => {
    const custom = { ...DEFAULT_SETTINGS, audioEnabled: false, textScale: 1.4 as const, difficulty: 'dificil' as const };
    await saveSettings(custom);
    expect(await loadSettings()).toEqual(custom);
  });

  it('descarta valores no válidos o corruptos', async () => {
    expect(sanitizeSettings({ textScale: 7, difficulty: 'imposible', speechRate: 9 })).toEqual(DEFAULT_SETTINGS);
    await AsyncStorage.setItem(STORAGE_KEYS.settings, '{no es json');
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('progreso', () => {
  it('acumula aciertos e intentos sin modificar el original', () => {
    const p1 = addResult(EMPTY_PROGRESS, 'busca', 'animales_perro', true);
    const p2 = addResult(p1, 'busca', 'animales_perro', false);
    expect(p2.porJuego.busca?.animales_perro).toMatchObject({ aciertos: 1, intentos: 2 });
    expect(EMPTY_PROGRESS.porJuego).toEqual({});
  });

  it('solo guarda el mejor resultado de memory', () => {
    let p = addMemoryBest(EMPTY_PROGRESS, 4, 10);
    p = addMemoryBest(p, 4, 12);
    expect(p.memoryMejores['4']).toBe(10);
    p = addMemoryBest(p, 4, 7);
    expect(p.memoryMejores['4']).toBe(7);
  });

  it('persiste y recupera el progreso', async () => {
    const p = addResult(EMPTY_PROGRESS, 'memory', 'x', true);
    await saveProgress(p);
    expect((await loadProgress()).porJuego.memory?.x?.aciertos).toBe(1);
  });
});
