/** Contact page: enquiries are saved to the CMS inbox rather than handed off to a mailto: draft. */
import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowUpRight, Check, Loader2, Mail, MapPin } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

function contentMap(items: Array<{ key: string; value: string }> | undefined) {
  return Object.fromEntries((items ?? []).map((item) => [item.key, item.value]));
}

export default function Contact() {
  const contentQuery = trpc.registry.public.siteContent.useQuery();
  const content = contentMap(contentQuery.data);

  const email = content["company.email"] ?? "hello@workshopcollective.co";
  const address = content["company.address"] ?? "Bandung, Jawa Barat · Indonesia";

  const [sent, setSent] = useState(false);
  const submit = trpc.registry.public.submitContact.useMutation({
    onSuccess: () => setSent(true),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    submit.mutate({
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      company: String(data.get("company") ?? "").trim() || undefined,
      message: String(data.get("message") ?? "").trim(),
      botField: String(data.get("botField") ?? ""),
    });
  };

  return (
    <SiteShell>
      <main className="contact-page">
        {/* Contact Hero */}
        <section className="contact-hero">
          <div>
            <span className="section-label">
              <i /> Kontak &amp; Konsultasi
            </span>
            <h1>
              Sampaikan tantangan yang ingin Anda <br />
              <em>buat lebih sederhana.</em>
            </h1>
          </div>
          <p>
            {content["contact.intro"] ??
              "Tertarik menggunakan produk kami, mendiskusikan peluang kemitraan, atau memiliki kebutuhan solusi sistem khusus? Mari diskusikan bersama kami."}
          </p>
        </section>

        {/* Contact Body */}
        <section className="contact-body">
          <aside className="contact-aside">
            <div>
              <span>Kirim Email Langsung</span>
              <a href={`mailto:${email}`}>
                <Mail size={16} /> {email} <ArrowUpRight size={14} />
              </a>
            </div>
            <div>
              <span>Lokasi Kantor</span>
              <p>
                <MapPin size={16} /> {address}<br />
                Bekerja fleksibel lintas zona waktu.
              </p>
            </div>
            <div className="contact-aside-note">
              <i /> Titik awal terbaik adalah masalah nyata yang dihadapi, bukan ringkasan yang rumit.
            </div>
          </aside>

          {/* Form */}
          {sent ? (
            <div className="contact-form contact-sent" role="status" aria-live="polite">
              <span className="sent-badge"><Check size={16} /></span>
              <h2>Pesan Anda sudah kami terima.</h2>
              <p>
                Terima kasih sudah menghubungi kami. Tim kami akan membaca dan membalas ke alamat
                email yang Anda tulis. Biasanya dalam satu hingga dua hari kerja.
              </p>
              <button type="button" className="button button-outline" onClick={() => { setSent(false); submit.reset(); }}>
                Kirim pesan lain
              </button>
            </div>
          ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-heading">
              <span>01 / Pesan Anda</span>
              <p>Isi informasi dasar di bawah ini. Pesan Anda langsung masuk ke tim kami — tidak perlu membuka aplikasi email.</p>
            </div>

            <label>
              Nama Lengkap
              <input required name="name" autoComplete="name" placeholder="Nama Anda" />
            </label>

            <label>
              Alamat Email
              <input required type="email" name="email" autoComplete="email" placeholder="nama@perusahaan.com" />
            </label>

            <label>
              Nama Perusahaan / Tim <span>(opsional)</span>
              <input name="company" autoComplete="organization" placeholder="Nama perusahaan atau tim Anda" />
            </label>

            <label>
              Apa yang bisa kami bantu?
              <textarea
                required
                name="message"
                rows={5}
                placeholder="Pertanyaan seputar produk, ide kolaborasi, atau alur kerja operasional yang ingin disempurnakan."
              />
            </label>

            {/* Honeypot — off-screen and skipped by tab order; only bots fill it. */}
            <input className="bot-field" type="text" name="botField" tabIndex={-1} autoComplete="off" aria-hidden="true" />

            {submit.isError && (
              <p className="form-error" role="alert">
                <AlertCircle size={15} />
                {submit.error.message || "Pesan gagal terkirim. Coba lagi sebentar."}
              </p>
            )}

            <button className="button button-ink" type="submit" disabled={submit.isPending}>
              {submit.isPending ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Mengirim…
                </>
              ) : (
                <>
                  Kirim Pesan <ArrowUpRight size={17} />
                </>
              )}
            </button>
          </form>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
