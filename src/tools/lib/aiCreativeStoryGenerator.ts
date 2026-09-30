/**
 * Client-side story composer for the AI Creative Story Generator.
 *
 * No LLM is involved: the story is assembled from genre and mood sentence banks
 * around the user's own premise, characters and setting, using a seeded random
 * generator so the same inputs give the same story and "Regenerate" gives a new
 * variation. Length options are honest approximations of what is produced.
 */

export const GENRES = [
  'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Horror',
  'Adventure', 'Comedy', 'Drama', 'Thriller', 'Historical Fiction',
  'Dystopian', 'Magical Realism', 'Western', 'Cyberpunk', 'Steampunk',
] as const;

export const MOODS = [
  'Uplifting', 'Dark', 'Mysterious', 'Romantic', 'Humorous',
  'Suspenseful', 'Melancholic', 'Inspiring', 'Eerie', 'Adventurous',
  'Nostalgic', 'Intense', 'Whimsical', 'Dramatic', 'Peaceful',
] as const;

export const LENGTHS = [
  { value: 'flash', label: 'Flash fiction (~100-150 words)' },
  { value: 'short', label: 'Short story (~250-300 words)' },
  { value: 'medium', label: 'Longer story (~450-550 words)' },
] as const;

export type LengthValue = (typeof LENGTHS)[number]['value'];

export interface StoryInput {
  prompt: string;
  genre: string;
  mood: string;
  length: string;
  characters: string;
  setting: string;
}

export interface StoryResult {
  id: string;
  createdAt: string;
  title: string;
  story: string;
  genre: string;
  mood: string;
  wordCount: number;
  readingTime: number;
  characterAnalysis: string;
  plotSummary: string;
  themes: string[];
  moodAnalysis: string;
  sequelSuggestions: string[];
}

export const PROMPT_MIN_LENGTH = 15;
export const PROMPT_MAX_LENGTH = 1000;

export const validateStoryPrompt = (prompt: string): string => {
  const p = prompt.trim();
  if (!p) return 'Write a story prompt first.';
  if (p.length < PROMPT_MIN_LENGTH) return `Add a little more detail - at least ${PROMPT_MIN_LENGTH} characters.`;
  if (p.length > PROMPT_MAX_LENGTH) return `Keep the prompt under ${PROMPT_MAX_LENGTH} characters.`;
  return '';
};

// ---------------------------------------------------------------------------
// Seeded randomness
// ---------------------------------------------------------------------------

const hashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Rng = () => number;
const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];
const shuffle = <T,>(rng: Rng, items: readonly T[]): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------------------------------------------------------------------------
// Content banks
// ---------------------------------------------------------------------------

interface GenreProfile {
  hero: string;
  ally: string;
  setting: string;
  threat: string;
  openings: string[];
  incitings: string[];
  complications: string[];
  climaxes: string[];
  resolutions: string[];
  titles: string[];
  themes: string[];
}

// Placeholders: {Hero}/{hero}, {Ally}/{ally}, {setting} (first mention), {place} (later mentions),
// {motif}, {threat}.
const GENRE_PROFILES: Record<string, GenreProfile> = {
  Fantasy: {
    hero: 'a young mapmaker named Elara', ally: 'an old wizard', setting: 'the kingdom of Eldmoor', threat: 'the ancient shadow',
    openings: ['In a realm where magic ran like rivers beneath the ancient forests, {hero} lived in {setting}, far from any legend.', 'The bells of {setting} had not rung in a hundred years - until the night {hero} found the {motif}.'],
    incitings: ['Then the old wards began to fail, one by one, and whispers spoke of {threat} waking in the north.', 'A raven arrived with a message sealed in silver wax, and it named {hero} as the last hope of {place}.'],
    complications: ['The spell they needed was written in a language no living person could read.', 'Every mile north, the forest grew quieter, as if the trees themselves were holding their breath.'],
    climaxes: ['Magic crackled through the air as {hero} raised the {motif}, and for one terrible heartbeat the whole world seemed to choose a side.', 'At the heart of the storm, {threat} offered {hero} everything - power, safety, a crown - in exchange for the {motif}.'],
    resolutions: ['When the light faded, {threat} was gone, and {place} woke to a morning that felt brand new.', '{Hero} walked home the long way, the {motif} quiet at last, knowing that some stories end by becoming someone else\'s beginning.'],
    titles: ['The Legend of', 'The Chronicles of', 'The Last Song of'], themes: ['Good vs Evil', 'Destiny', 'Courage'],
  },
  'Science Fiction': {
    hero: 'a ship\'s engineer named Kai', ally: 'the ship\'s AI', setting: 'the research vessel Meridian', threat: 'the signal from the dark',
    openings: ['In the year 2157, when humanity had scattered itself across the stars, {hero} kept {setting} running with patience and duct tape.', 'Three hundred light-years from Earth, aboard {setting}, {hero} was the first to hear it.'],
    incitings: ['The sensors picked up {threat} - a pattern too precise to be natural, and too old to be human.', 'A routine diagnostic returned an impossible result, and it pointed straight at the {motif}.'],
    complications: ['Command wanted answers in hours; the physics said it would take years.', 'Half the crew wanted to turn back. The other half had stopped sleeping.'],
    climaxes: ['With the reactor screaming and the hull groaning, {hero} made the only calculation that mattered.', 'Technology and humanity collided as {hero} connected the {motif} to the ship and opened a channel to {threat}.'],
    resolutions: ['The reply, when it came, was not a threat but an invitation - and a new chapter of human history began.', 'Weeks later, {setting} limped home carrying a secret that would change how humanity looked at the stars.'],
    titles: ['Beyond the', 'Starbound:', 'The Signal of'], themes: ['Technology vs Humanity', 'Discovery', 'First Contact'],
  },
  Mystery: {
    hero: 'Detective Ada Quinn', ally: 'a sharp-eyed journalist', setting: 'the fog-bound town of Hollowmere', threat: 'whoever was behind it',
    openings: ['The rain had not stopped for three days when {hero} was called to {setting}.', 'Everyone in {setting} had a secret, and {hero} had made a career of noticing them.'],
    incitings: ['The body was found at dawn, and next to it, placed with terrible care, was the {motif}.', 'A letter arrived with no signature, only a single line: "Ask them about the {motif}."'],
    complications: ['Each witness told a different story, and every story was almost true.', 'The one person who could explain it all had vanished the night before.'],
    climaxes: ['In the locked study, with the storm rattling the windows, {hero} laid out the final piece of the puzzle.', 'The truth about the {motif} came out all at once, and it recontextualised everything that had come before.'],
    resolutions: ['The case was closed, but {hero} kept the {motif} in a drawer, a reminder that every answer hides another question.', 'By morning the fog had lifted from {place}, and for the first time in years, people could see clearly.'],
    titles: ['The Secret of', 'The Case of', 'Shadows over'], themes: ['Truth vs Deception', 'Justice', 'Hidden Secrets'],
  },
  Romance: {
    hero: 'a florist named June', ally: 'a stubborn architect', setting: 'a small seaside town', threat: 'the fear of losing everything',
    openings: ['{Hero} had made a quiet, careful life in {setting}, and had no intention of changing it.', 'Their eyes met across a crowded room in {setting}, and in that instant everything became complicated.'],
    incitings: ['Then {ally} arrived with plans that would change {place} forever - and an infuriating smile.', 'It started with the {motif}, left on the counter with a note that simply said, "For no reason."'],
    complications: ['They were wrong for each other in every way that looked good on paper.', 'An old promise, made long ago, stood between them like a closed door.'],
    climaxes: ['On the pier, in the rain, {hero} finally said the thing they had both been too afraid to say.', 'Hearts laid bare, they faced the moment that would either bind them together or send them apart forever.'],
    resolutions: ['Love, they learned, was not about finding each other - it was about choosing to stay.', 'Years later, the {motif} still sat on the windowsill, and {hero} still smiled every time the light caught it.'],
    titles: ['Love in', 'The Promise of', 'Hearts of'], themes: ['Love Conquers All', 'Second Chances', 'Vulnerability'],
  },
  Horror: {
    hero: 'a night-shift nurse named Rosa', ally: 'her skeptical brother', setting: 'an abandoned asylum on the hill', threat: 'the thing in the dark',
    openings: ['{Setting} had been empty for decades, yet something still moved within its walls.', 'Nobody in town talked about {setting}, and {hero} was about to learn why.'],
    incitings: ['It began with the {motif}, which should not have been there, and a sound like breathing behind the walls.', 'The first night, {hero} heard footsteps. The second night, the footsteps stopped right outside the door.'],
    complications: ['Every photograph they took showed one more person than had been in the room.', 'The doors they had locked were open in the morning, and the {motif} had moved.'],
    climaxes: ['In the deepest room, by the light of a dying torch, {hero} finally saw {threat} clearly.', 'Terror reached its crescendo as {hero} understood what the {motif} had been keeping locked away.'],
    resolutions: ['They escaped at dawn, but some doors, once opened, can never truly be closed again.', 'The asylum was demolished that winter. {Hero} still sleeps with the lights on.'],
    titles: ['The Haunting of', 'Terror in', 'The Curse of'], themes: ['Fear of the Unknown', 'Survival', 'Guilt'],
  },
  Adventure: {
    hero: 'a treasure hunter named Marco', ally: 'a quick-witted guide', setting: 'the uncharted jungle of the Red Coast', threat: 'the rival expedition',
    openings: ['{Hero} had chased rumours across four continents before one finally led to {setting}.', 'The map was torn, the compass was cracked, and {hero} had never been happier.'],
    incitings: ['The {motif} was real - and {threat} had already set out to claim it first.', 'A stranger pressed the {motif} into {hero}\'s hands and whispered one word: "Run."'],
    complications: ['The river they needed to cross had swallowed the bridge in the night.', 'Their supplies were running low, and the trail markings had begun to lie.'],
    climaxes: ['On a crumbling ledge above the falls, {hero} and {threat} reached for the {motif} at the same moment.', 'With the temple collapsing around them, {hero} had seconds to choose between the treasure and {ally}.'],
    resolutions: ['They came home with empty pockets and a story worth more than gold.', 'The {motif} went to a museum; {hero} went looking for the next map.'],
    titles: ['The Quest for', 'Journey to', 'The Lost'], themes: ['Exploration', 'Friendship', 'Greed vs Wonder'],
  },
  Comedy: {
    hero: 'a hapless wedding planner named Gus', ally: 'his overconfident cousin', setting: 'the most chaotic wedding of the year', threat: 'the rapidly escalating disaster',
    openings: ['{Hero} had one rule: nothing goes wrong at {setting}. It lasted eleven minutes.', 'If {hero} had known what the day would bring, they would have stayed in bed. Possibly in another country.'],
    incitings: ['It all went sideways the moment the {motif} went missing.', 'A small misunderstanding about the {motif} snowballed, as small misunderstandings do, into {threat}.'],
    complications: ['Every attempt to fix things created two new problems, one of which involved a goat.', '{Ally} had a plan. It was a terrible plan. They went with it anyway.'],
    climaxes: ['In front of two hundred guests, a string quartet, and one very confused goat, {hero} made a speech nobody would ever forget.', 'At the worst possible moment, the {motif} reappeared - in the last place anyone expected.'],
    resolutions: ['Somehow, against all odds and several laws of physics, it all worked out.', 'It was, everyone agreed later, the best disaster they had ever attended.'],
    titles: ['The Trouble with', 'Absolutely Not:', 'The Great'], themes: ['Chaos and Order', 'Friendship', 'Imperfection'],
  },
  Drama: {
    hero: 'a retired teacher named Helen', ally: 'her estranged son', setting: 'the family farmhouse', threat: 'the secret everyone was keeping',
    openings: ['Every summer, the family returned to {setting}, and every summer, nobody said what they really meant.', '{Hero} had spent a lifetime holding things together. This year, things were coming apart.'],
    incitings: ['Then the {motif} turned up in the attic, and with it, {threat}.', 'A phone call in the middle of the night brought {ally} home for the first time in years.'],
    complications: ['Old arguments resurfaced over dinner, sharper for having waited so long.', 'The truth about the {motif} would help someone and hurt someone else.'],
    climaxes: ['On the porch, with the storm rolling in, {hero} finally told the whole story.', 'Everything that had gone unsaid for twenty years was said in a single, shaking breath.'],
    resolutions: ['Nothing was fixed, exactly. But for the first time in years, nobody left the table early.', '{Hero} kept the {motif} on the mantel, where everyone could see it, and nobody had to pretend anymore.'],
    titles: ['What Remains of', 'The Weight of', 'Letters from'], themes: ['Family', 'Forgiveness', 'Truth'],
  },
  Thriller: {
    hero: 'a former analyst named Sam Reyes', ally: 'an unlikely informant', setting: 'the rain-slick streets of Berlin', threat: 'the people hunting them',
    openings: ['{Hero} had left the agency to live a quiet life. {Setting} had other plans.', 'The message came at 3:14 a.m.: a photo of the {motif}, and a countdown.'],
    incitings: ['Within an hour, {hero}\'s accounts were frozen and {threat} were at the door.', 'The {motif} held proof of something powerful people had killed to hide.'],
    complications: ['Every safe house was compromised; every ally had a price.', 'The timer kept counting down, and every clue cost them precious minutes.'],
    climaxes: ['On the rooftop, with sirens closing in, {hero} faced the person behind it all.', 'With seconds to spare, {hero} made the call that would either save the city or end their life.'],
    resolutions: ['The story broke at dawn, and by noon three governments were denying everything.', '{Hero} disappeared again, but this time it was a choice - and the {motif} was safe.'],
    titles: ['Countdown to', 'The Protocol:', 'Deadline in'], themes: ['Trust', 'Conspiracy', 'Survival'],
  },
  'Historical Fiction': {
    hero: 'a printer\'s apprentice named Thomas', ally: 'a daring pamphleteer', setting: 'London in 1666', threat: 'the tide of history',
    openings: ['In {setting}, where news travelled by candlelight and rumour, {hero} set type by day and dreamed by night.', 'History remembers the great names of {setting}. It forgets people like {hero}.'],
    incitings: ['Then the {motif} fell into {hero}\'s hands, and with it a secret that powerful people wanted buried.', 'The summer brought fever, fear and {threat}, and nobody would be the same again.'],
    complications: ['To speak the truth was dangerous; to stay silent felt worse.', 'The city itself seemed to turn against them, street by narrow street.'],
    climaxes: ['As the city burned, {hero} ran toward the flames with the {motif} clutched to their chest.', 'Before the magistrate, with everything at stake, {hero} chose the truth.'],
    resolutions: ['The history books never mentioned {hero}. The people {hero} saved never forgot.', 'Centuries later, the {motif} sits behind museum glass, its story finally told.'],
    titles: ['The Year of', 'A Chronicle of', 'The Ashes of'], themes: ['Courage in Hard Times', 'Legacy', 'Justice'],
  },
  Dystopian: {
    hero: 'a factory worker named Nia', ally: 'a member of the underground', setting: 'the walled city of New Haven', threat: 'the Directorate',
    openings: ['In {setting}, citizens were told they were free. {Hero} had begun to doubt it.', 'The screens in {setting} said everything was fine. They always said everything was fine.'],
    incitings: ['Then {hero} found the {motif}, and learned what {threat} had been hiding beyond the walls.', 'A friend disappeared overnight, and the only thing left behind was the {motif}.'],
    complications: ['Every camera, every neighbour, every friend might be watching.', 'Joining the resistance meant giving up the only life {hero} had ever known.'],
    climaxes: ['In the heart of the Directorate\'s tower, {hero} broadcast the truth to every screen in the city.', 'Standing before the great gate, {hero} used the {motif} to open what was never meant to open.'],
    resolutions: ['The walls did not fall in a day, but that night, for the first time, people looked up.', 'Beyond the gate, the world was broken and beautiful, and it was finally theirs.'],
    titles: ['After the', 'The Last Days of', 'Children of'], themes: ['Freedom vs Control', 'Resistance', 'Hope'],
  },
  'Magical Realism': {
    hero: 'a baker named Lucía', ally: 'her grandmother', setting: 'a sleepy town where it always smells of oranges', threat: 'the quiet impossible thing',
    openings: ['In {setting}, nobody was surprised when it rained petals on Tuesdays.', '{Hero} had always known that the bread tasted of whatever the baker was feeling.'],
    incitings: ['So when the {motif} began to hum each night at midnight, only {hero} seemed worried.', 'The day {ally} forgot her own name, the {motif} began to glow.'],
    complications: ['The townspeople offered advice, most of it poetic and none of it useful.', 'Every small miracle seemed to cost a memory.'],
    climaxes: ['Under a sky full of slow-falling stars, {hero} finally listened to what the {motif} was trying to say.', 'At the festival, in front of everyone, {threat} became visible at last.'],
    resolutions: ['Afterwards, the oranges bloomed out of season, and nobody thought that was strange at all.', '{Hero} baked a loaf that tasted exactly like forgiveness, and gave it all away.'],
    titles: ['The Hours of', 'A Season of', 'The Quiet'], themes: ['Memory', 'Love and Loss', 'Wonder in the Ordinary'],
  },
  Western: {
    hero: 'a drifter named Cole', ally: 'the town\'s reluctant sheriff', setting: 'the dusty frontier town of Red Mesa', threat: 'the outlaw gang',
    openings: ['{Hero} rode into {setting} with a tired horse and no plans to stay.', 'The wind in {setting} carried two things: dust and trouble.'],
    incitings: ['Then {threat} rode in at noon, looking for the {motif}.', 'A dying man pressed the {motif} into {hero}\'s hand and asked for one last favour.'],
    complications: ['The townsfolk wanted help, but nobody wanted to stand in the street.', 'The railroad men had money, the outlaws had guns, and the law had one tired sheriff.'],
    climaxes: ['At high noon, in the empty street, {hero} faced {threat} alone - until {ally} stepped out beside them.', 'In the burning livery, with the {motif} in hand, {hero} made a choice that would echo across the frontier.'],
    resolutions: ['When the dust settled, {place} was a little safer, and {hero} rode on at sunset.', '{Hero} hung up the gun belt and stayed. Some places are worth putting down roots.'],
    titles: ['The Ballad of', 'Showdown at', 'The Last Ride of'], themes: ['Justice', 'Redemption', 'Community'],
  },
  Cyberpunk: {
    hero: 'a street hacker called Vex', ally: 'a burned-out ex-cop', setting: 'the neon sprawl of Neo-Kowloon', threat: 'the corporation',
    openings: ['In {setting}, the rain was acid, the air was advertising, and {hero} was running out of credit.', 'Everyone in {setting} was wired into something. {Hero} was wired into everything.'],
    incitings: ['A routine data heist turned up the {motif} - and a kill order from {threat}.', 'The job was simple: steal the {motif}, ask no questions. {Hero} asked questions.'],
    complications: ['Every firewall they broke woke three more, and the black ice was learning.', 'Their contacts went dark one by one, erased from the network like they had never existed.'],
    climaxes: ['Jacked in at the top of the tower, {hero} held the {motif} over the core and chose to set it free.', 'In the flooded server vault, {hero} came face to face with the mind behind {threat}.'],
    resolutions: ['The next morning, every screen in the city told the truth for exactly sixty seconds. It was enough.', '{Hero} vanished into the noise of {place}, a ghost with a conscience.'],
    titles: ['Neon', 'Ghost in', 'The Code of'], themes: ['Humanity vs Machine', 'Corporate Power', 'Identity'],
  },
  Steampunk: {
    hero: 'an inventor named Ada Fairweather', ally: 'a clockwork automaton', setting: 'the airship city of Brasshaven', threat: 'the Iron Consortium',
    openings: ['High above the clouds, {setting} ran on steam, ambition and {hero}\'s questionable inventions.', 'In a workshop full of gears in {setting}, {hero} was one bolt away from a breakthrough.'],
    incitings: ['Then {threat} came calling, demanding the {motif} and offering nothing but threats.', 'The {motif} began to tick on its own, counting down to something nobody understood.'],
    complications: ['The city\'s engines were failing, and every repair revealed more sabotage.', 'The only person who understood the blueprints had been missing for a decade.'],
    climaxes: ['As the city tilted toward the storm, {hero} climbed into the great engine with the {motif} in hand.', 'In the Consortium\'s gilded hall, {hero} revealed exactly what the {motif} could do.'],
    resolutions: ['{Place} sailed on, lighter and freer, its engines humming a new tune.', 'The {motif} was installed at the heart of the city, where it belonged, ticking steadily at last.'],
    titles: ['The Clockwork', 'Engines of', 'The Brass'], themes: ['Invention', 'Progress vs Tradition', 'Ingenuity'],
  },
  'General Fiction': {
    hero: 'a woman named Mara', ally: 'an old friend', setting: 'a city that never quite slept', threat: 'the thing none of them could name',
    openings: ['{Hero} lived in {setting}, where most days looked exactly like the one before.', 'It was an ordinary morning in {setting}, which is exactly when extraordinary things like to happen.'],
    incitings: ['Then the {motif} appeared, and nothing was ordinary again.', 'A single unexpected knock at the door changed everything.'],
    complications: ['The easy path and the right path pointed in opposite directions.', 'Every answer {hero} found raised two new questions.'],
    climaxes: ['At the moment of truth, {hero} finally understood what the {motif} had meant all along.', 'Everything came down to one decision, and {hero} made it.'],
    resolutions: ['Life went on, as it does, but {hero} walked through it differently now.', 'Some changes are loud. This one was quiet, and it lasted.'],
    titles: ['The Story of', 'A Tale of', 'The Year of'], themes: ['Change', 'Identity', 'Growth'],
  },
};

interface MoodProfile {
  atmosphere: string[];
  ending: string;
  analysis: string;
  theme: string;
}

const MOOD_PROFILES: Record<string, MoodProfile> = {
  Uplifting: { atmosphere: ['Hope bloomed in unexpected places, reminding everyone that light always finds a way in.', 'Even on the hardest days, small kindnesses kept appearing, like signposts.'], ending: 'hope', analysis: 'Warm, hopeful beats balance the conflict so the story lifts rather than weighs down.', theme: 'Hope' },
  Dark: { atmosphere: ['Shadows lengthened with every passing hour, and dread settled over {place} like a heavy blanket.', 'Nothing was safe, and no one was entirely innocent.'], ending: 'hard-won survival', analysis: 'A heavy, shadowed tone raises the stakes and keeps every victory costly.', theme: 'Moral Ambiguity' },
  Mysterious: { atmosphere: ['Questions multiplied faster than answers, and every revelation only deepened the enigma.', 'Something was just out of sight, always one step ahead.'], ending: 'lingering wonder', analysis: 'Withheld information and unanswered questions keep the reader leaning forward.', theme: 'The Unknown' },
  Romantic: { atmosphere: ['Hearts spoke in languages words could never capture, and every stolen glance carried unspoken promises.', 'The air itself seemed warmer whenever they were close.'], ending: 'tenderness', analysis: 'Emotional closeness and longing colour every scene, even the dangerous ones.', theme: 'Love' },
  Humorous: { atmosphere: ['Things went wrong in the most ridiculous ways possible, and then got slightly worse.', 'If it had not been so absurd, it might have been a tragedy.'], ending: 'laughter', analysis: 'Comic escalation and absurd details keep the tone light without losing the stakes.', theme: 'Absurdity' },
  Suspenseful: { atmosphere: ['Every creak and every silence felt like a warning.', 'Time was running out, and everyone could feel it.'], ending: 'relief', analysis: 'Ticking clocks and near-misses sustain tension from beginning to end.', theme: 'Danger' },
  Melancholic: { atmosphere: ['There was a sadness in {place} that no amount of sunlight could lift.', 'Memories arrived uninvited, heavy with everything that had been lost.'], ending: 'bittersweet acceptance', analysis: 'A reflective, wistful tone lets loss and memory shape the characters\' choices.', theme: 'Loss' },
  Inspiring: { atmosphere: ['Each small step forward proved that one person really could make a difference.', 'Courage turned out to be contagious.'], ending: 'triumph', analysis: 'Growth and perseverance drive the narrative toward an empowering finish.', theme: 'Perseverance' },
  Eerie: { atmosphere: ['The silence in {place} felt wrong, as if it were listening.', 'Familiar things looked subtly out of place, like a picture hung slightly crooked.'], ending: 'unease', analysis: 'Quiet wrongness and unsettling details create a creeping, uncanny atmosphere.', theme: 'The Uncanny' },
  Adventurous: { atmosphere: ['Each step forward brought new challenges and discoveries, turning an ordinary journey into a quest.', 'The horizon kept calling, and they kept answering.'], ending: 'exhilaration', analysis: 'Momentum, discovery and physical challenges keep the pace brisk.', theme: 'Exploration' },
  Nostalgic: { atmosphere: ['Everything reminded them of how things used to be - and of who they used to be.', 'Old songs, old streets, old promises: the past was everywhere.'], ending: 'gentle reflection', analysis: 'Memory and longing for the past frame the present-day events.', theme: 'Memory' },
  Intense: { atmosphere: ['There was no time to breathe, no room for mistakes.', 'Every choice carried the weight of life and death.'], ending: 'catharsis', analysis: 'High-pressure scenes and relentless pacing make every decision feel critical.', theme: 'Pressure' },
  Whimsical: { atmosphere: ['Teacups argued, clouds took the shape of old friends, and nobody found this odd.', 'The world seemed to wink at them, as though it were in on a joke.'], ending: 'delight', analysis: 'Playful, imaginative details give the story a light, storybook quality.', theme: 'Imagination' },
  Dramatic: { atmosphere: ['Every conversation felt like it might be the last honest one.', 'Emotions ran high, and old wounds refused to stay closed.'], ending: 'resolution', analysis: 'Big emotions and confrontations drive the characters toward change.', theme: 'Conflict' },
  Peaceful: { atmosphere: ['There was a stillness in {place} that made even hard things feel manageable.', 'The days moved slowly, gently, like a river in late summer.'], ending: 'calm', analysis: 'A gentle, unhurried rhythm lets small moments carry the emotional weight.', theme: 'Serenity' },
};

const DEFAULT_MOOD: MoodProfile = {
  atmosphere: ['The days that followed were strange and bright and full of questions.', 'Nothing felt quite the same as before.'],
  ending: 'quiet change',
  analysis: 'The tone stays balanced, letting events rather than atmosphere lead.',
  theme: 'Change',
};

const BEATS = [
  '{Hero} spent the night turning the problem over and over. Somewhere in {place}, an answer was waiting, and {hero} meant to find it before {threat} did.',
  'It was {ally} who noticed the first real clue: something about the {motif} that did not fit. "Look closer," {ally} said, and for once {hero} listened.',
  'They argued, the way people do when the stakes rise. {Ally} wanted to wait. {Hero} knew that waiting was a luxury they no longer had.',
  'The first attempt failed. The second failed worse. By the third, {hero} had learned something more useful than success: exactly what {threat} wanted.',
  'For a while it almost seemed simple. {Hero} and {ally} shared a quiet meal and a rare laugh, and neither of them mentioned the {motif}.',
  'Then came the setback nobody had planned for. A door closed, a promise broke, and {hero} was suddenly alone with the weight of every choice so far.',
  'Rumours travelled faster than the truth through {place}. By morning everyone had an opinion about {hero}, and most of them were wrong.',
  '{Hero} returned to the place where it had all started and saw it with new eyes. The {motif} had been a message all along.',
  '{Ally} made a choice that changed everything - brave, reckless and completely unexpected. {Hero} could only follow.',
  'There was a moment, at the edge of it all, when {hero} could have walked away. Nobody would have blamed them. {Hero} stayed.',
  'Piece by piece, the pattern came together. Each small victory cost something, and {hero} began to understand the true price of the {motif}.',
  'Old memories surfaced at the worst possible time, reminding {hero} why this mattered so much.',
];

const INTROS = [
  'It was not the kind of life that stories usually happen to, and that suited everyone just fine.',
  'Most days there were quiet, careful and predictable.',
  'Nobody expected much to change, and for a long time nothing did.',
  'Small things were noticed there, and big things were politely ignored.',
];

const EPILOGUES = [
  'Long afterwards, people in {place} still told the story, and each time it grew a little - which is how you know a story is true.',
  'If you ask {hero} about it now, they will only smile and change the subject. But they keep the {motif} close.',
  'And somewhere, quietly, the next story was already beginning.',
];

const THEME_KEYWORDS: [RegExp, string][] = [
  [/\b(love|lover|romance|heart|kiss)\b/i, 'Love'],
  [/\b(family|mother|father|sister|brother|daughter|son|grand\w+)\b/i, 'Family'],
  [/\b(friend|friends|friendship|companion)\b/i, 'Friendship'],
  [/\b(revenge|vengeance|avenge)\b/i, 'Revenge'],
  [/\b(betray\w*|traitor)\b/i, 'Betrayal'],
  [/\b(power|throne|crown|king|queen|empire)\b/i, 'Power'],
  [/\b(lost|loss|grief|death|dies|died|mourning)\b/i, 'Loss'],
  [/\b(free|freedom|escape|prison|cage)\b/i, 'Freedom'],
  [/\b(secret|hidden|lie|lies|truth)\b/i, 'Truth and Secrets'],
  [/\b(who (he|she|they) (is|are|was)|identity|memory|memories|forget)\b/i, 'Identity'],
  [/\b(time|past|future|travel)\b/i, 'Time'],
];

const STOPWORDS = new Set(
  ('a an the and or but of to in on at by for with from into onto over under about after before when while who whom whose which that this these those ' +
    'is are was were be been being has have had do does did can could will would should may might must she he they them their his her its it i you we ' +
    'our your my me us one two some any all every no not only very just then than so such there here what where why how story day night world people ' +
    'someone something everything nothing')
    .split(' ')
);

/** Common verbs that would make a poor story motif ("the talk", "the finds"). */
const VERBS = new Set(
  ('discover discovers find finds learn learns become becomes try tries want wants talk talks walk walks run runs live lives meet meets fall falls ' +
    'fight fights save saves travel travels return returns wake wakes begin begins start starts keep keeps leave leaves look looks open opens turn ' +
    'turns tell tells know knows think thinks feel feels make makes take takes give gives come comes goes gets sees hear hears help helps decide ' +
    'decides realize realizes realise realises must need needs stop stops change changes hide hides search searches left said saw gave took ' +
    'made came went got knew thought felt told found lost won ran fell met kept brought bought sold wrote spoke stole broke grew flew')
    .split(' ')
);

/** Base forms used to spot inflected verbs ("dies", "paints", "arrived"). */
const BASE_VERBS = new Set(
  ('die paint leave say see give send bring hold sing dance write read build break steal kill love hate win lose sell buy eat drink sleep dream ' +
    'fly swim climb cry laugh smile wait watch follow chase escape arrive disappear vanish appear move stay grow remember forget believe speak ' +
    'exist live work play fight save wake')
    .split(' ')
);

const isVerb = (w: string) =>
  VERBS.has(w) || BASE_VERBS.has(w) || BASE_VERBS.has(w.replace(/s$/, '')) || BASE_VERBS.has(w.replace(/es$/, '')) || BASE_VERBS.has(w.replace(/d$/, '')) || BASE_VERBS.has(w.replace(/ed$/, ''));

/** Nouns that describe a person - good protagonists, poor motifs. */
const PERSON_NOUNS = new Set(
  ('girl boy man woman child kid person detective king queen prince princess knight wizard witch soldier doctor nurse teacher student farmer sailor ' +
    'pilot captain scientist robot android thief orphan mother father sister brother daughter son friend stranger boss officer agent hero heroine ' +
    'warrior hunter spy artist writer baker chef musician engineer hacker widow grandmother grandfather twins couple family astronaut explorer ' +
    'owner master mentor rival lover partner neighbor neighbour wife husband uncle aunt cousin chefs rivals friends strangers')
    .split(' ')
);

const PREPOSITIONS = new Set(
  'during through across against between near inside outside without within behind beyond above below toward towards until since upon among around along'.split(' ')
);

const DETERMINER_PHRASE = /\b(a|an|the|his|her|their|its|my|our|your|one)\s+([a-z'-]+(?:\s+[a-z'-]+){0,2})/gi;

const usableWord = (w: string) => !STOPWORDS.has(w) && !VERBS.has(w) && !PREPOSITIONS.has(w) && !/(ing|ed|ly)$/.test(w) && w.length >= 3;

interface NounPhrase {
  determiner: string;
  words: string[];
  head: string;
}

/** Determiner phrases ("an old lantern that…" -> modifiers [old], head "lantern"). */
const nounPhrases = (text: string): NounPhrase[] => {
  const out: NounPhrase[] = [];
  const re = new RegExp(DETERMINER_PHRASE.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const taken: string[] = [];
    for (const w of m[2].split(/\s+/)) {
      const lw = w.toLowerCase();
      // Right after a determiner a verb-like word is a noun ("a dream"); later it ends the phrase ("its owner dies").
      if (STOPWORDS.has(lw) || PREPOSITIONS.has(lw) || (taken.length > 0 && isVerb(lw))) break;
      taken.push(w);
    }
    const head = (taken[taken.length - 1] || '').toLowerCase();
    if (head && usableWord(head)) out.push({ determiner: m[1].toLowerCase(), words: taken, head });
  }
  return out;
};

const keywordsFrom = (text: string): string[] => {
  const counts = new Map<string, number>();
  (text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || []).forEach((w) => {
    if (!usableWord(w) || PERSON_NOUNS.has(w) || isVerb(w)) return;
    counts.set(w, (counts.get(w) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([w]) => w);
};

/** Object nouns introduced with a determiner ("a strange lantern" -> "lantern"), in order of appearance. */
const objectNouns = (text: string): string[] =>
  Array.from(new Set(nounPhrases(text).map((p) => p.head).filter((h) => !PERSON_NOUNS.has(h))));

/** A person introduced in the prompt ("a young girl"), used when no characters were given. */
const personFromPrompt = (text: string): string | null => {
  // "my grandmother" is someone *related to* the protagonist, so only a/an/the phrases qualify.
  const person = nounPhrases(text).find((p) => PERSON_NOUNS.has(p.head) && ['a', 'an', 'the'].includes(p.determiner));
  if (!person) return null;
  const words = person.words.join(' ').toLowerCase();
  return `${person.determiner === 'the' ? 'the' : /^[aeiou]/.test(words) ? 'an' : 'a'} ${words}`;
};

// ---------------------------------------------------------------------------
// Composition helpers
// ---------------------------------------------------------------------------

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const lowerFirst = (s: string) => (s && !/^[A-Z][a-z]*[A-Z]|^I\b|^[A-Z][a-z]+\s+[A-Z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const ensurePeriod = (s: string) => (/[.!?…"']$/.test(s) ? s : `${s}.`);

/** "a brave knight" -> "the brave knight"; proper names stay as they are. */
const laterReference = (phrase: string): string => {
  const p = clean(phrase);
  const named = p.match(/\b(?:named|called)\s+([A-Z][\w'-]*(?:\s[A-Z][\w'-]*)?)/);
  if (named) return named[1];
  if (/^(a|an)\s/i.test(p)) return p.replace(/^(a|an)\s/i, 'the ');
  return p;
};

const parseCharacters = (text: string): string[] =>
  text
    .split(/,|;|&|\band\b/i)
    .map((c) => clean(c))
    .filter((c) => c.length > 0 && c.length <= 80)
    .slice(0, 5);

const premiseSentence = (prompt: string): string => {
  const p = clean(prompt);
  const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
  const joined = clean(sentences.slice(0, 3).join(' '));
  return ensurePeriod(cap(joined.length > 400 ? `${joined.slice(0, 397)}…` : joined));
};

interface Cast {
  heroFirst: string;
  hero: string;
  allyFirst: string;
  ally: string;
  extras: string[];
  settingFirst: string;
  place: string;
  motif: string;
  threat: string;
}

const fill = (template: string, cast: Cast, firstMentions: { hero: boolean; ally: boolean; setting: boolean }): string => {
  let out = template;
  const heroText = () => {
    const v = firstMentions.hero ? cast.heroFirst : cast.hero;
    firstMentions.hero = false;
    return v;
  };
  const allyText = () => {
    const v = firstMentions.ally ? cast.allyFirst : cast.ally;
    firstMentions.ally = false;
    return v;
  };
  out = out.replace(/\{(Hero|hero|Ally|ally|Setting|setting|Place|place|motif|threat)\}/g, (_m, key: string) => {
    switch (key) {
      case 'Hero':
        return cap(heroText());
      case 'hero':
        return heroText();
      case 'Ally':
        return cap(allyText());
      case 'ally':
        return allyText();
      case 'Setting':
      case 'setting': {
        const v = firstMentions.setting ? cast.settingFirst : cast.place;
        firstMentions.setting = false;
        return key === 'Setting' ? cap(v) : v;
      }
      case 'Place':
        return cap(cast.place);
      case 'place':
        return cast.place;
      case 'motif':
        return cast.motif;
      default:
        return cast.threat;
    }
  });
  return out;
};

const titleCase = (s: string) => s.split(/\s+/).map(cap).join(' ');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const createStory = (input: StoryInput, variation = 0): StoryResult => {
  const genreName = (GENRES as readonly string[]).includes(input.genre) ? input.genre : 'General Fiction';
  const genre = GENRE_PROFILES[genreName];
  const mood = MOOD_PROFILES[input.mood] ?? DEFAULT_MOOD;
  const length: LengthValue = LENGTHS.some((l) => l.value === input.length) ? (input.length as LengthValue) : 'short';
  const prompt = clean(input.prompt);

  const seed = hashString([prompt, genreName, input.mood, length, input.characters, input.setting, variation].join('|'));
  const rng = mulberry32(seed);

  const characters = parseCharacters(input.characters);
  const characterWords = new Set(characters.join(' ').toLowerCase().split(/\W+/));
  const settingWords = new Set(clean(input.setting).toLowerCase().split(/\W+/));
  const candidates = [...objectNouns(prompt), ...keywordsFrom(prompt)].filter((k) => !characterWords.has(k) && !settingWords.has(k));
  const motifFromPrompt = candidates[0];
  const motifWord = motifFromPrompt ?? 'secret';

  const heroFirst = characters[0] ?? personFromPrompt(prompt) ?? genre.hero;
  const allyFirst = characters[1] ?? genre.ally;
  const settingFirst = clean(input.setting) || genre.setting;
  const cast: Cast = {
    heroFirst,
    hero: laterReference(heroFirst),
    allyFirst,
    ally: laterReference(allyFirst),
    extras: characters.slice(2),
    settingFirst,
    place: laterReference(settingFirst),
    motif: motifWord,
    threat: genre.threat,
  };
  const first = { hero: true, ally: true, setting: true };
  const f = (t: string) => fill(t, cast, first);

  const opening = f(pick(rng, genre.openings));
  const premise = `It all began like this: ${premiseSentence(prompt)}`;
  const inciting = f(pick(rng, genre.incitings));
  const [complicationA, complicationB] = shuffle(rng, genre.complications).map(f);
  const [atmosphereA, atmosphereB] = shuffle(rng, mood.atmosphere).map(f);
  const intro = f(pick(rng, INTROS));
  const beatCount = length === 'flash' ? 0 : length === 'short' ? 4 : BEATS.length;
  const b = shuffle(rng, BEATS).slice(0, beatCount).map(f);
  const extrasLine = cast.extras.length
    ? f(`Along the way they were joined by ${cast.extras.join(' and ')}, who ${cast.extras.length > 1 ? 'each ' : ''}had their own reasons for wanting to see it through.`)
    : '';
  const climax = f(pick(rng, genre.climaxes));
  const resolution = f(pick(rng, genre.resolutions));
  const endingLine = `In the end, what remained was ${mood.ending}.`;

  let paragraphs: string[];
  if (length === 'flash') {
    paragraphs = [
      `${opening} ${premise}`,
      `${inciting} ${complicationA} ${atmosphereA}`,
      `${climax} ${resolution}`,
    ];
  } else if (length === 'short') {
    paragraphs = [
      `${opening} ${intro}`,
      `${premise} ${atmosphereA}`,
      `${inciting} ${extrasLine}`,
      `${complicationA} ${b[0]}`,
      `${b[1]} ${b[2]}`,
      `${complicationB} ${b[3]} ${atmosphereB}`,
      climax,
      `${resolution} ${endingLine}`,
    ];
  } else {
    paragraphs = [
      `${opening} ${intro}`,
      `${premise} ${atmosphereA}`,
      `${inciting} ${extrasLine}`,
      `${complicationA} ${b[0]}`,
      `${b[1]} ${b[2]}`,
      `${b[3]} ${atmosphereB}`,
      `${complicationB} ${b[4]}`,
      `${b[5]} ${b[6]}`,
      `${b[7]} ${b[8]}`,
      `${b[9]} ${b[10]}`,
      b[11],
      climax,
      `${resolution} ${endingLine}`,
      f(pick(rng, EPILOGUES)),
    ];
  }

  const story = paragraphs.map(clean).filter(Boolean).join('\n\n');
  const wordCount = story.split(/\s+/).filter(Boolean).length;

  const prefix = pick(rng, genre.titles);
  const subject = motifFromPrompt ? `the ${titleCase(motifWord)}` : titleCase(cast.hero).replace(/^The /, 'the ');
  const endsWithPreposition = /\b(of|in|for|to|with|over|from|at|about)$/i.test(prefix);
  const title = `${prefix} ${endsWithPreposition ? subject : subject.replace(/^the /i, '')}`;

  const promptThemes = THEME_KEYWORDS.filter(([re]) => re.test(prompt)).map(([, t]) => t);
  const themes = Array.from(new Set([...promptThemes, ...genre.themes, mood.theme])).slice(0, 5);

  const charNotes = [
    `${cap(cast.heroFirst)} is the protagonist, driven by the events of the premise and tested by ${cast.threat}.`,
    `${cap(cast.allyFirst)} acts as ally and foil, pushing ${cast.hero} to act when it would be easier to wait.`,
    ...cast.extras.map((c) => `${cap(c)} plays a supporting role, widening the story's world.`),
  ];
  const characterAnalysis = characters.length
    ? charNotes.join(' ')
    : `${charNotes.join(' ')} (No characters were listed, so the cast comes from your prompt and typical ${genreName.toLowerCase()} roles - add your own to personalise the story.)`;

  const plotSummary = [
    `Act I introduces ${cast.heroFirst} in ${cast.settingFirst}. The premise - ${lowerFirst(premiseSentence(prompt).replace(/[.!?…]$/, ''))} - sets things in motion.`,
    `Act II escalates through ${2 + beatCount} turns as ${cast.threat} closes in, centred on the ${cast.motif} and ${cast.hero}'s bond with ${cast.ally}.`,
    `Act III resolves in a climactic confrontation and ends on a note of ${mood.ending}.`,
  ].join(' ');

  const moodAnalysis = input.mood
    ? `${input.mood}: ${mood.analysis}`
    : `No mood selected - ${mood.analysis.charAt(0).toLowerCase()}${mood.analysis.slice(1)}`;

  const sequelSuggestions = [
    `Follow ${cast.ally} after the events of this story - what did it cost them?`,
    `Return to ${cast.place} years later, when ${cast.threat} (or something like it) resurfaces.`,
    `A prequel revealing where the ${cast.motif} really came from.`,
    `Tell the same events from the point of view of ${cast.threat}.`,
    `Send ${cast.hero} somewhere completely unfamiliar with only the lessons learned here.`,
  ];

  return {
    id: `${seed.toString(36)}-${Date.now().toString(36)}`,
    createdAt: new Date().toLocaleString(),
    title,
    story,
    genre: genreName,
    mood: input.mood || 'Balanced',
    wordCount,
    readingTime: Math.max(1, Math.round(wordCount / 200)),
    characterAnalysis,
    plotSummary,
    themes,
    moodAnalysis,
    sequelSuggestions,
  };
};

export const storyToText = (story: StoryResult): string =>
  [
    story.title,
    '='.repeat(Math.min(story.title.length, 60)),
    '',
    `Genre: ${story.genre} · Mood: ${story.mood}`,
    `Word count: ${story.wordCount} · Reading time: ${story.readingTime} min`,
    `Generated: ${story.createdAt}`,
    '',
    story.story,
    '',
    '---',
    '',
    'PLOT SUMMARY',
    story.plotSummary,
    '',
    'CHARACTERS',
    story.characterAnalysis,
    '',
    'THEMES',
    ...story.themes.map((t) => `• ${t}`),
    '',
    'MOOD',
    story.moodAnalysis,
    '',
    'SEQUEL IDEAS',
    ...story.sequelSuggestions.map((s) => `• ${s}`),
    '',
    'Generated with the Aivello Creative Story Generator',
  ].join('\n');

export const downloadStoryFile = (story: StoryResult): void => {
  const name = story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'story';
  const blob = new Blob([storyToText(story)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.txt`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
