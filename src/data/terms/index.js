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

// 검색 — 한국어/발음 + 5개 언어 모두 매칭
const SEARCH_LANGS = ['vi', 'zh', 'th', 'tl', 'my'];

export function searchTerms(query, language, licenceId) {
    const source = licenceId ? (terms[licenceId] || []) : getAllTerms();
    const q = query.toLowerCase();

    return source.filter(t => {
        if (t.korean.toLowerCase().includes(q)) return true;
        if (t.pronunciation?.toLowerCase().includes(q)) return true;
        for (const lang of SEARCH_LANGS) {
            if (t[lang]?.toLowerCase().includes(q)) return true;
        }
        return false;
    });
}
