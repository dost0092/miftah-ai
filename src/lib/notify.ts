import "server-only";

/**
 * Sends an internal notification email (new waitlist signup, contact message, new account)
 * to the address in NOTIFY_EMAIL, via Resend (https://resend.com).
 *
 * The recipient lives only in the NOTIFY_EMAIL environment variable: it is never shown
 * on the website or committed to the code. Failures are logged and never break the
 * visitor's request: their data is already saved in Supabase.
 */
export async function notifyTeam(subject: string, fields: Record<string, string | null | undefined>) {
  const apiKey = process.env.RESEND_API_KEY;
  // NOTIFY_EMAIL may hold several addresses separated by commas.
  const to = (process.env.NOTIFY_EMAIL ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!apiKey || to.length === 0) {
    console.warn("[notify] RESEND_API_KEY or NOTIFY_EMAIL not set; skipping email:", subject);
    return;
  }
  const from = process.env.EMAIL_FROM || "Miftah AI <onboarding@resend.dev>";

  const rows = Object.entries(fields)
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;color:#5b6a62;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td>` +
        `<td style="padding:8px 12px;color:#0f1a15;font-size:14px">${escapeHtml(String(v)).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f7f2e7;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #ede4d0">
    <div style="background:#0f4a36;padding:20px 24px;color:#fff">
      <div style="font-size:18px;font-weight:bold">Miftah <span style="color:#dcbd78">AI</span></div>
      <div style="font-size:14px;opacity:.8;margin-top:4px">${escapeHtml(subject)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:8px 0">${rows}</table>
    <div style="padding:12px 24px 20px;color:#7d8a83;font-size:12px">Sent automatically by miftah-ai. The full record is stored in Supabase.</div>
  </div></body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: `[Miftah AI] ${subject}`,
        html,
        reply_to: fields["Email"] || undefined,
      }),
    });
    if (!res.ok) console.error("[notify] Resend error", res.status, await res.text());
  } catch (err) {
    console.error("[notify] failed", err);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
