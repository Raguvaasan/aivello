import { describe, it, expect } from 'vitest';
import { extractYouTubeVideoId, isValidVideoId, thumbnailUrl } from '../../tools/lib/youtubeThumbnail';

const ID = 'dQw4w9WgXcQ';

describe('extractYouTubeVideoId', () => {
  it.each([
    [ID],
    [`https://www.youtube.com/watch?v=${ID}`],
    [`https://youtube.com/watch?v=${ID}&t=42s&list=PL123`],
    [`https://www.youtube.com/watch?feature=share&v=${ID}`],
    [`https://m.youtube.com/watch?v=${ID}`],
    [`https://music.youtube.com/watch?v=${ID}&si=abc`],
    [`https://youtu.be/${ID}`],
    [`https://youtu.be/${ID}?si=xyz&t=10`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`https://youtube.com/shorts/${ID}?feature=share`],
    [`https://www.youtube.com/embed/${ID}?start=30`],
    [`https://www.youtube-nocookie.com/embed/${ID}`],
    [`https://www.youtube.com/live/${ID}?si=abc`],
    [`https://www.youtube.com/v/${ID}`],
    [`www.youtube.com/watch?v=${ID}`],
    [`youtu.be/${ID}`],
    [`  https://youtu.be/${ID}  `],
    [`https://www.youtube.com/watch?v=${ID}#comments`],
  ])('parses %s', (input) => {
    expect(extractYouTubeVideoId(input)).toBe(ID);
  });

  it.each([
    [''],
    ['not a url'],
    ['dQw4w9WgXc'], // 10 chars
    ['dQw4w9WgXcQQ'], // 12 chars
    ['https://www.youtube.com/watch?v=short'],
    [`https://evil.example.com/watch?v=${ID}`],
    [`https://youtube.com.evil.example/watch?v=${ID}`],
    ['https://www.youtube.com/channel/UC1234567890'],
    [`javascript:alert(1)//youtu.be/${ID}`],
  ])('rejects %s', (input) => {
    expect(extractYouTubeVideoId(input)).toBeNull();
  });
});

describe('helpers', () => {
  it('validates IDs', () => {
    expect(isValidVideoId(ID)).toBe(true);
    expect(isValidVideoId('abc_def-123')).toBe(true);
    expect(isValidVideoId('abc def 123')).toBe(false);
  });

  it('builds img.youtube.com URLs', () => {
    expect(thumbnailUrl(ID, 'hqdefault')).toBe(`https://img.youtube.com/vi/${ID}/hqdefault.jpg`);
  });
});
