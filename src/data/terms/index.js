import { koreanFoodTerms } from './korean-food';
import { beautyGeneralTerms } from './beauty-general';
import { pastryTerms } from './pastry';

export const terms = {
    'korean-food': koreanFoodTerms,
    'beauty-general': beautyGeneralTerms,
    'pastry': pastryTerms,
};

// 전체 용어 목록 (자격증 무관)
export function getAllTerms() {
    const all = [];
    Object.entries(terms).forEach(([licenceId, termList]) => {
        termList.forEach(t => all.push({ ...t, licenceId }));
    });
    return all;
}

// 자격증별 용어
export function getTermsByLicence(licenceId) {
    return terms[licenceId] || [];
}

// 카테고리 목록
export function getCategories(licenceId) {
    const termList = terms[licenceId] || [];
    return [...new Set(termList.map(t => t.category))];
}

// 검색
export function searchTerms(query, language, licenceId) {
    const source = licenceId ? (terms[licenceId] || []) : getAllTerms();
    const q = query.toLowerCase();

    return source.filter(t => {
        const matchKorean = t.korean.toLowerCase().includes(q);
        const matchTranslation = t[language]?.toLowerCase().includes(q);
        const matchPronunciation = t.pronunciation?.toLowerCase().includes(q);
        return matchKorean || matchTranslation || matchPronunciation;
    });
}
