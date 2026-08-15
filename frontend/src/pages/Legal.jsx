import React from "react";

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "YONII is designed to work without creating an account. We do not ask for your name, email, phone number, address, date of birth or any identifying document.",
      "Anonymous chat: your questions and YONII's responses are stored on our servers in an anonymised form for safety, quality and abuse-prevention purposes. They are not linked to an identity because we do not collect one.",
      "Payments: to accept ₹9 for the Image Health Check we route transactions through Razorpay. Razorpay processes the payment and receives standard payment metadata (order ID, timestamp, method). YONII does not receive or store your card or bank details.",
      "Uploaded images: images uploaded to Image Health Check are processed in memory only. They are automatically discarded after the analysis is generated. We never store the image on disk, index it, share it, use it for advertising, or use it to train models.",
      "Server logs: our infrastructure may temporarily retain request logs (including IP address) for security and abuse-prevention. Logs are retained for a short period and are not shared with third parties for marketing.",
      "Cookies / local storage: we use browser local storage to remember your 18+ confirmation and your current chat session. No third-party advertising cookies.",
      "Your rights: because we do not have an account for you, we cannot 'find your data' — but you can clear your session at any time by clearing your browser storage.",
    ],
  },
  terms: {
    title: "Terms of Use",
    body: [
      "YONII is a sexual-health education platform for adults aged 18 and above. By using YONII you confirm you are 18 or older.",
      "YONII is not a medical service, not a substitute for a doctor and does not create a doctor–patient relationship.",
      "Do not use YONII for pornographic, erotic, exploitative, non-consensual, or illegal content. Such requests will be refused.",
      "You are responsible for the information you enter. Do not include personal identifying information about yourself or others.",
      "YONII may rate-limit or block abusive users to keep the service safe for everyone.",
      "The service is provided 'as is' without warranty of accuracy for any personal medical situation.",
    ],
  },
  disclaimer: {
    title: "Medical Disclaimer",
    body: [
      "YONII provides general sexual-health education. It does not diagnose, prescribe or provide treatment.",
      "Information on YONII should not be used as a substitute for consultation with a qualified healthcare professional.",
      "In an emergency (severe pain, heavy bleeding, difficulty breathing, loss of consciousness, suspected sexual assault, suicidal ideation), please contact your local emergency services or go to the nearest emergency department immediately.",
      "The Image Health Check feature is educational only. An image alone cannot reliably establish a medical diagnosis.",
    ],
  },
  refund: {
    title: "Refund Policy",
    body: [
      "The Image Health Check is a ₹9 one-time payment for a single analysis.",
      "If payment succeeds but the AI analysis fails to complete, please contact support and we will process a full refund via the original payment method.",
      "Because the analysis is delivered instantly upon successful payment, refunds are not available once an analysis has been generated and shown to you.",
      "Contact: support@yonii.app (placeholder).",
    ],
  },
  imagePrivacy: {
    title: "Image Privacy Policy",
    body: [
      "Images you upload to YONII's Image Health Check are treated as highly sensitive.",
      "Images are transmitted over HTTPS, processed in memory on our servers, sent to the vision AI provider for a single analysis, and then discarded.",
      "Images are never stored on disk, never indexed by search engines, never shared with advertisers, never used to train AI models, and never included in analytics.",
      "EXIF metadata (including GPS if present) is stripped before analysis.",
      "You can also delete the textual analysis from our database using the 'Delete this analysis' button on the result page.",
    ],
  },
};

export default function Legal({ page }) {
  const c = CONTENT[page];
  if (!c) return null;
  return (
    <div className="yonii-container py-14">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05]">{c.title}</h1>
        <div className="mt-8 space-y-4 text-[var(--yonii-text)] leading-relaxed">
          {c.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
