// 5개 언어 용어 사전 데이터 (자격증별)

export const terms = {
    // ===== 한식조리기능사 =====
    'korean-food': [
        { korean: 'HACCP', pronunciation: 'hae-seop', category: '식품위생', vi: 'An toàn thực phẩm (HACCP)', zh: '食品安全管理 (HACCP)', th: 'ระบบความปลอดภัยอาหาร', tl: 'Food Safety (HACCP)', my: 'အစားအစာဘေးကင်းရေး' },
        { korean: '식중독', pronunciation: 'sik-jung-dok', category: '식품위생', vi: 'Ngộ độc thực phẩm', zh: '食物中毒', th: 'อาหารเป็นพิษ', tl: 'Food poisoning', my: 'အစားအစာအဆိပ်သင့်ခြင်း' },
        { korean: '멸균', pronunciation: 'myeol-gyun', category: '식품위생', vi: 'Khử trùng', zh: '灭菌', th: 'การฆ่าเชื้อ', tl: 'Sterilization', my: 'ပိုးသတ်ခြင်း' },
        { korean: '소독', pronunciation: 'so-dok', category: '식품위생', vi: 'Sát trùng/Khử trùng', zh: '消毒', th: 'การฆ่าเชื้อโรค', tl: 'Disinfection', my: 'ပိုးသတ်ဆေးခြင်း' },
        { korean: '보존료', pronunciation: 'bo-jon-ryo', category: '식품위생', vi: 'Chất bảo quản', zh: '防腐剂', th: 'สารกันบูด', tl: 'Preservative', my: 'ထိန်းသိမ်းဆေး' },
        { korean: '영업허가', pronunciation: 'yeong-eop-heo-ga', category: '식품위생', vi: 'Giấy phép kinh doanh', zh: '营业许可', th: 'ใบอนุญาตประกอบกิจการ', tl: 'Business permit', my: 'လုပ်ငန်းလိုင်စင်' },
        { korean: '탄수화물', pronunciation: 'tan-su-hwa-mul', category: '식품학', vi: 'Carbohydrate', zh: '碳水化合物', th: 'คาร์โบไฮเดรต', tl: 'Carbohydrate', my: 'ကာဗိုဟိုက်ဒရိတ်' },
        { korean: '단백질', pronunciation: 'dan-baek-jil', category: '식품학', vi: 'Protein/Chất đạm', zh: '蛋白质', th: 'โปรตีน', tl: 'Protein', my: 'ပရိုတင်း' },
        { korean: '지방', pronunciation: 'ji-bang', category: '식품학', vi: 'Chất béo/Mỡ', zh: '脂肪', th: 'ไขมัน', tl: 'Fat/Lipid', my: 'အဆီ' },
        { korean: '비타민', pronunciation: 'bi-ta-min', category: '식품학', vi: 'Vitamin', zh: '维生素', th: 'วิตามิน', tl: 'Vitamin', my: 'ဗီတာမင်' },
        { korean: '호화', pronunciation: 'ho-hwa', category: '식품학', vi: 'Hồ hóa (Gelatinization)', zh: '糊化', th: 'เจลาติไนเซชัน', tl: 'Gelatinization', my: 'ဂျယ်လ်လာတင်နိုင်ဇေးရှင်း' },
        { korean: '열변성', pronunciation: 'yeol-byeon-seong', category: '식품학', vi: 'Biến tính nhiệt', zh: '热变性', th: 'การเปลี่ยนสภาพจากความร้อน', tl: 'Heat denaturation', my: 'အပူဖြင့်ပြောင်းလဲခြင်း' },
        { korean: '갈변', pronunciation: 'gal-byeon', category: '식품학', vi: 'Hóa nâu (Browning)', zh: '褐变', th: 'การเปลี่ยนเป็นสีน้ำตาล', tl: 'Browning', my: 'အညိုရောင်ပြောင်းခြင်း' },
        { korean: '발효', pronunciation: 'bal-hyo', category: '식품학', vi: 'Lên men', zh: '发酵', th: 'การหมัก', tl: 'Fermentation', my: 'အချဉ်ဖောက်ခြင်း' },
        { korean: '젖산균', pronunciation: 'jeot-san-gyun', category: '식품학', vi: 'Vi khuẩn lactic', zh: '乳酸菌', th: 'แลคโตบาซิลลัส', tl: 'Lactic acid bacteria', my: 'နို့ချဉ်ဘက်တီးရီးယား' },
        { korean: '육수', pronunciation: 'yuk-su', category: '조리이론', vi: 'Nước dùng/Nước hầm', zh: '高汤', th: 'น้ำซุป', tl: 'Broth/Stock', my: 'ဟင်းချို' },
        { korean: '고추장', pronunciation: 'go-chu-jang', category: '조리이론', vi: 'Tương ớt Hàn Quốc', zh: '辣椒酱', th: 'โกชูจัง', tl: 'Gochujang (Red pepper paste)', my: 'ငရုတ်သီးပိစပ်' },
        { korean: '된장', pronunciation: 'doen-jang', category: '조리이론', vi: 'Tương đậu Hàn Quốc', zh: '大酱', th: 'เตนจัง', tl: 'Doenjang (Soybean paste)', my: 'ပဲငံပြာရည်' },
        { korean: '습열조리', pronunciation: 'seup-yeol-jo-ri', category: '조리이론', vi: 'Nấu bằng hơi nước', zh: '湿热烹饪', th: 'การปรุงอาหารด้วยความร้อนชื้น', tl: 'Moist-heat cooking', my: 'အစိုဓာတ်အပူဖြင့်ချက်ပြုတ်ခြင်း' },
        { korean: '건열조리', pronunciation: 'geon-yeol-jo-ri', category: '조리이론', vi: 'Nấu bằng nhiệt khô', zh: '干热烹饪', th: 'การปรุงอาหารด้วยความร้อนแห้ง', tl: 'Dry-heat cooking', my: 'ခြောက်သွေ့အပူဖြင့်ချက်ပြုတ်ခြင်း' },
        { korean: '데치기', pronunciation: 'de-chi-gi', category: '조리이론', vi: 'Chần/Trụng', zh: '焯水', th: 'ลวก', tl: 'Blanching', my: 'ရေနွေးတွင်နှစ်ခြင်း' },
        { korean: '볶음', pronunciation: 'bok-eum', category: '조리이론', vi: 'Xào', zh: '炒', th: 'ผัด', tl: 'Stir-fry', my: 'ကြော်ခြင်း' },
        { korean: '찜', pronunciation: 'jjim', category: '조리이론', vi: 'Hấp/Hầm', zh: '蒸/炖', th: 'นึ่ง', tl: 'Steaming/Braising', my: 'ပေါင်းခြင်း' },
    ],

    // ===== 미용사(일반) =====
    'beauty-general': [
        { korean: '케라틴', pronunciation: 'ke-ra-tin', category: '두피·모발', vi: 'Keratin', zh: '角蛋白', th: 'เคราติน', tl: 'Keratin', my: 'ကီရာတင်' },
        { korean: '멜라닌', pronunciation: 'mel-la-nin', category: '두피·모발', vi: 'Melanin (Sắc tố)', zh: '黑色素', th: 'เมลานิน', tl: 'Melanin', my: 'မယ်လနင်' },
        { korean: '모피질', pronunciation: 'mo-pi-jil', category: '두피·모발', vi: 'Vỏ tóc (Cortex)', zh: '毛皮质', th: 'คอร์เทกซ์', tl: 'Hair Cortex', my: 'ဆံပင်ကော်တက်စ်' },
        { korean: '각질층', pronunciation: 'gak-jil-cheung', category: '두피·모발', vi: 'Lớp sừng', zh: '角质层', th: 'ชั้นเคราติน', tl: 'Stratum corneum', my: 'ခေါင်းလွှာ' },
        { korean: '표피', pronunciation: 'pyo-pi', category: '두피·모발', vi: 'Biểu bì', zh: '表皮', th: 'หนังกำพร้า', tl: 'Epidermis', my: 'အပြင်သားရေ' },
        { korean: '퍼머넌트 웨이브', pronunciation: 'peo-meo-neon-teu we-i-beu', category: '미용이론', vi: 'Uốn tóc vĩnh viễn', zh: '永久烫发', th: 'ดัดผมถาวร', tl: 'Permanent wave', my: 'ဆံပင်အမြဲတမ်းကောက်ခြင်း' },
        { korean: '아줄렌', pronunciation: 'a-jul-len', category: '화장품학', vi: 'Azulene (chiết xuất hoa cúc)', zh: '甘菊蓝', th: 'อะซูลีน', tl: 'Azulene', my: 'အာဇူလင်း' },
        { korean: '진정', pronunciation: 'jin-jeong', category: '화장품학', vi: 'Làm dịu', zh: '镇静/舒缓', th: 'สงบ', tl: 'Calming/Soothing', my: 'ငြိမ်းချမ်းခြင်း' },
        { korean: 'SPF', pronunciation: 'es-pi-e-peu', category: '화장품학', vi: 'Chỉ số chống nắng', zh: '防晒系数', th: 'ค่าป้องกันแดด', tl: 'Sun Protection Factor', my: 'နေရောင်ခြည်ကာကွယ်ခြင်း' },
        { korean: '고압증기 멸균', pronunciation: 'go-ap-jeung-gi myeol-gyun', category: '공중위생', vi: 'Hấp tiệt trùng áp suất cao', zh: '高压蒸汽灭菌', th: 'การอบไอน้ำแรงดันสูง', tl: 'High-pressure steam sterilization', my: 'အပူချိန်မြင့်ရေငွေ့ပိုးသတ်ခြင်း' },
        { korean: '포자', pronunciation: 'po-ja', category: '공중위생', vi: 'Bào tử', zh: '芽孢', th: 'สปอร์', tl: 'Spore', my: 'မှိုပွင့်' },
        { korean: '보정', pronunciation: 'bo-jeong', category: '미용이론', vi: 'Điều chỉnh/Hiệu chỉnh', zh: '修正/校正', th: 'แก้ไข', tl: 'Correction/Adjustment', my: 'ပြင်ဆင်ခြင်း' },
    ],
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
