import { getWord } from '@/content/catalog';
import { SENTENCES } from '@/content/sentences';
import { WORDS } from '@/content/words';
import { buildChips, buildGapRound, isCorrectOrder, isGapAnswer, sentencesForDifficulty } from '@/games/frases/frasesLogic';
import { seededRng } from '@/utils/random';
import { normalize } from '@/utils/text';

describe('completar la frase', () => {
  it('cada hueco apunta a un token y sus distractores no coinciden con la respuesta', () => {
    for (const s of SENTENCES) {
      if (!s.hueco) continue;
      expect(s.hueco.indice).toBeGreaterThanOrEqual(0);
      expect(s.hueco.indice).toBeLessThan(s.tokens.length);
      expect(s.hueco.distractores.length).toBeGreaterThanOrEqual(1);
      const answer = normalize(s.tokens[s.hueco.indice]);
      for (const d of s.hueco.distractores) expect(normalize(d)).not.toBe(answer);
    }
  });

  it('la ronda tiene una sola respuesta correcta y conserva el resto de la frase', () => {
    for (const s of SENTENCES.filter((x) => x.hueco)) {
      const r = buildGapRound(s, 3, seededRng(2))!;
      expect(r.options.filter((o) => isGapAnswer(r, o))).toHaveLength(1);
      expect([...r.before, r.answer, ...r.after]).toEqual(s.tokens);
    }
  });

  it('las mayúsculas de los distractores coinciden con la posición del hueco', () => {
    for (const s of SENTENCES.filter((x) => x.hueco)) {
      const first = s.hueco!.indice === 0;
      for (const d of s.hueco!.distractores) {
        const isUpper = d.charAt(0) === d.charAt(0).toLocaleUpperCase('es-ES');
        expect(isUpper).toBe(first);
      }
    }
  });
});

describe('construir la frase', () => {
  it('en difícil añade una ficha de más que no forma parte de la frase', () => {
    const s = SENTENCES.find((x) => x.id === 'beber-1')!;
    const chips = buildChips(s, true, seededRng(1));
    expect(chips).toHaveLength(s.tokens.length + 1);
    expect(isCorrectOrder(s, chips.map((c) => c.text))).toBe(false);
  });

  it('sin ficha extra, las fichas son exactamente las de la frase', () => {
    const s = SENTENCES[0];
    expect(buildChips(s, false, seededRng(1)).map((c) => c.text).sort()).toEqual([...s.tokens].sort());
  });

  it('filtra por nivel según la dificultad', () => {
    expect(sentencesForDifficulty(SENTENCES, 'facil').every((s) => s.nivel === 1)).toBe(true);
    expect(sentencesForDifficulty(SENTENCES, 'dificil')).toHaveLength(SENTENCES.length);
  });
});

describe('coherencia frase–foto', () => {
  /** Singular sencillo para comparar ("vacas" -> "vaca"). */
  const singular = (t: string) => t.replace(/es$|s$/, '');

  it('solo nombra palabras del vocabulario que aparecen en la foto', () => {
    const nouns = WORDS.filter((w) => w.tipo === 'sustantivo');
    for (const s of SENTENCES) {
      const own = getWord(s.palabraId)!;
      const allowed = new Set([own.id, ...(own.contiene ?? [])]);
      const tokens = s.tokens.map((t) => normalize(t));
      for (const n of nouns) {
        const name = normalize(n.palabra);
        const mentioned = !name.includes(' ') && tokens.some((t) => t === name || singular(t) === name);
        if (mentioned) expect({ frase: s.texto, palabra: n.id, permitida: allowed.has(n.id) }).toEqual({ frase: s.texto, palabra: n.id, permitida: true });
      }
    }
  });
});
