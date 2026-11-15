import { buildRound, instructionFor, isCorrectChoice, nextGridSize, pickDistractors } from '@/games/busca/buscaLogic';
import {
  createNamingSession,
  isFinished,
  mark,
  next,
  retryPending,
  reveal,
  summary,
  wordsForDifficulty,
} from '@/games/denominacion/denominacionLogic';
import {
  buildChoiceRound,
  correctPrefixLength,
  isCorrectOrder,
  scrambledChips,
} from '@/games/frases/frasesLogic';
import { createMemoryState, matchedPairs, memoryReducer, type MemoryState } from '@/games/memory/memoryLogic';
import type { Sentence, Word } from '@/types/content';
import { sample, seededRng, shuffle } from '@/utils/random';
import { normalize } from '@/utils/text';

const word = (id: string, extra: Partial<Word> = {}): Word => ({
  id,
  palabra: id,
  categoria: 'animales',
  tipo: 'sustantivo',
  articulo: 'el',
  imagen: id,
  nivel: 1,
  silabas: 2,
  fonemaInicial: id[0],
  descripcion: '',
  frases: [],
  ...extra,
});

describe('random', () => {
  it('con la misma semilla produce la misma secuencia', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('shuffle no pierde ni duplica elementos ni modifica el original', () => {
    const items = [1, 2, 3, 4, 5, 6];
    const out = shuffle(items, seededRng(1));
    expect([...out].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('sample devuelve elementos distintos y como máximo los disponibles', () => {
    expect(new Set(sample([1, 2, 3, 4], 3, seededRng(3))).size).toBe(3);
    expect(sample([1, 2], 5)).toHaveLength(2);
  });
});

describe('memory', () => {
  const ids = ['a', 'b', 'c'];
  const flip = (s: MemoryState, uid: string) => memoryReducer(s, { type: 'FLIP', uid });

  it('crea dos cartas por palabra', () => {
    const s = createMemoryState(ids, seededRng(1));
    expect(s.cards).toHaveLength(6);
    for (const id of ids) expect(s.cards.filter((c) => c.wordId === id)).toHaveLength(2);
  });

  it('empareja dos cartas iguales y cuenta el intento', () => {
    let s = createMemoryState(ids, seededRng(1));
    s = flip(s, 'a#a');
    s = flip(s, 'a#b');
    expect(matchedPairs(s)).toBe(1);
    expect(s.attempts).toBe(1);
    expect(s.locked).toBe(false);
  });

  it('bloquea con dos cartas distintas y las oculta con RESOLVE', () => {
    let s = createMemoryState(ids, seededRng(1));
    s = flip(s, 'a#a');
    s = flip(s, 'b#a');
    expect(s.locked).toBe(true);
    expect(flip(s, 'c#a')).toBe(s); // no se puede pulsar mientras está bloqueado
    s = memoryReducer(s, { type: 'RESOLVE' });
    expect(s.cards.every((c) => c.status === 'hidden')).toBe(true);
  });

  it('termina cuando todas las parejas están encontradas', () => {
    let s = createMemoryState(['a', 'b'], seededRng(1));
    for (const uid of ['a#a', 'a#b', 'b#a', 'b#b']) s = flip(s, uid);
    expect(s.finished).toBe(true);
    expect(s.attempts).toBe(2);
  });

  it('no permite pulsar dos veces la misma carta', () => {
    let s = createMemoryState(ids, seededRng(1));
    s = flip(s, 'a#a');
    expect(flip(s, 'a#a')).toBe(s);
  });
});

describe('busca la imagen', () => {
  const pool = [
    word('zapatos', { grupoConfusion: 'calzado' }),
    word('botas', { grupoConfusion: 'calzado' }),
    word('perro'),
    word('gato'),
    word('dormir', { tipo: 'verbo', gerundio: 'durmiendo', contiene: ['gato'] }),
    word('coche'),
  ];

  it('nunca usa como distractor una palabra confundible', () => {
    for (let seed = 0; seed < 50; seed++) {
      const d = pickDistractors(pool[0], pool, 5, seededRng(seed));
      expect(d.map((w) => w.id)).not.toContain('botas');
      expect(d.map((w) => w.id)).not.toContain('zapatos');
      const ids = d.map((w) => w.id);
      expect(ids.includes('gato') && ids.includes('dormir')).toBe(false);
    }
  });

  it('el objetivo aparece exactamente una vez en su posición', () => {
    for (let seed = 0; seed < 30; seed++) {
      const r = buildRound(pool[2], pool, 4, seededRng(seed))!;
      expect(r.options.filter((w) => w.id === 'perro')).toHaveLength(1);
      expect(r.options[r.targetIndex].id).toBe('perro');
      expect(isCorrectChoice(r, 'perro')).toBe(true);
      expect(isCorrectChoice(r, r.options.find((w) => w.id !== 'perro')!.id)).toBe(false);
    }
  });

  it('reduce la cuadrícula en lugar de rellenar con opciones ambiguas', () => {
    const tiny = [word('zapatos', { grupoConfusion: 'calzado' }), word('botas', { grupoConfusion: 'calzado' })];
    expect(buildRound(tiny[0], tiny, 4)).toBeNull();
  });

  it('sube de nivel tras tres aciertos seguidos', () => {
    expect(nextGridSize(2, 2)).toBe(2);
    expect(nextGridSize(2, 3)).toBe(3);
    expect(nextGridSize(6, 3)).toBe(6);
  });

  it('redacta la instrucción con artículo o gerundio', () => {
    expect(instructionFor(pool[2])).toBe('Busca el perro');
    expect(instructionFor(pool[4])).toBe('Busca quién está durmiendo');
  });
});

describe('denominación', () => {
  const words = [word('a'), word('b'), word('c', { nivel: 3 })];

  it('recorre la sesión y resume los resultados', () => {
    let s = createNamingSession(words, seededRng(1));
    s = reveal(s);
    expect(s.revealed).toBe(true);
    s = next(mark(s, 'conseguida'));
    expect(s.revealed).toBe(false);
    s = next(mark(s, 'pendiente'));
    s = next(mark(s, 'conseguida'));
    expect(isFinished(s)).toBe(true);
    expect(summary(s)).toEqual({ conseguidas: 2, pendientes: 1, total: 3 });
    expect(retryPending(s).order).toHaveLength(1);
  });

  it('filtra por dificultad sin dejar la sesión vacía', () => {
    expect(wordsForDifficulty(words, 'facil', 2).map((w) => w.id)).toEqual(['a', 'b']);
    expect(wordsForDifficulty(words, 'facil', 4)).toHaveLength(3);
  });
});

describe('frases', () => {
  const s: Sentence = { id: 's1', palabraId: 'x', texto: 'El gato duerme.', tokens: ['El', 'gato', 'duerme'], nivel: 1 };

  it('valida el orden sin distinguir mayúsculas ni tildes', () => {
    expect(isCorrectOrder(s, ['el', 'GATO', 'duerme'])).toBe(true);
    expect(isCorrectOrder(s, ['gato', 'el', 'duerme'])).toBe(false);
    expect(isCorrectOrder(s, ['El', 'gato'])).toBe(false);
    expect(correctPrefixLength(s, ['El', 'duerme', 'gato'])).toBe(1);
  });

  it('nunca presenta las fichas ya ordenadas', () => {
    for (let seed = 0; seed < 30; seed++) {
      const chips = scrambledChips(s, seededRng(seed));
      expect(isCorrectOrder(s, chips.map((c) => c.text))).toBe(false);
    }
  });

  it('la ronda de elección tiene una única frase de la foto', () => {
    const pool: Sentence[] = [
      s,
      { ...s, id: 's2', palabraId: 'x' },
      { ...s, id: 's3', palabraId: 'y' },
      { ...s, id: 's4', palabraId: 'z' },
    ];
    for (let seed = 0; seed < 20; seed++) {
      const r = buildChoiceRound(s, pool, 3, seededRng(seed));
      expect(r.options).toHaveLength(3);
      expect(r.options.filter((o) => o.palabraId === 'x')).toHaveLength(1);
    }
  });
});

describe('texto', () => {
  it('normaliza tildes, mayúsculas y signos', () => {
    expect(normalize('¡Camión!  ')).toBe('camion');
  });
});
