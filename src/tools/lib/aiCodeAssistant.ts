/**
 * Client-side code generator for the AI Code Assistant.
 *
 * There is no LLM behind this tool. The prompt is matched against a set of intents
 * (HTTP request, class/model, validation, sorting, SQL, …) and a real, runnable
 * snippet is produced in the selected language, named after the user's request.
 * When an intent has no template for the selected language the generator says so in
 * `note` and returns a scaffold in that language instead of silently switching.
 */

export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
  { id: 'csharp', label: 'C#', ext: 'cs' },
  { id: 'go', label: 'Go', ext: 'go' },
  { id: 'rust', label: 'Rust', ext: 'rs' },
  { id: 'php', label: 'PHP', ext: 'php' },
  { id: 'ruby', label: 'Ruby', ext: 'rb' },
  { id: 'swift', label: 'Swift', ext: 'swift' },
  { id: 'kotlin', label: 'Kotlin', ext: 'kt' },
  { id: 'dart', label: 'Dart', ext: 'dart' },
  { id: 'html', label: 'HTML', ext: 'html' },
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'sql', label: 'SQL', ext: 'sql' },
  { id: 'bash', label: 'Bash', ext: 'sh' },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]['id'];

export const isLanguageId = (value: string): value is LanguageId => LANGUAGES.some((l) => l.id === value);

export const languageLabel = (id: LanguageId): string => LANGUAGES.find((l) => l.id === id)?.label ?? id;

export const languageExtension = (id: LanguageId): string => LANGUAGES.find((l) => l.id === id)?.ext ?? 'txt';

export interface GeneratedCode {
  code: string;
  language: LanguageId;
  title: string;
  /** Explains fallbacks or what the user still has to fill in. */
  note?: string;
}

export const PROMPT_MIN_LENGTH = 5;
export const PROMPT_MAX_LENGTH = 500;

// ---------------------------------------------------------------------------
// Naming helpers
// ---------------------------------------------------------------------------

const NAME_STOPWORDS = new Set(
  (
    'a an the and or of to for in on with without by from into that which who whose this these those it its is are be ' +
    'create make write generate build implement code program script simple basic small quick please me i want need can ' +
    'you your my function method class object model struct component snippet using use takes take returns return given ' +
    'some any all each every new get set how do does should would will api endpoint http request fetch sql query css html ' +
    'javascript typescript python java cpp csharp golang go rust php ruby swift kotlin dart bash shell react express flask ' +
    'responsive layout page database table file files data rest js ts py'
  ).split(' ')
);

/** Keywords in at least one supported language - never usable as a bare identifier. */
const RESERVED = new Set(
  (
    'abstract async await begin break case catch const continue def default defer delete do elif else end enum except ' +
    'export extends false final finally fn for fun func function go goto if impl implements import in instanceof interface ' +
    'is lambda let loop match mod module mut namespace new nil none not null operator or override package pass private ' +
    'protected public raise return self static struct super switch this throw throws true try type typeof unless until ' +
    'use var void when where while with yield'
  ).split(' ')
);

const words = (text: string) => text.toLowerCase().match(/[a-z][a-z0-9]*/g) || [];

export const nameWords = (prompt: string, fallback: string[]): string[] => {
  const w = words(prompt).filter((x) => !NAME_STOPWORDS.has(x) && !RESERVED.has(x) && x.length > 1);
  return w.length ? w.slice(0, 3) : fallback;
};

/** The part of a prompt before a "with name, email…" style clause - used for type names. */
const subjectOf = (prompt: string) => prompt.split(/\b(?:with|having|containing|that|which)\b/i)[0];

const cap = (w: string) => (w ? w[0].toUpperCase() + w.slice(1) : w);
const camel = (w: string[]) => w.map((x, i) => (i === 0 ? x : cap(x))).join('');
const pascal = (w: string[]) => w.map(cap).join('');
const snake = (w: string[]) => w.join('_');

const plural = (w: string) => (w.endsWith('s') ? w : w.endsWith('y') && !/[aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`);
const singular = (w: string) => (w.endsWith('ies') ? `${w.slice(0, -3)}y` : w.endsWith('ss') ? w : w.endsWith('s') ? w.slice(0, -1) : w);

/** Prompt text that is safe to place inside a single-line comment in any language. */
export const sanitizeForComment = (prompt: string): string =>
  prompt
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\*\/|\/\*|-->|<!--|"""|'''/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

const commentPrefix = (lang: LanguageId): string => {
  if (lang === 'python' || lang === 'ruby' || lang === 'bash') return '#';
  if (lang === 'sql') return '--';
  return '//';
};

const header = (lang: LanguageId, prompt: string): string => {
  const text = `Generated for: "${sanitizeForComment(prompt)}"`;
  if (lang === 'html') return `<!-- ${text} -->`;
  if (lang === 'css') return `/* ${text} */`;
  return `${commentPrefix(lang)} ${text}`;
};

// ---------------------------------------------------------------------------
// Field inference for classes / models / tables / forms
// ---------------------------------------------------------------------------

type FieldKind = 'string' | 'int' | 'float' | 'boolean' | 'date';

interface Field {
  words: string[];
  kind: FieldKind;
}

const inferKind = (name: string): FieldKind => {
  if (/^(is|has|can|should)[a-z]|^(active|enabled|completed|done|verified|published|visible|available)$/.test(name)) return 'boolean';
  if (/(date|at|time|birthday|deadline|timestamp)$/.test(name)) return 'date';
  if (/^(price|amount|total|balance|salary|cost|rating|score|weight|height)$/.test(name)) return 'float';
  if (/^(id|age|count|quantity|qty|year|stock|level|number|size|pages|priority)$/.test(name)) return 'int';
  return 'string';
};

const DEFAULT_FIELDS: Record<string, string[]> = {
  user: ['name', 'email', 'age'],
  person: ['name', 'email', 'age'],
  customer: ['name', 'email', 'phone'],
  product: ['name', 'price', 'stock'],
  item: ['name', 'price', 'quantity'],
  task: ['title', 'completed', 'due date'],
  todo: ['title', 'completed'],
  book: ['title', 'author', 'year'],
  order: ['customer id', 'total', 'created at'],
  post: ['title', 'body', 'published'],
  employee: ['name', 'role', 'salary'],
  student: ['name', 'grade', 'age'],
  car: ['make', 'model', 'year'],
  account: ['owner', 'balance'],
};

export const extractFields = (prompt: string, entity: string): Field[] => {
  const m = prompt.match(/\b(?:with|having|fields?|properties|attributes|columns?)\b[:\s]+(.+)$/i);
  let raw: string[] = [];
  if (m) {
    raw = m[1]
      .split(/,|\band\b|;/i)
      .map((s) => s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').trim())
      .filter((s) => s && s.length <= 30)
      .slice(0, 8);
  }
  if (!raw.length) raw = DEFAULT_FIELDS[entity] || ['name', 'created at'];
  return raw.map((r) => {
    const w = r.split(/\s+/).filter(Boolean).slice(0, 3);
    return { words: w, kind: inferKind(camel(w)) };
  });
};

const TYPE_MAP: Partial<Record<LanguageId, Record<FieldKind, string>>> = {
  typescript: { string: 'string', int: 'number', float: 'number', boolean: 'boolean', date: 'Date' },
  python: { string: 'str', int: 'int', float: 'float', boolean: 'bool', date: 'datetime' },
  java: { string: 'String', int: 'int', float: 'double', boolean: 'boolean', date: 'LocalDate' },
  csharp: { string: 'string', int: 'int', float: 'decimal', boolean: 'bool', date: 'DateTime' },
  go: { string: 'string', int: 'int', float: 'float64', boolean: 'bool', date: 'time.Time' },
  rust: { string: 'String', int: 'i64', float: 'f64', boolean: 'bool', date: 'String' },
  php: { string: 'string', int: 'int', float: 'float', boolean: 'bool', date: '\\DateTimeImmutable' },
  swift: { string: 'String', int: 'Int', float: 'Double', boolean: 'Bool', date: 'Date' },
  kotlin: { string: 'String', int: 'Int', float: 'Double', boolean: 'Boolean', date: 'LocalDate' },
  dart: { string: 'String', int: 'int', float: 'double', boolean: 'bool', date: 'DateTime' },
  cpp: { string: 'std::string', int: 'int', float: 'double', boolean: 'bool', date: 'std::string' },
  sql: { string: 'VARCHAR(255) NOT NULL', int: 'INTEGER NOT NULL', float: 'DECIMAL(10, 2) NOT NULL', boolean: 'BOOLEAN NOT NULL DEFAULT FALSE', date: 'TIMESTAMP' },
};

const typeOf = (lang: LanguageId, kind: FieldKind) => TYPE_MAP[lang]?.[kind] ?? '';

const sampleValue = (lang: LanguageId, f: Field): string => {
  const n = camel(f.words);
  switch (f.kind) {
    case 'int':
      return '1';
    case 'float':
      return lang === 'csharp' ? '9.99m' : '9.99';
    case 'boolean':
      return lang === 'python' ? 'False' : 'false';
    case 'date':
      if (lang === 'python') return 'datetime.now()';
      if (lang === 'java' || lang === 'kotlin') return 'LocalDate.now()';
      if (lang === 'csharp' || lang === 'dart') return lang === 'csharp' ? 'DateTime.Now' : 'DateTime.now()';
      if (lang === 'go') return 'time.Now()';
      if (lang === 'swift') return 'Date()';
      if (lang === 'php') return 'new \\DateTimeImmutable()';
      if (lang === 'typescript' || lang === 'javascript') return 'new Date()';
      if (lang === 'rust') return '"2024-01-01".to_string()';
      return '"2024-01-01"';
    default:
      if (lang === 'rust') return `"example ${n}".to_string()`;
      if (lang === 'php' || lang === 'ruby' || lang === 'python') return `'example ${n}'`;
      return `"example ${n}"`;
  }
};

// ---------------------------------------------------------------------------
// Parameter inference for functions
// ---------------------------------------------------------------------------

type ParamKind = 'list' | 'text' | 'number' | 'object' | 'any';

const inferParam = (prompt: string): { name: string; kind: ParamKind } => {
  const p = prompt.toLowerCase();
  if (/\b(list|array|numbers|items|values|collection)\b/.test(p)) return { name: 'items', kind: 'list' };
  if (/\b(string|text|word|sentence|name|email|message)\b/.test(p)) return { name: 'text', kind: 'text' };
  if (/\b(number|integer|amount|count|age|price)\b/.test(p)) return { name: 'value', kind: 'number' };
  if (/\b(user|person|customer|order|product|record|object)\b/.test(p)) return { name: 'record', kind: 'object' };
  return { name: 'input', kind: 'any' };
};

// ---------------------------------------------------------------------------
// Scaffold (works for every language; used as the honest fallback)
// ---------------------------------------------------------------------------

const scaffold = (lang: LanguageId, prompt: string): string => {
  const w = nameWords(prompt, ['process', 'input']);
  const fn = camel(w);
  const fnSnake = snake(w);
  const Fn = pascal(w);
  const param = inferParam(prompt);
  const desc = sanitizeForComment(prompt);
  const h = header(lang, prompt);

  switch (lang) {
    case 'javascript':
      return `${h}
/**
 * ${desc}
 * @param {${param.kind === 'list' ? 'Array<unknown>' : param.kind === 'text' ? 'string' : param.kind === 'number' ? 'number' : 'unknown'}} ${param.name}
 */
export function ${fn}(${param.name}) {
  if (${param.name} === undefined || ${param.name} === null) {
    throw new TypeError('${fn}: "${param.name}" is required');
  }

  // TODO: implement the logic for this function.
  const result = ${param.name};

  return result;
}

// Example
console.log(${fn}(${param.kind === 'list' ? '[1, 2, 3]' : param.kind === 'text' ? "'hello'" : param.kind === 'number' ? '42' : "{ id: 1 }"}));
`;
    case 'typescript': {
      const t = param.kind === 'list' ? 'T[]' : param.kind === 'text' ? 'string' : param.kind === 'number' ? 'number' : param.kind === 'object' ? 'Record<string, unknown>' : 'T';
      const generic = t.includes('T') ? '<T>' : '';
      return `${h}
/** ${desc} */
export function ${fn}${generic}(${param.name}: ${t}): ${t} {
  if (${param.name} === undefined || ${param.name} === null) {
    throw new TypeError('${fn}: "${param.name}" is required');
  }

  // TODO: implement the logic for this function.
  return ${param.name};
}

// Example
console.log(${fn}(${param.kind === 'list' ? '[1, 2, 3]' : param.kind === 'text' ? "'hello'" : param.kind === 'number' ? '42' : "{ id: 1 }"}));
`;
    }
    case 'python':
      return `${h}
from typing import Any


def ${fnSnake}(${param.name}: Any) -> Any:
    """${desc}"""
    if ${param.name} is None:
        raise ValueError("${fnSnake}: '${param.name}' is required")

    # TODO: implement the logic for this function.
    result = ${param.name}

    return result


if __name__ == "__main__":
    print(${fnSnake}(${param.kind === 'list' ? '[1, 2, 3]' : param.kind === 'text' ? '"hello"' : param.kind === 'number' ? '42' : '{"id": 1}'}))
`;
    case 'java':
      return `${h}
import java.util.Objects;

public class ${Fn} {

    /** ${desc} */
    public static <T> T ${fn}(T ${param.name}) {
        Objects.requireNonNull(${param.name}, "${param.name} is required");

        // TODO: implement the logic for this method.
        return ${param.name};
    }

    public static void main(String[] args) {
        System.out.println(${fn}("hello"));
    }
}
`;
    case 'cpp':
      return `${h}
#include <iostream>
#include <string>

// ${desc}
template <typename T>
T ${fn}(const T& ${param.name}) {
    // TODO: implement the logic for this function.
    return ${param.name};
}

int main() {
    std::cout << ${fn}(std::string("hello")) << std::endl;
    return 0;
}
`;
    case 'csharp':
      return `${h}
using System;

public static class ${Fn}Helper
{
    /// <summary>${desc}</summary>
    public static T ${Fn}<T>(T ${param.name})
    {
        if (${param.name} is null) throw new ArgumentNullException(nameof(${param.name}));

        // TODO: implement the logic for this method.
        return ${param.name};
    }

    public static void Main()
    {
        Console.WriteLine(${Fn}("hello"));
    }
}
`;
    case 'go':
      return `${h}
package main

import (
	"errors"
	"fmt"
)

// ${fn} ${desc}
func ${fn}(${param.name} string) (string, error) {
	if ${param.name} == "" {
		return "", errors.New("${fn}: ${param.name} is required")
	}

	// TODO: implement the logic for this function.
	return ${param.name}, nil
}

func main() {
	result, err := ${fn}("hello")
	if err != nil {
		fmt.Println("error:", err)
		return
	}
	fmt.Println(result)
}
`;
    case 'rust':
      return `${h}
/// ${desc}
fn ${fnSnake}(${param.name}: &str) -> Result<String, String> {
    if ${param.name}.is_empty() {
        return Err("${param.name} is required".to_string());
    }

    // TODO: implement the logic for this function.
    Ok(${param.name}.to_string())
}

fn main() {
    match ${fnSnake}("hello") {
        Ok(result) => println!("{}", result),
        Err(e) => eprintln!("error: {}", e),
    }
}
`;
    case 'php':
      return `<?php
${h}

declare(strict_types=1);

/**
 * ${desc}
 */
function ${fn}(mixed $${param.name}): mixed
{
    if ($${param.name} === null) {
        throw new InvalidArgumentException('${param.name} is required');
    }

    // TODO: implement the logic for this function.
    return $${param.name};
}

var_dump(${fn}('hello'));
`;
    case 'ruby':
      return `${h}

# ${desc}
def ${fnSnake}(${param.name})
  raise ArgumentError, '${param.name} is required' if ${param.name}.nil?

  # TODO: implement the logic for this method.
  ${param.name}
end

puts ${fnSnake}('hello')
`;
    case 'swift':
      return `${h}
import Foundation

enum ${Fn}Error: Error {
    case missingInput
}

/// ${desc}
func ${fn}(_ ${param.name}: String) throws -> String {
    guard !${param.name}.isEmpty else { throw ${Fn}Error.missingInput }

    // TODO: implement the logic for this function.
    return ${param.name}
}

do {
    print(try ${fn}("hello"))
} catch {
    print("error: \\(error)")
}
`;
    case 'kotlin':
      return `${h}

/** ${desc} */
fun <T> ${fn}(${param.name}: T?): T {
    requireNotNull(${param.name}) { "${param.name} is required" }

    // TODO: implement the logic for this function.
    return ${param.name}
}

fun main() {
    println(${fn}("hello"))
}
`;
    case 'dart':
      return `${h}

/// ${desc}
T ${fn}<T>(T? ${param.name}) {
  if (${param.name} == null) {
    throw ArgumentError.notNull('${param.name}');
  }

  // TODO: implement the logic for this function.
  return ${param.name};
}

void main() {
  print(${fn}('hello'));
}
`;
    case 'html':
      return htmlPage(prompt);
    case 'css':
      return cssLayout(prompt);
    case 'sql':
      return sqlQuery(prompt);
    case 'bash':
      return bashScript(prompt);
    default:
      return h;
  }
};

// ---------------------------------------------------------------------------
// Intent templates
// ---------------------------------------------------------------------------

const classTemplate = (lang: LanguageId, prompt: string): string | null => {
  const w = nameWords(subjectOf(prompt), ['item']);
  const entity = singular(w[w.length - 1]);
  const nameW = w.length > 1 ? [...w.slice(0, -1), entity] : [entity];
  const Name = pascal(nameW);
  const fields = extractFields(prompt, entity);
  const h = header(lang, prompt);
  const fc = (f: Field) => camel(f.words);
  const fs = (f: Field) => snake(f.words);
  const needsDate = fields.some((f) => f.kind === 'date');

  switch (lang) {
    case 'javascript':
      return `${h}
export class ${Name} {
  constructor({ ${fields.map(fc).join(', ')} }) {
${fields.map((f) => `    this.${fc(f)} = ${fc(f)};`).join('\n')}
  }

  toJSON() {
    return { ${fields.map(fc).join(', ').replace(/(\w+)/g, '$1: this.$1')} };
  }
}

// Example
const ${camel(nameW)} = new ${Name}({ ${fields.map((f) => `${fc(f)}: ${sampleValue(lang, f)}`).join(', ')} });
console.log(${camel(nameW)}.toJSON());
`;
    case 'typescript':
      return `${h}
export interface ${Name}Props {
${fields.map((f) => `  ${fc(f)}: ${typeOf(lang, f.kind)};`).join('\n')}
}

export class ${Name} implements ${Name}Props {
${fields.map((f) => `  ${fc(f)}: ${typeOf(lang, f.kind)};`).join('\n')}

  constructor(props: ${Name}Props) {
${fields.map((f) => `    this.${fc(f)} = props.${fc(f)};`).join('\n')}
  }

  toJSON(): ${Name}Props {
    return { ${fields.map((f) => `${fc(f)}: this.${fc(f)}`).join(', ')} };
  }
}

// Example
const ${camel(nameW)} = new ${Name}({ ${fields.map((f) => `${fc(f)}: ${sampleValue(lang, f)}`).join(', ')} });
console.log(${camel(nameW)}.toJSON());
`;
    case 'python':
      return `${h}
from dataclasses import dataclass, asdict${needsDate ? '\nfrom datetime import datetime' : ''}


@dataclass
class ${Name}:
${fields.map((f) => `    ${fs(f)}: ${typeOf(lang, f.kind)}`).join('\n')}

    def to_dict(self) -> dict:
        return asdict(self)


if __name__ == "__main__":
    ${snake(nameW)} = ${Name}(${fields.map((f) => `${fs(f)}=${sampleValue(lang, f)}`).join(', ')})
    print(${snake(nameW)}.to_dict())
`;
    case 'java':
      return `${h}
${needsDate ? 'import java.time.LocalDate;\n' : ''}import java.util.Objects;

public class ${Name} {
${fields.map((f) => `    private ${typeOf(lang, f.kind)} ${fc(f)};`).join('\n')}

    public ${Name}(${fields.map((f) => `${typeOf(lang, f.kind)} ${fc(f)}`).join(', ')}) {
${fields.map((f) => `        this.${fc(f)} = ${fc(f)};`).join('\n')}
    }

${fields.map((f) => `    public ${typeOf(lang, f.kind)} get${pascal(f.words)}() { return ${fc(f)}; }\n    public void set${pascal(f.words)}(${typeOf(lang, f.kind)} ${fc(f)}) { this.${fc(f)} = ${fc(f)}; }`).join('\n\n')}

    @Override
    public String toString() {
        return "${Name}{" + ${fields.map((f) => `"${fc(f)}=" + ${fc(f)}`).join(' + ", " + ')} + "}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ${Name})) return false;
        ${Name} other = (${Name}) o;
        return ${fields.map((f) => `Objects.equals(${fc(f)}, other.${fc(f)})`).join(' && ')};
    }

    @Override
    public int hashCode() {
        return Objects.hash(${fields.map(fc).join(', ')});
    }
}
`;
    case 'csharp':
      return `${h}
using System;

public record ${Name}(${fields.map((f) => `${typeOf(lang, f.kind)} ${pascal(f.words)}`).join(', ')});

public static class Program
{
    public static void Main()
    {
        var ${camel(nameW)} = new ${Name}(${fields.map((f) => sampleValue(lang, f)).join(', ')});
        Console.WriteLine(${camel(nameW)});
    }
}
`;
    case 'go':
      return `${h}
package main

import (
	"fmt"${needsDate ? '\n\t"time"' : ''}
)

// ${Name} ${sanitizeForComment(prompt)}
type ${Name} struct {
${fields.map((f) => `\t${pascal(f.words)} ${typeOf(lang, f.kind)} \`json:"${fs(f)}"\``).join('\n')}
}

// New${Name} creates a ${Name}.
func New${Name}(${fields.map((f) => `${fc(f)} ${typeOf(lang, f.kind)}`).join(', ')}) *${Name} {
	return &${Name}{${fields.map((f) => `${pascal(f.words)}: ${fc(f)}`).join(', ')}}
}

func main() {
	v := New${Name}(${fields.map((f) => sampleValue(lang, f)).join(', ')})
	fmt.Printf("%+v\\n", *v)
}
`;
    case 'rust':
      return `${h}
#[derive(Debug, Clone, PartialEq)]
pub struct ${Name} {
${fields.map((f) => `    pub ${fs(f)}: ${typeOf(lang, f.kind)},`).join('\n')}
}

impl ${Name} {
    pub fn new(${fields.map((f) => `${fs(f)}: ${typeOf(lang, f.kind)}`).join(', ')}) -> Self {
        Self { ${fields.map(fs).join(', ')} }
    }
}

fn main() {
    let value = ${Name}::new(${fields.map((f) => sampleValue(lang, f)).join(', ')});
    println!("{:?}", value);
}
`;
    case 'php':
      return `<?php
${h}

declare(strict_types=1);

final class ${Name}
{
    public function __construct(
${fields.map((f) => `        public ${typeOf(lang, f.kind)} $${fc(f)},`).join('\n')}
    ) {
    }

    public function toArray(): array
    {
        return get_object_vars($this);
    }
}

$${camel(nameW)} = new ${Name}(${fields.map((f) => sampleValue(lang, f)).join(', ')});
print_r($${camel(nameW)}->toArray());
`;
    case 'ruby':
      return `${h}

class ${Name}
  attr_accessor ${fields.map((f) => `:${fs(f)}`).join(', ')}

  def initialize(${fields.map((f) => `${fs(f)}:`).join(', ')})
${fields.map((f) => `    @${fs(f)} = ${fs(f)}`).join('\n')}
  end

  def to_h
    { ${fields.map((f) => `${fs(f)}: @${fs(f)}`).join(', ')} }
  end
end

${snake(nameW)} = ${Name}.new(${fields.map((f) => `${fs(f)}: ${f.kind === 'date' ? 'Time.now' : sampleValue(lang, f)}`).join(', ')})
p ${snake(nameW)}.to_h
`;
    case 'swift':
      return `${h}
import Foundation

struct ${Name}: Codable, Equatable {
${fields.map((f) => `    var ${fc(f)}: ${typeOf(lang, f.kind)}`).join('\n')}
}

let ${fc({ words: nameW, kind: 'string' })} = ${Name}(${fields.map((f) => `${fc(f)}: ${sampleValue(lang, f)}`).join(', ')})
print(${fc({ words: nameW, kind: 'string' })})
`;
    case 'kotlin':
      return `${h}
${needsDate ? 'import java.time.LocalDate\n' : ''}
data class ${Name}(
${fields.map((f) => `    val ${fc(f)}: ${typeOf(lang, f.kind)},`).join('\n')}
)

fun main() {
    val ${camel(nameW)} = ${Name}(${fields.map((f) => `${fc(f)} = ${sampleValue(lang, f)}`).join(', ')})
    println(${camel(nameW)})
}
`;
    case 'dart':
      return `${h}

class ${Name} {
${fields.map((f) => `  final ${typeOf(lang, f.kind)} ${fc(f)};`).join('\n')}

  const ${Name}({${fields.map((f) => `required this.${fc(f)}`).join(', ')}});

  Map<String, dynamic> toJson() => {${fields.map((f) => `'${fs(f)}': ${f.kind === 'date' ? `${fc(f)}.toIso8601String()` : fc(f)}`).join(', ')}};
}

void main() {
  final ${camel(nameW)} = ${Name}(${fields.map((f) => `${fc(f)}: ${sampleValue(lang, f)}`).join(', ')});
  print(${camel(nameW)}.toJson());
}
`;
    case 'cpp':
      return `${h}
#include <iostream>
#include <string>
#include <utility>

class ${Name} {
public:
    ${Name}(${fields.map((f) => `${typeOf(lang, f.kind)} ${fc(f)}`).join(', ')})
        : ${fields.map((f) => `${fc(f)}_(${f.kind === 'string' || f.kind === 'date' ? `std::move(${fc(f)})` : fc(f)})`).join(', ')} {}

${fields.map((f) => `    const ${typeOf(lang, f.kind)}& ${fc(f)}() const { return ${fc(f)}_; }`).join('\n')}

private:
${fields.map((f) => `    ${typeOf(lang, f.kind)} ${fc(f)}_;`).join('\n')}
};

int main() {
    ${Name} value(${fields.map((f) => sampleValue(lang, f)).join(', ')});
    std::cout << value.${fc(fields[0])}() << std::endl;
    return 0;
}
`;
    case 'sql': {
      const table = plural(snake(nameW));
      return `${h}
CREATE TABLE ${table} (
    id SERIAL PRIMARY KEY,
${fields.filter((f) => fs(f) !== 'id').map((f) => `    ${fs(f)} ${typeOf(lang, f.kind)},`).join('\n')}
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Example row
INSERT INTO ${table} (${fields.filter((f) => fs(f) !== 'id').map(fs).join(', ')})
VALUES (${fields.filter((f) => fs(f) !== 'id').map((f) => (f.kind === 'string' ? `'example'` : f.kind === 'boolean' ? 'FALSE' : f.kind === 'date' ? 'CURRENT_TIMESTAMP' : '1')).join(', ')});
`;
    }
    case 'html':
      return htmlForm(prompt, fields);
    default:
      return null;
  }
};

const httpClientTemplate = (lang: LanguageId, prompt: string): string | null => {
  const w = nameWords(prompt, ['items']);
  const resource = plural(w[w.length - 1]);
  const fn = camel(['fetch', ...w.map((x, i) => (i === w.length - 1 ? plural(x) : x))]);
  const fnSnake = snake(['fetch', ...w.map((x, i) => (i === w.length - 1 ? plural(x) : x))]);
  const url = `https://api.example.com/${resource}`;
  const h = header(lang, prompt);
  const isPost = /\b(post|send|submit|create|upload)\b/i.test(prompt);

  switch (lang) {
    case 'javascript':
      return `${h}
/**
 * ${isPost ? 'Send JSON to' : 'Fetch JSON from'} an API with a timeout and clear errors.
 */
export async function ${fn}(${isPost ? 'payload, ' : ''}{ timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('${url}', {
      method: '${isPost ? 'POST' : 'GET'}',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },${isPost ? '\n      body: JSON.stringify(payload),' : ''}
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(\`Request failed: \${response.status} \${response.statusText}\`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(\`Request timed out after \${timeoutMs}ms\`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Usage
${fn}(${isPost ? "{ name: 'Example' }" : ''})
  .then((data) => console.log(data))
  .catch((error) => console.error(error.message));
`;
    case 'typescript':
      return `${h}
export interface ${pascal([singular(resource)])} {
  id: number;
  [key: string]: unknown;
}

export async function ${fn}(${isPost ? `payload: Partial<${pascal([singular(resource)])}>, ` : ''}timeoutMs = 10_000): Promise<${pascal([singular(resource)])}${isPost ? '' : '[]'}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('${url}', {
      method: '${isPost ? 'POST' : 'GET'}',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },${isPost ? '\n      body: JSON.stringify(payload),' : ''}
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(\`Request failed: \${response.status} \${response.statusText}\`);
    }
    return (await response.json()) as ${pascal([singular(resource)])}${isPost ? '' : '[]'};
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(\`Request timed out after \${timeoutMs}ms\`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
`;
    case 'python':
      return `${h}
import requests


def ${fnSnake}(${isPost ? 'payload: dict, ' : ''}timeout: float = 10.0)${isPost ? ' -> dict' : ' -> list'}:
    """${isPost ? 'Send JSON to' : 'Fetch JSON from'} the API and return the decoded body."""
    try:
        response = requests.${isPost ? 'post' : 'get'}("${url}", ${isPost ? 'json=payload, ' : ''}timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout as exc:
        raise RuntimeError(f"Request timed out after {timeout}s") from exc
    except requests.exceptions.RequestException as exc:
        raise RuntimeError(f"Request failed: {exc}") from exc


if __name__ == "__main__":
    print(${fnSnake}(${isPost ? '{"name": "Example"}' : ''}))
`;
    case 'go':
      return `${h}
package main

import (
	${isPost ? '"bytes"\n\t' : ''}"encoding/json"
	"fmt"
	"net/http"
	"time"
)

var client = &http.Client{Timeout: 10 * time.Second}

func ${fn}(${isPost ? 'payload any' : ''}) ([]map[string]any, error) {
	${isPost ? 'body, err := json.Marshal(payload)\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\tresp, err := client.Post("' + url + '", "application/json", bytes.NewReader(body))' : `resp, err := client.Get("${url}")`}
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}

	var result []map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode failed: %w", err)
	}
	return result, nil
}

func main() {
	data, err := ${fn}(${isPost ? 'map[string]string{"name": "Example"}' : ''})
	if err != nil {
		fmt.Println("error:", err)
		return
	}
	fmt.Println(data)
}
`;
    case 'java':
      return `${h}
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class ${pascal(['api', 'client'])} {
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public static String ${fn}(${isPost ? 'String jsonBody' : ''}) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create("${url}"))
                .timeout(Duration.ofSeconds(10))
                .header("Accept", "application/json")${isPost ? '\n                .header("Content-Type", "application/json")\n                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))' : '\n                .GET()'}
                .build();

        HttpResponse<String> response = CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("Request failed with status " + response.statusCode());
        }
        return response.body();
    }

    public static void main(String[] args) throws Exception {
        System.out.println(${fn}(${isPost ? '"{\\"name\\":\\"Example\\"}"' : ''}));
    }
}
`;
    case 'csharp':
      return `${h}
using System;
using System.Net.Http;${isPost ? '\nusing System.Net.Http.Json;' : ''}
using System.Threading.Tasks;

public static class ApiClient
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(10) };

    public static async Task<string> ${pascal(['fetch', ...w])}Async(${isPost ? 'object payload' : ''})
    {
        using var response = await Http.${isPost ? `PostAsJsonAsync("${url}", payload)` : `GetAsync("${url}")`};
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync();
    }

    public static async Task Main()
    {
        try
        {
            Console.WriteLine(await ${pascal(['fetch', ...w])}Async(${isPost ? 'new { Name = "Example" }' : ''}));
        }
        catch (HttpRequestException ex)
        {
            Console.Error.WriteLine($"Request failed: {ex.Message}");
        }
    }
}
`;
    case 'php':
      return `<?php
${h}

declare(strict_types=1);

function ${fn}(${isPost ? 'array $payload' : ''}): array
{
    $ch = curl_init('${url}');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/json'],${isPost ? "\n        CURLOPT_POST => true,\n        CURLOPT_POSTFIELDS => json_encode($payload, JSON_THROW_ON_ERROR)," : ''}
    ]);

    $body = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($body === false) {
        throw new RuntimeException("Request failed: $error");
    }
    if ($status < 200 || $status >= 300) {
        throw new RuntimeException("Unexpected status: $status");
    }
    return json_decode($body, true, 512, JSON_THROW_ON_ERROR);
}

print_r(${fn}(${isPost ? "['name' => 'Example']" : ''}));
`;
    case 'ruby':
      return `${h}
require 'net/http'
require 'json'
require 'uri'

def ${fnSnake}(${isPost ? 'payload' : ''})
  uri = URI('${url}')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.read_timeout = 10

  request = Net::HTTP::${isPost ? 'Post' : 'Get'}.new(uri, 'Content-Type' => 'application/json')${isPost ? '\n  request.body = payload.to_json' : ''}
  response = http.request(request)
  raise "Request failed: #{response.code}" unless response.is_a?(Net::HTTPSuccess)

  JSON.parse(response.body)
end

p ${fnSnake}(${isPost ? "{ name: 'Example' }" : ''})
`;
    case 'rust':
      return `${h}
// Cargo.toml: reqwest = { version = "0.12", features = ["blocking", "json"] }, serde_json = "1"
use std::time::Duration;

fn ${fnSnake}() -> Result<serde_json::Value, reqwest::Error> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()?;
    client.get("${url}").send()?.error_for_status()?.json()
}

fn main() {
    match ${fnSnake}() {
        Ok(data) => println!("{:#}", data),
        Err(e) => eprintln!("request failed: {}", e),
    }
}
`;
    case 'swift':
      return `${h}
import Foundation

enum APIError: Error { case badStatus(Int) }

func ${fn}() async throws -> Data {
    let url = URL(string: "${url}")!
    var request = URLRequest(url: url, timeoutInterval: 10)
    request.setValue("application/json", forHTTPHeaderField: "Accept")

    let (data, response) = try await URLSession.shared.data(for: request)
    if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
        throw APIError.badStatus(http.statusCode)
    }
    return data
}
`;
    case 'kotlin':
      return `${h}
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

private val client: HttpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build()

fun ${fn}(): String {
    val request = HttpRequest.newBuilder(URI.create("${url}"))
        .timeout(Duration.ofSeconds(10))
        .header("Accept", "application/json")
        .GET()
        .build()
    val response = client.send(request, HttpResponse.BodyHandlers.ofString())
    check(response.statusCode() in 200..299) { "Request failed: \${response.statusCode()}" }
    return response.body()
}

fun main() = println(${fn}())
`;
    case 'dart':
      return `${h}
// pubspec.yaml: http: ^1.2.0
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<dynamic> ${fn}() async {
  final response = await http
      .get(Uri.parse('${url}'), headers: {'Accept': 'application/json'})
      .timeout(const Duration(seconds: 10));
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw Exception('Request failed: \${response.statusCode}');
  }
  return jsonDecode(response.body);
}

Future<void> main() async => print(await ${fn}());
`;
    case 'bash':
      return `#!/usr/bin/env bash
${h}
set -euo pipefail

URL="${url}"

if ! response=$(curl --fail --silent --show-error --max-time 10 ${isPost ? '-X POST -H "Content-Type: application/json" -d \'{"name":"Example"}\' ' : ''}-H "Accept: application/json" "$URL"); then
  echo "Request to $URL failed" >&2
  exit 1
fi

# Pretty-print when jq is available
if command -v jq >/dev/null 2>&1; then
  echo "$response" | jq .
else
  echo "$response"
fi
`;
    default:
      return null;
  }
};

const serverTemplate = (lang: LanguageId, prompt: string): string | null => {
  const w = nameWords(prompt, ['items']);
  const resource = plural(w[w.length - 1]);
  const Entity = pascal([singular(resource)]);
  const h = header(lang, prompt);
  switch (lang) {
    case 'javascript':
    case 'typescript': {
      const ts = lang === 'typescript';
      return `${h}
// npm install express${ts ? ' && npm install -D @types/express' : ''}
import express${ts ? ', { Request, Response }' : ''} from 'express';

const app = express();
app.use(express.json());
${ts ? `\ninterface ${Entity} {\n  id: number;\n  name: string;\n}\n` : ''}
const ${resource}${ts ? `: ${Entity}[]` : ''} = [];
let nextId = 1;

app.get('/api/${resource}', (_req${ts ? ': Request' : ''}, res${ts ? ': Response' : ''}) => {
  res.json(${resource});
});

app.get('/api/${resource}/:id', (req${ts ? ': Request' : ''}, res${ts ? ': Response' : ''}) => {
  const item = ${resource}.find((x) => x.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: '${Entity} not found' });
  res.json(item);
});

app.post('/api/${resource}', (req${ts ? ': Request' : ''}, res${ts ? ': Response' : ''}) => {
  const { name } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: '"name" is required' });
  }
  const item = { id: nextId++, name: name.trim() };
  ${resource}.push(item);
  res.status(201).json(item);
});

app.delete('/api/${resource}/:id', (req${ts ? ': Request' : ''}, res${ts ? ': Response' : ''}) => {
  const index = ${resource}.findIndex((x) => x.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: '${Entity} not found' });
  ${resource}.splice(index, 1);
  res.status(204).end();
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(\`API listening on http://localhost:\${PORT}\`));
`;
    }
    case 'python':
      return `${h}
# pip install flask
from flask import Flask, jsonify, request, abort

app = Flask(__name__)
${resource}: list[dict] = []
next_id = 1


@app.get("/api/${resource}")
def list_${resource}():
    return jsonify(${resource})


@app.get("/api/${resource}/<int:item_id>")
def get_${singular(resource)}(item_id: int):
    item = next((x for x in ${resource} if x["id"] == item_id), None)
    if item is None:
        abort(404, description="${Entity} not found")
    return jsonify(item)


@app.post("/api/${resource}")
def create_${singular(resource)}():
    global next_id
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    if not name:
        return jsonify(error='"name" is required'), 400
    item = {"id": next_id, "name": name}
    next_id += 1
    ${resource}.append(item)
    return jsonify(item), 201


if __name__ == "__main__":
    app.run(debug=False, port=3000)
`;
    case 'go':
      return `${h}
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
)

type ${Entity} struct {
	ID   int    \`json:"id"\`
	Name string \`json:"name"\`
}

var (
	mu     sync.Mutex
	store  []${Entity}
	nextID = 1
)

func ${resource}Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	switch r.Method {
	case http.MethodGet:
		mu.Lock()
		defer mu.Unlock()
		json.NewEncoder(w).Encode(store)
	case http.MethodPost:
		var in ${Entity}
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil || strings.TrimSpace(in.Name) == "" {
			http.Error(w, \`{"error":"name is required"}\`, http.StatusBadRequest)
			return
		}
		mu.Lock()
		in.ID = nextID
		nextID++
		store = append(store, in)
		mu.Unlock()
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(in)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func main() {
	http.HandleFunc("/api/${resource}", ${resource}Handler)
	log.Println("listening on :3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}
`;
    case 'java':
      return `${h}
// Spring Boot (spring-boot-starter-web)
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/${resource}")
public class ${Entity}Controller {

    public record ${Entity}(long id, String name) {}

    private final List<${Entity}> store = new CopyOnWriteArrayList<>();
    private final AtomicLong nextId = new AtomicLong(1);

    @GetMapping
    public List<${Entity}> list() {
        return store;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "").trim();
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "name is required"));
        }
        ${Entity} item = new ${Entity}(nextId.getAndIncrement(), name);
        store.add(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }
}
`;
    case 'csharp':
      return `${h}
// ASP.NET Core minimal API (dotnet new web)
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var ${resource} = new List<${Entity}>();
var nextId = 1;

app.MapGet("/api/${resource}", () => ${resource});

app.MapPost("/api/${resource}", (${Entity}Input input) =>
{
    if (string.IsNullOrWhiteSpace(input.Name))
        return Results.BadRequest(new { error = "name is required" });
    var item = new ${Entity}(nextId++, input.Name.Trim());
    ${resource}.Add(item);
    return Results.Created($"/api/${resource}/{item.Id}", item);
});

app.Run();

record ${Entity}(int Id, string Name);
record ${Entity}Input(string Name);
`;
    case 'php':
      return `<?php
${h}
// Run with: php -S localhost:3000 index.php

declare(strict_types=1);

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path !== '/api/${resource}') {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input') ?: '[]', true) ?? [];
    $name = trim((string)($data['name'] ?? ''));
    if ($name === '') {
        http_response_code(400);
        echo json_encode(['error' => 'name is required']);
        exit;
    }
    http_response_code(201);
    echo json_encode(['id' => 1, 'name' => $name]);
    exit;
}

echo json_encode([]);
`;
    case 'ruby':
      return `${h}
# gem install sinatra
require 'sinatra'
require 'json'

${resource.toUpperCase()} = []

before { content_type :json }

get '/api/${resource}' do
  ${resource.toUpperCase()}.to_json
end

post '/api/${resource}' do
  data = JSON.parse(request.body.read) rescue {}
  name = data['name'].to_s.strip
  halt 400, { error: 'name is required' }.to_json if name.empty?

  item = { id: ${resource.toUpperCase()}.size + 1, name: name }
  ${resource.toUpperCase()} << item
  status 201
  item.to_json
end
`;
    default:
      return null;
  }
};

const validationTemplate = (lang: LanguageId, prompt: string): string | null => {
  const h = header(lang, prompt);
  switch (lang) {
    case 'javascript':
      return `${h}
const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/;

/**
 * Validates a sign-up style form. Returns { isValid, errors } where errors maps
 * field names to a human-readable message.
 */
export function validateForm({ name = '', email = '', password = '' } = {}) {
  const errors = {};

  if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';

  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';

  if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Password needs an uppercase letter and a number';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// Example
console.log(validateForm({ name: 'Ada', email: 'ada@example.com', password: 'Secret123' }));
`;
    case 'typescript':
      return `${h}
export interface FormValues {
  name: string;
  email: string;
  password: string;
}

export type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/;

export function validateForm(values: FormValues): { isValid: boolean; errors: FormErrors } {
  const errors: FormErrors = {};

  if (values.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';

  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address';

  if (values.password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!/[A-Z]/.test(values.password) || !/[0-9]/.test(values.password)) {
    errors.password = 'Password needs an uppercase letter and a number';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
`;
    case 'python':
      return `${h}
import re

EMAIL_RE = re.compile(r"^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$")


def validate_form(name: str, email: str, password: str) -> dict[str, str]:
    """Return a dict of field -> error message. An empty dict means the form is valid."""
    errors: dict[str, str] = {}

    if len(name.strip()) < 2:
        errors["name"] = "Name must be at least 2 characters"

    if not email.strip():
        errors["email"] = "Email is required"
    elif not EMAIL_RE.match(email.strip()):
        errors["email"] = "Enter a valid email address"

    if len(password) < 8:
        errors["password"] = "Password must be at least 8 characters"
    elif not re.search(r"[A-Z]", password) or not re.search(r"\\d", password):
        errors["password"] = "Password needs an uppercase letter and a number"

    return errors


if __name__ == "__main__":
    print(validate_form("Ada", "ada@example.com", "Secret123"))
`;
    case 'java':
      return `${h}
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

public final class FormValidator {
    private static final Pattern EMAIL = Pattern.compile("^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]{2,}$");

    public static Map<String, String> validate(String name, String email, String password) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (name == null || name.trim().length() < 2) errors.put("name", "Name must be at least 2 characters");
        if (email == null || email.isBlank()) errors.put("email", "Email is required");
        else if (!EMAIL.matcher(email.trim()).matches()) errors.put("email", "Enter a valid email address");
        if (password == null || password.length() < 8) errors.put("password", "Password must be at least 8 characters");
        return errors;
    }

    public static void main(String[] args) {
        System.out.println(validate("Ada", "ada@example.com", "Secret123"));
    }
}
`;
    case 'go':
      return `${h}
package main

import (
	"fmt"
	"regexp"
	"strings"
)

var emailRE = regexp.MustCompile(\`^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$\`)

func validateForm(name, email, password string) map[string]string {
	errs := map[string]string{}
	if len(strings.TrimSpace(name)) < 2 {
		errs["name"] = "Name must be at least 2 characters"
	}
	if strings.TrimSpace(email) == "" {
		errs["email"] = "Email is required"
	} else if !emailRE.MatchString(strings.TrimSpace(email)) {
		errs["email"] = "Enter a valid email address"
	}
	if len(password) < 8 {
		errs["password"] = "Password must be at least 8 characters"
	}
	return errs
}

func main() {
	fmt.Println(validateForm("Ada", "ada@example.com", "Secret123"))
}
`;
    case 'php':
      return `<?php
${h}

declare(strict_types=1);

function validateForm(string $name, string $email, string $password): array
{
    $errors = [];
    if (mb_strlen(trim($name)) < 2) {
        $errors['name'] = 'Name must be at least 2 characters';
    }
    if (trim($email) === '') {
        $errors['email'] = 'Email is required';
    } elseif (!filter_var(trim($email), FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Enter a valid email address';
    }
    if (strlen($password) < 8) {
        $errors['password'] = 'Password must be at least 8 characters';
    }
    return $errors;
}

print_r(validateForm('Ada', 'ada@example.com', 'Secret123'));
`;
    case 'csharp':
      return `${h}
using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

public static class FormValidator
{
    private static readonly Regex Email = new(@"^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", RegexOptions.Compiled);

    public static Dictionary<string, string> Validate(string name, string email, string password)
    {
        var errors = new Dictionary<string, string>();
        if ((name ?? "").Trim().Length < 2) errors["name"] = "Name must be at least 2 characters";
        if (string.IsNullOrWhiteSpace(email)) errors["email"] = "Email is required";
        else if (!Email.IsMatch(email.Trim())) errors["email"] = "Enter a valid email address";
        if ((password ?? "").Length < 8) errors["password"] = "Password must be at least 8 characters";
        return errors;
    }

    public static void Main() => Console.WriteLine(Validate("Ada", "ada@example.com", "Secret123").Count == 0 ? "valid" : "invalid");
}
`;
    case 'html':
      return htmlForm(prompt, extractFields(prompt, 'user'));
    default:
      return null;
  }
};

const sortTemplate = (lang: LanguageId, prompt: string): string | null => {
  const h = header(lang, prompt);
  const desc = /\b(desc|descending|largest|highest|biggest|reverse)\b/i.test(prompt);
  const byMatch = prompt.match(/\bby\s+([a-z][a-z ]{1,20}?)(?:\s+(?:in|asc|desc|ascending|descending|order|from)\b|[.,]|$)/i);
  const key = byMatch ? byMatch[1].trim().toLowerCase().split(/\s+/) : null;
  const k = key ? camel(key) : null;
  const ks = key ? snake(key) : null;
  const order = desc ? 'descending' : 'ascending';

  switch (lang) {
    case 'javascript':
    case 'typescript': {
      const ts = lang === 'typescript';
      if (k) {
        return `${h}
/** Returns a new array sorted by "${k}" (${order}). The input is not mutated. */
export function sortBy${pascal(key as string[])}${ts ? `<T extends { ${k}: string | number }>(items: T[]): T[]` : '(items)'} {
  return [...items].sort((a, b) => {
    const x = a.${k};
    const y = b.${k};
    const result = typeof x === 'string' && typeof y === 'string' ? x.localeCompare(y) : Number(x) - Number(y);
    return ${desc ? '-result' : 'result'};
  });
}

// Example
console.log(sortBy${pascal(key as string[])}([{ ${k}: 3 }, { ${k}: 1 }, { ${k}: 2 }]));
`;
      }
      return `${h}
/** Returns a new, ${order} sorted copy of the numbers. The input is not mutated. */
export function sortNumbers(numbers${ts ? ': number[]' : ''})${ts ? ': number[]' : ''} {
  return [...numbers].sort((a, b) => ${desc ? 'b - a' : 'a - b'});
}

// Note: the default Array.prototype.sort() compares as strings ([10, 9].sort() -> [10, 9]).
console.log(sortNumbers([5, 3, 10, 1]));
`;
    }
    case 'python':
      return k
        ? `${h}
from operator import itemgetter


def sort_by_${ks}(items: list[dict]) -> list[dict]:
    """Return a new list sorted by '${ks}' (${order})."""
    return sorted(items, key=itemgetter("${ks}"), reverse=${desc ? 'True' : 'False'})


if __name__ == "__main__":
    print(sort_by_${ks}([{"${ks}": 3}, {"${ks}": 1}, {"${ks}": 2}]))
`
        : `${h}
def sort_numbers(numbers: list[float]) -> list[float]:
    """Return a new ${order} sorted list; the input is not modified."""
    return sorted(numbers, reverse=${desc ? 'True' : 'False'})


if __name__ == "__main__":
    print(sort_numbers([5, 3, 10, 1]))
`;
    case 'java':
      return `${h}
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Sorter {
    public static List<Integer> sortNumbers(List<Integer> numbers) {
        List<Integer> copy = new ArrayList<>(numbers);
        copy.sort(${desc ? 'Comparator.reverseOrder()' : 'Comparator.naturalOrder()'});
        return copy;
    }

    public static void main(String[] args) {
        System.out.println(sortNumbers(List.of(5, 3, 10, 1)));
    }
}
`;
    case 'go':
      return `${h}
package main

import (
	"fmt"
	"sort"
)

func sortNumbers(numbers []int) []int {
	out := append([]int(nil), numbers...)
	sort.Slice(out, func(i, j int) bool { return out[i] ${desc ? '>' : '<'} out[j] })
	return out
}

func main() {
	fmt.Println(sortNumbers([]int{5, 3, 10, 1}))
}
`;
    case 'csharp':
      return `${h}
using System;
using System.Collections.Generic;
using System.Linq;

public static class Sorter
{
    public static List<int> SortNumbers(IEnumerable<int> numbers) =>
        numbers.${desc ? 'OrderByDescending' : 'OrderBy'}(n => n).ToList();

    public static void Main() => Console.WriteLine(string.Join(", ", SortNumbers(new[] { 5, 3, 10, 1 })));
}
`;
    case 'cpp':
      return `${h}
#include <algorithm>
#include <iostream>
#include <vector>

std::vector<int> sortNumbers(std::vector<int> numbers) {
    std::sort(numbers.begin(), numbers.end()${desc ? ', std::greater<int>()' : ''});
    return numbers;
}

int main() {
    for (int n : sortNumbers({5, 3, 10, 1})) std::cout << n << ' ';
    std::cout << std::endl;
    return 0;
}
`;
    case 'rust':
      return `${h}
fn sort_numbers(numbers: &[i64]) -> Vec<i64> {
    let mut out = numbers.to_vec();
    out.sort_unstable_by(|a, b| ${desc ? 'b.cmp(a)' : 'a.cmp(b)'});
    out
}

fn main() {
    println!("{:?}", sort_numbers(&[5, 3, 10, 1]));
}
`;
    case 'ruby':
      return `${h}
def sort_numbers(numbers)
  numbers.sort${desc ? '.reverse' : ''}
end

p sort_numbers([5, 3, 10, 1])
`;
    case 'php':
      return `<?php
${h}

function sortNumbers(array $numbers): array
{
    ${desc ? 'rsort' : 'sort'}($numbers, SORT_NUMERIC);
    return $numbers;
}

print_r(sortNumbers([5, 3, 10, 1]));
`;
    case 'sql':
      return `${h}
SELECT *
FROM ${plural(snake(nameWords(prompt, ['item']).slice(-1)))}
ORDER BY ${ks ?? 'created_at'} ${desc ? 'DESC' : 'ASC'};
`;
    default:
      return null;
  }
};

type Algorithm = 'fibonacci' | 'factorial' | 'prime' | 'palindrome' | 'reverse';

const detectAlgorithm = (prompt: string): Algorithm | null => {
  const p = prompt.toLowerCase();
  if (/fibonacci/.test(p)) return 'fibonacci';
  if (/factorial/.test(p)) return 'factorial';
  if (/\bprimes?\b/.test(p)) return 'prime';
  if (/palindrome/.test(p)) return 'palindrome';
  if (/\breverse\b.*\b(string|text|word)\b|\b(string|text|word)\b.*\breverse\b/.test(p)) return 'reverse';
  return null;
};

const ALGORITHMS: Record<Algorithm, Partial<Record<LanguageId, string>>> = {
  fibonacci: {
    javascript: `/** Returns the first n Fibonacci numbers (iterative, O(n)). */\nexport function fibonacci(n) {\n  if (!Number.isInteger(n) || n < 0) throw new RangeError('n must be a non-negative integer');\n  const seq = [];\n  let a = 0, b = 1;\n  for (let i = 0; i < n; i++) {\n    seq.push(a);\n    [a, b] = [b, a + b];\n  }\n  return seq;\n}\n\nconsole.log(fibonacci(10)); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]\n`,
    typescript: `/** Returns the first n Fibonacci numbers (iterative, O(n)). */\nexport function fibonacci(n: number): number[] {\n  if (!Number.isInteger(n) || n < 0) throw new RangeError('n must be a non-negative integer');\n  const seq: number[] = [];\n  let a = 0;\n  let b = 1;\n  for (let i = 0; i < n; i++) {\n    seq.push(a);\n    [a, b] = [b, a + b];\n  }\n  return seq;\n}\n\nconsole.log(fibonacci(10));\n`,
    python: `def fibonacci(n: int) -> list[int]:\n    """Return the first n Fibonacci numbers."""\n    if n < 0:\n        raise ValueError("n must be non-negative")\n    seq, a, b = [], 0, 1\n    for _ in range(n):\n        seq.append(a)\n        a, b = b, a + b\n    return seq\n\n\nif __name__ == "__main__":\n    print(fibonacci(10))\n`,
    java: `import java.util.ArrayList;\nimport java.util.List;\n\npublic class Fibonacci {\n    public static List<Long> fibonacci(int n) {\n        if (n < 0) throw new IllegalArgumentException("n must be non-negative");\n        List<Long> seq = new ArrayList<>();\n        long a = 0, b = 1;\n        for (int i = 0; i < n; i++) {\n            seq.add(a);\n            long next = a + b;\n            a = b;\n            b = next;\n        }\n        return seq;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(fibonacci(10));\n    }\n}\n`,
    go: `package main\n\nimport "fmt"\n\nfunc fibonacci(n int) []int {\n\tseq := make([]int, 0, n)\n\ta, b := 0, 1\n\tfor i := 0; i < n; i++ {\n\t\tseq = append(seq, a)\n\t\ta, b = b, a+b\n\t}\n\treturn seq\n}\n\nfunc main() {\n\tfmt.Println(fibonacci(10))\n}\n`,
    csharp: `using System;\nusing System.Collections.Generic;\n\npublic static class Fib\n{\n    public static List<long> Fibonacci(int n)\n    {\n        if (n < 0) throw new ArgumentOutOfRangeException(nameof(n));\n        var seq = new List<long>(n);\n        long a = 0, b = 1;\n        for (var i = 0; i < n; i++)\n        {\n            seq.Add(a);\n            (a, b) = (b, a + b);\n        }\n        return seq;\n    }\n\n    public static void Main() => Console.WriteLine(string.Join(", ", Fibonacci(10)));\n}\n`,
    cpp: `#include <iostream>\n#include <vector>\n\nstd::vector<long long> fibonacci(int n) {\n    std::vector<long long> seq;\n    long long a = 0, b = 1;\n    for (int i = 0; i < n; ++i) {\n        seq.push_back(a);\n        long long next = a + b;\n        a = b;\n        b = next;\n    }\n    return seq;\n}\n\nint main() {\n    for (auto v : fibonacci(10)) std::cout << v << ' ';\n    std::cout << std::endl;\n}\n`,
    rust: `fn fibonacci(n: usize) -> Vec<u64> {\n    let mut seq = Vec::with_capacity(n);\n    let (mut a, mut b) = (0u64, 1u64);\n    for _ in 0..n {\n        seq.push(a);\n        let next = a + b;\n        a = b;\n        b = next;\n    }\n    seq\n}\n\nfn main() {\n    println!("{:?}", fibonacci(10));\n}\n`,
  },
  factorial: {
    javascript: `/** n! using BigInt so large values stay exact. */\nexport function factorial(n) {\n  if (!Number.isInteger(n) || n < 0) throw new RangeError('n must be a non-negative integer');\n  let result = 1n;\n  for (let i = 2n; i <= BigInt(n); i++) result *= i;\n  return result;\n}\n\nconsole.log(factorial(20).toString()); // 2432902008176640000\n`,
    typescript: `/** n! using BigInt so large values stay exact. */\nexport function factorial(n: number): bigint {\n  if (!Number.isInteger(n) || n < 0) throw new RangeError('n must be a non-negative integer');\n  let result = 1n;\n  for (let i = 2n; i <= BigInt(n); i++) result *= i;\n  return result;\n}\n\nconsole.log(factorial(20).toString());\n`,
    python: `def factorial(n: int) -> int:\n    """Return n! (Python ints never overflow)."""\n    if n < 0:\n        raise ValueError("n must be non-negative")\n    result = 1\n    for i in range(2, n + 1):\n        result *= i\n    return result\n\n\nif __name__ == "__main__":\n    print(factorial(20))\n`,
    java: `import java.math.BigInteger;\n\npublic class Factorial {\n    public static BigInteger factorial(int n) {\n        if (n < 0) throw new IllegalArgumentException("n must be non-negative");\n        BigInteger result = BigInteger.ONE;\n        for (int i = 2; i <= n; i++) result = result.multiply(BigInteger.valueOf(i));\n        return result;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(factorial(20));\n    }\n}\n`,
    go: `package main\n\nimport (\n\t"fmt"\n\t"math/big"\n)\n\nfunc factorial(n int64) *big.Int {\n\treturn new(big.Int).MulRange(1, n)\n}\n\nfunc main() {\n\tfmt.Println(factorial(20))\n}\n`,
    csharp: `using System;\nusing System.Numerics;\n\npublic static class MathUtil\n{\n    public static BigInteger Factorial(int n)\n    {\n        if (n < 0) throw new ArgumentOutOfRangeException(nameof(n));\n        BigInteger result = 1;\n        for (var i = 2; i <= n; i++) result *= i;\n        return result;\n    }\n\n    public static void Main() => Console.WriteLine(Factorial(20));\n}\n`,
    cpp: `#include <iostream>\n#include <stdexcept>\n\nunsigned long long factorial(int n) {\n    if (n < 0) throw std::invalid_argument("n must be non-negative");\n    if (n > 20) throw std::overflow_error("n > 20 overflows 64-bit integers");\n    unsigned long long result = 1;\n    for (int i = 2; i <= n; ++i) result *= i;\n    return result;\n}\n\nint main() {\n    std::cout << factorial(20) << std::endl;\n}\n`,
    rust: `fn factorial(n: u64) -> Option<u64> {\n    (1..=n).try_fold(1u64, |acc, x| acc.checked_mul(x))\n}\n\nfn main() {\n    println!("{:?}", factorial(20));\n}\n`,
  },
  prime: {
    javascript: `/** Primality test by trial division up to sqrt(n). */\nexport function isPrime(n) {\n  if (!Number.isInteger(n) || n < 2) return false;\n  if (n % 2 === 0) return n === 2;\n  for (let i = 3; i * i <= n; i += 2) {\n    if (n % i === 0) return false;\n  }\n  return true;\n}\n\n/** All primes up to limit (Sieve of Eratosthenes). */\nexport function primesUpTo(limit) {\n  const sieve = new Uint8Array(limit + 1).fill(1);\n  sieve[0] = sieve[1] = 0;\n  for (let i = 2; i * i <= limit; i++) {\n    if (sieve[i]) for (let j = i * i; j <= limit; j += i) sieve[j] = 0;\n  }\n  return [...sieve.keys()].filter((i) => sieve[i]);\n}\n\nconsole.log(isPrime(97), primesUpTo(30));\n`,
    typescript: `export function isPrime(n: number): boolean {\n  if (!Number.isInteger(n) || n < 2) return false;\n  if (n % 2 === 0) return n === 2;\n  for (let i = 3; i * i <= n; i += 2) {\n    if (n % i === 0) return false;\n  }\n  return true;\n}\n\nexport function primesUpTo(limit: number): number[] {\n  const sieve = new Uint8Array(limit + 1).fill(1);\n  sieve[0] = 0;\n  sieve[1] = 0;\n  for (let i = 2; i * i <= limit; i++) {\n    if (sieve[i]) for (let j = i * i; j <= limit; j += i) sieve[j] = 0;\n  }\n  return Array.from(sieve.keys()).filter((i) => sieve[i] === 1);\n}\n\nconsole.log(isPrime(97), primesUpTo(30));\n`,
    python: `import math\n\n\ndef is_prime(n: int) -> bool:\n    if n < 2:\n        return False\n    if n % 2 == 0:\n        return n == 2\n    for i in range(3, math.isqrt(n) + 1, 2):\n        if n % i == 0:\n            return False\n    return True\n\n\ndef primes_up_to(limit: int) -> list[int]:\n    sieve = [True] * (limit + 1)\n    sieve[0:2] = [False, False]\n    for i in range(2, math.isqrt(limit) + 1):\n        if sieve[i]:\n            sieve[i * i :: i] = [False] * len(sieve[i * i :: i])\n    return [i for i, is_p in enumerate(sieve) if is_p]\n\n\nif __name__ == "__main__":\n    print(is_prime(97), primes_up_to(30))\n`,
    java: `public class Primes {\n    public static boolean isPrime(long n) {\n        if (n < 2) return false;\n        if (n % 2 == 0) return n == 2;\n        for (long i = 3; i * i <= n; i += 2) {\n            if (n % i == 0) return false;\n        }\n        return true;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(isPrime(97));\n    }\n}\n`,
    go: `package main\n\nimport "fmt"\n\nfunc isPrime(n int) bool {\n\tif n < 2 {\n\t\treturn false\n\t}\n\tif n%2 == 0 {\n\t\treturn n == 2\n\t}\n\tfor i := 3; i*i <= n; i += 2 {\n\t\tif n%i == 0 {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}\n\nfunc main() {\n\tfmt.Println(isPrime(97))\n}\n`,
    csharp: `using System;\n\npublic static class Primes\n{\n    public static bool IsPrime(long n)\n    {\n        if (n < 2) return false;\n        if (n % 2 == 0) return n == 2;\n        for (long i = 3; i * i <= n; i += 2)\n            if (n % i == 0) return false;\n        return true;\n    }\n\n    public static void Main() => Console.WriteLine(IsPrime(97));\n}\n`,
    cpp: `#include <iostream>\n\nbool isPrime(long long n) {\n    if (n < 2) return false;\n    if (n % 2 == 0) return n == 2;\n    for (long long i = 3; i * i <= n; i += 2)\n        if (n % i == 0) return false;\n    return true;\n}\n\nint main() {\n    std::cout << std::boolalpha << isPrime(97) << std::endl;\n}\n`,
    rust: `fn is_prime(n: u64) -> bool {\n    if n < 2 {\n        return false;\n    }\n    if n % 2 == 0 {\n        return n == 2;\n    }\n    let mut i = 3;\n    while i * i <= n {\n        if n % i == 0 {\n            return false;\n        }\n        i += 2;\n    }\n    true\n}\n\nfn main() {\n    println!("{}", is_prime(97));\n}\n`,
  },
  palindrome: {
    javascript: `/** True when text reads the same backwards, ignoring case, spaces and punctuation. */\nexport function isPalindrome(text) {\n  const clean = String(text).toLowerCase().replace(/[^a-z0-9]/g, '');\n  return clean === [...clean].reverse().join('');\n}\n\nconsole.log(isPalindrome('A man, a plan, a canal: Panama')); // true\n`,
    typescript: `export function isPalindrome(text: string): boolean {\n  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return clean === [...clean].reverse().join('');\n}\n\nconsole.log(isPalindrome('A man, a plan, a canal: Panama'));\n`,
    python: `import re\n\n\ndef is_palindrome(text: str) -> bool:\n    clean = re.sub(r"[^a-z0-9]", "", text.lower())\n    return clean == clean[::-1]\n\n\nif __name__ == "__main__":\n    print(is_palindrome("A man, a plan, a canal: Panama"))\n`,
    java: `public class Palindrome {\n    public static boolean isPalindrome(String text) {\n        String clean = text.toLowerCase().replaceAll("[^a-z0-9]", "");\n        return new StringBuilder(clean).reverse().toString().equals(clean);\n    }\n\n    public static void main(String[] args) {\n        System.out.println(isPalindrome("A man, a plan, a canal: Panama"));\n    }\n}\n`,
    go: `package main\n\nimport (\n\t"fmt"\n\t"strings"\n\t"unicode"\n)\n\nfunc isPalindrome(text string) bool {\n\tvar r []rune\n\tfor _, c := range strings.ToLower(text) {\n\t\tif unicode.IsLetter(c) || unicode.IsDigit(c) {\n\t\t\tr = append(r, c)\n\t\t}\n\t}\n\tfor i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {\n\t\tif r[i] != r[j] {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}\n\nfunc main() {\n\tfmt.Println(isPalindrome("A man, a plan, a canal: Panama"))\n}\n`,
    csharp: `using System;\nusing System.Linq;\n\npublic static class Text\n{\n    public static bool IsPalindrome(string text)\n    {\n        var clean = new string(text.ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());\n        return clean.SequenceEqual(clean.Reverse());\n    }\n\n    public static void Main() => Console.WriteLine(IsPalindrome("A man, a plan, a canal: Panama"));\n}\n`,
    cpp: `#include <algorithm>\n#include <cctype>\n#include <iostream>\n#include <string>\n\nbool isPalindrome(const std::string& text) {\n    std::string clean;\n    for (unsigned char c : text)\n        if (std::isalnum(c)) clean += static_cast<char>(std::tolower(c));\n    return std::equal(clean.begin(), clean.begin() + clean.size() / 2, clean.rbegin());\n}\n\nint main() {\n    std::cout << std::boolalpha << isPalindrome("A man, a plan, a canal: Panama") << std::endl;\n}\n`,
    rust: `fn is_palindrome(text: &str) -> bool {\n    let clean: Vec<char> = text.chars().filter(|c| c.is_alphanumeric()).flat_map(|c| c.to_lowercase()).collect();\n    clean.iter().eq(clean.iter().rev())\n}\n\nfn main() {\n    println!("{}", is_palindrome("A man, a plan, a canal: Panama"));\n}\n`,
  },
  reverse: {
    javascript: `/** Reverses a string safely for emoji and other multi-byte characters. */\nexport function reverseString(text) {\n  return Array.from(String(text)).reverse().join('');\n}\n\nconsole.log(reverseString('hello 👋'));\n`,
    typescript: `export function reverseString(text: string): string {\n  return Array.from(text).reverse().join('');\n}\n\nconsole.log(reverseString('hello 👋'));\n`,
    python: `def reverse_string(text: str) -> str:\n    return text[::-1]\n\n\nif __name__ == "__main__":\n    print(reverse_string("hello"))\n`,
    java: `public class Reverse {\n    public static String reverse(String text) {\n        return new StringBuilder(text).reverse().toString();\n    }\n\n    public static void main(String[] args) {\n        System.out.println(reverse("hello"));\n    }\n}\n`,
    go: `package main\n\nimport "fmt"\n\nfunc reverseString(s string) string {\n\tr := []rune(s)\n\tfor i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {\n\t\tr[i], r[j] = r[j], r[i]\n\t}\n\treturn string(r)\n}\n\nfunc main() {\n\tfmt.Println(reverseString("hello"))\n}\n`,
    csharp: `using System;\n\npublic static class Text\n{\n    public static string Reverse(string text)\n    {\n        var chars = text.ToCharArray();\n        Array.Reverse(chars);\n        return new string(chars);\n    }\n\n    public static void Main() => Console.WriteLine(Reverse("hello"));\n}\n`,
    cpp: `#include <algorithm>\n#include <iostream>\n#include <string>\n\nstd::string reverseString(std::string text) {\n    std::reverse(text.begin(), text.end());\n    return text;\n}\n\nint main() {\n    std::cout << reverseString("hello") << std::endl;\n}\n`,
    rust: `fn reverse_string(text: &str) -> String {\n    text.chars().rev().collect()\n}\n\nfn main() {\n    println!("{}", reverse_string("hello"));\n}\n`,
  },
};

const reactComponent = (lang: 'javascript' | 'typescript', prompt: string): string => {
  const ts = lang === 'typescript';
  const p = prompt.toLowerCase();
  const w = nameWords(prompt, ['my', 'widget']);
  const Name = pascal(w);
  const h = header(lang, prompt);

  if (/\b(form|login|sign ?in|sign ?up|register|auth\w*|contact)\b/.test(p)) {
    return `${h}
import { useState${ts ? ', FormEvent' : ''} } from 'react';
${ts ? `\ninterface ${Name}Props {\n  onSubmit: (values: { email: string; password: string }) => Promise<void> | void;\n}\n` : ''}
export default function ${Name}({ onSubmit }${ts ? `: ${Name}Props` : ''}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event${ts ? ': FormEvent<HTMLFormElement>' : ''}) => {
    event.preventDefault();
    setError('');
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return setError('Enter a valid email address');
    if (password.length < 8) return setError('Password must be at least 8 characters');

    setSubmitting(true);
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />

      <label htmlFor="password">Password</label>
      <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />

      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
`;
  }

  if (/\b(list|todo|to-do|tasks?|items?)\b/.test(p)) {
    return `${h}
import { useState } from 'react';
${ts ? '\ninterface Item {\n  id: number;\n  text: string;\n  done: boolean;\n}\n' : ''}
export default function ${Name}() {
  const [items, setItems] = useState${ts ? '<Item[]>' : ''}([]);
  const [text, setText] = useState('');

  const addItem = () => {
    const value = text.trim();
    if (!value) return;
    setItems((prev) => [...prev, { id: Date.now(), text: value, done: false }]);
    setText('');
  };

  const toggle = (id${ts ? ': number' : ''}) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));

  const remove = (id${ts ? ': number' : ''}) => setItems((prev) => prev.filter((item) => item.id !== id));

  return (
    <section>
      <label htmlFor="new-item">New item</label>
      <input id="new-item" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} />
      <button type="button" onClick={addItem}>Add</button>

      {items.length === 0 ? (
        <p>Nothing here yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <label>
                <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} />
                {item.done ? <s>{item.text}</s> : item.text}
              </label>
              <button type="button" onClick={() => remove(item.id)} aria-label={\`Remove \${item.text}\`}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
`;
  }

  if (/\b(fetch|api|load|data)\b/.test(p)) {
    return `${h}
import { useEffect, useState } from 'react';

export default function ${Name}({ url }${ts ? ': { url: string }' : ''}) {
  const [data, setData] = useState${ts ? '<unknown>' : ''}(null);
  const [error, setError] = useState${ts ? '<string | null>' : ''}(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [url]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p role="alert">Error: {error}</p>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
`;
  }

  return `${h}
import { useState } from 'react';
${ts ? `\ninterface ${Name}Props {\n  title?: string;\n  initialCount?: number;\n}\n` : ''}
export default function ${Name}({ title = '${w.map(cap).join(' ')}', initialCount = 0 }${ts ? `: ${Name}Props` : ''}) {
  const [count, setCount] = useState(initialCount);

  return (
    <section>
      <h2>{title}</h2>
      <p aria-live="polite">Count: {count}</p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>Increment</button>
      <button type="button" onClick={() => setCount(initialCount)}>Reset</button>
    </section>
  );
}
`;
};

const debounceTemplate = (lang: LanguageId, prompt: string): string | null => {
  const h = header(lang, prompt);
  const throttle = /throttle/i.test(prompt);
  if (lang === 'javascript' || lang === 'typescript') {
    const ts = lang === 'typescript';
    return throttle
      ? `${h}
/** Calls fn at most once every waitMs milliseconds. */
export function throttle${ts ? '<A extends unknown[]>(fn: (...args: A) => void, waitMs: number)' : '(fn, waitMs)'} {
  let last = 0;
  return (...args${ts ? ': A' : ''}) => {
    const now = Date.now();
    if (now - last >= waitMs) {
      last = now;
      fn(...args);
    }
  };
}

window.addEventListener('scroll', throttle(() => console.log('scrolled'), 200));
`
      : `${h}
/** Delays calling fn until waitMs have passed without another call. */
export function debounce${ts ? '<A extends unknown[]>(fn: (...args: A) => void, waitMs: number)' : '(fn, waitMs)'} {
  let timer${ts ? ': ReturnType<typeof setTimeout> | undefined' : ''};
  const debounced = (...args${ts ? ': A' : ''}) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

const onSearch = debounce((query${ts ? ': string' : ''}) => console.log('search for', query), 300);
onSearch('a');
onSearch('ab'); // only this call runs, 300ms later
`;
  }
  if (lang === 'python') {
    return `${h}
import threading
from functools import wraps


def debounce(wait_seconds: float):
    """Decorator: run the function only after wait_seconds without another call."""
    def decorator(fn):
        timer = None
        lock = threading.Lock()

        @wraps(fn)
        def debounced(*args, **kwargs):
            nonlocal timer
            with lock:
                if timer is not None:
                    timer.cancel()
                timer = threading.Timer(wait_seconds, fn, args, kwargs)
                timer.start()

        return debounced
    return decorator


@debounce(0.3)
def on_search(query: str) -> None:
    print("search for", query)
`;
  }
  return null;
};

const dbQueryTemplate = (lang: LanguageId, prompt: string): string | null => {
  const w = nameWords(prompt, ['user']);
  const table = plural(snake([singular(w[w.length - 1])]));
  const h = header(lang, prompt);
  switch (lang) {
    case 'javascript':
    case 'typescript': {
      const ts = lang === 'typescript';
      return `${h}
// npm install pg
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

/** Parameterised query - never concatenate user input into SQL. */
export async function find${pascal([singular(table)])}ById(id${ts ? ': number' : ''}) {
  const { rows } = await pool.query('SELECT * FROM ${table} WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function search${pascal([table])}(term${ts ? ': string' : ''}, limit = 20) {
  const { rows } = await pool.query(
    'SELECT * FROM ${table} WHERE name ILIKE $1 ORDER BY name LIMIT $2',
    [\`%\${term}%\`, limit]
  );
  return rows;
}
`;
    }
    case 'python':
      return `${h}
import sqlite3
from contextlib import closing


def find_${singular(table)}_by_id(db_path: str, item_id: int) -> dict | None:
    """Parameterised query - never format user input into SQL strings."""
    with closing(sqlite3.connect(db_path)) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM ${table} WHERE id = ?", (item_id,)).fetchone()
        return dict(row) if row else None


def search_${table}(db_path: str, term: str, limit: int = 20) -> list[dict]:
    with closing(sqlite3.connect(db_path)) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM ${table} WHERE name LIKE ? ORDER BY name LIMIT ?",
            (f"%{term}%", limit),
        ).fetchall()
        return [dict(r) for r in rows]
`;
    case 'java':
      return `${h}
import java.sql.*;
import java.util.Optional;

public class ${pascal([singular(table)])}Repository {
    private final Connection connection;

    public ${pascal([singular(table)])}Repository(Connection connection) {
        this.connection = connection;
    }

    /** Uses a PreparedStatement so input is never concatenated into SQL. */
    public Optional<String> findNameById(long id) throws SQLException {
        String sql = "SELECT name FROM ${table} WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() ? Optional.of(rs.getString("name")) : Optional.empty();
            }
        }
    }
}
`;
    case 'go':
      return `${h}
package store

import (
	"context"
	"database/sql"
)

type ${pascal([singular(table)])} struct {
	ID   int64
	Name string
}

// Find${pascal([singular(table)])}ByID uses a placeholder so input is never concatenated into SQL.
func Find${pascal([singular(table)])}ByID(ctx context.Context, db *sql.DB, id int64) (*${pascal([singular(table)])}, error) {
	var v ${pascal([singular(table)])}
	err := db.QueryRowContext(ctx, "SELECT id, name FROM ${table} WHERE id = $1", id).Scan(&v.ID, &v.Name)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &v, nil
}
`;
    case 'php':
      return `<?php
${h}

declare(strict_types=1);

function find${pascal([singular(table)])}ById(PDO $pdo, int $id): ?array
{
    // Prepared statement: input is bound, never concatenated.
    $stmt = $pdo->prepare('SELECT * FROM ${table} WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row === false ? null : $row;
}
`;
    default:
      return null;
  }
};

const sqlQuery = (prompt: string): string => {
  const p = prompt.toLowerCase();
  const w = nameWords(prompt, ['user']);
  const entity = singular(w[w.length - 1]);
  const table = plural(snake([entity]));
  const h = header('sql', prompt);

  if (/\b(create|table|schema|model)\b/.test(p) && !/\bselect\b/.test(p)) {
    return classTemplate('sql', prompt) ?? h;
  }
  if (/\b(count|total|sum|average|avg|group|per|statistics|report)\b/.test(p)) {
    return `${h}
SELECT
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS total_${table}
FROM ${table}
GROUP BY month
ORDER BY month DESC;
`;
  }
  if (/\bjoin\b|\bwith their\b|\band their\b/.test(p)) {
    return `${h}
SELECT
    u.id,
    u.name,
    COUNT(o.id) AS order_count
FROM ${table} AS u
LEFT JOIN orders AS o ON o.${entity}_id = u.id
GROUP BY u.id, u.name
ORDER BY order_count DESC;
`;
  }
  if (/\b(insert|add)\b/.test(p)) {
    return `${h}
INSERT INTO ${table} (name, created_at)
VALUES ('Example', CURRENT_TIMESTAMP)
RETURNING id;
`;
  }
  if (/\bupdate\b/.test(p)) {
    return `${h}
-- Always include a WHERE clause on UPDATE.
UPDATE ${table}
SET name = 'New name'
WHERE id = 1;
`;
  }
  if (/\b(delete|remove)\b/.test(p)) {
    return `${h}
-- Always include a WHERE clause on DELETE. Run the SELECT first to check what will be removed.
SELECT * FROM ${table} WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

DELETE FROM ${table}
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
`;
  }
  return `${h}
SELECT id, name, created_at
FROM ${table}
WHERE name ILIKE '%' || :search || '%'
ORDER BY created_at DESC
LIMIT 20;

-- Speeds up the lookup above
CREATE INDEX IF NOT EXISTS idx_${table}_created_at ON ${table} (created_at);
`;
};

const cssLayout = (prompt: string): string => {
  const p = prompt.toLowerCase();
  const h = header('css', prompt);
  if (/\b(center|centre)\b/.test(p)) {
    return `${h}
/* Center anything horizontally and vertically */
.center {
  display: grid;
  place-items: center;
  min-height: 100vh;
}
`;
  }
  if (/\b(nav|navbar|navigation|menu|header)\b/.test(p)) {
    return `${h}
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #1f2937;
  color: #fff;
}

.navbar__links {
  display: flex;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.navbar__links a {
  color: inherit;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
}

.navbar__links a:hover,
.navbar__links a:focus-visible {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 640px) {
  .navbar {
    flex-direction: column;
    align-items: stretch;
  }
  .navbar__links {
    flex-direction: column;
  }
}
`;
  }
  return `${h}
/* Responsive card grid: 1 column on phones, as many 16rem columns as fit on wider screens */
.layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 72rem;
  margin: 0 auto;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  .card {
    background: #1f2937;
    color: #f9fafb;
  }
}
`;
};

const htmlPage = (prompt: string): string => {
  const title = nameWords(prompt, ['my', 'page']).map(cap).join(' ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; line-height: 1.6; }
    header, main, footer { padding: 1rem; max-width: 60rem; margin: 0 auto; }
  </style>
</head>
<body>
  ${header('html', prompt)}
  <header>
    <h1>${title}</h1>
    <nav aria-label="Main">
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <main>
    <section id="about">
      <h2>About</h2>
      <p>Describe your page content here.</p>
    </section>
    <section id="contact">
      <h2>Contact</h2>
      <p><a href="mailto:hello@example.com">hello@example.com</a></p>
    </section>
  </main>

  <footer>
    <small>&copy; ${new Date().getFullYear()} ${title}</small>
  </footer>
</body>
</html>
`;
};

const htmlForm = (prompt: string, fields: Field[]): string => {
  const inputType = (f: Field) => {
    const n = camel(f.words).toLowerCase();
    if (n.includes('email')) return 'email';
    if (n.includes('password')) return 'password';
    if (n.includes('phone')) return 'tel';
    if (f.kind === 'int' || f.kind === 'float') return 'number';
    if (f.kind === 'date') return 'date';
    if (f.kind === 'boolean') return 'checkbox';
    return 'text';
  };
  return `${header('html', prompt)}
<form action="#" method="post" novalidate>
${fields
  .map((f) => {
    const id = snake(f.words).replace(/_/g, '-');
    const label = f.words.map(cap).join(' ');
    const type = inputType(f);
    return type === 'checkbox'
      ? `  <div>\n    <input id="${id}" name="${id}" type="checkbox" />\n    <label for="${id}">${label}</label>\n  </div>`
      : `  <div>\n    <label for="${id}">${label}</label>\n    <input id="${id}" name="${id}" type="${type}" required />\n  </div>`;
  })
  .join('\n')}
  <button type="submit">Submit</button>
</form>
`;
};

const bashScript = (prompt: string): string => {
  const p = prompt.toLowerCase();
  const h = header('bash', prompt);
  if (/\bbackup\b/.test(p)) {
    return `#!/usr/bin/env bash
${h}
set -euo pipefail

SOURCE_DIR="\${1:?Usage: $0 <source-dir> [backup-dir]}"
BACKUP_DIR="\${2:-$HOME/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$BACKUP_DIR/$(basename "$SOURCE_DIR")-$STAMP.tar.gz"

mkdir -p "$BACKUP_DIR"
tar -czf "$ARCHIVE" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")"
echo "Backup written to $ARCHIVE"

# Keep only the 7 most recent backups
ls -1t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm --
`;
  }
  if (/\b(delete|clean|old|remove)\b/.test(p)) {
    return `#!/usr/bin/env bash
${h}
set -euo pipefail

TARGET_DIR="\${1:?Usage: $0 <dir> [days]}"
DAYS="\${2:-30}"

echo "Files older than $DAYS days in $TARGET_DIR:"
find "$TARGET_DIR" -type f -mtime +"$DAYS" -print

read -r -p "Delete them? [y/N] " answer
if [[ "$answer" =~ ^[Yy]$ ]]; then
  find "$TARGET_DIR" -type f -mtime +"$DAYS" -delete
  echo "Done."
fi
`;
  }
  if (/\brename\b/.test(p)) {
    return `#!/usr/bin/env bash
${h}
set -euo pipefail

DIR="\${1:-.}"
PREFIX="\${2:-file}"
i=1
for f in "$DIR"/*; do
  [[ -f "$f" ]] || continue
  ext="\${f##*.}"
  new="$DIR/$PREFIX-$(printf '%03d' "$i").$ext"
  mv -n -- "$f" "$new"
  echo "$f -> $new"
  i=$((i + 1))
done
`;
  }
  const fn = snake(nameWords(prompt, ['main']));
  return `#!/usr/bin/env bash
${h}
set -euo pipefail

usage() {
  echo "Usage: $0 <input>" >&2
  exit 1
}

${fn}() {
  local input="$1"
  # TODO: implement the script logic.
  echo "Processing: $input"
}

[[ $# -ge 1 ]] || usage
${fn} "$1"
`;
};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export const generateCode = (rawPrompt: string, lang: LanguageId): GeneratedCode => {
  const prompt = rawPrompt.trim().slice(0, PROMPT_MAX_LENGTH);
  const p = prompt.toLowerCase();
  const label = languageLabel(lang);
  const fallbackNote = (what: string) =>
    `There is no built-in ${what} template for ${label}, so this is a ${label} starter scaffold named after your request - fill in the TODO.`;

  // Language-specific generators first.
  if (lang === 'sql') return { code: sqlQuery(prompt), language: 'sql', title: 'SQL query' };
  if (lang === 'css') return { code: cssLayout(prompt), language: 'css', title: 'CSS layout' };
  if (lang === 'bash' && !/\b(api|http|fetch|curl|request)\b/.test(p)) {
    return { code: bashScript(prompt), language: 'bash', title: 'Bash script' };
  }

  if (/\breact\b|\bjsx\b|\btsx\b|\bcomponent\b/.test(p)) {
    if (lang === 'javascript' || lang === 'typescript') {
      return { code: reactComponent(lang, prompt), language: lang, title: 'React component' };
    }
    return {
      code: reactComponent('typescript', prompt),
      language: 'typescript',
      title: 'React component',
      note: `React components are written in JavaScript/TypeScript, so this was generated in TypeScript instead of ${label}.`,
    };
  }

  const algo = detectAlgorithm(p);
  if (algo) {
    const code = ALGORITHMS[algo][lang];
    if (code) return { code: `${header(lang, prompt)}\n${code}`, language: lang, title: `${cap(algo)} (${label})` };
    return { code: scaffold(lang, prompt), language: lang, title: 'Starter scaffold', note: fallbackNote(algo) };
  }

  const intents: { test: RegExp; title: string; build: (l: LanguageId, pr: string) => string | null }[] = [
    { test: /\b(debounce|throttle)\b/, title: 'Debounce / throttle', build: debounceTemplate },
    { test: /\b(endpoint|express|server|route|routes|flask|backend|rest api|crud api)\b/, title: 'API endpoint', build: serverTemplate },
    { test: /\b(database|sql|query|repository|db)\b/, title: 'Database query', build: dbQueryTemplate },
    { test: /\b(api|fetch|http|request|get data|download data|call)\b/, title: 'HTTP request', build: httpClientTemplate },
    { test: /\b(validat\w*|form|email check|password check)\b/, title: 'Form validation', build: validationTemplate },
    { test: /\bsort\w*\b|\border by\b/, title: 'Sorting', build: sortTemplate },
    { test: /\b(class|object|model|entity|struct|record|dataclass)\b/, title: 'Class / model', build: classTemplate },
  ];

  for (const intent of intents) {
    if (intent.test.test(p)) {
      const code = intent.build(lang, prompt);
      if (code) return { code, language: lang, title: `${intent.title} (${label})` };
      return { code: scaffold(lang, prompt), language: lang, title: 'Starter scaffold', note: fallbackNote(intent.title.toLowerCase()) };
    }
  }

  if (lang === 'html') return { code: htmlPage(prompt), language: 'html', title: 'HTML page' };

  return {
    code: scaffold(lang, prompt),
    language: lang,
    title: `Function scaffold (${label})`,
    note: 'No specific pattern (API call, class, validation, sorting, SQL, React…) was recognised, so this is a typed starter scaffold named after your request. Add more detail to get a fuller implementation.',
  };
};

export interface CodeTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

/** Templates are canned prompts run through the same generator, so they work in every language. */
export const CODE_TEMPLATES: CodeTemplate[] = [
  { id: 'http', title: 'API data fetching', description: 'HTTP GET with timeout and error handling', prompt: 'fetch users from an API' },
  { id: 'endpoint', title: 'REST endpoint', description: 'Create/list endpoints with validation', prompt: 'REST API endpoint for products' },
  { id: 'model', title: 'Data model', description: 'Class or struct with typed fields', prompt: 'Create a User class with name, email and age' },
  { id: 'validation', title: 'Form validation', description: 'Name, email and password rules', prompt: 'validate a signup form' },
  { id: 'sort', title: 'Sorting', description: 'Non-mutating sort helper', prompt: 'sort a list of numbers in descending order' },
  { id: 'db', title: 'Safe database query', description: 'Parameterised queries (no SQL injection)', prompt: 'database query to find a user by id' },
  { id: 'react', title: 'React component', description: 'Functional component with hooks', prompt: 'React todo list component' },
  { id: 'debounce', title: 'Debounce', description: 'Rate-limit expensive callbacks', prompt: 'debounce function for search input' },
];

export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  language: LanguageId;
  category: string;
  code: string;
}

export const CODE_SNIPPETS: CodeSnippet[] = [
  { id: 'js-state', title: 'React useState', description: 'State in a function component', language: 'javascript', category: 'React', code: `const [value, setValue] = useState(initialValue);\n\n// Functional update when the new value depends on the old one\nsetValue((prev) => prev + 1);` },
  { id: 'js-async', title: 'Async/await with error handling', description: 'Modern asynchronous JavaScript', language: 'javascript', category: 'JavaScript', code: `async function loadJson(url) {\n  const response = await fetch(url);\n  if (!response.ok) throw new Error(\`HTTP \${response.status}\`);\n  return response.json();\n}\n\ntry {\n  const data = await loadJson('/api/items');\n  console.log(data);\n} catch (error) {\n  console.error(error);\n}` },
  { id: 'js-array', title: 'Array methods', description: 'filter / map / reduce pipeline', language: 'javascript', category: 'JavaScript', code: `const total = orders\n  .filter((order) => order.paid)\n  .map((order) => order.amount)\n  .reduce((sum, amount) => sum + amount, 0);` },
  { id: 'ts-interface', title: 'Interface + type guard', description: 'Narrow unknown data safely', language: 'typescript', category: 'TypeScript', code: `interface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\nfunction isUser(value: unknown): value is User {\n  return (\n    typeof value === 'object' && value !== null &&\n    typeof (value as User).id === 'number' &&\n    typeof (value as User).name === 'string'\n  );\n}` },
  { id: 'ts-generic', title: 'Generic groupBy', description: 'Type-safe grouping helper', language: 'typescript', category: 'TypeScript', code: `function groupBy<T, K extends PropertyKey>(items: T[], key: (item: T) => K): Record<K, T[]> {\n  return items.reduce((acc, item) => {\n    (acc[key(item)] ||= []).push(item);\n    return acc;\n  }, {} as Record<K, T[]>);\n}` },
  { id: 'py-comprehension', title: 'List comprehension', description: 'Concise list building', language: 'python', category: 'Python', code: `squares_of_evens = [x ** 2 for x in range(10) if x % 2 == 0]\nword_lengths = {word: len(word) for word in ["apple", "kiwi"]}` },
  { id: 'py-context', title: 'Context manager', description: 'Guaranteed cleanup with "with"', language: 'python', category: 'Python', code: `from contextlib import contextmanager\nimport time\n\n\n@contextmanager\ndef timer(label: str):\n    start = time.perf_counter()\n    try:\n        yield\n    finally:\n        print(f"{label}: {time.perf_counter() - start:.3f}s")\n\n\nwith timer("work"):\n    sum(range(1_000_000))` },
  { id: 'java-stream', title: 'Streams', description: 'Filter and collect with streams', language: 'java', category: 'Java', code: `List<String> activeNames = users.stream()\n    .filter(User::isActive)\n    .map(User::getName)\n    .sorted()\n    .collect(Collectors.toList());` },
  { id: 'go-errors', title: 'Error wrapping', description: 'Idiomatic error handling', language: 'go', category: 'Go', code: `data, err := os.ReadFile(path)\nif err != nil {\n\treturn fmt.Errorf("reading %s: %w", path, err)\n}` },
  { id: 'rust-result', title: 'The ? operator', description: 'Propagate errors concisely', language: 'rust', category: 'Rust', code: `fn read_config(path: &str) -> Result<String, std::io::Error> {\n    let contents = std::fs::read_to_string(path)?;\n    Ok(contents.trim().to_string())\n}` },
  { id: 'sql-join', title: 'LEFT JOIN with count', description: 'Include rows with no matches', language: 'sql', category: 'SQL', code: `SELECT c.id, c.name, COUNT(o.id) AS orders\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id, c.name;` },
  { id: 'css-center', title: 'Center with grid', description: 'Two-line centering', language: 'css', category: 'CSS', code: `.center {\n  display: grid;\n  place-items: center;\n}` },
  { id: 'bash-strict', title: 'Strict mode header', description: 'Fail fast in shell scripts', language: 'bash', category: 'Bash', code: `#!/usr/bin/env bash\nset -euo pipefail\nIFS=$'\\n\\t'` },
  { id: 'html-a11y', title: 'Accessible image & button', description: 'alt text and labelled icon button', language: 'html', category: 'HTML', code: `<img src="chart.png" alt="Sales grew 20% from January to March" />\n<button type="button" aria-label="Close dialog">×</button>` },
];

export interface QuickAction {
  label: string;
  prompt: string;
  language: LanguageId;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'React Component', prompt: 'Create a React component with state', language: 'typescript' },
  { label: 'Python Function', prompt: 'Write a Python function to check if a number is prime', language: 'python' },
  { label: 'API Endpoint', prompt: 'Generate a REST API endpoint with Express.js for tasks', language: 'javascript' },
  { label: 'SQL Query', prompt: 'Monthly count of orders', language: 'sql' },
  { label: 'CSS Layout', prompt: 'Build a responsive card grid layout', language: 'css' },
];

/** Triggers a browser download for generated or optimised code. */
export const downloadCodeFile = (code: string, lang: LanguageId, baseName: string): void => {
  const safe = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'code';
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safe}.${languageExtension(lang)}`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
