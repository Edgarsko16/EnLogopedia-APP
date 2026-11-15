import { getAllWords, getPhonologyOptions, getWord } from '@/content/catalog';
import { PHONEMES, WORD_PHONOLOGY } from '@/content/phonology';
import { WORDS } from '@/content/words';
import {
  availablePhonemes,
  buildClassifySession,
  buildIdentifyRound,
  isUsableForDiscrimination,
  phonemeAt,
} from '@/games/fonologia/fonologiaLogic';
import { seededRng } from '@/utils/random';
import { normalize } from '@/utils/text';

const words = getAllWords();
const std = getPhonologyOptions(false);
const seseo = getPhonologyOptions(true);

describe('datos de fonología', () => {
  const ids = new Set(PHONEMES.map((p) => p.id));

  it('todo fonema inicial del banco está en el inventario', () => {
    for (const w of WORDS) expect({ palabra: w.id, ok: ids.has(w.fonemaInicial) }).toEqual({ palabra: w.id, ok: true });
  });

  it('las notas fonológicas apuntan a palabras existentes', () => {
    const wordIds = new Set(WORDS.map((w) => w.id));
    for (const id of Object.keys(WORD_PHONOLOGY)) expect(wordIds.has(id)).toBe(true);
  });

  it('el fonema inicial concuerda con la ortografía (revisión automática básica)', () => {
    // Primera letra esperada por fonema. Las excepciones deben estar documentadas en WORD_PHONOLOGY.
    const spelling: Record<string, RegExp> = {
      p: /^p/, b: /^[bv]/, m: /^m/, f: /^f/, t: /^t/, d: /^d/, n: /^n/, l: /^l(?!l)/, s: /^s/,
      z: /^(z|ce|ci)/, k: /^(ca|co|cu|qu|k)/, g: /^(ga|go|gu)/, ch: /^ch/, ll: /^(ll|y)/,
      a: /^h?a/, e: /^h?e/, i: /^h?i/, o: /^h?o/, u: /^h?u/,
    };
    for (const w of WORDS) {
      const re = spelling[w.fonemaInicial];
      expect({ palabra: w.palabra, ok: !!re && re.test(normalize(w.palabra)) }).toEqual({ palabra: w.palabra, ok: true });
    }
  });

  it('los ejemplos de los fonemas no son palabras del banco (no coinciden con ninguna foto)', () => {
    const names = new Set(WORDS.map((w) => normalize(w.palabra)));
    for (const p of PHONEMES) expect(names.has(normalize(p.ejemplo))).toBe(false);
  });
});

describe('seseo', () => {
  it('con seseo, /θ/ pasa a /s/', () => {
    const cerdo = getWord('animales_cerdo')!;
    expect(phonemeAt(cerdo, 'inicial', std)).toBe('z');
    expect(phonemeAt(cerdo, 'inicial', seseo)).toBe('s');
    expect(availablePhonemes(words, seseo).some((a) => a.phoneme.id === 'z')).toBe(false);
  });

  it('las posiciones medial y final aún no están implementadas', () => {
    expect(phonemeAt(words[0], 'medial', std)).toBeUndefined();
  });
});

describe('discriminación', () => {
  it('excluye verbos, palabras dudosas y fotos con objetos de otro fonema', () => {
    expect(isUsableForDiscrimination(getWord('acciones_dormir')!, std)).toBe(false);
    expect(isUsableForDiscrimination(getWord('alimentos_huevo')!, std)).toBe(false);
    expect(isUsableForDiscrimination(getWord('casa_plato')!, std)).toBe(false); // contiene un tenedor (/t/)
    expect(isUsableForDiscrimination(getWord('animales_perro')!, std)).toBe(true);
  });

  it('identificar: exactamente una imagen empieza por el fonema', () => {
    for (const { phoneme, usable } of availablePhonemes(words, std)) {
      if (usable === 0) continue;
      for (let seed = 0; seed < 15; seed++) {
        const r = buildIdentifyRound(words, phoneme.id, 4, std, seededRng(seed))!;
        expect(r).not.toBeNull();
        const matches = r.options.filter((w) => phonemeAt(w, 'inicial', std) === phoneme.id);
        expect(matches.map((w) => w.id)).toEqual([r.answerId]);
        for (const w of r.options) expect(isUsableForDiscrimination(w, std)).toBe(true);
      }
    }
  });

  it('clasificar: mezcla palabras con y sin el fonema', () => {
    const items = buildClassifySession(words, 'k', 8, std, seededRng(3));
    expect(items).toHaveLength(8);
    const yes = items.filter((w) => phonemeAt(w, 'inicial', std) === 'k').length;
    expect(yes).toBeGreaterThan(0);
    expect(yes).toBeLessThan(8);
  });
});
