/** Design system: Software Almanac — Contact page in Indonesian with dynamic database content and Bandung location. */
import { type FormEvent } from "react";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

function contentMap(items: Array<{ key: string; value: string }> | undefined) {
  return Object.fromEntries((items ?? []).map((item) => [item.key, item.value]));
}

export default function Contact() {
  const contentQuery = trpc.registry.public.siteContent.useQuery();
  const content = contentMap(contentQuery.data);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Inquiry Workshop Collective — ${String(data.get("company") || data.get("name"))}`);
    const body = encodeURIComponent(
      `Nama: ${data.get("name")}\nEmail: ${data.get("email")}\nPerusahaan / Tim: ${data.get("company")}\n\nPesan:\n${data.get("message")}`
    );
    window.location.href = `mailto:hello@workshopcollective.co?subject=${subject}&body=${body}`;
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
              <a href="mailto:hello@workshopcollective.co">
                <Mail size={16} /> hello@workshopcollective.co <ArrowUpRight size={14} />
              </a>
            </div>
            <div>
              <span>Lokasi Kantor</span>
              <p>
                <MapPin size={16} /> Bandung, Jawa Barat · Indonesia<br />
                Bekerja fleksibel lintas zona waktu.
              </p>
            </div>
            <div className="contact-aside-note">
              <i /> Titik awal terbaik adalah masalah nyata yang dihadapi, bukan ringkasan yang rumit.
            </div>
          </aside>

          {/* Form */}
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-heading">
              <span>01 / Pesan Anda</span>
              <p>Isi informasi dasar di bawah ini. Aplikasi email Anda akan otomatis terbuka dengan draf pesan siap kirim.</p>
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

            <button className="button button-ink" type="submit">
              Siapkan Email <ArrowUpRight size={17} />
            </button>
          </form>
        </section>
      </main>
    </SiteShell>
  );
}
