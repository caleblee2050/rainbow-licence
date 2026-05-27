// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { extractTextFromPdf, PdfExtractError } from '../pdf-extract';

describe('PDF 텍스트 추출', () => {
    it('샘플 PDF에서 텍스트 추출', async () => {
        const buf = await readFile('src/lib/__tests__/fixtures/sample.pdf');
        const text = await extractTextFromPdf(buf);
        expect(text).toContain('HACCP');
        expect(text).toContain('1234');
    });

    it('비어있는 buffer는 에러', async () => {
        await expect(extractTextFromPdf(Buffer.from([])))
            .rejects.toThrow(PdfExtractError);
    });

    it('잘못된 PDF 형식은 PdfExtractError', async () => {
        await expect(extractTextFromPdf(Buffer.from('not a pdf')))
            .rejects.toThrow(PdfExtractError);
    });
});
