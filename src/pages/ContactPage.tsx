import React, { useState } from 'react';
import { CheckCircle2, Mail, Send, ShieldCheck } from 'lucide-react';
import { submitContactMessageApi } from '../lib/apiClient';
import { useToast } from '../components/Toast';

export function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await submitContactMessageApi({ name, email, subject, message });
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      showToast('Your message has been submitted and recorded.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to send message.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-medium text-emerald-400">Contact GROEarnX</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">Get in Touch</h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
          Have questions about the platform simulation, security architecture, or compliance
          roadmap? Send a verified inquiry below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-5">
          <div className="space-y-2">
            <Mail className="w-5 h-5 text-emerald-400" />
            <h2 className="font-display text-base font-semibold text-white">Direct Inquiries</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Messages submitted here are validated server-side and stored securely for review by
              platform administrators.
            </p>
          </div>
          <div className="pt-4 border-t border-white/10 space-y-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Transparency Reminder</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Do not send passwords, private keys, or sensitive payment credentials through this
              form.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="md:col-span-2 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4"
        >
          {submitted && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-start gap-3 text-sm text-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Thank you. Your inquiry has been securely recorded.</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="block text-xs font-medium text-slate-300">
                Full Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="block text-xs font-medium text-slate-300">
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-subject" className="block text-xs font-medium text-slate-300">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              required
              minLength={3}
              maxLength={140}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Platform inquiry"
              className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-message" className="block text-xs font-medium text-slate-300">
              Message
            </label>
            <textarea
              id="contact-message"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe how we can assist..."
              className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
