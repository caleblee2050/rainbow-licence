// 번역 접근 헬퍼

const LANG_CODES = ['vi', 'zh', 'th', 'tl', 'my'];
const VERIFIED_LANGS = ['vi', 'zh'];

export function getTranslatedQuestion(question, lang) {
    return question?.translations?.[lang]?.question || null;
}

export function getTranslatedOptions(question, lang) {
    return question?.translations?.[lang]?.options || null;
}

export function getTranslatedExplanation(question, lang) {
    return question?.translations?.[lang]?.explanation || null;
}

export function getKeywordHints(question, lang) {
    return question?.keywordHints?.[lang] || [];
}

export function isLangVerified(lang) {
    return VERIFIED_LANGS.includes(lang);
}

export function getLangBadge(lang) {
    return isLangVerified(lang) ? '✓ 검수 완료' : 'AI 번역';
}

export { LANG_CODES, VERIFIED_LANGS };
