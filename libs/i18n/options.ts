// Interests and Goals with translation keys
// The 'key' is sent to API (English), 'translationKey' is used for display

export const INTERESTS_OPTIONS = [
  { key: 'Fullstack Development', translationKey: 'options.fullstackDevelopment' },
  { key: 'Mobile Development', translationKey: 'options.mobileDevelopment' },
  { key: 'Data Science', translationKey: 'options.dataScience' },
  { key: 'AI & Machine Learning', translationKey: 'options.aiMachineLearning' },
  { key: 'Cloud Computing', translationKey: 'options.cloudComputing' },
  { key: 'Data Engineering', translationKey: 'options.dataEngineering' },
  { key: 'Primary Skills', translationKey: 'options.primarySkills' },
  { key: 'Chemistry', translationKey: 'options.chemistry' },
  { key: 'Physics', translationKey: 'options.physics' },
  { key: 'DevOps', translationKey: 'options.devOps' },
  { key: 'Cybersecurity', translationKey: 'options.cybersecurity' },
  { key: 'Blockchain', translationKey: 'options.blockchain' },
  { key: 'Game Development', translationKey: 'options.gameDevelopment' },
  { key: 'UI/UX Design', translationKey: 'options.uiUxDesign' },
  { key: 'Digital Marketing', translationKey: 'options.digitalMarketing' },
  { key: 'Business', translationKey: 'options.business' },
  { key: 'Finance', translationKey: 'options.finance' },
  { key: 'Photography', translationKey: 'options.photography' },
  { key: 'Music Production', translationKey: 'options.musicProduction' },
  { key: 'Writing', translationKey: 'options.writing' },
  { key: 'Language Learning', translationKey: 'options.languageLearning' },
  { key: 'Fitness', translationKey: 'options.fitness' },
  { key: 'Nutrition', translationKey: 'options.nutrition' },
  { key: 'Psychology', translationKey: 'options.psychology' },
  { key: 'Philosophy', translationKey: 'options.philosophy' },
];

export const GOALS_OPTIONS = [
  { key: 'Career Advancement', translationKey: 'options.careerAdvancement' },
  { key: 'Personal Growth', translationKey: 'options.personalGrowth' },
  { key: 'Skill Development', translationKey: 'options.skillDevelopment' },
  { key: 'Hobby', translationKey: 'options.hobby' },
  { key: 'Start a Business', translationKey: 'options.startBusiness' },
  { key: 'Get Certified', translationKey: 'options.getCertified' },
  { key: 'Teach Others', translationKey: 'options.teachOthers' },
  { key: 'Stay Updated', translationKey: 'options.stayUpdated' },
  { key: 'Others', translationKey: 'options.others' },
];

// Helper to get all interest keys (for API)
export const getInterestKeys = () => INTERESTS_OPTIONS.map(i => i.key);

// Helper to get all goal keys (for API)
export const getGoalKeys = () => GOALS_OPTIONS.map(g => g.key);

// Helper to translate a key to display label
export const translateInterest = (key: string, t: (key: string) => string): string => {
  const option = INTERESTS_OPTIONS.find(i => i.key === key);
  return option ? t(option.translationKey) : key;
};

export const translateGoal = (key: string, t: (key: string) => string): string => {
  const option = GOALS_OPTIONS.find(g => g.key === key);
  return option ? t(option.translationKey) : key;
};

// Helper to get key from translated label (reverse lookup)
export const getInterestKey = (label: string, t: (key: string) => string): string => {
  const option = INTERESTS_OPTIONS.find(i => t(i.translationKey) === label);
  return option ? option.key : label;
};

export const getGoalKey = (label: string, t: (key: string) => string): string => {
  const option = GOALS_OPTIONS.find(g => t(g.translationKey) === label);
  return option ? option.key : label;
};

const normalizeOptionText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const INTEREST_ALIASES: Record<string, string> = {
  'web development': 'Fullstack Development',
  'web developer': 'Fullstack Development',
  'full stack': 'Fullstack Development',
  'fullstack': 'Fullstack Development',
  'full stack development': 'Fullstack Development',
  'frontend': 'Fullstack Development',
  'backend': 'Fullstack Development',
  'mobile apps': 'Mobile Development',
  'mobile app development': 'Mobile Development',
  'app development': 'Mobile Development',
  'ai': 'AI & Machine Learning',
  'artificial intelligence': 'AI & Machine Learning',
  'machine learning': 'AI & Machine Learning',
  'ai and ml': 'AI & Machine Learning',
  'ai ml': 'AI & Machine Learning',
  'ml': 'AI & Machine Learning',
  'cloud': 'Cloud Computing',
  'cloud engineering': 'Cloud Computing',
  'data': 'Data Science',
  'analytics': 'Data Science',
  'data analytics': 'Data Science',
  'primary education': 'Primary Skills',
  'school': 'Primary Skills',
  'cyber security': 'Cybersecurity',
  'security': 'Cybersecurity',
  'ui ux': 'UI/UX Design',
  'ui design': 'UI/UX Design',
  'ux design': 'UI/UX Design',
  'design': 'UI/UX Design',
  'marketing': 'Digital Marketing',
  'music': 'Music Production',
  'languages': 'Language Learning',
};

export const normalizeInterestKey = (value: string): string | null => {
  const normalizedValue = normalizeOptionText(value);
  if (!normalizedValue) return null;

  const directMatch = INTERESTS_OPTIONS.find(
    interest => normalizeOptionText(interest.key) === normalizedValue
  );
  if (directMatch) return directMatch.key;

  return INTEREST_ALIASES[normalizedValue] ?? null;
};

export const normalizeInterestKeys = (values: string[] = []): string[] => {
  const normalized = values
    .map(normalizeInterestKey)
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(normalized));
};
