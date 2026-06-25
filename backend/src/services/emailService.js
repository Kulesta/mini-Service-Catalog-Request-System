const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });

    return transporter;
}

async function sendEmail({ to, subject, html, text }) {
    const transport = getTransporter();

    if (!transport) {
        console.log('[EMAIL DISABLED] Would send:');
        console.log(`  To: ${to}`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Body: ${text || subject}`);
        return { sent: false, reason: 'SMTP not configured' };
    }

    try {
        const info = await transport.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html,
            text: text || subject,
        });
        console.log(`[EMAIL SENT] ${info.messageId} -> ${to}`);
        return { sent: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EMAIL FAILED] ${error.message}`);
        return { sent: false, reason: error.message };
    }
}

async function sendRequestNotification({ providerEmail, providerName, customerName, services, serviceNames, requestNote }) {
    const subject = `New Service Request from ${customerName}`;
    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">New Service Request</h1>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 30px;">
            <p style="color: #475569; font-size: 15px; margin: 0 0 20px;">Hi <strong>${providerName}</strong>,</p>
            <p style="color: #475569; font-size: 15px; margin: 0 0 20px;">You have a new service request from <strong>${customerName}</strong>.</p>

            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">Requested Services</h3>
                ${services.map(s => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #475569;">${s.name}</span>
                    <span style="color: #10b981; font-weight: 600;">$${s.total.toFixed(2)}</span>
                </div>`).join('')}
                <div style="display: flex; justify-content: space-between; padding: 12px 0 0; margin-top: 8px; border-top: 2px solid #e2e8f0;">
                    <span style="color: #1e293b; font-weight: 700;">Total</span>
                    <span style="color: #10b981; font-weight: 700; font-size: 18px;">$${services.reduce((sum, s) => sum + s.total, 0).toFixed(2)}</span>
                </div>
            </div>

            ${requestNote ? `
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0;"><strong>Customer Note:</strong> "${requestNote}"</p>
            </div>` : ''}

            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 20px 0 0;">Log in to your dashboard to manage this request.</p>
        </div>
    </div>`;

    const text = `New Service Request from ${customerName}\n\nServices: ${serviceNames}\nNote: ${requestNote || 'None'}\n\nLog in to your dashboard to manage this request.`;

    return sendEmail({ to: providerEmail, subject, html, text });
}

async function sendReviewNotification({ providerEmail, providerName, customerName, rating, comment }) {
    const subject = `New ${rating}-Star Review from ${customerName}`;
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #f97316); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">New Review Received</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 28px;">${stars}</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 30px;">
            <p style="color: #475569; font-size: 15px; margin: 0 0 20px;">Hi <strong>${providerName}</strong>,</p>
            <p style="color: #475569; font-size: 15px; margin: 0 0 20px;"><strong>${customerName}</strong> left you a <strong>${rating}-star</strong> review.</p>
            ${comment ? `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #475569; font-size: 14px; font-style: italic; margin: 0;">"${comment}"</p>
            </div>` : ''}
            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 20px 0 0;">Great reviews help attract more customers!</p>
        </div>
    </div>`;

    const text = `New Review from ${customerName}: ${rating} stars\n${comment ? `Comment: "${comment}"` : ''}`;

    return sendEmail({ to: providerEmail, subject, html, text });
}

async function sendRequestStatusEmail({ customerEmail, customerName, providerName, status }) {
    if (!customerEmail) return { sent: false, reason: 'No customer email' };

    const statusColors = {
        completed: { color: '#10b981', label: 'Completed', icon: '✅' },
        cancelled: { color: '#ef4444', label: 'Cancelled', icon: '❌' },
    };
    const sc = statusColors[status] || { color: '#6b7280', label: status, icon: '📋' };

    const subject = `Your Request with ${providerName} has been ${sc.label}`;
    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${sc.color}; border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">${sc.icon} Request ${sc.label}</h1>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 30px;">
            <p style="color: #475569; font-size: 15px; margin: 0 0 20px;">Hi <strong>${customerName}</strong>,</p>
            <p style="color: #475569; font-size: 15px; margin: 0 0 20px;">Your service request with <strong>${providerName}</strong> has been <strong style="color: ${sc.color};">${sc.label.toLowerCase()}</strong>.</p>
            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 20px 0 0;">Thank you for using our service!</p>
        </div>
    </div>`;

    return sendEmail({ to: customerEmail, subject, html, text: `Your request with ${providerName} has been ${sc.label}.` });
}

module.exports = { sendEmail, sendRequestNotification, sendReviewNotification, sendRequestStatusEmail };
