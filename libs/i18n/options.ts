// Interests and Goals with translation keys
// The 'key' is sent to API (English), 'translationKey' is used for display

export const INTERESTS_OPTIONS = [
  { key: 'Web Development', translationKey: 'options.webDevelopment' },
  { key: 'Mobile Development', translationKey: 'options.mobileDevelopment' },
  { key: 'Data Science', translationKey: 'options.dataScience' },
  { key: 'Machine Learning', translationKey: 'options.machineLearning' },
  { key: 'Artificial Intelligence', translationKey: 'options.artificialIntelligence' },
  { key: 'Cloud Computing', translationKey: 'options.cloudComputing' },
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
