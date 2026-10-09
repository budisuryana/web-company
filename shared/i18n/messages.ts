/**
 * Public-site copy in Indonesian (default) and English.
 *
 * Copy lives in code rather than the CMS so both languages ship together,
 * stay reviewable in git, and reach production without a data migration.
 * Product records (names, images, Indonesian descriptions) still come from
 * the CMS; their English text lives in ./products.ts.
 *
 * Rule for every string here: state only what is verifiable. No customers,
 * revenue, partnerships, team size, or legal entity until the owner confirms.
 */
import { SITE } from "../site";

export type LegalSection = { heading: string; body?: string[]; list?: string[] };
export type LegalDoc = { title: string; eyebrow: string; updated: string; intro: string; sections: LegalSection[] };

const id = {
  meta: {
    homeTitle: "Ruang Karya — Software Bisnis & Solusi SaaS",
    homeDescription:
      "Ruang Karya membangun aplikasi SaaS untuk operasional bisnis: Reconly untuk rekonsiliasi data dan KaryaPeople untuk HR & payroll. Berbasis di Bandung, Indonesia.",
    productsTitle: "Produk SaaS",
    productsDescription:
      "Reconly dan KaryaPeople — aplikasi SaaS untuk tim finance dan HR yang ingin operasional lebih teratur.",
    aboutTitle: "Tentang Kami",
    aboutDescription:
      "Ruang Karya adalah studio software di Bandung yang membangun dan mengoperasikan aplikasi SaaS untuk operasional bisnis.",
    contactTitle: "Kontak",
    contactDescription:
      "Hubungi Ruang Karya untuk demo produk, pertanyaan seputar Reconly dan KaryaPeople, atau kebutuhan software bisnis.",
    privacyTitle: "Kebijakan Privasi",
    termsTitle: "Ketentuan Layanan",
    notFoundTitle: "Halaman tidak ditemukan",
    breadcrumbHome: "Beranda",
    breadcrumbProducts: "Produk",
  },
  common: {
    tagline: "Software bisnis & solusi SaaS untuk operasional yang lebih teratur.",
    statusLive: "Live",
    viewDetails: "Lihat detail",
    tryProduct: (name: string) => `Coba ${name}`,
    requestDemo: "Minta Demo",
    contactUs: "Hubungi Kami",
    exploreProducts: "Lihat Produk",
    allProducts: "Semua produk",
    loading: "Memuat…",
    externalNote: "Membuka aplikasi di tab baru",
    location: `${SITE.city}, ${SITE.region.id}, ${SITE.country.id}`,
  },
  nav: {
    products: "Produk",
    about: "Tentang Kami",
    contact: "Kontak",
    primaryLabel: "Navigasi utama",
    openMenu: "Buka menu",
    closeMenu: "Tutup menu",
    home: "Beranda",
    language: "Bahasa",
    switchTo: "English",
  },
  footer: {
    products: "Produk",
    company: "Perusahaan",
    legal: "Legal",
    privacy: "Kebijakan Privasi",
    terms: "Ketentuan Layanan",
    contact: "Kontak",
    rights: "Hak cipta dilindungi.",
  },
  home: {
    eyebrow: "Software Bisnis & Solusi SaaS",
    title: "Software bisnis yang membuat operasional lebih teratur.",
    lead:
      "Ruang Karya membangun dan mengoperasikan aplikasi SaaS untuk tim finance dan HR — mulai dari rekonsiliasi data hingga pengelolaan karyawan dan payroll.",
    facts: ["2 produk SaaS live", "Finance & HR", "Bandung, Indonesia"],
    productsEyebrow: "Produk",
    productsTitle: "Dua produk SaaS untuk alur kerja operasional.",
    productsLead:
      "Setiap produk fokus pada satu masalah yang sering menguras waktu tim: mencocokkan data dari dua sumber, dan mengelola administrasi SDM yang tersebar di banyak file.",
    keyCapabilities: "Kapabilitas utama",
    methodEyebrow: "Cara Kami Membangun",
    methodTitle: "Fokus pada masalah nyata, bukan fitur sebanyak-banyaknya.",
    method: [
      {
        title: "Mulai dari alur kerja",
        body: "Kami memahami alur kerja di lapangan lebih dulu — pengecekan berulang, data yang tersebar, dan persetujuan yang tertunda — lalu membangun alat yang menghilangkannya.",
      },
      {
        title: "Pertahankan konteks",
        body: "Produk yang baik menunjukkan alasan di balik setiap data dan keputusan, bukan sekadar mencatatnya.",
      },
      {
        title: "Sederhana tanpa mengurangi nilai",
        body: "Antarmuka kami ringkas, tetapi detail penting untuk audit dan pengambilan keputusan tetap tersedia.",
      },
    ],
    aiEyebrow: "AI & Teknologi",
    aiTitle: "Dikembangkan dengan bantuan AI, diputuskan oleh manusia.",
    aiLead:
      "Kami menggunakan Claude Code dari Anthropic dalam proses pengembangan software sehari-hari. AI mempercepat pekerjaan engineering; keputusan dan tanggung jawab atas setiap rilis tetap ada pada tim kami.",
    aiPractices: [
      {
        title: "Claude Code dalam alur engineering",
        body: "Implementasi fitur, refactor, penulisan dan peninjauan kode, pengujian, serta dokumentasi teknis dikerjakan bersama Claude Code langsung di repositori dan server pengembangan.",
      },
      {
        title: "Workflow multi-agent",
        body: "Pekerjaan besar dipecah ke beberapa agent dengan peran berbeda — misalnya implementasi, review, dan pengujian — yang berjalan paralel, lalu hasilnya dikonsolidasikan dan diverifikasi.",
      },
      {
        title: "Persetujuan manusia sebelum rilis",
        body: "Perubahan dikerjakan di branch terpisah, diuji (typecheck, test, build), dan baru di-deploy ke production setelah disetujui pemilik.",
      },
      {
        title: "Aman untuk data production",
        body: "Audit dilakukan read-only terlebih dulu, backup dibuat dan diverifikasi sebelum perubahan infrastruktur, dan secret tidak ditampilkan ke dalam percakapan AI.",
      },
    ],
    aiNote:
      "Bagian ini menjelaskan cara kami membangun software. Ini bukan klaim bahwa Reconly atau KaryaPeople memiliki fitur yang memanggil Claude API.",
    stackTitle: "Teknologi yang kami gunakan",
    stack: ["TypeScript", "React", "Node.js", "PostgreSQL", "Claude Code"],
    ctaTitle: "Butuh software yang lebih teratur untuk operasional bisnis Anda?",
    ctaLead: "Ceritakan proses yang ingin Anda sederhanakan. Kami akan membalas melalui email.",
  },
  products: {
    eyebrow: "Produk SaaS",
    title: "Software yang membantu operasional bisnis lebih teratur.",
    lead:
      "Dua produk SaaS yang sudah live, masing-masing dibangun untuk satu alur kerja operasional yang spesifik.",
    builtFor: "Dirancang untuk",
    ctaTitle: "Ingin melihat produk kami bekerja dengan data Anda?",
    ctaButton: "Diskusikan kebutuhan Anda",
  },
  productDetail: {
    challenge: "Tantangan",
    solution: "Solusi",
    workflowEyebrow: "Alur Kerja",
    workflowTitle: "Satu alur kerja, dari awal hingga hasil.",
    capabilitiesEyebrow: "Fitur Utama",
    capabilitiesTitle: "Kapabilitas yang dibutuhkan tim setiap hari.",
    screensEyebrow: "Tangkapan Layar",
    screensLead: "Tampilan antarmuka produk yang sedang berjalan.",
    audienceEyebrow: "Untuk Siapa",
    audienceTitle: "Dibangun untuk tim yang membutuhkan pekerjaan lebih terstruktur.",
    discuss: (name: string) => `Diskusikan ${name}`,
    notFoundEyebrow: "Tidak ditemukan",
    notFoundTitle: "Produk ini tidak tersedia.",
    notFoundBody: "Produk yang Anda cari belum dipublikasikan atau sudah tidak tersedia.",
    backToProducts: "Kembali ke produk",
    demoNote: "Demo dijadwalkan melalui tim kami.",
  },
  about: {
    eyebrow: "Tentang Kami",
    title: "Studio software yang membangun SaaS untuk operasional bisnis.",
    lead:
      "Ruang Karya merancang, membangun, dan mengoperasikan aplikasi SaaS untuk pekerjaan yang membutuhkan ketelitian — keuangan, SDM, dan administrasi operasional.",
    storyTitle: "Apa yang kami kerjakan",
    story: [
      "Ruang Karya adalah studio produk software independen yang berbasis di Bandung, Indonesia. Kami membangun produk sendiri dan mengoperasikannya sebagai layanan SaaS.",
      "Saat ini kami mengoperasikan dua produk: Reconly untuk rekonsiliasi data dan KaryaPeople untuk pengelolaan karyawan, kehadiran, cuti, rekrutmen, dan payroll. Kami juga terbuka untuk diskusi kebutuhan software bisnis yang lebih spesifik.",
    ],
    factsTitle: "Profil singkat",
    facts: [
      { label: "Brand", value: SITE.name },
      { label: "Fokus", value: "Software bisnis & SaaS" },
      { label: "Produk live", value: "Reconly, KaryaPeople" },
      { label: "Lokasi", value: `${SITE.city}, ${SITE.region.id}, ${SITE.country.id}` },
      { label: "Email", value: SITE.email },
      { label: "Website", value: SITE.domain },
    ],
    valuesEyebrow: "Prinsip Kerja",
    valuesTitle: "Cara kami membangun produk.",
    values: [
      {
        title: "Fungsional di atas segalanya",
        body: "Kami memprioritaskan fitur yang menghilangkan hambatan harian dibanding ide rumit yang sulit dipertahankan.",
      },
      {
        title: "Konteks adalah bagian dari desain",
        body: "Setiap layar harus membantu pengguna memahami mengapa sesuatu penting — bukan hanya tombol apa yang harus diklik.",
      },
      {
        title: "Kualitas ada pada detail",
        body: "Kejelasan lahir dari banyak keputusan kecil: pilihan kata, status sistem, perpindahan data, dan tata letak.",
      },
    ],
    aiTitle: "AI dalam proses pengembangan",
    aiBody:
      "Kami menggunakan Claude Code dan workflow multi-agent untuk mempercepat engineering, dengan persetujuan manusia sebelum setiap rilis.",
    aiLink: "Baca selengkapnya",
    ctaTitle: "Mari diskusikan kebutuhan operasional Anda.",
  },
  contact: {
    eyebrow: "Kontak",
    title: "Ceritakan proses yang ingin Anda sederhanakan.",
    lead:
      "Tertarik menggunakan Reconly atau KaryaPeople, ingin menjadwalkan demo, atau membutuhkan software bisnis khusus? Kirim pesan kepada kami.",
    emailLabel: "Email",
    locationLabel: "Lokasi",
    locationNote: "Bekerja jarak jauh lintas zona waktu.",
    responseNote: "Kami biasanya membalas dalam satu hingga dua hari kerja.",
    formEyebrow: "Kirim pesan",
    formLead: "Pesan Anda langsung masuk ke tim kami — tidak perlu membuka aplikasi email.",
    demoFormEyebrow: (name: string) => `Permintaan demo ${name}`,
    demoPrefill: (name: string) => `Halo, saya ingin menjadwalkan demo ${name}.\n\nKebutuhan kami: `,
    name: "Nama lengkap",
    namePlaceholder: "Nama Anda",
    email: "Alamat email",
    emailPlaceholder: "nama@perusahaan.com",
    company: "Perusahaan / tim",
    optional: "(opsional)",
    companyPlaceholder: "Nama perusahaan atau tim",
    message: "Pesan",
    messagePlaceholder: "Ceritakan produk yang Anda minati atau alur kerja yang ingin disederhanakan.",
    consentBefore: "Dengan mengirim formulir ini, Anda setuju data Anda diproses sesuai ",
    consentLink: "Kebijakan Privasi",
    consentAfter: " kami.",
    submit: "Kirim pesan",
    sending: "Mengirim…",
    errorFallback: "Pesan gagal terkirim. Coba lagi sebentar.",
    sentTitle: "Pesan Anda sudah kami terima.",
    sentBody: "Terima kasih. Kami akan membalas ke alamat email yang Anda tulis, biasanya dalam satu hingga dua hari kerja.",
    sendAnother: "Kirim pesan lain",
  },
  notFound: {
    eyebrow: "Error 404",
    title: "Halaman tidak ditemukan.",
    body: "Halaman yang Anda tuju tidak tersedia atau sudah dipindahkan.",
    home: "Ke beranda",
    products: "Lihat produk",
  },
  legal: {
    draftBanner:
      "DRAF — dokumen ini masih ditinjau dan belum berlaku. Bagian bertanda [Perlu konfirmasi] menunggu keputusan pemilik.",
    lastUpdated: "Terakhir diperbarui",
    privacy: {
      eyebrow: "Legal",
      title: "Kebijakan Privasi",
      updated: "[Perlu konfirmasi: tanggal berlaku]",
      intro: `Kebijakan ini menjelaskan data apa yang dikumpulkan website ${SITE.domain}, untuk apa data tersebut digunakan, dan hak Anda atas data tersebut.`,
      sections: [
        {
          heading: "1. Siapa kami",
          body: [
            `Website ${SITE.domain} dioperasikan oleh ${SITE.name}, ${SITE.city}, ${SITE.country.id}. [Perlu konfirmasi: nama badan hukum dan alamat terdaftar.]`,
            `Pertanyaan tentang privasi dapat dikirim ke ${SITE.email}.`,
          ],
        },
        {
          heading: "2. Data yang kami kumpulkan",
          list: [
            "Formulir kontak: nama, alamat email, nama perusahaan (opsional), dan isi pesan. Untuk mencegah penyalahgunaan, kami juga menyimpan alamat IP dan jenis browser (user agent) pengirim.",
            "Log kunjungan: halaman yang dikunjungi, halaman perujuk (referrer), waktu kunjungan, alamat IP, perkiraan kota/wilayah/negara, serta jenis perangkat, browser, dan sistem operasi.",
            "Penyimpanan di browser: preferensi tampilan disimpan di localStorage. Cookie teknis hanya digunakan untuk login panel admin.",
          ],
        },
        {
          heading: "3. Cara data diproses",
          list: [
            "Perkiraan lokasi dihitung dari alamat IP menggunakan database GeoIP yang berjalan di server kami sendiri, tanpa mengirim alamat IP ke layanan geolokasi pihak ketiga.",
            "Kami tidak menggunakan cookie iklan maupun layanan analitik pihak ketiga.",
            "Kami tidak menjual data pribadi.",
          ],
        },
        {
          heading: "4. Tujuan penggunaan",
          list: [
            "Membalas pertanyaan dan permintaan demo yang Anda kirim.",
            "Menjaga keamanan website dan mencegah spam atau penyalahgunaan.",
            "Memahami penggunaan website secara agregat untuk memperbaikinya.",
          ],
        },
        {
          heading: "5. Pihak ketiga",
          list: [
            "Google Fonts: browser Anda memuat font dari server Google, sehingga Google menerima alamat IP Anda.",
            "Penyedia hosting: Hostinger (VPS). [Perlu konfirmasi: lokasi pusat data.]",
            "Penyedia email untuk alamat kontak kami. [Perlu konfirmasi: nama penyedia.]",
          ],
        },
        {
          heading: "6. Penyimpanan data",
          body: ["[Perlu konfirmasi: masa simpan pesan kontak dan log kunjungan, misalnya 24 bulan dan 12 bulan.]"],
        },
        {
          heading: "7. Hak Anda",
          body: [
            `Sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi, Anda dapat meminta akses, perbaikan, atau penghapusan data pribadi Anda, maupun menarik persetujuan, dengan menghubungi ${SITE.email}.`,
          ],
        },
        {
          heading: "8. Data di dalam produk",
          body: [
            "Data yang diunggah atau dikelola pelanggan di dalam Reconly dan KaryaPeople diproses untuk menyediakan layanan kepada pelanggan tersebut. [Perlu konfirmasi: lokasi hosting produk, subprosesor, dan apakah tiap produk memiliki kebijakan privasi tersendiri.]",
          ],
        },
        {
          heading: "9. Keamanan",
          body: ["Seluruh website diakses melalui HTTPS. Akses panel admin dibatasi untuk akun dengan peran admin."],
        },
        {
          heading: "10. Perubahan kebijakan",
          body: ["Perubahan akan dipublikasikan di halaman ini beserta tanggal pembaruannya."],
        },
      ],
    } satisfies LegalDoc,
    terms: {
      eyebrow: "Legal",
      title: "Ketentuan Layanan",
      updated: "[Perlu konfirmasi: tanggal berlaku]",
      intro: `Ketentuan ini mengatur penggunaan website ${SITE.domain} dan layanan SaaS ${SITE.name}, yaitu Reconly dan KaryaPeople.`,
      sections: [
        {
          heading: "1. Para pihak",
          body: [
            `"Kami" berarti ${SITE.name} [Perlu konfirmasi: nama badan hukum]. "Anda" berarti pengunjung website atau pengguna layanan.`,
          ],
        },
        {
          heading: "2. Layanan",
          body: [
            "Layanan mencakup website ini serta aplikasi Reconly dan KaryaPeople. Perjanjian berlangganan atau ketentuan khusus produk, jika ada, berlaku lebih dulu apabila bertentangan dengan ketentuan ini. [Perlu konfirmasi: apakah ada perjanjian berlangganan terpisah.]",
          ],
        },
        {
          heading: "3. Akun",
          body: ["Anda bertanggung jawab menjaga kerahasiaan kredensial akun dan atas seluruh aktivitas yang terjadi di akun Anda."],
        },
        {
          heading: "4. Penggunaan yang dilarang",
          list: [
            "Mencoba mengakses sistem atau data tanpa izin.",
            "Mengunggah konten yang melanggar hukum atau hak pihak lain.",
            "Mengganggu, membebani, atau merusak layanan.",
          ],
        },
        {
          heading: "5. Data pelanggan",
          body: [
            "Data yang Anda unggah ke layanan tetap menjadi milik Anda. Kami memprosesnya hanya untuk menyediakan layanan, sebagaimana dijelaskan dalam Kebijakan Privasi.",
          ],
        },
        {
          heading: "6. Biaya",
          body: ["[Perlu konfirmasi: model harga, masa uji coba, mata uang, dan cara penagihan.]"],
        },
        {
          heading: "7. Ketersediaan layanan",
          body: [
            'Layanan disediakan "sebagaimana adanya". Kami berupaya menjaga layanan tetap tersedia, tetapi tidak menjamin bebas gangguan. [Perlu konfirmasi: apakah ada SLA.]',
          ],
        },
        {
          heading: "8. Hak kekayaan intelektual",
          body: [`Software, nama ${SITE.name}, Reconly, dan KaryaPeople beserta logonya adalah milik kami.`],
        },
        {
          heading: "9. Batasan tanggung jawab",
          body: ["[Perlu konfirmasi: batas tanggung jawab — perlu ditinjau penasihat hukum.]"],
        },
        {
          heading: "10. Penghentian",
          body: [
            "Kami dapat menangguhkan akses apabila ketentuan ini dilanggar. [Perlu konfirmasi: prosedur ekspor data ketika langganan berakhir.]",
          ],
        },
        {
          heading: "11. Hukum yang berlaku",
          body: ["Ketentuan ini tunduk pada hukum Republik Indonesia. [Perlu konfirmasi: domisili penyelesaian sengketa.]"],
        },
        {
          heading: "12. Kontak",
          body: [`Pertanyaan tentang ketentuan ini dapat dikirim ke ${SITE.email}.`],
        },
      ],
    } satisfies LegalDoc,
  },
};

export type Messages = typeof id;

const en: Messages = {
  meta: {
    homeTitle: "Ruang Karya — Business Software & SaaS Solutions",
    homeDescription:
      "Ruang Karya builds SaaS for business operations: Reconly for data reconciliation and KaryaPeople for HR & payroll. Based in Bandung, Indonesia.",
    productsTitle: "SaaS Products",
    productsDescription:
      "Reconly and KaryaPeople — SaaS applications for finance and HR teams who want better-run operations.",
    aboutTitle: "About Us",
    aboutDescription:
      "Ruang Karya is a software studio in Bandung, Indonesia that builds and operates SaaS applications for business operations.",
    contactTitle: "Contact",
    contactDescription:
      "Contact Ruang Karya for a product demo, questions about Reconly and KaryaPeople, or business software needs.",
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Service",
    notFoundTitle: "Page not found",
    breadcrumbHome: "Home",
    breadcrumbProducts: "Products",
  },
  common: {
    tagline: "Business software & SaaS solutions for well-run operations.",
    statusLive: "Live",
    viewDetails: "View details",
    tryProduct: (name: string) => `Try ${name}`,
    requestDemo: "Request a Demo",
    contactUs: "Contact Us",
    exploreProducts: "Explore Products",
    allProducts: "All products",
    loading: "Loading…",
    externalNote: "Opens the app in a new tab",
    location: `${SITE.city}, ${SITE.region.en}, ${SITE.country.en}`,
  },
  nav: {
    products: "Products",
    about: "About",
    contact: "Contact",
    primaryLabel: "Main navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    home: "Home",
    language: "Language",
    switchTo: "Bahasa Indonesia",
  },
  footer: {
    products: "Products",
    company: "Company",
    legal: "Legal",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    contact: "Contact",
    rights: "All rights reserved.",
  },
  home: {
    eyebrow: "Business Software & SaaS Solutions",
    title: "Business software that keeps operations in order.",
    lead:
      "Ruang Karya builds and operates SaaS applications for finance and HR teams — from data reconciliation to employee management and payroll.",
    facts: ["2 live SaaS products", "Finance & HR", "Bandung, Indonesia"],
    productsEyebrow: "Products",
    productsTitle: "Two SaaS products for operational workflows.",
    productsLead:
      "Each product focuses on one problem that drains a team's time: matching data from two sources, and running HR administration that is scattered across files.",
    keyCapabilities: "Key capabilities",
    methodEyebrow: "How We Build",
    methodTitle: "Focused on real problems, not on feature count.",
    method: [
      {
        title: "Start from the workflow",
        body: "We study the workflow on the ground first — repeated checks, scattered data, stalled approvals — then build tools that remove them.",
      },
      {
        title: "Preserve context",
        body: "Good products show the reason behind every record and decision, not just the record itself.",
      },
      {
        title: "Simple without losing value",
        body: "Our interfaces stay lean, while the details needed for audits and decisions remain within reach.",
      },
    ],
    aiEyebrow: "AI & Technology",
    aiTitle: "Built with AI assistance, decided by people.",
    aiLead:
      "We use Claude Code by Anthropic in our day-to-day software development. AI speeds up the engineering work; decisions and accountability for every release stay with our team.",
    aiPractices: [
      {
        title: "Claude Code in the engineering loop",
        body: "Feature implementation, refactoring, code writing and review, testing, and technical documentation are done with Claude Code directly in our repositories and development servers.",
      },
      {
        title: "Multi-agent workflows",
        body: "Large tasks are split across several agents with distinct roles — for example implementation, review, and testing — that run in parallel, then the results are consolidated and verified.",
      },
      {
        title: "Human approval before release",
        body: "Changes are made on separate branches, checked (typecheck, tests, build), and deployed to production only after the owner approves.",
      },
      {
        title: "Safe around production data",
        body: "Audits run read-only first, backups are taken and verified before infrastructure changes, and secrets are kept out of AI conversations.",
      },
    ],
    aiNote:
      "This section describes how we build software. It is not a claim that Reconly or KaryaPeople include features that call the Claude API.",
    stackTitle: "Technology we use",
    stack: ["TypeScript", "React", "Node.js", "PostgreSQL", "Claude Code"],
    ctaTitle: "Need more structured software for your business operations?",
    ctaLead: "Tell us which process you want to simplify. We will reply by email.",
  },
  products: {
    eyebrow: "SaaS Products",
    title: "Software that brings order to business operations.",
    lead: "Two live SaaS products, each built for one specific operational workflow.",
    builtFor: "Built for",
    ctaTitle: "Want to see our products working with your data?",
    ctaButton: "Discuss your needs",
  },
  productDetail: {
    challenge: "The challenge",
    solution: "The solution",
    workflowEyebrow: "Workflow",
    workflowTitle: "One workflow, from start to result.",
    capabilitiesEyebrow: "Key Features",
    capabilitiesTitle: "The capabilities teams rely on every day.",
    screensEyebrow: "Screenshots",
    screensLead: "The product interface as it runs today.",
    audienceEyebrow: "Who It's For",
    audienceTitle: "Built for teams that need more structured work.",
    discuss: (name: string) => `Discuss ${name}`,
    notFoundEyebrow: "Not found",
    notFoundTitle: "This product is not available.",
    notFoundBody: "The product you are looking for is not published or is no longer available.",
    backToProducts: "Back to products",
    demoNote: "Demos are scheduled with our team.",
  },
  about: {
    eyebrow: "About Us",
    title: "A software studio building SaaS for business operations.",
    lead:
      "Ruang Karya designs, builds, and operates SaaS applications for work that demands precision — finance, HR, and operational administration.",
    storyTitle: "What we do",
    story: [
      "Ruang Karya is an independent software product studio based in Bandung, Indonesia. We build our own products and operate them as SaaS.",
      "We currently operate two products: Reconly for data reconciliation and KaryaPeople for employee records, attendance, leave, recruitment, and payroll. We are also open to discussing more specific business software needs.",
    ],
    factsTitle: "At a glance",
    facts: [
      { label: "Brand", value: SITE.name },
      { label: "Focus", value: "Business software & SaaS" },
      { label: "Live products", value: "Reconly, KaryaPeople" },
      { label: "Location", value: `${SITE.city}, ${SITE.region.en}, ${SITE.country.en}` },
      { label: "Email", value: SITE.email },
      { label: "Website", value: SITE.domain },
    ],
    valuesEyebrow: "Principles",
    valuesTitle: "How we build products.",
    values: [
      {
        title: "Function above all",
        body: "We prioritise features that remove everyday friction over complex ideas that are hard to sustain.",
      },
      {
        title: "Context is part of the design",
        body: "Every screen should help people understand why something matters — not just which button to click next.",
      },
      {
        title: "Quality lives in the details",
        body: "Clarity comes from many small decisions: wording, system states, data handoffs, and layout.",
      },
    ],
    aiTitle: "AI in our development process",
    aiBody:
      "We use Claude Code and multi-agent workflows to speed up engineering, with human approval before every release.",
    aiLink: "Read more",
    ctaTitle: "Let's talk about your operational needs.",
  },
  contact: {
    eyebrow: "Contact",
    title: "Tell us which process you want to simplify.",
    lead:
      "Interested in Reconly or KaryaPeople, want to schedule a demo, or need custom business software? Send us a message.",
    emailLabel: "Email",
    locationLabel: "Location",
    locationNote: "Working remotely across time zones.",
    responseNote: "We usually reply within one to two business days.",
    formEyebrow: "Send a message",
    formLead: "Your message goes straight to our team — no email app needed.",
    demoFormEyebrow: (name: string) => `${name} demo request`,
    demoPrefill: (name: string) => `Hi, I would like to schedule a demo of ${name}.\n\nOur needs: `,
    name: "Full name",
    namePlaceholder: "Your name",
    email: "Email address",
    emailPlaceholder: "name@company.com",
    company: "Company / team",
    optional: "(optional)",
    companyPlaceholder: "Company or team name",
    message: "Message",
    messagePlaceholder: "Tell us which product you are interested in or which workflow you want to simplify.",
    consentBefore: "By submitting this form, you agree to the processing of your data as described in our ",
    consentLink: "Privacy Policy",
    consentAfter: ".",
    submit: "Send message",
    sending: "Sending…",
    errorFallback: "Your message could not be sent. Please try again shortly.",
    sentTitle: "We have received your message.",
    sentBody: "Thank you. We will reply to the email address you provided, usually within one to two business days.",
    sendAnother: "Send another message",
  },
  notFound: {
    eyebrow: "Error 404",
    title: "Page not found.",
    body: "The page you are looking for does not exist or has been moved.",
    home: "Go to home",
    products: "View products",
  },
  legal: {
    draftBanner:
      "DRAFT — this document is under review and not yet in effect. Items marked [To be confirmed] await the owner's decision.",
    lastUpdated: "Last updated",
    privacy: {
      eyebrow: "Legal",
      title: "Privacy Policy",
      updated: "[To be confirmed: effective date]",
      intro: `This policy explains what data the ${SITE.domain} website collects, why it is used, and your rights over it.`,
      sections: [
        {
          heading: "1. Who we are",
          body: [
            `${SITE.domain} is operated by ${SITE.name}, ${SITE.city}, ${SITE.country.en}. [To be confirmed: legal entity name and registered address.]`,
            `Privacy questions can be sent to ${SITE.email}.`,
          ],
        },
        {
          heading: "2. Data we collect",
          list: [
            "Contact form: name, email address, company name (optional), and your message. To prevent abuse we also store the sender's IP address and browser type (user agent).",
            "Visit logs: pages visited, referring page, time of visit, IP address, approximate city/region/country, and device, browser, and operating system type.",
            "Browser storage: display preferences are kept in localStorage. Technical cookies are used only for admin panel sign-in.",
          ],
        },
        {
          heading: "3. How data is processed",
          list: [
            "Approximate location is derived from the IP address using a GeoIP database that runs on our own server; IP addresses are not sent to third-party geolocation services.",
            "We do not use advertising cookies or third-party analytics services.",
            "We do not sell personal data.",
          ],
        },
        {
          heading: "4. Purposes",
          list: [
            "Replying to the enquiries and demo requests you send.",
            "Keeping the website secure and preventing spam or abuse.",
            "Understanding website usage in aggregate in order to improve it.",
          ],
        },
        {
          heading: "5. Third parties",
          list: [
            "Google Fonts: your browser loads fonts from Google's servers, so Google receives your IP address.",
            "Hosting provider: Hostinger (VPS). [To be confirmed: data centre location.]",
            "Email provider for our contact address. [To be confirmed: provider name.]",
          ],
        },
        {
          heading: "6. Retention",
          body: ["[To be confirmed: retention period for contact messages and visit logs, e.g. 24 months and 12 months.]"],
        },
        {
          heading: "7. Your rights",
          body: [
            `Under Indonesia's Personal Data Protection Law (Law No. 27 of 2022), you may request access to, correction of, or deletion of your personal data, or withdraw consent, by contacting ${SITE.email}.`,
          ],
        },
        {
          heading: "8. Data inside our products",
          body: [
            "Data that customers upload to or manage in Reconly and KaryaPeople is processed to provide the service to that customer. [To be confirmed: product hosting location, sub-processors, and whether each product has its own privacy policy.]",
          ],
        },
        {
          heading: "9. Security",
          body: ["The entire website is served over HTTPS. Admin panel access is restricted to accounts with the admin role."],
        },
        {
          heading: "10. Changes",
          body: ["Changes will be published on this page together with the date of the update."],
        },
      ],
    },
    terms: {
      eyebrow: "Legal",
      title: "Terms of Service",
      updated: "[To be confirmed: effective date]",
      intro: `These terms govern your use of the ${SITE.domain} website and ${SITE.name}'s SaaS services, Reconly and KaryaPeople.`,
      sections: [
        {
          heading: "1. Parties",
          body: [`"We" means ${SITE.name} [To be confirmed: legal entity name]. "You" means a website visitor or service user.`],
        },
        {
          heading: "2. Services",
          body: [
            "The services include this website and the Reconly and KaryaPeople applications. A subscription agreement or product-specific terms, if any, take precedence where they conflict with these terms. [To be confirmed: whether a separate subscription agreement exists.]",
          ],
        },
        {
          heading: "3. Accounts",
          body: ["You are responsible for keeping your account credentials confidential and for all activity under your account."],
        },
        {
          heading: "4. Prohibited use",
          list: [
            "Attempting to access systems or data without authorisation.",
            "Uploading content that is unlawful or infringes the rights of others.",
            "Disrupting, overloading, or damaging the services.",
          ],
        },
        {
          heading: "5. Customer data",
          body: [
            "Data you upload to the services remains yours. We process it only to provide the services, as described in the Privacy Policy.",
          ],
        },
        {
          heading: "6. Fees",
          body: ["[To be confirmed: pricing model, trial period, currency, and billing.]"],
        },
        {
          heading: "7. Availability",
          body: [
            'The services are provided "as is". We work to keep them available but do not guarantee uninterrupted operation. [To be confirmed: whether an SLA applies.]',
          ],
        },
        {
          heading: "8. Intellectual property",
          body: [`The software and the ${SITE.name}, Reconly, and KaryaPeople names and logos belong to us.`],
        },
        {
          heading: "9. Limitation of liability",
          body: ["[To be confirmed: liability cap — to be reviewed by legal counsel.]"],
        },
        {
          heading: "10. Termination",
          body: [
            "We may suspend access if these terms are breached. [To be confirmed: data export procedure when a subscription ends.]",
          ],
        },
        {
          heading: "11. Governing law",
          body: ["These terms are governed by the laws of the Republic of Indonesia. [To be confirmed: venue for dispute resolution.]"],
        },
        {
          heading: "12. Contact",
          body: [`Questions about these terms can be sent to ${SITE.email}.`],
        },
      ],
    },
  },
};

export const MESSAGES: Record<"id" | "en", Messages> = { id, en };
