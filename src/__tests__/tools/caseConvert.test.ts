import { describe, it, expect } from 'vitest';
import {
  capitalize,
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toSentenceCase,
  splitWords,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toConstantCase,
  toAlternatingCase,
  toInverseCase,
  countCharacters,
  countWords,
  CASE_CONVERSIONS,
} from '../../utils/tools/caseConvert';

describe('basic cases', () => {
  it('upper/lower are Unicode aware', () => {
    expect(toUpperCase('héllo wörld ñ')).toBe('HÉLLO WÖRLD Ñ');
    expect(toLowerCase('ΑΘΗΝΑ ПРИВЕТ')).toBe('αθηνα привет');
  });

  it('capitalize works per code point', () => {
    expect(capitalize('éCOLE')).toBe('École');
    expect(capitalize('')).toBe('');
    expect(capitalize('😀abc')).toBe('😀abc');
  });
});

describe('toTitleCase', () => {
  it('keeps small words lowercase except first and last', () => {
    expect(toTitleCase('the lord of the rings')).toBe('The Lord of the Rings');
    expect(toTitleCase('a tale of two cities')).toBe('A Tale of Two Cities');
    expect(toTitleCase('what are you looking for')).toBe('What Are You Looking For');
    expect(toTitleCase('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG')).toBe('The Quick Brown Fox Jumps Over the Lazy Dog');
  });

  it('capitalises after a colon', () => {
    expect(toTitleCase('star wars: a new hope')).toBe('Star Wars: A New Hope');
  });

  it('handles apostrophes and hyphenated compounds', () => {
    expect(toTitleCase("don't stop me now")).toBe("Don't Stop Me Now");
    expect(toTitleCase('an in-depth look at state-of-the-art tools')).toBe('An In-Depth Look at State-of-the-Art Tools');
  });

  it('preserves whitespace and punctuation', () => {
    expect(toTitleCase('  hello,   world!  ')).toBe('  Hello,   World!  ');
    expect(toTitleCase('line one\nline two')).toBe('Line One\nLine Two');
    expect(toTitleCase('')).toBe('');
    expect(toTitleCase('!!!')).toBe('!!!');
  });

  it('works with accented words', () => {
    expect(toTitleCase('élan of the ÉCOLE')).toBe('Élan of the École');
  });
});

describe('toSentenceCase', () => {
  it('capitalises the start of each sentence', () => {
    expect(toSentenceCase('HELLO WORLD. HOW ARE YOU? fine! thanks')).toBe('Hello world. How are you? Fine! Thanks');
  });

  it('capitalises after new lines and skips leading punctuation', () => {
    expect(toSentenceCase('first line\nsecond line')).toBe('First line\nSecond line');
    expect(toSentenceCase('  "quoted start" here')).toBe('  "Quoted start" here');
  });

  it('does not capitalise after decimals', () => {
    expect(toSentenceCase('it costs 3.5 dollars')).toBe('It costs 3.5 dollars');
  });
});

describe('splitWords', () => {
  it('splits on separators and camel humps', () => {
    expect(splitWords('hello world')).toEqual(['hello', 'world']);
    expect(splitWords('helloWorld')).toEqual(['hello', 'World']);
    expect(splitWords('XMLHttpRequest')).toEqual(['XML', 'Http', 'Request']);
    expect(splitWords('snake_case-and kebab')).toEqual(['snake', 'case', 'and', 'kebab']);
    expect(splitWords("don't panic")).toEqual(['dont', 'panic']);
    expect(splitWords('version2Beta base64')).toEqual(['version2', 'Beta', 'base64']);
    expect(splitWords('  ...  ')).toEqual([]);
  });
});

describe('identifier cases', () => {
  const input = 'Hello World from AiVello';

  it('camelCase', () => {
    expect(toCamelCase(input)).toBe('helloWorldFromAiVello');
    expect(toCamelCase('XMLHttpRequest')).toBe('xmlHttpRequest');
    expect(toCamelCase('user_id')).toBe('userId');
  });

  it('PascalCase', () => {
    expect(toPascalCase(input)).toBe('HelloWorldFromAiVello');
    expect(toPascalCase('some-kebab-case')).toBe('SomeKebabCase');
  });

  it('snake_case', () => {
    expect(toSnakeCase(input)).toBe('hello_world_from_ai_vello');
    expect(toSnakeCase('camelCaseString')).toBe('camel_case_string');
  });

  it('kebab-case', () => {
    expect(toKebabCase(input)).toBe('hello-world-from-ai-vello');
    expect(toKebabCase('  Leading and trailing  ')).toBe('leading-and-trailing');
  });

  it('CONSTANT_CASE', () => {
    expect(toConstantCase(input)).toBe('HELLO_WORLD_FROM_AI_VELLO');
    expect(toConstantCase('max retries')).toBe('MAX_RETRIES');
  });

  it('keeps non-Latin letters', () => {
    expect(toSnakeCase('Привет Мир')).toBe('привет_мир');
    expect(toCamelCase('crème brûlée')).toBe('crèmeBrûlée');
    expect(toKebabCase('日本 語')).toBe('日本-語');
  });

  it('returns empty output for empty input', () => {
    for (const fn of [toCamelCase, toPascalCase, toSnakeCase, toKebabCase, toConstantCase]) {
      expect(fn('')).toBe('');
    }
  });
});

describe('toAlternatingCase', () => {
  it('alternates across letters only', () => {
    expect(toAlternatingCase('alternating')).toBe('aLtErNaTiNg');
    expect(toAlternatingCase('hello world')).toBe('hElLo WoRlD');
    expect(toAlternatingCase('a1b2c3')).toBe('a1B2c3');
  });

  it('keeps emoji intact', () => {
    expect(toAlternatingCase('ab😀cd')).toBe('aB😀cD');
  });
});

describe('toInverseCase', () => {
  it('swaps case', () => {
    expect(toInverseCase('Inverse')).toBe('iNVERSE');
    expect(toInverseCase('Hello World 123')).toBe('hELLO wORLD 123');
    expect(toInverseCase('ÉcOLE')).toBe('éCole');
  });

  it('is its own inverse for simple text', () => {
    const text = 'The Quick Brown Fox';
    expect(toInverseCase(toInverseCase(text))).toBe(text);
  });
});

describe('counts', () => {
  it('counts characters as user-perceived graphemes', () => {
    expect(countCharacters('')).toBe(0);
    expect(countCharacters('abc')).toBe(3);
    expect(countCharacters('😀')).toBe(1);
    expect(countCharacters('👍🏽')).toBe(1);
    expect(countCharacters('é')).toBe(1); // e + combining acute
  });

  it('counts words by whitespace', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords('one')).toBe(1);
    expect(countWords(' one  two\nthree\tfour ')).toBe(4);
  });
});

describe('CASE_CONVERSIONS', () => {
  it('exposes all eleven conversions with unique ids', () => {
    const ids = CASE_CONVERSIONS.map((c) => c.id);
    expect(ids).toHaveLength(11);
    expect(new Set(ids).size).toBe(11);
  });
});
