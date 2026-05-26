// 미용사(일반) 용어 사전
export const beautyGeneralTerms = [
    // ── 기존 12개 ────────────────────────────────────────────────────
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
    // ── 신규 28개 ────────────────────────────────────────────────────
    // 두피·모발 (~10개)
    { korean: '모발', pronunciation: 'mo-bal', category: '두피·모발', vi: 'Tóc', zh: '头发', th: 'เส้นผม', tl: 'Hair', my: 'ဆံပင်' },
    { korean: '두피', pronunciation: 'du-pi', category: '두피·모발', vi: 'Da đầu', zh: '头皮', th: 'หนังศีรษะ', tl: 'Scalp', my: 'ဦးရေပြားအရေပြား' },
    { korean: '모표피', pronunciation: 'mo-pyo-pi', category: '두피·모발', vi: 'Biểu bì tóc (Cuticle)', zh: '毛表皮', th: 'คิวติเคิลผม', tl: 'Hair Cuticle', my: 'ဆံပင်ကျူတီကယ်' },
    { korean: '모수질', pronunciation: 'mo-su-jil', category: '두피·모발', vi: 'Tủy tóc (Medulla)', zh: '毛髓质', th: 'เมดัลลาผม', tl: 'Hair Medulla', my: 'ဆံပင်မဒ်ဒူလာ' },
    { korean: '모낭', pronunciation: 'mo-nang', category: '두피·모발', vi: 'Nang tóc', zh: '毛囊', th: 'รูขุมขน', tl: 'Hair Follicle', my: 'ဆံပင်အမြစ်အိတ်' },
    { korean: '성장기', pronunciation: 'seong-jang-gi', category: '두피·모발', vi: 'Giai đoạn mọc tóc (Anagen)', zh: '生长期', th: 'ระยะเจริญเติบโต', tl: 'Anagen phase', my: 'ကြီးထွားချိန်' },
    { korean: '퇴행기', pronunciation: 'toe-haeng-gi', category: '두피·모발', vi: 'Giai đoạn thoái hóa (Catagen)', zh: '退行期', th: 'ระยะถดถอย', tl: 'Catagen phase', my: 'ဆုတ်ယုတ်ချိန်' },
    { korean: '휴지기', pronunciation: 'hyu-ji-gi', category: '두피·모발', vi: 'Giai đoạn nghỉ ngơi (Telogen)', zh: '休止期', th: 'ระยะพัก', tl: 'Telogen phase', my: 'အနားယူချိန်' },
    { korean: '시스틴', pronunciation: 'si-seu-tin', category: '두피·모발', vi: 'Cystine (axit amin)', zh: '胱氨酸', th: 'ซิสทีน', tl: 'Cystine', my: 'ဆစ်တင်း' },
    { korean: '지성 두피', pronunciation: 'ji-seong du-pi', category: '두피·모발', vi: 'Da đầu dầu', zh: '油性头皮', th: 'หนังศีรษะมัน', tl: 'Oily Scalp', my: 'ဆီဆိုင်ဦးရေပြား' },
    // 화장품학 (~8개)
    { korean: '보습제', pronunciation: 'bo-seup-je', category: '화장품학', vi: 'Chất dưỡng ẩm', zh: '保湿剂', th: 'สารเพิ่มความชุ่มชื้น', tl: 'Humectant/Moisturizer', my: 'အစိုဓာတ်ထိန်းဆေး' },
    { korean: '계면활성제', pronunciation: 'gye-myeon-hwal-seong-je', category: '화장품학', vi: 'Chất hoạt động bề mặt', zh: '表面活性剂', th: 'สารลดแรงตึงผิว', tl: 'Surfactant', my: 'မျက်နှာပြင်လှုပ်ရှားမှုဆေး' },
    { korean: '방부제', pronunciation: 'bang-bu-je', category: '화장품학', vi: 'Chất bảo quản', zh: '防腐剂', th: 'สารกันบูด', tl: 'Preservative', my: 'ဆေးသိုလှောင်ဆေး' },
    { korean: '기능성 화장품', pronunciation: 'gi-neung-seong hwa-jang-pum', category: '화장품학', vi: 'Mỹ phẩm chức năng', zh: '功能性化妆品', th: 'เครื่องสำอางฟังก์ชัน', tl: 'Functional Cosmetics', my: 'လုပ်ဆောင်ချက်ကောင်းသောလိမ်းဆေး' },
    { korean: '유화', pronunciation: 'yu-hwa', category: '화장품학', vi: 'Nhũ tương (Emulsion)', zh: '乳化', th: 'อิมัลชัน', tl: 'Emulsion', my: 'အီမူးရှင်း' },
    { korean: 'PA', pronunciation: 'pi-e-i', category: '화장품학', vi: 'Chỉ số chống UVA', zh: 'UVA防护等级', th: 'ค่า PA', tl: 'PA (UVA protection grade)', my: 'PA တန်ဖိုး' },
    { korean: '글리세린', pronunciation: 'geul-li-se-rin', category: '화장품학', vi: 'Glycerin', zh: '甘油', th: 'กลีเซอรีน', tl: 'Glycerin', my: 'ဂလစ်ဆာရင်' },
    { korean: '전성분 표시', pronunciation: 'jeon-seong-bun pyo-si', category: '화장품학', vi: 'Danh sách toàn bộ thành phần', zh: '全成分标注', th: 'รายการส่วนผสมทั้งหมด', tl: 'Full ingredient listing', my: 'ပါဝင်ပစ္စည်းအားလုံးဖော်ပြချက်' },
    // 공중위생 (~5개)
    { korean: '영업신고', pronunciation: 'yeong-eop-sin-go', category: '공중위생', vi: 'Đăng ký kinh doanh', zh: '营业申报', th: 'การแจ้งประกอบธุรกิจ', tl: 'Business registration/notification', my: 'စီးပွားရေးလုပ်ငန်းကြေငြာမှု' },
    { korean: '자비소독', pronunciation: 'ja-bi-so-dok', category: '공중위생', vi: 'Khử trùng bằng nước sôi', zh: '煮沸消毒', th: 'การต้มฆ่าเชื้อ', tl: 'Boiling water disinfection', my: 'ရေဆူသောအပူဖြင့်သန့်စင်ခြင်း' },
    { korean: '면허', pronunciation: 'myeon-heo', category: '공중위생', vi: 'Giấy phép hành nghề', zh: '执照', th: 'ใบอนุญาต', tl: 'License', my: 'လိုင်စင်' },
    { korean: '위생교육', pronunciation: 'wi-saeng-gyo-yuk', category: '공중위생', vi: 'Giáo dục vệ sinh', zh: '卫生教育', th: 'การศึกษาด้านสุขอนามัย', tl: 'Hygiene education', my: 'သန့်ရှင်းရေးပညာရေး' },
    { korean: '에탄올 소독', pronunciation: 'e-ta-nol so-dok', category: '공중위생', vi: 'Khử trùng bằng cồn ethanol', zh: '乙醇消毒', th: 'การฆ่าเชื้อด้วยเอทานอล', tl: 'Ethanol disinfection', my: 'အီသနောဖြင့်သန့်စင်ခြင်း' },
    // 미용이론 (~5개)
    { korean: '헤어 커트', pronunciation: 'he-eo keo-teu', category: '미용이론', vi: 'Cắt tóc', zh: '剪发', th: 'ตัดผม', tl: 'Hair cut', my: 'ဆံပင်ညှပ်ခြင်း' },
    { korean: '원랭스', pronunciation: 'won-laeng-seu', category: '미용이론', vi: 'Cắt tóc đồng đều (One-length)', zh: '齐长发型', th: 'ทรงผมระนาบเดียว', tl: 'One-length cut', my: 'တူညီသောအလျားဆံပင်ညှပ်ခြင်း' },
    { korean: '탈색', pronunciation: 'tal-saek', category: '미용이론', vi: 'Tẩy tóc', zh: '脱色', th: 'การฟอกสีผม', tl: 'Hair bleaching', my: 'ဆံပင်ဖျော့ဖျောက်ခြင်း' },
    { korean: '헤어 트리트먼트', pronunciation: 'he-eo teu-ri-teu-men-teu', category: '미용이론', vi: 'Kem ủ tóc', zh: '护发素/发膜', th: 'ทรีทเมนต์ผม', tl: 'Hair treatment', my: 'ဆံပင်ထုပ်ခြင်း' },
    { korean: '상담', pronunciation: 'sang-dam', category: '미용이론', vi: 'Tư vấn', zh: '咨询', th: 'การให้คำปรึกษา', tl: 'Consultation', my: 'တိုင်ပင်ဆွေးနွေးခြင်း' },
];
