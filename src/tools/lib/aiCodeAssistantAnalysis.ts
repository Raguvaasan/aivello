/**
 * Static heuristics for the AI Code Assistant's "Analyze" and "Optimize" tabs.
 *
 * Everything runs locally on the pasted code. Strings and comments are masked out
 * (replaced by spaces, keeping offsets and line numbers intact) before pattern checks
 * so that, for example, the word "var" inside a string is not reported.
 */
import { LanguageId } from './aiCodeAssistant';

type Family = 'c' | 'python' | 'ruby' | 'shell' | 'sql' | 'html' | 'css';

const C_FAMILY: LanguageId[] = ['javascript', 'typescript', 'java', 'cpp', 'csharp', 'go', 'rust', 'php', 'swift', 'kotlin', 'dart'];

export const familyOf = (lang: LanguageId): Family => {
  if (C_FAMILY.includes(lang)) return 'c';
  if (lang === 'python') return 'python';
  if (lang === 'ruby') return 'ruby';
  if (lang === 'bash') return 'shell';
  if (lang === 'sql') return 'sql';
  if (lang === 'html') return 'html';
  return 'css';
};

const blank = (s: string) => s.replace(/[^\n]/g, ' ');

/**
 * Returns `code` with string literals and comments replaced by spaces.
 * Newlines are kept, so indices and line numbers match the original.
 */
export const maskCode = (code: string, lang: LanguageId): string => {
  const family = familyOf(lang);
  let out = '';
  let i = 0;
  const n = code.length;

  const takeUntil = (end: string, from: number, escapes: boolean): number => {
    let j = from;
    while (j < n) {
      if (escapes && code[j] === '\\') {
        j += 2;
        continue;
      }
      if (code.startsWith(end, j)) return j + end.length;
      j += 1;
    }
    return n;
  };

  const lineEnd = (from: number) => {
    const j = code.indexOf('\n', from);
    return j === -1 ? n : j;
  };

  while (i < n) {
    const ch = code[i];
    const next = code[i + 1];
    let end = -1;

    if (family === 'html') {
      if (code.startsWith('<!--', i)) end = takeUntil('-->', i + 4, false);
    } else if (family === 'css') {
      if (ch === '/' && next === '*') end = takeUntil('*/', i + 2, false);
      else if (ch === '"' || ch === "'") end = takeUntil(ch, i + 1, true);
    } else if (family === 'sql') {
      if (ch === '-' && next === '-') end = lineEnd(i);
      else if (ch === '/' && next === '*') end = takeUntil('*/', i + 2, false);
      else if (ch === "'" || ch === '"') end = takeUntil(ch, i + 1, false);
    } else if (family === 'python') {
      if (ch === '#') end = lineEnd(i);
      else if (code.startsWith('"""', i) || code.startsWith("'''", i)) end = takeUntil(code.slice(i, i + 3), i + 3, true);
      else if (ch === '"' || ch === "'") end = takeUntil(ch, i + 1, true);
    } else if (family === 'ruby') {
      if (ch === '#' && code[i - 1] !== '$') end = lineEnd(i);
      else if (ch === '"' || ch === "'") end = takeUntil(ch, i + 1, true);
    } else if (family === 'shell') {
      if (ch === '#' && (i === 0 || /\s/.test(code[i - 1])) && next !== '!') end = lineEnd(i);
      else if (ch === '#' && i === 0) end = lineEnd(i);
      else if (ch === "'") end = takeUntil("'", i + 1, false);
      else if (ch === '"') end = takeUntil('"', i + 1, true);
    } else {
      // C family
      if (ch === '/' && next === '/') end = lineEnd(i);
      else if (ch === '/' && next === '*') end = takeUntil('*/', i + 2, false);
      else if (lang === 'php' && ch === '#' && next !== '[') end = lineEnd(i);
      else if (ch === '"') end = takeUntil('"', i + 1, true);
      else if (ch === '`' && (lang === 'javascript' || lang === 'typescript' || lang === 'go' || lang === 'kotlin')) {
        end = takeUntil('`', i + 1, lang !== 'go');
      } else if (ch === "'") {
        if (lang === 'rust') {
          // Char literal ('a', '\n') - but not a lifetime ('a in fn f<'a>).
          const close = code.indexOf("'", i + 1);
          if (close !== -1 && close - i <= 4 && !code.slice(i + 1, close).includes('\n')) end = close + 1;
        } else {
          end = takeUntil("'", i + 1, true);
        }
      }
    }

    if (end > i) {
      out += blank(code.slice(i, end));
      i = end;
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export type Severity = 'error' | 'warning' | 'info';

export interface CodeIssue {
  id: string;
  severity: Severity;
  message: string;
  fix?: string;
  lines: number[];
  count: number;
}

export interface CodeMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  longestLine: number;
  maxNesting: number;
  functions: number;
  decisionPoints: number;
}

export type Complexity = 'Low' | 'Medium' | 'High';

export interface CodeAnalysis {
  language: LanguageId;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  complexity: Complexity;
  metrics: CodeMetrics;
  issues: CodeIssue[];
  suggestions: string[];
  strengths: string[];
}

interface LineRule {
  id: string;
  severity: Severity;
  message: string;
  fix?: string;
  re: RegExp;
  /** Test against the masked line (default) or the original line. */
  source?: 'masked' | 'original';
  langs?: LanguageId[];
}

const JS: LanguageId[] = ['javascript', 'typescript'];

const LINE_RULES: LineRule[] = [
  // JavaScript / TypeScript
  { id: 'var', langs: JS, severity: 'warning', re: /\bvar\s+[A-Za-z_$]/, message: '`var` is function-scoped and hoisted', fix: 'Use `const` (or `let` when the value is reassigned).' },
  { id: 'loose-eq', langs: JS, severity: 'warning', re: /[^=!<>]==[^=]|!=[^=]/, message: 'Loose equality (`==` / `!=`) coerces types', fix: 'Use `===` and `!==`.' },
  { id: 'console', langs: JS, severity: 'info', re: /\bconsole\.(log|debug)\s*\(/, message: 'console.log left in the code', fix: 'Remove it or use a logger that is silenced in production.' },
  { id: 'eval', langs: JS, severity: 'error', re: /\beval\s*\(|\bnew\s+Function\s*\(/, message: '`eval` / `new Function` executes arbitrary code', fix: 'Parse data with JSON.parse or use a lookup table instead.' },
  { id: 'xss', langs: JS, severity: 'error', re: /\.(innerHTML|outerHTML)\s*=|dangerouslySetInnerHTML|document\.write\s*\(/, message: 'Writing raw HTML can lead to XSS', fix: 'Use textContent, or sanitise the HTML first.' },
  { id: 'debugger', langs: JS, severity: 'warning', re: /\bdebugger\b/, message: '`debugger` statement left in the code', fix: 'Remove it before shipping.' },
  { id: 'ts-any', langs: ['typescript'], severity: 'warning', re: /:\s*any\b|<any>|\bas\s+any\b/, message: '`any` disables type checking', fix: 'Use a specific type, a generic, or `unknown` with a type guard.' },
  { id: 'ts-ignore', langs: ['typescript'], severity: 'warning', source: 'original', re: /@ts-(ignore|nocheck)/, message: 'Type errors are being suppressed', fix: 'Fix the underlying type error, or use @ts-expect-error with a reason.' },
  // Python
  { id: 'bare-except', langs: ['python'], severity: 'warning', re: /^\s*except\s*:/, message: 'Bare `except:` also catches KeyboardInterrupt and SystemExit', fix: 'Catch specific exceptions, e.g. `except ValueError:`.' },
  { id: 'py-print', langs: ['python'], severity: 'info', re: /^\s*print\s*\(/, message: 'print() used for output', fix: 'Use the logging module for anything beyond a quick script.' },
  { id: 'star-import', langs: ['python'], severity: 'warning', re: /^\s*from\s+\S+\s+import\s+\*/, message: 'Wildcard import hides where names come from', fix: 'Import the names you need explicitly.' },
  { id: 'mutable-default', langs: ['python'], severity: 'warning', re: /def\s+\w+\s*\([^)]*=\s*(\[\]|\{\}|set\(\)|list\(\)|dict\(\))/, message: 'Mutable default argument is shared between calls', fix: 'Default to None and create the list/dict inside the function.' },
  { id: 'none-eq', langs: ['python'], severity: 'warning', re: /[!=]=\s*None\b/, message: 'Comparing to None with == / !=', fix: 'Use `is None` / `is not None`.' },
  { id: 'py-eval', langs: ['python', 'ruby'], severity: 'error', re: /\b(eval|exec)\s*\(/, message: '`eval` / `exec` runs arbitrary code', fix: 'Use ast.literal_eval or explicit parsing.' },
  // Java / C# / Kotlin / Swift / Dart
  { id: 'java-print', langs: ['java'], severity: 'info', re: /System\.(out|err)\.print/, message: 'System.out used for output', fix: 'Use a logging framework such as SLF4J.' },
  { id: 'stacktrace', langs: ['java', 'kotlin'], severity: 'info', re: /\.printStackTrace\s*\(\s*\)/, message: 'printStackTrace() loses context in production logs', fix: 'Log the exception with a logger.' },
  { id: 'java-str-eq', langs: ['java'], severity: 'warning', source: 'original', re: /==\s*"|"\s*==/, message: 'Strings compared with ==', fix: 'Use .equals() (or Objects.equals) for string content.' },
  { id: 'cs-async-void', langs: ['csharp'], severity: 'warning', re: /\basync\s+void\b/, message: '`async void` exceptions cannot be awaited or caught', fix: 'Return Task instead (except for event handlers).' },
  { id: 'catch-all', langs: ['java', 'csharp', 'kotlin'], severity: 'info', re: /catch\s*\(\s*(Exception|Throwable)\b/, message: 'Catching the base Exception type', fix: 'Catch the specific exceptions you can handle.' },
  { id: 'kotlin-bang', langs: ['kotlin'], severity: 'warning', re: /!!/, message: '`!!` throws on null', fix: 'Use `?.`, `?:` or requireNotNull with a message.' },
  { id: 'swift-force', langs: ['swift'], severity: 'warning', re: /\btry!|\bas!/, message: 'Forced try/cast crashes on failure', fix: 'Use do/catch, try? or as? with proper handling.' },
  { id: 'dart-print', langs: ['dart'], severity: 'info', re: /^\s*print\s*\(/, message: 'print() used for output', fix: 'Use debugPrint or a logger.' },
  // Go / Rust
  { id: 'go-panic', langs: ['go'], severity: 'info', re: /\bpanic\s*\(/, message: 'panic() used for error handling', fix: 'Return an error value instead.' },
  { id: 'go-ignored-err', langs: ['go'], severity: 'warning', re: /,\s*_\s*:?=|^\s*_\s*=\s*\w+\(/, message: 'Error value discarded with _', fix: 'Check the error and handle or return it.' },
  { id: 'rust-unwrap', langs: ['rust'], severity: 'warning', re: /\.unwrap\s*\(\s*\)/, message: '.unwrap() panics on None/Err', fix: 'Use `?`, match, or .expect() with a helpful message.' },
  { id: 'rust-unsafe', langs: ['rust'], severity: 'warning', re: /\bunsafe\s*\{/, message: '`unsafe` block', fix: 'Document the invariants that make it safe, or avoid it.' },
  // PHP
  { id: 'php-mysql', langs: ['php'], severity: 'error', re: /\bmysql_\w+\s*\(/, message: 'Removed mysql_* API', fix: 'Use PDO or mysqli with prepared statements.' },
  { id: 'php-xss', langs: ['php'], severity: 'error', re: /\b(echo|print)\b[^;]*\$_(GET|POST|REQUEST|COOKIE)/, message: 'Request data echoed without escaping (XSS)', fix: 'Wrap output in htmlspecialchars().' },
  { id: 'php-eval', langs: ['php'], severity: 'error', re: /\beval\s*\(/, message: '`eval` runs arbitrary code', fix: 'Remove eval and use explicit logic.' },
  { id: 'php-sqli', langs: ['php'], severity: 'error', source: 'original', re: /(query|exec)\s*\(\s*["'][^"']*\b(SELECT|INSERT|UPDATE|DELETE)\b[^"']*["']\s*\.\s*\$/i, message: 'SQL built by string concatenation (SQL injection)', fix: 'Use prepared statements with bound parameters.' },
  // C++
  { id: 'cpp-namespace', langs: ['cpp'], severity: 'info', re: /\busing\s+namespace\s+std\s*;/, message: '`using namespace std;` pollutes the global namespace', fix: 'Qualify names (std::string) or import specific names.' },
  { id: 'cpp-unsafe-c', langs: ['cpp'], severity: 'error', re: /\b(gets|strcpy|strcat|sprintf)\s*\(/, message: 'Unsafe C string function (buffer overflow risk)', fix: 'Use std::string, std::getline or snprintf.' },
  { id: 'cpp-raw-new', langs: ['cpp'], severity: 'info', re: /\bnew\s+[A-Za-z_]/, message: 'Raw `new` allocation', fix: 'Prefer std::make_unique / std::make_shared or stack objects.' },
  // SQL
  { id: 'sql-star', langs: ['sql'], severity: 'warning', re: /\bselect\s+\*/i, message: 'SELECT * fetches every column', fix: 'List the columns you need.' },
  // HTML
  { id: 'html-img-alt', langs: ['html'], severity: 'warning', re: /<img\b(?![^>]*\balt\s*=)[^>]*>/i, message: '<img> without alt text', fix: 'Add alt="" for decorative images or a description otherwise.' },
  { id: 'html-inline-js', langs: ['html'], severity: 'info', re: /<[^>]+\son[a-z]+\s*=/i, message: 'Inline event handler attribute', fix: 'Attach listeners in JavaScript (also required by strict CSP).' },
  { id: 'html-blank', langs: ['html'], severity: 'warning', re: /<a\b(?=[^>]*target\s*=\s*["']_blank)(?![^>]*\brel\s*=)[^>]*>/i, message: 'target="_blank" without rel', fix: 'Add rel="noopener noreferrer".' },
  { id: 'html-deprecated', langs: ['html'], severity: 'warning', re: /<(font|center|marquee|blink)\b/i, message: 'Deprecated HTML element', fix: 'Use CSS for presentation.' },
  // CSS
  { id: 'css-important', langs: ['css'], severity: 'warning', re: /!important/, message: '!important makes styles hard to override', fix: 'Increase selector specificity or restructure the cascade instead.' },
  { id: 'css-float', langs: ['css'], severity: 'info', re: /\bfloat\s*:\s*(left|right)/, message: 'float used for layout', fix: 'Flexbox or Grid are simpler and more robust for layout.' },
  // Bash
  { id: 'sh-rm-var', langs: ['bash'], severity: 'warning', source: 'original', re: /\brm\s+(-\w+\s+)*\$\w+/, message: 'rm with an unquoted variable', fix: 'Quote it ("$dir") and guard against empty values: "${dir:?}".' },
  { id: 'sh-backticks', langs: ['bash'], severity: 'info', re: /`[^`]+`/, source: 'original', message: 'Backtick command substitution', fix: 'Use $(...) - it nests and reads better.' },
  { id: 'sh-eval', langs: ['bash'], severity: 'warning', re: /\beval\b/, message: '`eval` on shell input is dangerous', fix: 'Use arrays or explicit parsing instead.' },
  // Every language
  { id: 'secret', severity: 'error', source: 'original', re: /(password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key)\w*["']?\s*[:=]\s*["'][^"'\s]{4,}["']/i, message: 'Hard-coded secret or credential', fix: 'Load secrets from environment variables or a secrets manager.' },
  { id: 'todo', severity: 'info', source: 'original', re: /\b(TODO|FIXME|HACK|XXX)\b/, message: 'TODO / FIXME left in the code', fix: 'Resolve it or track it in your issue tracker.' },
];

const DECISION_RE: Record<Family, RegExp> = {
  // `?` as a ternary only: not `?.`, `??`, or a TypeScript optional `?:`.
  c: /\b(if|for|while|case|catch|foreach)\b|&&|\|\||(?<!\?)\?(?![.?:])/g,
  python: /\b(if|elif|for|while|except|and|or|case)\b/g,
  ruby: /\b(if|elsif|unless|while|until|for|when|rescue)\b|&&|\|\|/g,
  shell: /\b(if|elif|for|while|until|case)\b|&&|\|\|/g,
  sql: /\b(when|where)\b/gi,
  html: /$^/g,
  css: /$^/g,
};

const countMatches = (text: string, re: RegExp) => (text.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)) || []).length;

const countFunctions = (masked: string, lang: LanguageId): number => {
  const control = /^(if|for|while|switch|catch|return|else|do|using|lock|foreach)$/;
  switch (lang) {
    case 'javascript':
    case 'typescript': {
      const declared = countMatches(masked, /\bfunction\b/g) + countMatches(masked, /=>/g);
      const methods = (masked.match(/^\s*(?:(?:async|static|public|private|protected|get|set)\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::\s*[^{]+)?\{/gm) || [])
        .map((m) => (m.trim().match(/([A-Za-z_$][\w$]*)\s*\(/) || ['', ''])[1])
        .filter((name) => !control.test(name)).length;
      return declared + methods;
    }
    case 'python':
      return countMatches(masked, /^\s*(async\s+)?def\s+\w+/gm);
    case 'ruby':
      return countMatches(masked, /^\s*def\s+/gm);
    case 'go':
    case 'swift':
      return countMatches(masked, /\bfunc\b/g);
    case 'rust':
      return countMatches(masked, /\bfn\b/g);
    case 'kotlin':
      return countMatches(masked, /\bfun\b/g);
    case 'php':
      return countMatches(masked, /\bfunction\b/g);
    case 'bash':
      return countMatches(masked, /^\s*(function\s+)?[A-Za-z_]\w*\s*\(\)\s*\{/gm);
    case 'java':
    case 'csharp':
    case 'cpp':
    case 'dart':
      return (masked.match(/\b[\w<>[\],?]+\s+(\w+)\s*\([^;{}()]*\)\s*(?:const\s*)?(?:throws\s+[\w., ]+)?\s*\{/g) || [])
        .map((m) => (m.match(/(\w+)\s*\(/) || ['', ''])[1])
        .filter((name) => !control.test(name)).length;
    default:
      return 0;
  }
};

const maxNestingOf = (masked: string, family: Family): number => {
  if (family === 'c' || family === 'css') {
    let depth = 0;
    let max = 0;
    for (const ch of masked) {
      if (ch === '{') max = Math.max(max, ++depth);
      else if (ch === '}') depth = Math.max(0, depth - 1);
    }
    return max;
  }
  if (family === 'python' || family === 'ruby' || family === 'shell') {
    const indents = masked
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => (l.match(/^[ \t]*/) || [''])[0].replace(/\t/g, '    ').length);
    const positive = indents.filter((x) => x > 0);
    if (!positive.length) return 0;
    const unit = Math.max(2, Math.min(...positive));
    return Math.max(...indents.map((x) => Math.round(x / unit)));
  }
  return 0;
};

const pushIssue = (map: Map<string, CodeIssue>, rule: Omit<CodeIssue, 'lines' | 'count'>, line: number) => {
  const existing = map.get(rule.id);
  if (existing) {
    existing.count += 1;
    if (existing.lines.length < 12 && !existing.lines.includes(line)) existing.lines.push(line);
  } else {
    map.set(rule.id, { ...rule, lines: [line], count: 1 });
  }
};

const lineOfIndex = (text: string, index: number) => text.slice(0, index).split('\n').length;

const SEVERITY_WEIGHT: Record<Severity, number> = { error: 15, warning: 6, info: 2 };
const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

export const analyzeCode = (code: string, lang: LanguageId): CodeAnalysis => {
  const family = familyOf(lang);
  const masked = maskCode(code, lang);
  const lines = code.replace(/\r\n?/g, '\n').split('\n');
  const maskedLines = masked.replace(/\r\n?/g, '\n').split('\n');
  const issues = new Map<string, CodeIssue>();

  let blankLines = 0;
  let commentLines = 0;
  let longestLine = 0;
  let longLines = 0;
  let trailing = 0;
  const longLineNumbers: number[] = [];

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    const m = maskedLines[idx] ?? '';
    if (!line.trim()) blankLines += 1;
    else if (!m.trim()) commentLines += 1;
    longestLine = Math.max(longestLine, line.length);
    if (line.length > 120) {
      longLines += 1;
      if (longLineNumbers.length < 12) longLineNumbers.push(lineNo);
    }
    if (/[ \t]+$/.test(line)) trailing += 1;

    LINE_RULES.forEach((rule) => {
      if (rule.langs && !rule.langs.includes(lang)) return;
      const target = rule.source === 'original' ? line : m;
      if (rule.re.test(target)) {
        pushIssue(issues, { id: rule.id, severity: rule.severity, message: rule.message, fix: rule.fix }, lineNo);
      }
    });
  });

  // Whole-file checks -------------------------------------------------------
  const emptyCatch = /catch\s*(\([^)]*\))?\s*\{\s*\}/g;
  if (family === 'c') {
    let match: RegExpExecArray | null;
    while ((match = emptyCatch.exec(masked)) !== null) {
      pushIssue(issues, { id: 'empty-catch', severity: 'warning', message: 'Empty catch block silently swallows errors', fix: 'Log or handle the error, or rethrow it.' }, lineOfIndex(masked, match.index));
    }
  }
  if (family === 'python') {
    const exceptPass = /except[^:\n]*:\s*\n\s*pass\b/g;
    let match: RegExpExecArray | null;
    while ((match = exceptPass.exec(masked)) !== null) {
      pushIssue(issues, { id: 'except-pass', severity: 'warning', message: '`except: pass` silently swallows errors', fix: 'Log or handle the exception.' }, lineOfIndex(masked, match.index));
    }
    const tabIndented = lines.some((l) => /^\t+\S/.test(l));
    const spaceIndented = lines.some((l) => /^ +\S/.test(l));
    if (tabIndented && spaceIndented) {
      pushIssue(issues, { id: 'mixed-indent', severity: 'error', message: 'Mixed tabs and spaces for indentation', fix: 'Use 4 spaces everywhere (PEP 8).' }, lines.findIndex((l) => /^\t+\S/.test(l)) + 1);
    }
  }
  if (JS.includes(lang)) {
    if (/\b(fetch\s*\(|axios\.)/.test(masked) && !/\btry\b|\.catch\s*\(/.test(masked)) {
      const idx = masked.search(/\b(fetch\s*\(|axios\.)/);
      pushIssue(issues, { id: 'unhandled-async', severity: 'warning', message: 'Network request without error handling', fix: 'Wrap awaits in try/catch or add .catch().' }, lineOfIndex(masked, idx));
    }
    if (/\bsetInterval\s*\(/.test(masked) && !/\bclearInterval\s*\(/.test(masked)) {
      pushIssue(issues, { id: 'interval-leak', severity: 'info', message: 'setInterval without clearInterval', fix: 'Keep the id and clear it when no longer needed.' }, lineOfIndex(masked, masked.search(/\bsetInterval\s*\(/)));
    }
  }
  if (lang === 'go' && /\berr\s*:?=/.test(masked) && !/\berr\s*!=\s*nil\b/.test(masked)) {
    pushIssue(issues, { id: 'go-unchecked', severity: 'warning', message: 'err is assigned but never checked', fix: 'Add `if err != nil { return err }`.' }, lineOfIndex(masked, masked.search(/\berr\s*:?=/)));
  }
  if (lang === 'sql') {
    let offset = 0;
    masked.split(';').forEach((stmt) => {
      const s = stmt.trim();
      if (/^(delete\s+from|update)\b/i.test(s) && !/\bwhere\b/i.test(s)) {
        const lead = stmt.length - stmt.trimStart().length;
        pushIssue(issues, { id: 'sql-no-where', severity: 'error', message: 'UPDATE/DELETE without WHERE affects every row', fix: 'Add a WHERE clause (and run it inside a transaction).' }, lineOfIndex(masked, offset + lead));
      }
      offset += stmt.length + 1;
    });
  }
  if (lang === 'html' && /<html\b/i.test(code) && !/<!doctype html>/i.test(code)) {
    pushIssue(issues, { id: 'html-doctype', severity: 'info', message: 'Missing <!DOCTYPE html>', fix: 'Add it as the first line to avoid quirks mode.' }, 1);
  }
  if (lang === 'bash' && lines.filter((l) => l.trim()).length > 5 && !/\bset\s+-[a-z]*e/.test(masked)) {
    pushIssue(issues, { id: 'sh-strict', severity: 'info', message: 'Script does not stop on errors', fix: 'Add `set -euo pipefail` near the top.' }, 1);
  }

  // Metrics -----------------------------------------------------------------
  const totalLines = lines.length;
  const codeLines = totalLines - blankLines - commentLines;
  const functions = countFunctions(masked, lang);
  const decisionPoints = family === 'html' || family === 'css' ? 0 : countMatches(masked, DECISION_RE[family]);
  const maxNesting = maxNestingOf(masked, family);

  if (longLines) {
    issues.set('long-lines', { id: 'long-lines', severity: 'info', message: `${longLines} line${longLines === 1 ? '' : 's'} longer than 120 characters`, fix: 'Wrap long expressions over several lines.', lines: longLineNumbers, count: longLines });
  }
  if (trailing) {
    issues.set('trailing', { id: 'trailing', severity: 'info', message: `Trailing whitespace on ${trailing} line${trailing === 1 ? '' : 's'}`, fix: 'Use the Optimize tab to trim it automatically.', lines: [], count: trailing });
  }
  if (totalLines > 300) {
    issues.set('long-file', { id: 'long-file', severity: 'info', message: `File is ${totalLines} lines long`, fix: 'Split it into smaller modules.', lines: [], count: 1 });
  }
  const nestingLimit = family === 'css' ? 3 : 4;
  if (maxNesting > nestingLimit) {
    issues.set('deep-nesting', { id: 'deep-nesting', severity: 'warning', message: `Deeply nested code (depth ${maxNesting})`, fix: 'Use early returns / guard clauses or extract helper functions.', lines: [], count: 1 });
  }

  const perFunction = (decisionPoints + Math.max(1, functions)) / Math.max(1, functions);
  let complexity: Complexity = 'Low';
  if (family !== 'html' && family !== 'css') {
    if (perFunction > 10 || decisionPoints > 60) complexity = 'High';
    else if (perFunction > 5 || decisionPoints > 25) complexity = 'Medium';
  }

  // Score -------------------------------------------------------------------
  const issueList = Array.from(issues.values()).sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.count - a.count
  );
  let infoPenalty = 0;
  let penalty = 0;
  issueList.forEach((issue) => {
    const weight = SEVERITY_WEIGHT[issue.severity] * (1 + Math.min(issue.count - 1, 2) * 0.5);
    if (issue.severity === 'info') infoPenalty += weight;
    else penalty += weight;
  });
  penalty += Math.min(infoPenalty, 10);
  if (complexity === 'High') penalty += 10;
  else if (complexity === 'Medium') penalty += 4;
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  // Suggestions & strengths -------------------------------------------------
  const commentRatio = codeLines > 0 ? commentLines / (codeLines + commentLines) : 0;
  const suggestions: string[] = [];
  if (issueList.some((i) => i.severity === 'error')) suggestions.push('Fix the errors first - they are security or correctness problems.');
  if (codeLines > 20 && commentRatio < 0.05 && family !== 'css' && family !== 'html') {
    suggestions.push('Add comments or docstrings that explain why non-obvious code exists.');
  }
  if (maxNesting > 3 && family !== 'css' && family !== 'html') suggestions.push(`Flatten nesting (current max depth ${maxNesting}) with guard clauses or helper functions.`);
  if (complexity !== 'Low') suggestions.push('Split the most branching logic into smaller, single-purpose functions and add unit tests for each branch.');
  if (functions === 0 && codeLines > 25 && !['css', 'html', 'sql'].includes(family)) {
    suggestions.push('Group the logic into named functions so it can be reused and tested.');
  }
  if (codeLines > 200) suggestions.push('Consider splitting this file into smaller modules.');
  if (issues.has('trailing') || issues.has('var') || issues.has('loose-eq') || issues.has('none-eq')) {
    suggestions.push('Several of these can be fixed automatically in the Optimize tab.');
  }
  if (!suggestions.length) suggestions.push('No structural problems found. Next step: add tests for edge cases (empty input, invalid values, errors).');

  const strengths: string[] = [];
  if (!issueList.some((i) => i.severity === 'error')) strengths.push('No security-critical patterns detected');
  if (!issues.has('secret')) strengths.push('No hard-coded credentials found');
  if (complexity === 'Low' && codeLines > 0) strengths.push('Low branching complexity');
  if (commentRatio >= 0.1) strengths.push(`Good comment coverage (${Math.round(commentRatio * 100)}% of lines)`);
  if (JS.includes(lang) && !issues.has('var') && /\b(const|let)\b/.test(masked)) strengths.push('Uses block-scoped const/let');
  if (JS.includes(lang) && !issues.has('loose-eq') && /===|!==/.test(masked)) strengths.push('Uses strict equality');
  if (lang === 'typescript' && !issues.has('ts-any')) strengths.push('No `any` types');
  if (!issues.has('trailing') && !issues.has('long-lines') && codeLines > 0) strengths.push('Tidy formatting (no trailing whitespace or very long lines)');

  return {
    language: lang,
    score,
    grade,
    complexity,
    metrics: { totalLines, codeLines, commentLines, blankLines, longestLine, maxNesting, functions, decisionPoints },
    issues: issueList,
    suggestions,
    strengths,
  };
};

// ---------------------------------------------------------------------------
// Language detection (a hint only - the user's selection always wins)
// ---------------------------------------------------------------------------

const DETECTORS: [LanguageId, RegExp[]][] = [
  ['typescript', [/\binterface\s+\w+\s*\{/, /:\s*(string|number|boolean|void)\b/, /\btype\s+\w+\s*=/, /\bas\s+const\b/, /\bimplements\s+\w+/]],
  ['javascript', [/\b(const|let)\s+\w+\s*=/, /\bfunction\s+\w*\s*\(/, /=>/, /\bconsole\.log\(/, /\brequire\(/, /\bdocument\./]],
  ['python', [/^\s*def\s+\w+\s*\(.*\)\s*(->\s*[\w[\], .]+)?:\s*$/m, /^\s*import\s+\w+\s*$/m, /^\s*from\s+[\w.]+\s+import\b/m, /\bself\b/, /\belif\b/, /^\s*if\s+.+:\s*$/m]],
  ['java', [/\bpublic\s+(static\s+)?(final\s+)?(class|void|int|String)\b/, /System\.out\.println/, /\bimport\s+java\./, /@Override/]],
  ['csharp', [/\busing\s+System/, /Console\.Write/, /\bnamespace\s+[\w.]+/, /\basync\s+Task\b/]],
  ['cpp', [/#include\s*</, /std::/, /\bcout\s*<</, /\bint\s+main\s*\(/]],
  ['go', [/^package\s+\w+/m, /\bfunc\s+(\(\w+\s+\*?\w+\)\s*)?\w+\s*\(/, /:=/, /\bfmt\.\w+\(/]],
  ['rust', [/\bfn\s+\w+\s*[(<]/, /\blet\s+mut\b/, /\bprintln!\(/, /->\s*(Result|Option|Vec)</, /\bimpl\b/]],
  ['php', [/<\?php/, /\$\w+\s*=/, /\$this->/, /\becho\b/]],
  ['ruby', [/^\s*def\s+\w+[?!]?(\(.*\))?\s*$/m, /^\s*end\s*$/m, /\bputs\b/, /\battr_accessor\b/, /\bdo\s*\|\w+/]],
  ['swift', [/\bfunc\s+\w+\s*\(/, /\b(var|let)\s+\w+\s*:\s*[A-Z]\w*/, /\bguard\s+let\b/, /\bimport\s+(Foundation|UIKit|SwiftUI)\b/]],
  ['kotlin', [/\bfun\s+\w+\s*\(/, /\bval\s+\w+/, /\bdata\s+class\b/, /\bprintln\(/]],
  ['dart', [/\bvoid\s+main\s*\(\s*\)/, /\bfinal\s+\w+\s+\w+\s*=/, /import\s+'package:/, /\bWidget\b/]],
  ['html', [/<!DOCTYPE html>/i, /<(html|head|body|div|span|section|p|a|img|ul)\b[^>]*>/i, /<\/(div|p|span|section|body|html)>/i]],
  ['css', [/^\s*[.#]?[\w-]+[^{\n]*\{\s*$/m, /@media\b/, /^\s*(margin|padding|display|color|background|font-size)\s*:/m]],
  ['sql', [/\bSELECT\b[\s\S]+\bFROM\b/i, /\bINSERT\s+INTO\b/i, /\bCREATE\s+TABLE\b/i, /\bUPDATE\s+\w+\s+SET\b/i, /\bWHERE\b/i]],
  ['bash', [/^#!.*\b(bash|sh)\b/m, /\becho\s+["$]/, /^\s*fi\s*$/m, /^\s*done\s*$/m, /\bthen\s*$/m]],
];

export const detectLanguage = (code: string): LanguageId | null => {
  if (code.trim().length < 20) return null;
  const scores = new Map<LanguageId, number>();
  DETECTORS.forEach(([lang, patterns]) => {
    scores.set(lang, patterns.filter((re) => re.test(code)).length);
  });
  // TypeScript is a superset of JavaScript.
  const ts = scores.get('typescript') ?? 0;
  if (ts > 0) scores.set('typescript', ts + (scores.get('javascript') ?? 0));
  const ranked = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
  const [best, second] = ranked;
  if (!best || best[1] < 2 || (second && second[1] === best[1])) return null;
  return best[0];
};

// ---------------------------------------------------------------------------
// Optimizer (safe, reviewable clean-ups)
// ---------------------------------------------------------------------------

export type OptimizeOptionId =
  | 'trimTrailing'
  | 'collapseBlank'
  | 'tabsToSpaces'
  | 'strictEquality'
  | 'varToLet'
  | 'removeConsole'
  | 'pythonNone'
  | 'finalNewline';

export interface OptimizeOption {
  id: OptimizeOptionId;
  label: string;
  description: string;
  langs?: LanguageId[];
  defaultOn: boolean;
}

export const OPTIMIZE_OPTIONS: OptimizeOption[] = [
  { id: 'trimTrailing', label: 'Trim trailing whitespace', description: 'Removes spaces and tabs at the end of lines', defaultOn: true },
  { id: 'collapseBlank', label: 'Collapse blank lines', description: 'Turns runs of blank lines into a single blank line', defaultOn: true },
  { id: 'tabsToSpaces', label: 'Indent with spaces', description: 'Converts leading tabs to spaces (not for Go - gofmt uses tabs)', defaultOn: false },
  { id: 'strictEquality', label: 'Strict equality', description: '== → === and != → !== (leaves `== null` checks alone)', langs: JS, defaultOn: true },
  { id: 'varToLet', label: 'var → let', description: 'Block-scoped variables; review for code that relies on hoisting', langs: JS, defaultOn: true },
  { id: 'removeConsole', label: 'Remove console.log lines', description: 'Deletes lines that only contain a console.log/debug/info call', langs: JS, defaultOn: false },
  { id: 'pythonNone', label: 'is None', description: '== None → is None and != None → is not None', langs: ['python'], defaultOn: true },
  { id: 'finalNewline', label: 'Ensure final newline', description: 'Ends the file with exactly one newline', defaultOn: true },
];

export const optionAppliesTo = (option: OptimizeOption, lang: LanguageId) =>
  (!option.langs || option.langs.includes(lang)) && !(option.id === 'tabsToSpaces' && lang === 'go');

export interface OptimizeChange {
  label: string;
  count: number;
}

export interface OptimizeResult {
  code: string;
  changes: OptimizeChange[];
}

const indentWidth = (lang: LanguageId) => (['python', 'java', 'csharp', 'cpp', 'rust', 'php', 'kotlin', 'swift'].includes(lang) ? 4 : 2);

export const optimizeCode = (input: string, lang: LanguageId, enabled: Set<OptimizeOptionId>): OptimizeResult => {
  let code = input.replace(/\r\n?/g, '\n');
  const changes: OptimizeChange[] = [];
  const on = (id: OptimizeOptionId) => {
    const option = OPTIMIZE_OPTIONS.find((o) => o.id === id);
    return enabled.has(id) && Boolean(option && optionAppliesTo(option, lang));
  };
  const record = (label: string, count: number) => {
    if (count > 0) changes.push({ label, count });
  };

  if (on('tabsToSpaces')) {
    const spaces = ' '.repeat(indentWidth(lang));
    let count = 0;
    code = code.replace(/^\t+/gm, (tabs) => {
      count += 1;
      return spaces.repeat(tabs.length);
    });
    record('Lines re-indented with spaces', count);
  }

  if (on('strictEquality')) {
    const masked = maskCode(code, lang);
    let out = '';
    let count = 0;
    for (let i = 0; i < code.length; i += 1) {
      const isEq = masked[i] === '=' && masked[i + 1] === '=' && masked[i + 2] !== '=' && !'=!<>'.includes(masked[i - 1] ?? '');
      const isNe = masked[i] === '!' && masked[i + 1] === '=' && masked[i + 2] !== '=';
      if ((isEq || isNe) && !/^\s*(null|undefined)\b/.test(code.slice(i + 2, i + 14))) {
        out += isEq ? '===' : '!==';
        i += 1;
        count += 1;
      } else {
        out += code[i];
      }
    }
    code = out;
    record('Loose comparisons made strict', count);
  }

  if (on('varToLet')) {
    const masked = maskCode(code, lang);
    const chars = code.split('');
    let count = 0;
    const re = /\bvar(?=\s+[A-Za-z_$])/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(masked)) !== null) {
      chars.splice(m.index, 3, 'l', 'e', 't');
      count += 1;
    }
    code = chars.join('');
    record('`var` declarations changed to `let`', count);
  }

  if (on('pythonNone')) {
    const masked = maskCode(code, lang);
    const re = /(==|!=)(\s*)None\b/g;
    const hits: { index: number; length: number; replacement: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(masked)) !== null) {
      hits.push({ index: m.index, length: m[0].length, replacement: m[1] === '==' ? 'is None' : 'is not None' });
    }
    for (let k = hits.length - 1; k >= 0; k -= 1) {
      const h = hits[k];
      code = code.slice(0, h.index) + h.replacement + code.slice(h.index + h.length);
    }
    record('None comparisons changed to `is`', hits.length);
  }

  if (on('removeConsole')) {
    const maskedLines = maskCode(code, lang).split('\n');
    let count = 0;
    code = code
      .split('\n')
      .filter((line, idx) => {
        const drop = /^\s*console\.(log|debug|info)\(.*\);?\s*$/.test(line) && (maskedLines[idx] ?? '').trim().startsWith('console.');
        if (drop) count += 1;
        return !drop;
      })
      .join('\n');
    record('console.log lines removed', count);
  }

  if (on('trimTrailing')) {
    let count = 0;
    code = code.replace(/[ \t]+$/gm, () => {
      count += 1;
      return '';
    });
    record('Lines with trailing whitespace trimmed', count);
  }

  if (on('collapseBlank')) {
    let count = 0;
    code = code.replace(/\n{3,}/g, () => {
      count += 1;
      return '\n\n';
    });
    record('Runs of blank lines collapsed', count);
  }

  if (on('finalNewline')) {
    const before = code;
    code = `${code.replace(/\n+$/, '')}\n`;
    record('Final newline normalised', before === code ? 0 : 1);
  }

  return { code, changes };
};
