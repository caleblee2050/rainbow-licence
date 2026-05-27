import { Resend } from 'resend';

let _client = null;
function getResend() {
    if (_client) return _client;
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY not set');
    _client = new Resend(key);
    return _client;
}

export async function sendMagicLinkEmail({ to, link }) {
    const from = process.env.RESEND_FROM_EMAIL || 'Rainbow Licence <noreply@example.com>';
    await getResend().emails.send({
        from,
        to,
        subject: 'Rainbow Licence 로그인 링크',
        html: `<p>안녕하세요!</p>
               <p>아래 링크를 클릭하면 로그인됩니다 (15분 유효):</p>
               <p><a href="${link}">${link}</a></p>
               <p>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>`,
        text: `Rainbow Licence 로그인 링크 (15분 유효): ${link}`,
    });
}
