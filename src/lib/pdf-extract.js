import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const MAX_PAGES = 50;
const MAX_CHARS = 500_000;

export async function extractTextFromPdf(buffer) {
    // pdf-parse@1.x + pdfjs v1.x는 Node Buffer 직접 전달 시 XRef 파싱 버그가 있어
    // ArrayBuffer를 통한 순수 Uint8Array로 변환하여 전달한다.
    const arr = new ArrayBuffer(buffer.length);
    const data_in = new Uint8Array(arr);
    buffer.copy(data_in);
    let data;
    try {
        data = await pdfParse(data_in, { max: MAX_PAGES });
    } catch (e) {
        throw new PdfExtractError(`pdf-parse 실패: ${e.message}`);
    }
    const text = (data.text ?? '').trim();
    if (!text) {
        throw new PdfExtractError('텍스트 추출 결과가 비어있습니다. 스캔 이미지 PDF일 수 있습니다.');
    }
    if (text.length > MAX_CHARS) {
        return text.slice(0, MAX_CHARS);
    }
    return text;
}

export class PdfExtractError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PdfExtractError';
    }
}
