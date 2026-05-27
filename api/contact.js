const { Resend } = require('resend');

const ADMIN_EMAIL = 'asuki1995@gmail.com';
const FROM_ADDRESS = 'ワールドスピリッツ株式会社 <onboarding@resend.dev>';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildAdminHtml(data) {
  var rows = [
    { label: '会社名・団体名', value: data.company },
    { label: '部署名', value: data.department },
    { label: '氏名', value: data.name },
    { label: 'フリガナ', value: data.kana },
    { label: '電話番号', value: data.tel },
    { label: 'メールアドレス', value: data.email },
    { label: 'お問い合わせ種別', value: Array.isArray(data.type) ? data.type.join('、') : data.type },
    { label: 'お問い合わせ詳細', value: data.message }
  ];

  var tableRows = rows.map(function(r) {
    var val = escapeHtml(r.value || '');
    if (r.label === 'お問い合わせ詳細') {
      val = '<div style="white-space:pre-wrap;">' + val + '</div>';
    }
    return '<tr>' +
      '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#6b7280;width:160px;vertical-align:top;font-size:14px;">' + escapeHtml(r.label) + '</td>' +
      '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#1a1a2e;font-size:14px;">' + (val || '<span style="color:#9ca3af;">未入力</span>') + '</td>' +
      '</tr>';
  }).join('');

  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f9fafb;font-family:Yu Gothic,Meiryo,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;">' +
      '<tr><td style="background:#1a56a8;padding:24px 32px;">' +
        '<div style="color:#fff;font-size:18px;font-weight:700;">ウェブサイトからお問い合わせがありました</div>' +
        '<div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px;">WORLD SPIRITS - Contact Form</div>' +
      '</td></tr>' +
      '<tr><td style="padding:32px;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;">' + tableRows + '</table>' +
      '</td></tr>' +
      '<tr><td style="padding:24px 32px;background:#f3f4f6;color:#6b7280;font-size:12px;text-align:center;">' +
        'ワールドスピリッツ株式会社<br>〒890-0005 鹿児島県鹿児島市下伊敷2-29-6<br>TEL: 099-248-9744' +
      '</td></tr>' +
    '</table>' +
    '</body></html>';
}

function buildAutoReplyHtml(data) {
  var rows = [
    { label: '会社名・団体名', value: data.company },
    { label: '部署名', value: data.department },
    { label: '氏名', value: data.name },
    { label: 'フリガナ', value: data.kana },
    { label: '電話番号', value: data.tel },
    { label: 'メールアドレス', value: data.email },
    { label: 'お問い合わせ種別', value: Array.isArray(data.type) ? data.type.join('、') : data.type },
    { label: 'お問い合わせ詳細', value: data.message }
  ];

  var tableRows = rows.map(function(r) {
    var val = escapeHtml(r.value || '');
    if (r.label === 'お問い合わせ詳細') {
      val = '<div style="white-space:pre-wrap;">' + val + '</div>';
    }
    return '<tr>' +
      '<td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#6b7280;width:160px;vertical-align:top;font-size:13px;">' + escapeHtml(r.label) + '</td>' +
      '<td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;color:#1a1a2e;font-size:13px;">' + (val || '-') + '</td>' +
      '</tr>';
  }).join('');

  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f9fafb;font-family:Yu Gothic,Meiryo,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;">' +
      '<tr><td style="background:#1a56a8;padding:24px 32px;">' +
        '<div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:0.08em;">WORLD SPIRITS</div>' +
        '<div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:2px;">ワールドスピリッツ株式会社</div>' +
      '</td></tr>' +
      '<tr><td style="padding:32px;">' +
        '<p style="font-size:15px;color:#1a1a2e;margin:0 0 24px;">' + escapeHtml(data.name) + ' 様</p>' +
        '<p style="font-size:14px;color:#1a1a2e;line-height:2;margin:0 0 8px;">' +
          'この度はお問い合わせいただき、誠にありがとうございます。<br>' +
          '以下の内容でお問い合わせを承りました。<br>' +
          '担当者より改めてご連絡させていただきますので、今しばらくお待ちください。' +
        '</p>' +
        '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">' +
        '<p style="font-size:13px;font-weight:600;color:#1a56a8;margin:0 0 12px;">お問い合わせ内容</p>' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;">' + tableRows + '</table>' +
      '</td></tr>' +
      '<tr><td style="padding:24px 32px;background:#f3f4f6;color:#6b7280;font-size:12px;text-align:center;line-height:1.8;">' +
        'ワールドスピリッツ株式会社<br>' +
        '〒890-0005 鹿児島県鹿児島市下伊敷2-29-6<br>' +
        'TEL: 099-248-9744<br>' +
        '<span style="font-size:11px;color:#9ca3af;">※このメールは自動送信されています。このメールへの返信はお控えください。</span>' +
      '</td></tr>' +
    '</table>' +
    '</body></html>';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var data = req.body;
    if (!data.company || !data.name || !data.email || !data.message) {
      return res.status(400).json({ error: '必須項目が入力されていません' });
    }
    if (!Array.isArray(data.type) || data.type.length === 0) {
      return res.status(400).json({ error: 'お問い合わせ種別を選択してください' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return res.status(400).json({ error: 'メールアドレスの形式が正しくありません' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return res.status(500).json({ error: 'メール送信設定がされていません' });
    }

    var resend = new Resend(process.env.RESEND_API_KEY);

    var adminResult = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [ADMIN_EMAIL],
      replyTo: data.email,
      subject: '【お問い合わせ】' + data.name + '様（' + data.company + '）',
      html: buildAdminHtml(data)
    });

    if (adminResult.error) {
      console.error('Admin email error:', adminResult.error);
      return res.status(500).json({ error: 'メール送信に失敗しました' });
    }

    var replyResult = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [data.email],
      replyTo: ADMIN_EMAIL,
      subject: '【ワールドスピリッツ】お問い合わせありがとうございます',
      html: buildAutoReplyHtml(data)
    });

    if (replyResult.error) {
      console.error('Auto-reply email error:', replyResult.error);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact API error:', err);
    return res.status(500).json({ error: 'メール送信に失敗しました' });
  }
};
