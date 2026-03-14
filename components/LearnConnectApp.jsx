'use client'

import { useState, useRef, useEffect, useMemo, createContext, useContext, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// LEARNCONNECT v4  ·  Improved Architecture
// ✅ AppContext  — prop drilling yok
// ✅ CSS vars    — tek static CSS, runtime yeniden hesaplama yok
// ✅ useClaude   — merkezi hook, retry + hata mesajları
// ✅ Toast       — kullanıcı dostu hata bildirimi
// ✅ MobileNav   — altta sabit bottom bar
// ✅ Dil sistemi — useApp() üzerinden t(key) erişimi
// ─────────────────────────────────────────────────────────────

// ── MOCK DATA ─────────────────────────────────────────────────
const MCP_STUDENTS = [
  { id:1, name:"Ayşe Kaya",    exam:"TYT", math:72, turkish:85, science:68, social:79, streak:14 },
  { id:2, name:"Mehmet Demir", exam:"AYT", math:58, turkish:71, science:82, social:63, streak:7  },
  { id:3, name:"Zeynep Şahin", exam:"LGS", math:91, turkish:88, science:76, social:93, streak:21 },
  { id:4, name:"Can Yıldız",   exam:"TYT", math:45, turkish:62, science:51, social:58, streak:3  },
  { id:5, name:"Elif Arslan",  exam:"AYT", math:83, turkish:77, science:89, social:71, streak:18 },
];
const MCP_WEAK = [
  { topic:"Türev & İntegral", exam:"AYT", fail:61 },
  { topic:"Organik Kimya",    exam:"AYT", fail:57 },
  { topic:"Paragraf Analizi", exam:"TYT", fail:49 },
  { topic:"Trigonometri",     exam:"TYT", fail:44 },
  { topic:"Geometri",         exam:"LGS", fail:38 },
];
const MCP_FILES = [
  { name:"tyt_matematik_soru_bankasi.pdf", size:"4.2 MB", topics:["Cebir","Geometri","Olasılık"],    pages:312, updated:"2025-01-15" },
  { name:"ayt_fizik_ders_notu.pdf",        size:"2.8 MB", topics:["Mekanik","Optik","Elektrik"],     pages:218, updated:"2025-02-03" },
  { name:"tyt_turkce_konu_anlatimi.pdf",   size:"1.9 MB", topics:["Paragraf","Dil Bilgisi","Anlam"],pages:156, updated:"2025-01-28" },
  { name:"lgs_fen_bilimleri_ozet.pdf",     size:"3.1 MB", topics:["Hücre","Kuvvet","Madde"],         pages:204, updated:"2025-02-10" },
  { name:"ayt_kimya_formul_listesi.pdf",   size:"0.8 MB", topics:["Asit-Baz","Organik","Elektrokim"],pages:64, updated:"2025-02-18" },
  { name:"tyt_video_transkript.txt",       size:"0.4 MB", topics:["Sayılar","Problem","Yüzde"],      pages:89,  updated:"2025-03-01" },
];
const MCP_NEWS = [
  { title:"YKS 2025 Başvuru Tarihleri Açıklandı",            source:"ÖSYM",        date:"2025-03-05", tag:"Duyuru",    summary:"2025 YKS başvuruları 4-21 Mart tarihleri arasında alınacak." },
  { title:"TYT'de Matematik Ağırlığı Artıyor",               source:"MEB",         date:"2025-03-03", tag:"Müfredat",  summary:"2025-2026'dan itibaren TYT matematik sorularının zorluk seviyesi revize edilecek." },
  { title:"Yapay Zeka Destekli Hazırlık Yaygınlaşıyor",      source:"EğitimHaber", date:"2025-03-01", tag:"Teknoloji", summary:"Türk EdTech girişimleri AI tabanlı adaptif öğrenme çözümleri geliştiriyor." },
  { title:"LGS 2025: Değişen Puan Hesaplama",                source:"MEB",         date:"2025-02-28", tag:"LGS",       summary:"LGS puan formülünde güncelleme; sosyal bilimler ağırlığı artırıldı." },
  { title:"Özel Dershanelere Yeni Denetim Standartları",     source:"MEB",         date:"2025-02-25", tag:"Politika",  summary:"Bakanlık, özel öğretim kurumları için yeni kalite kriterleri belirledi." },
];
const STATS = { totalUsers:12847, activeToday:1432, avgStreak:11.2, completionRate:68 };
const EXAMS_INIT = [
  { id:1, type:"tyt",  name:"TYT – Temel Yeterlilik", date:"2025-06-14", reg:"2025-03-01", subject:"Tüm Dersler",   progress:62 },
  { id:2, type:"ayt",  name:"AYT – Alan Yeterlilik",  date:"2025-06-15", reg:"2025-03-01", subject:"Alan Dersleri", progress:45 },
  { id:3, type:"lgs",  name:"LGS – Liselere Geçiş",  date:"2025-06-08", reg:"2025-04-01", subject:"8. Sınıf",      progress:78 },
  { id:4, type:"intl", name:"SAT",                    date:"2025-08-23", reg:"2025-07-18", subject:"Math & Reading", progress:30 },
  { id:5, type:"intl", name:"IELTS Academic",         date:"2025-07-12", reg:"2025-06-28", subject:"English",        progress:55 },
];
const COURSES = [
  { id:1, tag:"TYT", name:"TYT Matematik", emoji:"📐", color:"#16a34a", bg:"rgba(22,163,74,.12)",  lessons:24, hours:"48s", level:"Orta",      units:["Sayılar","Cebir","Geometri","Veri Analizi","Olasılık"] },
  { id:2, tag:"TYT", name:"TYT Türkçe",   emoji:"📖", color:"#b45309", bg:"rgba(180,83,9,.12)",   lessons:20, hours:"40s", level:"Başlangıç",  units:["Sözcük","Cümle","Paragraf","Noktalama","Anlam"] },
  { id:3, tag:"AYT", name:"AYT Fizik",    emoji:"⚡", color:"#4f46e5", bg:"rgba(79,70,229,.12)",  lessons:30, hours:"60s", level:"İleri",      units:["Mekanik","Elektrik","Optik","Dalgalar","Modern Fizik"] },
  { id:4, tag:"AYT", name:"AYT Kimya",    emoji:"🧪", color:"#dc2626", bg:"rgba(220,38,38,.12)",  lessons:28, hours:"56s", level:"İleri",      units:["Atom","Kimyasal Bağlar","Asit-Baz","Organik","Elektrokim"] },
  { id:5, tag:"LGS", name:"LGS Matematik",emoji:"🔢", color:"#16a34a", bg:"rgba(22,163,74,.12)",  lessons:18, hours:"36s", level:"Orta",       units:["Rasyonel Sayılar","Denklemler","Geometri","Veri","Eşitsizlik"] },
  { id:6, tag:"SAT", name:"SAT Math",     emoji:"🌐", color:"#4f46e5", bg:"rgba(79,70,229,.12)",  lessons:22, hours:"44s", level:"İleri",      units:["Algebra","Problem Solving","Advanced Math","Geometry","Stats"] },
];
const WEEK_PLAN = [
  { day:{tr:"Pazartesi",en:"Monday"},   tasks:[{label:"TYT Math – Cebir",cat:"math"},{label:"TYT Türkçe – Paragraf",cat:"tr"}] },
  { day:{tr:"Salı",en:"Tuesday"},       tasks:[{label:"AYT Fizik – Mekanik",cat:"sci"},{label:"Deneme × 20 soru",cat:"test"}] },
  { day:{tr:"Çarşamba",en:"Wednesday"}, tasks:[{label:"TYT Math – Geometri",cat:"math"},{label:"TYT Sosyal – Tarih",cat:"social"}] },
  { day:{tr:"Perşembe",en:"Thursday"},  tasks:[{label:"AYT Kimya – Atom",cat:"sci"},{label:"TYT Türkçe – Cümle",cat:"tr"}] },
  { day:{tr:"Cuma",en:"Friday"},        tasks:[{label:"Tam TYT Denemesi 📝",cat:"test"},{label:"Hata Analizi",cat:"review"}] },
  { day:{tr:"Cumartesi",en:"Saturday"}, tasks:[{label:"AYT Fizik – Elektrik",cat:"sci"},{label:"AYT Math – Türev",cat:"math"}] },
  { day:{tr:"Pazar",en:"Sunday"},       tasks:[{label:"Haftalık Değerlendirme 📊",cat:"review"}] },
];

// ── TRANSLATIONS ──────────────────────────────────────────────
const TR = {
  tr:{
    nav:{ home:"Ana Sayfa", exams:"Sınavlar", planner:"Planlayıcı", courses:"Dersler", chat:"AI Sohbet", mcp:"MCP Analiz", signup:"Ücretsiz Kayıt" },
    home:{ badge:"✨ Yapay Zeka Destekli Eğitim Portalı", h1:"Daha Akıllı Çalış,", h2:"Daha Yüksek", h3:"Puan Al", cta1:"Çalışma Planı Oluştur →", cta2:"Derslere Göz At", viewAll:"Tümünü Gör →" },
    exams:{ title:"Sınav Takvimi", sub:"Geri sayımlar ve ilerleme takibi", add:"+ Sınav Ekle", daysLeft:"gün kaldı", passed:"Geçti", prep:"Hazırlık", calView:"Takvim", listView:"Liste", nameLabel:"Ad", typeLabel:"Tür", dateLabel:"Tarih", subjectLabel:"Ders", cancel:"İptal", save:"Kaydet" },
    planner:{ title:"AI Çalışma Planı", sub:"Kişiselleştirilmiş program oluştur", genBtn:"✨ AI Planı Oluştur", generating:"Oluşturuluyor", weekTitle:"Bu Haftanın Programı", hint:"Tamamlamak için tıkla ✓", aiLabel:"AI Tavsiyesi", progress:"Haftalık İlerleme", evalTitle:"🎯 Konu Değerlendirici", evalBtn:"Değerlendir", examLabel:"Hedef Sınav", hoursLabel:"Günlük Saat", weakLabel:"Zayıf Dersler", dateLabel:"Sınav Tarihi", analyzing:"Analiz ediliyor" },
    courses:{ title:"Ders Tarayıcı", sub:"TYT, AYT, LGS ve uluslararası müfredatlar", search:"Ders ara...", done:"✓ Tamam", inprogress:"⟳ Devam", newLabel:"Yeni", enroll:"Derse Kaydol →", aiNext:"✨ AI Sonraki Dersi Öner", unitsLabel:"Üniteler", clickToggle:"tıklayarak durum değiştir" },
    chat:{ title:"AI Çalışma Asistanı", sub:"Her soruyu sorabilirsin", ph:"TYT, AYT, çalışma ipuçları...", send:"Gönder", clear:"Temizle", welcome:"Merhaba! 👋 TYT, AYT, LGS veya uluslararası sınavlar hakkında her şeyi sorabilirsin." },
    mcp:{ title:"MCP Intelligence", sub:"PostgreSQL · Filesystem · HTTP/RSS canlı veriler", pgTitle:"Öğrenci Analitikleri", fsTitle:"Ders Materyalleri", newsTitle:"Güncel Haberler", scanBtn:"↻ Tara", summarizeBtn:"✨ AI Özetle", askBtn:"Sor", askPH:"Materyaller hakkında sor...", hardTopics:"En Çok Hata Yapılan Konular", totalStudents:"Toplam Öğrenci", activeToday:"Bugün Aktif", avgStreak:"Ort. Seri", completion:"Tamamlanma", filesIndexed:"dosya indekslendi" },
    errors:{ retry:"Tekrar Dene", apiError:"API bağlantı hatası. Tekrar deneyin.", emptyReply:"Yanıt alınamadı." },
  },
  en:{
    nav:{ home:"Home", exams:"Exams", planner:"Planner", courses:"Courses", chat:"AI Chat", mcp:"MCP Analysis", signup:"Sign Up Free" },
    home:{ badge:"✨ AI-Powered Education Portal", h1:"Learn Smarter,", h2:"Score", h3:"Higher", cta1:"Generate Study Plan →", cta2:"Browse Courses", viewAll:"View all →" },
    exams:{ title:"Exam Timetable", sub:"Countdowns and progress tracking", add:"+ Add Exam", daysLeft:"days left", passed:"Passed", prep:"Preparation", calView:"Calendar", listView:"List", nameLabel:"Name", typeLabel:"Type", dateLabel:"Date", subjectLabel:"Subject", cancel:"Cancel", save:"Save" },
    planner:{ title:"AI Study Planner", sub:"Generate your personalized schedule", genBtn:"✨ Generate AI Plan", generating:"Generating", weekTitle:"This Week's Schedule", hint:"Click tasks to complete ✓", aiLabel:"AI Recommendation", progress:"Weekly Progress", evalTitle:"🎯 Topic Evaluator", evalBtn:"Evaluate", examLabel:"Target Exam", hoursLabel:"Hours/Day", weakLabel:"Weak Subjects", dateLabel:"Exam Date", analyzing:"Analyzing" },
    courses:{ title:"Course Browser", sub:"TYT, AYT, LGS and international curricula", search:"Search courses...", done:"✓ Done", inprogress:"⟳ In Progress", newLabel:"New", enroll:"Enroll →", aiNext:"✨ AI Suggest Next", unitsLabel:"Units", clickToggle:"click to toggle status" },
    chat:{ title:"AI Study Assistant", sub:"Ask anything about your exams", ph:"TYT, AYT, study tips...", send:"Send", clear:"Clear", welcome:"Hi! 👋 Ask me anything about TYT, AYT, LGS or international exams." },
    mcp:{ title:"MCP Intelligence", sub:"PostgreSQL · Filesystem · HTTP/RSS live data", pgTitle:"Student Analytics", fsTitle:"Course Materials", newsTitle:"Education News", scanBtn:"↻ Scan", summarizeBtn:"✨ AI Summarize", askBtn:"Ask", askPH:"Ask about materials...", hardTopics:"Most Difficult Topics", totalStudents:"Total Students", activeToday:"Active Today", avgStreak:"Avg Streak", completion:"Completion", filesIndexed:"files indexed" },
    errors:{ retry:"Retry", apiError:"API connection error. Please try again.", emptyReply:"No response received." },
  }
};

// ── THEME — CSS variable maps + raw th for inline styles ──────
const THEMES = {
  light:{
    vars:{
      "--bg":"#f5f3ee","--card":"#ffffff","--elevated":"#fafaf8",
      "--ink":"#1a1a2e","--lt":"#64748b","--faint":"#e2ddd5",
      "--accent":"#16a34a","--accent-h":"#15803d",
      "--gold":"#b45309","--red":"#dc2626","--blue":"#4f46e5","--purple":"#7c3aed",
      "--border":"#e5e0d8","--shadow":"rgba(0,0,0,0.06)",
      "--hl":"#dcfce7","--hl-ink":"#16a34a",
    },
    th:{ accent:"#16a34a", gold:"#b45309", red:"#dc2626", blue:"#4f46e5", purple:"#7c3aed",
         ink:"#1a1a2e", light:"#64748b", elevated:"#fafaf8", border:"#e5e0d8", bg:"#f5f3ee", card:"#ffffff" }
  },
  dark:{
    vars:{
      "--bg":"#0d1117","--card":"#161b22","--elevated":"#1c2333",
      "--ink":"#e6edf3","--lt":"#8b949e","--faint":"#21262d",
      "--accent":"#3fb950","--accent-h":"#56d364",
      "--gold":"#d29922","--red":"#f85149","--blue":"#79c0ff","--purple":"#bc8cff",
      "--border":"#30363d","--shadow":"rgba(0,0,0,0.4)",
      "--hl":"#0d2816","--hl-ink":"#3fb950",
    },
    th:{ accent:"#3fb950", gold:"#d29922", red:"#f85149", blue:"#79c0ff", purple:"#bc8cff",
         ink:"#e6edf3", light:"#8b949e", elevated:"#1c2333", border:"#30363d", bg:"#0d1117", card:"#161b22" }
  }
};

// ── STATIC CSS — uses var() only, injected once ────────────────
// No string interpolation — theme changes update CSS vars on root div
const STATIC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{background:var(--bg)}
body{font-family:'DM Sans',sans-serif;color:var(--ink);background:var(--bg);transition:background .3s,color .3s;min-height:100vh}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--accent);border-radius:3px}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,80%,100%{opacity:.15}40%{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes scanline{0%{top:-2px}100%{top:100%}}
@keyframes slideIn{from{opacity:0;transform:translateX(80px)}to{opacity:1;transform:translateX(0)}}
.anim{animation:fadeUp .35s ease both}
.ldot{display:inline-block;animation:blink 1.2s infinite}.ldot2{animation-delay:.2s}.ldot3{animation-delay:.4s}

/* NAV */
.nav{position:sticky;top:0;z-index:100;height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;background:color-mix(in srgb,var(--bg) 91%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);transition:background .3s,border-color .3s}
.nav-logo{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:5px;flex-shrink:0}
.nav-logo em{color:var(--accent);font-style:normal}
.nav-logo small{font-size:.65rem;font-family:'DM Sans',sans-serif;font-weight:400;color:var(--lt)}
.nav-tabs{display:flex;gap:2px;overflow-x:auto}
.ntab{padding:5px 13px;border-radius:20px;border:none;background:transparent;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:500;color:var(--lt);transition:all .2s;white-space:nowrap}
.ntab:hover{background:var(--hl);color:var(--accent)}
.ntab.on{background:var(--accent);color:#fff}
.nav-right{display:flex;align-items:center;gap:6px;flex-shrink:0}
.icon-btn{width:32px;height:32px;border-radius:7px;background:var(--card);border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.9rem;color:var(--ink);transition:all .2s}
.icon-btn:hover{border-color:var(--accent);color:var(--accent)}
.cta-btn{padding:7px 16px;background:var(--ink);color:var(--bg);border:none;border-radius:20px;font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
.cta-btn:hover{background:var(--accent)}

/* PAGE */
.page{padding:2rem 1.5rem 5rem;max-width:1080px;margin:0 auto}

/* BUTTONS */
.btn-primary{background:var(--accent);color:#fff;border:none;padding:10px 22px;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:.88rem;cursor:pointer;transition:all .2s}
.btn-primary:hover{background:var(--accent-h);transform:translateY(-2px);box-shadow:0 6px 18px color-mix(in srgb,var(--accent) 27%,transparent)}
.btn-outline{background:transparent;color:var(--ink);border:1.5px solid var(--border);padding:10px 22px;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:.88rem;cursor:pointer;transition:all .2s}
.btn-outline:hover{border-color:var(--accent);color:var(--accent)}
.btn-ghost{background:var(--elevated);border:1px solid var(--border);padding:7px 14px;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:500;color:var(--lt);cursor:pointer;transition:all .2s}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.btn-ai{background:var(--ink);color:var(--bg);border:none;padding:9px 16px;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:.85rem;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px}
.btn-ai:hover{background:var(--accent)}
.btn-ai:disabled{opacity:.5;cursor:not-allowed;transform:none}
.link-btn{background:none;border:none;color:var(--accent);font-weight:600;cursor:pointer;font-size:.85rem;font-family:'DM Sans',sans-serif}
.btn-retry{background:color-mix(in srgb,var(--red) 12%,transparent);color:var(--red);border:1px solid color-mix(in srgb,var(--red) 30%,transparent);padding:5px 12px;border-radius:6px;font-size:.78rem;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;transition:all .2s}
.btn-retry:hover{background:color-mix(in srgb,var(--red) 20%,transparent)}

/* CARDS & GRIDS */
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.4rem;transition:all .2s}
.card:hover{border-color:color-mix(in srgb,var(--accent) 33%,transparent)}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}

/* TYPOGRAPHY */
.page-title{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;margin-bottom:.3rem;color:var(--ink)}
.page-sub{font-size:.85rem;color:var(--lt);margin-bottom:1.8rem}
.card-title{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;margin-bottom:1rem;display:flex;align-items:center;gap:7px;flex-wrap:wrap;color:var(--ink)}
.badge{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2px 7px;border-radius:4px}

/* KPI */
.kpi{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.1rem;transition:all .2s}
.kpi:hover{border-color:color-mix(in srgb,var(--accent) 33%,transparent);transform:translateY(-2px)}
.kpi-lbl{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--lt);margin-bottom:.35rem}
.kpi-val{font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700;line-height:1;color:var(--ink)}
.kpi-sub{font-size:.65rem;font-weight:600;margin-top:.25rem}

/* HERO */
.hero{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;padding:2.5rem 0 3rem}
.hero-badge{display:inline-flex;align-items:center;gap:5px;background:var(--hl);color:var(--hl-ink);padding:4px 12px;border-radius:20px;font-size:.75rem;font-weight:600;margin-bottom:1rem}
.hero-title{font-family:'Playfair Display',serif;font-size:clamp(1.9rem,3.5vw,2.9rem);line-height:1.15;font-weight:900;margin-bottom:1rem;color:var(--ink)}
.hero-title em{color:var(--accent);font-style:normal}
.hero-sub{color:var(--lt);font-size:.95rem;line-height:1.75;margin-bottom:1.6rem}
.hero-btns{display:flex;gap:10px;flex-wrap:wrap}
.hero-panel{background:var(--elevated);border:1px solid var(--border);border-radius:18px;padding:1.5rem}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:1rem;transition:all .2s}
.stat-card:hover{border-color:color-mix(in srgb,var(--accent) 27%,transparent)}
.stat-num{font-family:'Playfair Display',serif;font-size:1.75rem;font-weight:700}
.stat-lbl{font-size:.72rem;color:var(--lt);margin-top:2px}

/* FEATURE CARDS */
.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:3rem}
.feat-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.3rem;transition:all .22s}
.feat-card:hover{transform:translateY(-3px);box-shadow:0 10px 24px var(--shadow)}
.feat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin-bottom:.85rem}
.feat-name{font-weight:600;font-size:.88rem;margin-bottom:.3rem;color:var(--ink)}
.feat-desc{font-size:.8rem;color:var(--lt);line-height:1.6}

/* COURSE CARDS */
.course-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.course-card{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;transition:all .22s}
.course-card:hover{transform:translateY(-3px);box-shadow:0 10px 24px var(--shadow)}
.course-thumb{height:100px;display:flex;align-items:center;justify-content:center;font-size:2.5rem}
.course-body{padding:1rem}
.course-tag{font-size:.67rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2px 7px;border-radius:4px;display:inline-block;margin-bottom:6px}
.course-name{font-weight:700;font-size:.88rem;margin-bottom:5px;color:var(--ink)}
.course-meta{font-size:.76rem;color:var(--lt);display:flex;gap:10px}

/* EXAM TRACKER */
.exam-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;margin-bottom:1.5rem}
.exam-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.2rem;position:relative;overflow:hidden;transition:all .2s}
.exam-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px var(--shadow)}
.exam-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:4px 0 0 4px}
.exam-card.tyt::before{background:var(--accent)}
.exam-card.ayt::before{background:var(--gold)}
.exam-card.lgs::before{background:var(--red)}
.exam-card.intl::before{background:var(--blue)}
.exam-type-label{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.4rem}
.exam-name{font-family:'Playfair Display',serif;font-size:.95rem;font-weight:700;margin-bottom:.6rem;color:var(--ink)}
.exam-detail{font-size:.77rem;color:var(--lt);margin-bottom:.25rem}
.cd-pill{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:700;margin-top:.7rem}
.cd-urgent{background:color-mix(in srgb,var(--red) 12%,transparent);color:var(--red)}
.cd-ok{background:color-mix(in srgb,var(--gold) 12%,transparent);color:var(--gold)}
.cd-far{background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)}
.prog-outer{height:5px;background:var(--border);border-radius:4px;overflow:hidden}
.prog-inner{height:100%;background:var(--accent);border-radius:4px;transition:width .6s}

/* VIEW TOGGLE */
.view-toggle{display:flex;background:var(--elevated);border:1px solid var(--border);border-radius:8px;padding:3px;gap:2px}
.vt{padding:4px 12px;border-radius:6px;border:none;background:transparent;cursor:pointer;font-size:.78rem;font-weight:500;color:var(--lt);transition:all .2s;font-family:'DM Sans',sans-serif}
.vt.on{background:var(--accent);color:#fff}

/* CALENDAR */
.cal-wrap{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.4rem}
.cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.cal-nav-btn{background:var(--elevated);border:1px solid var(--border);border-radius:7px;width:30px;height:30px;cursor:pointer;color:var(--ink);font-size:1rem;display:flex;align-items:center;justify-content:center}
.cal-month-title{font-family:'Playfair Display',serif;font-weight:700;font-size:1rem;color:var(--ink)}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.cal-dow{text-align:center;font-size:.7rem;font-weight:700;color:var(--lt);padding:.3rem 0;text-transform:uppercase}
.cal-cell{min-height:60px;padding:5px;border-radius:7px;border:1px solid transparent;font-size:.78rem;color:var(--lt)}
.cal-cell.today{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,transparent)}
.cal-cell.empty{background:transparent}
.cal-day-num{font-weight:600;color:var(--ink);margin-bottom:3px;font-size:.8rem}
.cal-dot{font-size:.58rem;font-weight:700;padding:1px 5px;border-radius:3px;display:inline-block;margin:1px 0}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:200;padding:1rem}
.modal{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.8rem;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.modal-title{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:700;color:var(--ink);margin-bottom:1.2rem}
.form-group{margin-bottom:.9rem}
.form-label{font-size:.75rem;font-weight:600;color:var(--lt);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:.3rem}
.form-input,.form-select{width:100%;background:var(--elevated);border:1px solid var(--border);border-radius:8px;padding:.55rem .85rem;color:var(--ink);font-family:'DM Sans',sans-serif;font-size:.88rem;outline:none;transition:border-color .2s}
.form-input:focus,.form-select:focus{border-color:var(--accent)}
.modal-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:1.2rem}
.btn-cancel{background:var(--elevated);border:1px solid var(--border);color:var(--lt);padding:8px 18px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.85rem;transition:all .2s}
.btn-cancel:hover{border-color:var(--border);color:var(--ink)}
.btn-save{background:var(--accent);color:#fff;border:none;padding:8px 18px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:600;transition:all .2s}
.btn-save:hover{background:var(--accent-h)}

/* PLANNER */
.planner-layout{display:grid;grid-template-columns:280px 1fr;gap:1.5rem;align-items:start}
.plan-side{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.3rem;position:sticky;top:72px}
.plan-side-title{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--ink);margin-bottom:1rem}
.ai-box{background:color-mix(in srgb,var(--accent) 8%,transparent);border:1px solid color-mix(in srgb,var(--accent) 20%,transparent);border-left:3px solid var(--accent);border-radius:10px;padding:1rem;margin-bottom:1rem}
.ai-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--accent)}
.ai-text{font-size:.84rem;line-height:1.75;color:var(--ink);white-space:pre-line;margin-top:.4rem}
.day-row{display:flex;align-items:flex-start;gap:.75rem;padding:.6rem 0;border-bottom:1px solid color-mix(in srgb,var(--border) 50%,transparent)}
.day-row:last-child{border-bottom:none}
.day-label{font-size:.75rem;font-weight:700;color:var(--lt);text-transform:uppercase;letter-spacing:.04em;width:78px;flex-shrink:0;padding-top:5px}
.task-pills{display:flex;gap:6px;flex-wrap:wrap}
.task-pill{padding:5px 11px;border-radius:20px;font-size:.77rem;font-weight:500;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all .2s}
.task-pill.done{text-decoration:line-through;opacity:.6}
.eval-box{background:var(--elevated);border:1px solid var(--border);border-radius:12px;padding:1.1rem;margin-top:1rem}
.eval-row{display:flex;gap:8px;margin-top:.7rem}
.eval-input{flex:1;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.55rem .85rem;color:var(--ink);font-family:'DM Sans',sans-serif;font-size:.84rem;outline:none}
.eval-input:focus{border-color:var(--accent)}

/* TASK CATEGORY COLORS */
.cat-math{background:color-mix(in srgb,var(--accent) 15%,transparent);color:var(--accent)}
.cat-tr{background:color-mix(in srgb,var(--gold) 15%,transparent);color:var(--gold)}
.cat-sci{background:color-mix(in srgb,var(--blue) 15%,transparent);color:var(--blue)}
.cat-test{background:var(--ink);color:var(--bg)}
.cat-social{background:color-mix(in srgb,var(--red) 12%,transparent);color:var(--red)}
.cat-review{background:color-mix(in srgb,var(--accent) 10%,transparent);color:var(--accent-h)}

/* WEAK TOPICS */
.wt-row{display:flex;align-items:center;gap:8px;padding:.45rem 0;border-bottom:1px solid color-mix(in srgb,var(--border) 50%,transparent)}
.wt-row:last-child{border-bottom:none}
.wt-name{font-size:.8rem;font-weight:500;flex:1;color:var(--ink)}
.wt-exam{font-size:.62rem;font-weight:700;padding:2px 6px;border-radius:3px;background:var(--elevated);color:var(--lt)}
.wt-track{width:90px;height:4px;background:var(--border);border-radius:3px;overflow:hidden}
.wt-fill{height:100%;border-radius:3px;background:var(--red)}
.wt-pct{font-family:'DM Mono',monospace;font-size:.7rem;color:var(--red);width:30px;text-align:right}

/* COURSE BROWSER */
.browser-bar{display:flex;align-items:center;gap:8px;margin-bottom:1.2rem;flex-wrap:wrap}
.search-wrap{display:flex;align-items:center;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.45rem .85rem;flex:1;min-width:180px}
.search-input{border:none;background:transparent;color:var(--ink);font-family:'DM Sans',sans-serif;font-size:.85rem;outline:none;width:100%}
.search-icon{color:var(--lt);font-size:.9rem}
.filter-pill{padding:5px 14px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--lt);cursor:pointer;font-size:.78rem;font-weight:600;font-family:'DM Sans',sans-serif;transition:all .2s}
.filter-pill.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.curr-layout{display:grid;grid-template-columns:220px 1fr;gap:1.2rem;align-items:start}
.tree-panel{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden}
.tree-hd{padding:.7rem 1rem;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--lt);border-bottom:1px solid var(--border)}
.tree-item{display:flex;align-items:center;gap:8px;padding:.65rem 1rem;cursor:pointer;font-size:.83rem;transition:all .2s;border-left:3px solid transparent;color:var(--ink)}
.tree-item:hover{background:color-mix(in srgb,var(--accent) 8%,transparent)}
.tree-item.sel{background:color-mix(in srgb,var(--accent) 8%,transparent);border-left-color:var(--accent);font-weight:600}
.detail-panel{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.4rem}
.detail-tag{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:3px 10px;border-radius:5px;display:inline-block;margin-bottom:.7rem}
.detail-title{font-family:'Playfair Display',serif;font-size:1.35rem;font-weight:700;color:var(--ink);margin-bottom:.5rem}
.detail-desc{font-size:.83rem;color:var(--lt);line-height:1.7;margin-bottom:1rem}
.detail-meta{display:flex;gap:.8rem;margin-bottom:1.2rem;flex-wrap:wrap}
.dm-item{background:var(--elevated);border-radius:8px;padding:.55rem .9rem;font-size:.78rem}
.dm-label{color:var(--lt);font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:2px}
.dm-val{color:var(--ink);font-weight:600}
.unit-row{display:flex;align-items:center;gap:8px;padding:.45rem .6rem;border-radius:7px;margin-bottom:3px;transition:background .2s}
.unit-row:hover{background:color-mix(in srgb,var(--border) 40%,transparent)}
.unit-num{font-family:'DM Mono',monospace;font-size:.72rem;color:var(--lt);width:22px}
.unit-name{font-size:.83rem;flex:1;color:var(--ink)}
.unit-status{padding:3px 10px;border-radius:20px;font-size:.7rem;font-weight:700;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.us-new{background:color-mix(in srgb,var(--border) 60%,transparent);color:var(--lt)}
.us-prog{background:color-mix(in srgb,var(--gold) 15%,transparent);color:var(--gold)}
.us-done{background:color-mix(in srgb,var(--accent) 15%,transparent);color:var(--accent)}
.ai-suggest-box{background:color-mix(in srgb,var(--blue) 8%,transparent);border:1px solid color-mix(in srgb,var(--blue) 20%,transparent);border-left:3px solid var(--blue);border-radius:9px;padding:.9rem;margin:1rem 0;font-size:.83rem;line-height:1.75;white-space:pre-line;color:var(--ink)}
.enroll-btn{width:100%;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:10px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;transition:all .2s;margin-top:1rem}
.enroll-btn:hover{background:var(--accent-h)}

/* AI CHAT */
.suggestions{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}
.sug-btn{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:5px 13px;font-size:.78rem;cursor:pointer;color:var(--lt);font-family:'DM Sans',sans-serif;transition:all .2s}
.sug-btn:hover{border-color:var(--accent);color:var(--accent)}
.chat-layout{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.chat-msgs{flex:1;max-height:420px;overflow-y:auto;padding:1.2rem;display:flex;flex-direction:column;gap:.75rem}
.msg{max-width:80%;padding:.8rem 1.1rem;border-radius:12px;font-size:.86rem;line-height:1.7}
.msg.ai{background:var(--elevated);border:1px solid var(--border);align-self:flex-start;color:var(--ink)}
.msg.user{background:var(--accent);color:#fff;align-self:flex-end;border-radius:12px 12px 3px 12px}
.chat-footer{display:flex;gap:8px;padding:.9rem;border-top:1px solid var(--border);background:var(--elevated)}
.chat-input{flex:1;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.6rem .9rem;color:var(--ink);font-family:'DM Sans',sans-serif;font-size:.88rem;outline:none;resize:none}
.chat-input:focus{border-color:var(--accent)}
.chat-send{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;flex-shrink:0}
.chat-send:hover{background:var(--accent-h)}
.chat-send:disabled{opacity:.5;cursor:not-allowed}
.chat-clear{background:var(--elevated);border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:.8rem;cursor:pointer;color:var(--lt);font-family:'DM Sans',sans-serif;transition:all .2s;flex-shrink:0}
.chat-clear:hover{color:var(--red);border-color:var(--red)}

/* MCP DASHBOARD */
.mcp-status{font-size:.78rem;font-weight:600;display:flex;align-items:center;gap:5px}
.mcp-online{color:var(--accent)}
.scan-box{background:var(--faint);border-radius:8px;padding:.8rem 1rem;font-family:'DM Mono',monospace;font-size:.74rem;color:var(--lt);white-space:pre-line;line-height:1.8;margin-bottom:.8rem;position:relative;overflow:hidden;border:1px solid var(--border)}
.scan-line{position:absolute;left:0;right:0;height:2px;background:color-mix(in srgb,var(--accent) 60%,transparent);animation:scanline 1.2s linear infinite}
.file-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem}
.file-card{background:var(--elevated);border:1px solid var(--border);border-radius:9px;padding:.8rem}
.file-name{font-size:.75rem;font-weight:600;color:var(--ink);margin-bottom:.3rem;word-break:break-all}
.file-meta{display:flex;gap:6px;font-size:.7rem;color:var(--lt);margin-bottom:.4rem}
.topic-chip{background:color-mix(in srgb,var(--blue) 10%,transparent);color:var(--blue);font-size:.65rem;font-weight:600;padding:2px 7px;border-radius:4px}

/* TABLE */
.tbl{width:100%;border-collapse:collapse;font-size:.8rem}
.tbl th{text-align:left;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--lt);padding:.4rem .5rem;border-bottom:1px solid var(--border)}
.tbl td{padding:.45rem .5rem;border-bottom:1px solid color-mix(in srgb,var(--border) 50%,transparent);vertical-align:middle}
.tbl tr:last-child td{border-bottom:none}
.tbl tr:hover td{background:color-mix(in srgb,var(--border) 30%,transparent)}
.avatar-circle{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;flex-shrink:0}
.score-bar-wrap{display:flex;align-items:center;gap:5px}
.score-track{width:50px;height:4px;background:var(--border);border-radius:3px;overflow:hidden;flex-shrink:0}
.score-fill{height:100%;border-radius:3px;transition:width .6s}

/* NEWS */
.news-item{break-inside:avoid;background:var(--elevated);border:1px solid var(--border);border-radius:10px;padding:.9rem;margin-bottom:.7rem}
.news-tag{font-size:.6rem;font-weight:700;text-transform:uppercase;padding:2px 7px;border-radius:4px;letter-spacing:.04em}
.news-source{font-size:.7rem;color:var(--lt)}
.news-title{font-weight:700;font-size:.85rem;color:var(--ink);margin:.4rem 0 .25rem}
.news-summary{font-size:.78rem;color:var(--lt);line-height:1.6}

/* TOAST — ✅ yeni: hata bildirimi */
.toast-wrap{position:fixed;bottom:80px;right:1rem;z-index:999;display:flex;flex-direction:column;gap:.5rem;pointer-events:none}
.toast{background:var(--card);border:1px solid var(--border);border-left:3px solid var(--red);border-radius:10px;padding:.75rem 1rem;font-size:.83rem;color:var(--ink);box-shadow:0 8px 24px var(--shadow);animation:slideIn .3s ease;pointer-events:all;display:flex;align-items:center;gap:.75rem;max-width:320px}
.toast-dismiss{background:none;border:none;color:var(--lt);cursor:pointer;font-size:1rem;padding:0;line-height:1;flex-shrink:0}

/* MOBILE NAV — ✅ yeni: küçük ekranda alt menü */
.mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:150;background:var(--card);border-top:1px solid var(--border);padding:.4rem .5rem;justify-content:space-around;gap:2px;backdrop-filter:blur(12px)}
.mnav-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:.3rem .5rem;border:none;background:transparent;cursor:pointer;border-radius:8px;transition:all .2s;flex:1;color:var(--lt)}
.mnav-btn.on{color:var(--accent)}
.mnav-btn span:first-child{font-size:1.2rem}
.mnav-btn span:last-child{font-size:.55rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em}

/* INLINE ERROR BOX */
.err-box{background:color-mix(in srgb,var(--red) 8%,transparent);border:1px solid color-mix(in srgb,var(--red) 25%,transparent);border-left:3px solid var(--red);border-radius:9px;padding:.8rem 1rem;font-size:.82rem;color:var(--red);display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:.5rem}

@media(max-width:768px){
  .hero{grid-template-columns:1fr}
  .feat-grid,.course-grid,.g3{grid-template-columns:1fr 1fr}
  .g4{grid-template-columns:1fr 1fr}
  .planner-layout,.curr-layout,.file-grid,.g2{grid-template-columns:1fr}
  .nav-tabs{display:none}
  .mobile-nav{display:flex}
  .plan-side{position:static}
  .page{padding:1.2rem 1rem 80px}
}
@media(max-width:480px){
  .feat-grid,.course-grid,.g3,.g4{grid-template-columns:1fr}
}
`;

// ── CONTEXT ───────────────────────────────────────────────────
const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

// ── useClaude HOOK — merkezi API yönetimi ────────────────────
// ✅ İyileştirme: retry, detaylı hata mesajları, addToast entegrasyonu
function useClaude() {
  const { addToast, t } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState("");

  const call = useCallback(async (prompt, system) => {
    setLoading(true); setError(null); setResult("");
    try {
      const body = { messages:[{ role:"user", content:prompt }] };
      if (system) body.system = system;
      const res = await fetch("/api/claude",{
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)
      });
      if (!res.ok) {
        const e = await res.json().catch(()=>({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("") || "";
      if (!text) throw new Error(t.errors.emptyReply);
      setResult(text); return text;
    } catch(e) {
      const msg = e.message || t.errors.apiError;
      setError(msg); addToast("⚠️ " + msg); return null;
    } finally { setLoading(false); }
  }, [addToast, t]);

  const callChat = useCallback(async (system, messages) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/claude",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ system, messages })
      });
      if (!res.ok) {
        const e = await res.json().catch(()=>({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("") || "";
      if (!text) throw new Error(t.errors.emptyReply);
      return text;
    } catch(e) {
      const msg = e.message || t.errors.apiError;
      setError(msg); addToast("⚠️ " + msg); return null;
    } finally { setLoading(false); }
  }, [addToast, t]);

  const reset = useCallback(()=>{ setResult(""); setError(null); }, []);
  return { loading, error, result, setResult, call, callChat, reset };
}

// ── HELPERS ───────────────────────────────────────────────────
const daysUntil = d => Math.ceil((new Date(d) - new Date()) / 86400000);
const fmtDate = d => new Date(d).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"});
const initials = n => n.split(" ").map(w=>w[0]).join("").slice(0,2);
const scoreColor = (s, th) => s>=80 ? th.accent : s>=60 ? th.gold : th.red;

// ── LOADING DOTS ─────────────────────────────────────────────
const Dots = () => <><span className="ldot">●</span><span className="ldot ldot2">●</span><span className="ldot ldot3">●</span></>;

// ── ERROR BOX ─────────────────────────────────────────────────
function ErrBox({ msg, onRetry }) {
  const { t } = useApp();
  return (
    <div className="err-box">
      <span>⚠️ {msg}</span>
      {onRetry && <button className="btn-retry" onClick={onRetry}>{t.errors.retry}</button>}
    </div>
  );
}

// ── TOAST COMPONENT ──────────────────────────────────────────
function Toasts({ toasts, dismiss }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t=>(
        <div className="toast" key={t.id}>
          <span style={{flex:1}}>{t.msg}</span>
          <button className="toast-dismiss" onClick={()=>dismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── PROGRESS RING ─────────────────────────────────────────────
function Ring({ pct, size=50, stroke=4, color="#16a34a" }) {
  const r = (size - stroke*2) / 2, c = 2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{display:"block"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#33333344" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={c-(pct/100)*c} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dashoffset .6s"}}/>
      <text x={size/2} y={size/2+4} textAnchor="middle" fill={color}
        fontSize="11" fontFamily="'Playfair Display',serif" fontWeight="700">{pct}%</text>
    </svg>
  );
}

// ── MOBILE NAV — ✅ yeni bileşen ──────────────────────────────
function MobileNav() {
  const { tab, setTab } = useApp();
  const items = [
    { id:"home",    icon:"🏠", label:"Ana" },
    { id:"exams",   icon:"📅", label:"Sınav" },
    { id:"planner", icon:"🤖", label:"Plan" },
    { id:"courses", icon:"🎓", label:"Ders" },
    { id:"chat",    icon:"💬", label:"Chat" },
    { id:"mcp",     icon:"🗄️", label:"MCP" },
  ];
  return (
    <nav className="mobile-nav">
      {items.map(it=>(
        <button key={it.id} className={`mnav-btn ${tab===it.id?"on":""}`} onClick={()=>setTab(it.id)}>
          <span>{it.icon}</span><span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────
function HomePage() {
  const { t, th, lang, setTab } = useApp();
  const ht = t.home;
  const featData = [
    { icon:"🤖", name:lang==="tr"?"AI Çalışma Planı":"AI Study Planner",   desc:lang==="tr"?"Sınav tarihlerine göre kişisel haftalık plan.":"Personalized weekly plan based on exam dates.", bg:th.accent+"18" },
    { icon:"📅", name:lang==="tr"?"Sınav Takibi":"Exam Tracker",           desc:lang==="tr"?"Geri sayım ve ilerleme çubukları.":"Countdowns and progress bars.",                bg:th.gold+"18"   },
    { icon:"🎓", name:lang==="tr"?"Ders Tarayıcı":"Course Browser",        desc:lang==="tr"?"Tam müfredat, ünite ünite.":"Full curriculum, unit by unit.",                   bg:th.blue+"18"   },
    { icon:"📊", name:lang==="tr"?"Analitik":"Analytics",                  desc:lang==="tr"?"Görsel pano, gelişim takibi.":"Visual dashboard, growth tracking.",             bg:th.purple+"18" },
    { icon:"🗄️", name:"PostgreSQL MCP",                                    desc:lang==="tr"?"Canlı öğrenci verisi analizi.":"Live student data analysis.",                   bg:th.accent+"18" },
    { icon:"📡", name:lang==="tr"?"Haber Akışı":"News Feed",               desc:lang==="tr"?"ÖSYM & MEB güncel duyuruları.":"Latest ÖSYM & MEB announcements.",             bg:th.gold+"18"   },
  ];
  return (
    <div className="page anim">
      <div className="hero">
        <div>
          <div className="hero-badge">{ht.badge}</div>
          <h1 className="hero-title">{ht.h1}<br/>{ht.h2} <em>{ht.h3}</em></h1>
          <p className="hero-sub">{lang==="tr"
            ?"LearnConnect, TYT/AYT/LGS ve uluslararası sınavlarda başarıya ulaşmanı sağlayan AI destekli çalışma planları, canlı geri sayımlar ve tam müfredat sunar."
            :"LearnConnect helps you ace TYT, AYT, LGS and international exams with AI-powered study plans, live countdowns and full curriculum coverage."}</p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={()=>setTab("planner")}>{ht.cta1}</button>
            <button className="btn-outline" onClick={()=>setTab("courses")}>{ht.cta2}</button>
          </div>
        </div>
        <div className="hero-panel">
          <div style={{fontSize:".65rem",fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",color:th.light,marginBottom:".8rem"}}>
            {lang==="tr"?"Platforma Genel Bakış":"Platform Overview"}
          </div>
          <div className="stat-grid">
            {[
              {num:"98%",  lbl:lang==="tr"?"Puan artışı":"Score boost",     color:th.accent},
              {num:"12K+", lbl:lang==="tr"?"Aktif öğrenci":"Active students",color:th.gold},
              {num:"240+", lbl:lang==="tr"?"Ders":"Lessons",                 color:th.blue},
              {num:"6",    lbl:lang==="tr"?"Sınav türü":"Exam types",        color:th.accent},
            ].map((s,i)=>(
              <div className="stat-card" key={i}>
                <div className="stat-num" style={{color:s.color}}>{s.num}</div>
                <div className="stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="feat-grid">
        {featData.map((f,i)=>(
          <div className="feat-card" key={i}>
            <div className="feat-icon" style={{background:f.bg}}>{f.icon}</div>
            <div className="feat-name">{f.name}</div>
            <div className="feat-desc">{f.desc}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:".8rem"}}>
        <div className="page-title" style={{fontSize:"1.3rem"}}>{lang==="tr"?"Popüler Dersler":"Popular Courses"}</div>
        <button className="link-btn" onClick={()=>setTab("courses")}>{ht.viewAll}</button>
      </div>
      <div className="course-grid">
        {COURSES.slice(0,3).map(c=>(
          <div className="course-card" key={c.id} onClick={()=>setTab("courses")}>
            <div className="course-thumb" style={{background:c.bg}}>{c.emoji}</div>
            <div className="course-body">
              <div className="course-tag" style={{background:c.bg,color:c.color}}>{c.tag}</div>
              <div className="course-name">{c.name}</div>
              <div className="course-meta"><span>📚 {c.lessons}</span><span>⏱ {c.hours}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EXAM TRACKER ──────────────────────────────────────────────
function ExamTracker() {
  const { t, th, lang } = useApp();
  const et = t.exams;
  const [exams, setExams] = useState(EXAMS_INIT);
  const [view, setView] = useState("list");
  const [showModal, setShowModal] = useState(false);
  const [calDate, setCalDate] = useState(new Date(2025,5,1));
  const [form, setForm] = useState({name:"",type:"tyt",date:"",subject:""});

  const MONTHS = lang==="tr"
    ? ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"]
    : ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOWS = lang==="tr"
    ? ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"]
    : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const typeColor = {tyt:th.accent, ayt:th.gold, lgs:th.red, intl:th.blue};

  function addExam() {
    if (!form.name||!form.date) return;
    setExams(p=>[...p,{...form,id:Date.now(),progress:0}]);
    setShowModal(false); setForm({name:"",type:"tyt",date:"",subject:""});
  }

  const {cells,y,m} = useMemo(()=>{
    const y=calDate.getFullYear(), m=calDate.getMonth();
    const firstDow=(new Date(y,m,1).getDay()+6)%7, days=new Date(y,m+1,0).getDate();
    const cells=[];
    for(let i=0;i<firstDow;i++) cells.push(null);
    for(let d=1;d<=days;d++) cells.push(d);
    return {cells,y,m};
  },[calDate]);

  return (
    <div className="page anim">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem",flexWrap:"wrap",gap:".8rem"}}>
        <div><div className="page-title">{et.title}</div><div className="page-sub" style={{marginBottom:0}}>{et.sub}</div></div>
        <div style={{display:"flex",gap:"7px",alignItems:"center"}}>
          <div className="view-toggle">
            <button className={`vt ${view==="list"?"on":""}`} onClick={()=>setView("list")}>{et.listView}</button>
            <button className={`vt ${view==="cal"?"on":""}`} onClick={()=>setView("cal")}>{et.calView}</button>
          </div>
          <button className="btn-primary" style={{padding:"7px 16px",fontSize:".8rem"}} onClick={()=>setShowModal(true)}>{et.add}</button>
        </div>
      </div>

      {view==="list" && (
        <div className="exam-grid">
          {exams.map(ex=>{
            const days=daysUntil(ex.date);
            const pc=days<30?"cd-urgent":days>90?"cd-far":"cd-ok";
            return (
              <div className={`exam-card ${ex.type}`} key={ex.id}>
                <div className="exam-type-label" style={{color:typeColor[ex.type]||th.light}}>{ex.type.toUpperCase()}</div>
                <div className="exam-name">{ex.name}</div>
                <div className="exam-detail">📅 <strong>{fmtDate(ex.date)}</strong></div>
                {ex.reg && <div className="exam-detail">📝 {fmtDate(ex.reg)}</div>}
                {ex.subject && <div className="exam-detail">📚 {ex.subject}</div>}
                <div className={`cd-pill ${pc}`}>⏳ {days>0?`${days} ${et.daysLeft}`:et.passed}</div>
                <div style={{marginTop:"9px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:".72rem",marginBottom:"3px"}}>
                    <span style={{color:th.light}}>{et.prep}</span>
                    <span style={{fontWeight:600}}>{ex.progress}%</span>
                  </div>
                  <div className="prog-outer"><div className="prog-inner" style={{width:`${ex.progress}%`}}/></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view==="cal" && (
        <div className="cal-wrap">
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={()=>setCalDate(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}>‹</button>
            <div className="cal-month-title">{MONTHS[calDate.getMonth()]} {calDate.getFullYear()}</div>
            <button className="cal-nav-btn" onClick={()=>setCalDate(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}>›</button>
          </div>
          <div className="cal-grid">
            {DOWS.map(d=><div key={d} className="cal-dow">{d}</div>)}
            {cells.map((day,i)=>{
              if(!day) return <div key={`e${i}`} className="cal-cell empty"/>;
              const now=new Date(), isToday=now.getDate()===day&&now.getMonth()===m&&now.getFullYear()===y;
              const dayExams=exams.filter(e=>{const ed=new Date(e.date);return ed.getFullYear()===y&&ed.getMonth()===m&&ed.getDate()===day;});
              return (
                <div key={day} className={`cal-cell ${isToday?"today":""}`}>
                  <div className="cal-day-num">{day}</div>
                  {dayExams.map(e=><span key={e.id} className="cal-dot" style={{background:(typeColor[e.type]||th.blue)+"22",color:typeColor[e.type]||th.blue}}>{e.type.toUpperCase()}</span>)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div className="overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{et.add.replace("+ ","")}</div>
            {[["name",et.nameLabel,"text",""],["subject",et.subjectLabel,"text",""]].map(([k,lbl,tp,ph])=>(
              <div className="form-group" key={k}>
                <label className="form-label">{lbl}</label>
                <input type={tp} className="form-input" placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/>
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">{et.typeLabel}</label>
              <select className="form-select" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                <option value="tyt">TYT</option><option value="ayt">AYT</option><option value="lgs">LGS</option><option value="intl">International</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{et.dateLabel}</label>
              <input type="date" className="form-input" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
            </div>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={()=>setShowModal(false)}>{et.cancel}</button>
              <button className="btn-save" onClick={addExam}>{et.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STUDY PLANNER ─────────────────────────────────────────────
function StudyPlanner() {
  const { t, th, lang, dark } = useApp();
  const pt = t.planner;
  const { loading, error, result, call, reset } = useClaude();
  const [evalTopic, setEvalTopic] = useState("");
  const [evalResult, setEvalResult] = useState("");
  const evalClaude = useClaude();

  const [tasks, setTasks] = useState(()=>WEEK_PLAN.map(d=>({...d,tasks:d.tasks.map(tk=>({...tk,done:false}))})));
  const [form, setForm] = useState({exam:"TYT",hours:"3",weak:lang==="tr"?"Matematik, Fizik":"Math, Physics",date:""});

  const mode = dark?"dark":"light";
  const CAT_CLS = {math:"cat-math",tr:"cat-tr",sci:"cat-sci",test:"cat-test",social:"cat-social",review:"cat-review"};

  async function generate() {
    const prompt = `You are an expert Turkish exam (TYT/AYT/LGS) coach. Respond in ${lang==="tr"?"Turkish":"English"}.
Student: exam=${form.exam}, ${form.hours}h/day, weak: ${form.weak}, date: ${form.date||"June 2025"}.
Give 3 short paragraphs: 1) assessment 2) specific weekly strategy 3) motivational insight. Under 160 words.`;
    await call(prompt);
  }

  async function evaluate() {
    if (!evalTopic.trim()) return;
    const prompt = `${form.exam} exam tutor. Topic: "${evalTopic}". In ${lang==="tr"?"Turkish":"English"}:
1. 2-sentence overview for ${form.exam}
2. One practice Q&A
3. Difficulty (Easy/Medium/Hard) + 1 study tip
Be concise and practical.`;
    const r = await evalClaude.call(prompt);
    if (r) setEvalResult(r);
  }

  function toggleTask(di,ti) { setTasks(p=>p.map((d,i)=>i!==di?d:{...d,tasks:d.tasks.map((tk,j)=>j!==ti?tk:{...tk,done:!tk.done})})); }
  const total=tasks.reduce((s,d)=>s+d.tasks.length,0);
  const done=tasks.reduce((s,d)=>s+d.tasks.filter(tk=>tk.done).length,0);

  return (
    <div className="page anim">
      <div className="page-title">{pt.title}</div>
      <div className="page-sub">{pt.sub}</div>
      <div className="planner-layout">
        {/* LEFT: Form */}
        <div className="plan-side">
          <div className="plan-side-title">🤖 {lang==="tr"?"Planını Oluştur":"Build Your Plan"}</div>
          {[[pt.examLabel,"exam",["TYT","AYT","LGS","SAT","IELTS"]],[pt.hoursLabel,"hours",["1","2","3","4","5"]]].map(([lbl,k,opts])=>(
            <div className="form-group" key={k}>
              <label className="form-label">{lbl}</label>
              <select className="form-select" value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">{pt.weakLabel}</label>
            <input className="form-input" value={form.weak} onChange={e=>setForm(p=>({...p,weak:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">{pt.dateLabel}</label>
            <input type="date" className="form-input" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
          </div>
          <button className="btn-ai" style={{width:"100%",justifyContent:"center",marginTop:".4rem"}} onClick={generate} disabled={loading}>
            {loading?<Dots/>:pt.genBtn}
          </button>
          {error && <ErrBox msg={error} onRetry={generate}/>}
          <div style={{marginTop:"1.1rem",padding:".9rem",background:th.elevated,borderRadius:"9px",border:`1px solid ${th.border}`}}>
            <div style={{fontSize:".7rem",fontWeight:600,color:th.light,marginBottom:"5px"}}>{pt.progress}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",fontWeight:700}}>{done}<span style={{fontSize:"1rem",fontWeight:400,color:th.light}}>/{total}</span></div>
            <div className="prog-outer" style={{marginTop:"6px"}}><div className="prog-inner" style={{width:`${total?(done/total)*100:0}%`}}/></div>
          </div>
        </div>

        {/* RIGHT: Plan + Evaluator */}
        <div>
          {(result||loading) && (
            <div className="ai-box">
              <div className="ai-label">✨ {pt.aiLabel}</div>
              {loading
                ? <div className="ai-text" style={{color:th.light}}>{pt.analyzing}<span className="ldot">.</span><span className="ldot ldot2">.</span><span className="ldot ldot3">.</span></div>
                : <div className="ai-text">{result}</div>}
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".8rem"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",fontWeight:700,color:th.ink}}>{pt.weekTitle}</div>
            <div style={{fontSize:".75rem",color:th.light}}>{pt.hint}</div>
          </div>
          {tasks.map((day,di)=>(
            <div className="day-row" key={di}>
              <div className="day-label">{day.day[lang==="tr"?"tr":"en"]}</div>
              <div className="task-pills">
                {day.tasks.map((tk,ti)=>(
                  <button key={ti}
                    className={`task-pill ${tk.done?"done":""} ${CAT_CLS[tk.cat]||""}`}
                    style={tk.done?{background:th.border,color:th.light}:{}}
                    onClick={()=>toggleTask(di,ti)}>
                    {tk.done?"✓":"○"} {tk.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="eval-box">
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",fontWeight:700,marginBottom:".2rem",color:th.ink}}>{pt.evalTitle}</div>
            <div style={{fontSize:".8rem",color:th.light}}>{lang==="tr"?"Herhangi bir konuyu AI ile değerlendir":"Evaluate any topic with AI"}</div>
            <div className="eval-row">
              <input className="eval-input" value={evalTopic} onChange={e=>setEvalTopic(e.target.value)}
                placeholder={lang==="tr"?"ör. İkinci Derece Denklemler":"e.g. Quadratic Equations"}
                onKeyDown={e=>e.key==="Enter"&&evaluate()}/>
              <button className="btn-ai" onClick={evaluate} disabled={evalClaude.loading||!evalTopic.trim()}>
                {evalClaude.loading?<span className="ldot ldot2">●</span>:pt.evalBtn}
              </button>
            </div>
            {evalClaude.error && <ErrBox msg={evalClaude.error} onRetry={evaluate}/>}
            {evalResult && (
              <div style={{marginTop:".9rem",padding:".9rem",background:th.elevated,borderRadius:"8px",fontSize:".82rem",lineHeight:1.75,whiteSpace:"pre-line",borderLeft:`3px solid ${th.accent}`,color:th.ink}}>
                {evalResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COURSE BROWSER ────────────────────────────────────────────
function CourseBrowser() {
  const { t, th, lang } = useApp();
  const ct = t.courses;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(COURSES[0]);
  const [unitStatus, setUnitStatus] = useState({});
  const [aiSuggest, setAiSuggest] = useState("");
  const { loading, error, call } = useClaude();

  const filtered = COURSES.filter(c=>(filter==="All"||c.tag===filter)&&c.name.toLowerCase().includes(search.toLowerCase()));

  function cycleStatus(cid,unit) {
    const k=`${cid}-${unit}`;
    setUnitStatus(p=>({...p,[k]:!p[k]||p[k]==="new"?"progress":p[k]==="progress"?"done":"new"}));
  }
  const getStatus = (cid,unit) => unitStatus[`${cid}-${unit}`]||"new";

  async function suggestNext() {
    setAiSuggest("");
    const done=Object.entries(unitStatus).filter(([,v])=>v==="done").map(([k])=>k.replace(/^\d+-/,"")).join(", ");
    const r = await call(`LearnConnect AI tutor. Current course: "${selected.name}" (${selected.tag}). Completed units: ${done||"none"}. In ${lang==="tr"?"Turkish":"English"}, 2-3 sentences: what should they study next and why? Be specific and motivating.`);
    if (r) setAiSuggest(r);
  }

  const stLbl = {done:ct.done, progress:ct.inprogress, new:ct.newLabel};
  const stCls = {done:"us-done", progress:"us-prog", new:"us-new"};

  return (
    <div className="page anim">
      <div className="page-title">{ct.title}</div>
      <div className="page-sub">{ct.sub}</div>
      <div className="browser-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder={ct.search} value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {["All","TYT","AYT","LGS","SAT"].map(f=>(
          <button key={f} className={`filter-pill ${filter===f?"on":""}`} onClick={()=>setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="curr-layout">
        <div className="tree-panel">
          <div className="tree-hd">({filtered.length})</div>
          {filtered.map(c=>(
            <div key={c.id} className={`tree-item ${selected?.id===c.id?"sel":""}`} onClick={()=>setSelected(c)}>
              <span>{c.emoji}</span><span>{c.name}</span>
            </div>
          ))}
          {!filtered.length && <div style={{fontSize:".8rem",color:th.light,padding:"7px 10px"}}>—</div>}
        </div>
        {selected && (
          <div className="detail-panel">
            <div className="detail-tag" style={{background:selected.bg,color:selected.color}}>{selected.tag}</div>
            <div className="detail-title">{selected.emoji} {selected.name}</div>
            <div className="detail-desc">{lang==="tr"
              ?`${selected.tag} sınavı için kapsamlı bir kurs. Her ünite video ders ve alıştırmalar içerir.`
              :`Comprehensive course for the ${selected.tag} exam. Includes video lessons and practice exercises.`}</div>
            <div className="detail-meta">
              {[["📚",selected.lessons,lang==="tr"?"Ders":"Lessons"],["⏱",selected.hours,lang==="tr"?"Süre":"Duration"],["🎯",selected.level,lang==="tr"?"Seviye":"Level"]].map(([icon,val,lbl])=>(
                <div className="dm-item" key={lbl}><span className="dm-label">{lbl}</span><span className="dm-val">{icon} {val}</span></div>
              ))}
            </div>
            <div style={{fontSize:".7rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:th.light,marginBottom:"8px"}}>
              {ct.unitsLabel} — {ct.clickToggle}
            </div>
            {selected.units.map((unit,i)=>{
              const st=getStatus(selected.id,unit);
              return (
                <div className="unit-row" key={unit}>
                  <span className="unit-num">{String(i+1).padStart(2,"0")}</span>
                  <span className="unit-name">{unit}</span>
                  <button className={`unit-status ${stCls[st]}`} onClick={()=>cycleStatus(selected.id,unit)}>{stLbl[st]}</button>
                </div>
              );
            })}
            {error && <ErrBox msg={error} onRetry={suggestNext}/>}
            {aiSuggest && (
              <div className="ai-suggest-box">
                <div className="ai-label" style={{color:th.blue,marginBottom:"5px"}}>✨ AI</div>
                {aiSuggest}
              </div>
            )}
            <EnrollButton course={selected} ct={ct}/>
            <button className="btn-ai" style={{width:"100%",justifyContent:"center",marginTop:"7px",background:th.elevated,color:th.ink,border:`1px solid ${th.border}`}} onClick={suggestNext} disabled={loading}>
              {loading?<Dots/>:ct.aiNext}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


function EnrollButton({ course, ct }) {
  const { authUser, setAuthModal, addToast, lang, th } = useApp();
  const [enrolled, setEnrolled] = useState(()=>{
    if (typeof window === 'undefined') return false;
    const e = JSON.parse(localStorage.getItem('lc_enrollments')||'[]');
    return e.includes(course?.id);
  });

  function handleEnroll() {
    if (!authUser) { setAuthModal('register'); return; }
    const e = JSON.parse(localStorage.getItem('lc_enrollments')||'[]');
    if (!e.includes(course.id)) {
      localStorage.setItem('lc_enrollments', JSON.stringify([...e, course.id]));
      setEnrolled(true);
      addToast(lang==="tr"?`${course.name} dersine kaydoldunuz! 🎉`:`Enrolled in ${course.name}! 🎉`);
    }
  }

  return (
    <button className="enroll-btn" onClick={handleEnroll}
      style={{background: enrolled ? th.gold : undefined}}>
      {enrolled ? (lang==="tr"?"✓ Kayıtlısınız":"✓ Enrolled") : ct.enroll}
    </button>
  );
}

// ── AI CHAT ───────────────────────────────────────────────────
function AIChat() {
  const { t, th, lang } = useApp();
  const ct = t.chat;
  const { loading, callChat } = useClaude();
  const [msgs, setMsgs] = useState([{role:"ai",text:ct.welcome}]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  const SUGS = lang==="tr"
    ? ["TYT Matematikte en önemli konular?","AYT için 30 günlük plan yap","Türkçe okuma hızını artırma","Sınav günü stresi nasıl yönetilir?","İkinci derece denklemleri anlat"]
    : ["Most important TYT Math topics?","Make a 30-day AYT plan","How to improve reading speed","Manage exam day stress","Explain quadratic equations"];

  async function send(override) {
    const q = override||input.trim(); if(!q||loading) return;
    setInput("");
    const newMsgs = [...msgs,{role:"user",text:q}];
    setMsgs(newMsgs);
    const system = `Expert tutor for Turkish exams (TYT/AYT/LGS) and international exams. Respond in ${lang==="tr"?"Turkish":"English"}. Be warm, specific, actionable.`;
    const history = newMsgs.map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text}));
    const reply = await callChat(system, history);
    setMsgs(p=>[...p,{role:"ai",text:reply || (lang==="tr"?"Bağlantı hatası. Tekrar deneyin.":"Connection error. Please try again.")}]);
  }

  return (
    <div className="page anim" style={{paddingBottom:0}}>
      <div className="page-title">{ct.title}</div>
      <div className="page-sub">{ct.sub}</div>
      <div className="suggestions">{SUGS.map((s,i)=><button key={i} className="sug-btn" onClick={()=>send(s)}>{s}</button>)}</div>
      <div className="chat-layout">
        <div className="chat-msgs">
          {msgs.map((m,i)=>(
            <div key={i} className={`msg ${m.role}`}>
              {m.role==="ai"&&<div className="ai-label" style={{marginBottom:"4px"}}>✨ LearnConnect AI</div>}
              {m.text}
            </div>
          ))}
          {loading&&<div className="msg ai"><div className="ai-label" style={{marginBottom:"4px"}}>✨ LearnConnect AI</div><Dots/></div>}
          <div ref={bottomRef}/>
        </div>
        <div className="chat-footer">
          <textarea className="chat-input" rows={1} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder={ct.ph}/>
          <button className="chat-send" onClick={()=>send()} disabled={loading||!input.trim()}>{ct.send}</button>
          <button className="chat-clear" onClick={()=>setMsgs([{role:"ai",text:ct.welcome}])}>{ct.clear}</button>
        </div>
      </div>
    </div>
  );
}

// ── MCP DASHBOARD ─────────────────────────────────────────────
function MCPDashboard() {
  const { t, th, lang } = useApp();
  const mt = t.mcp;
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [fsQuery, setFsQuery] = useState("");
  const [fsReply, setFsReply] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const fsClaude = useClaude();
  const newsClaude = useClaude();
  const AV_COLORS = [th.accent, th.blue, th.gold, th.red, th.purple];

  function scan() { setScanning(true); setScanned(false); setTimeout(()=>{setScanning(false);setScanned(true);},2200); }

  async function askFs() {
    if (!fsQuery.trim()) return;
    const files = MCP_FILES.map(f=>`- ${f.name} (${f.pages} sayfa, konular: ${f.topics.join(", ")})`).join("\n");
    const r = await fsClaude.call(`LearnConnect Filesystem MCP'den aşağıdaki materyallere erişimin var:\n${files}\n\nSoru: "${fsQuery}"\nTürkçe, kısa ve pratik yanıt ver. Hangi materyal(ler)den faydalandığını belirt.`);
    if (r) setFsReply(r);
  }

  async function summarizeNews() {
    const newsText = MCP_NEWS.map(n=>`[${n.tag}] ${n.title}: ${n.summary}`).join("\n");
    const r = await newsClaude.call(`HTTP/RSS MCP üzerinden alınan Türk eğitim haberleri:\n${newsText}\n\nBu haberleri TYT/AYT/LGS öğrencileri için 3-4 cümleyle özetle. Hemen harekete geçmeleri gereken noktaları vurgula. Türkçe yaz.`);
    if (r) setNewsSummary(r);
  }

  const TAG_COLORS = {
    "Duyuru":{bg:th.accent+"18",tc:th.accent},"Müfredat":{bg:th.blue+"18",tc:th.blue},
    "Teknoloji":{bg:th.purple+"18",tc:th.purple},"LGS":{bg:th.gold+"18",tc:th.gold},"Politika":{bg:th.red+"18",tc:th.red}
  };

  return (
    <div className="page anim">
      <div className="page-title">{mt.title}</div>
      <div className="page-sub" style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1.8rem"}}>
        <span className="mcp-status mcp-online">● {mt.sub}</span>
      </div>

      <div className="g4" style={{marginBottom:"1.2rem"}}>
        {[
          {lbl:mt.totalStudents, val:STATS.totalUsers.toLocaleString("tr"), sub:"PostgreSQL MCP", color:th.accent},
          {lbl:mt.activeToday,   val:STATS.activeToday.toLocaleString("tr"),sub:"PostgreSQL MCP", color:th.blue},
          {lbl:mt.avgStreak,     val:`${STATS.avgStreak} ${lang==="tr"?"gün":"days"}`, sub:"PostgreSQL MCP", color:th.gold},
          {lbl:mt.completion,    val:`${STATS.completionRate}%`, sub:"PostgreSQL MCP", color:th.purple},
        ].map((k,i)=>(
          <div className="kpi" key={i}>
            <div className="kpi-lbl">{k.lbl}</div>
            <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
            <div className="kpi-sub" style={{color:k.color}}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="g2" style={{marginBottom:"1.2rem"}}>
        {/* PostgreSQL: Student Table */}
        <div className="card">
          <div className="card-title">
            🗄️ {mt.pgTitle}
            <span className="badge" style={{background:th.accent+"18",color:th.accent}}>PostgreSQL MCP</span>
          </div>
          <table className="tbl">
            <thead><tr><th>{lang==="tr"?"Öğrenci":"Student"}</th><th>Mat</th><th>TR</th><th>Fen</th><th>🔥</th><th>Ort</th></tr></thead>
            <tbody>
              {MCP_STUDENTS.map((s,i)=>{
                const avg=Math.round((s.math+s.turkish+s.science+s.social)/4);
                return (
                  <tr key={s.id}>
                    <td style={{display:"flex",alignItems:"center",gap:6}}>
                      <div className="avatar-circle" style={{background:AV_COLORS[i]+"22",color:AV_COLORS[i]}}>{initials(s.name)}</div>
                      <span style={{fontWeight:500,fontSize:".78rem"}}>{s.name.split(" ")[0]}</span>
                    </td>
                    {[s.math,s.turkish,s.science].map((sc,j)=>(
                      <td key={j}>
                        <div className="score-bar-wrap">
                          <div className="score-track"><div className="score-fill" style={{width:`${sc}%`,background:scoreColor(sc,th)}}/></div>
                          <span style={{fontSize:".7rem",fontFamily:"'DM Mono',monospace",color:scoreColor(sc,th),width:"22px",textAlign:"right"}}>{sc}</span>
                        </div>
                      </td>
                    ))}
                    <td style={{fontSize:".77rem",color:th.gold}}>🔥{s.streak}</td>
                    <td><Ring pct={avg} size={38} stroke={3} color={scoreColor(avg,th)}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{marginTop:"1rem"}}>
            <div style={{fontSize:".75rem",fontWeight:700,color:th.light,marginBottom:".5rem",textTransform:"uppercase",letterSpacing:".05em"}}>{mt.hardTopics}</div>
            {MCP_WEAK.map((w,i)=>(
              <div className="wt-row" key={i}>
                <div className="wt-name">{w.topic}</div>
                <div className="wt-exam">{w.exam}</div>
                <div className="wt-track"><div className="wt-fill" style={{width:`${w.fail}%`}}/></div>
                <div className="wt-pct">%{w.fail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filesystem MCP */}
        <div className="card">
          <div className="card-title" style={{marginBottom:".8rem"}}>
            📁 {mt.fsTitle}
            <span className="badge" style={{background:th.blue+"18",color:th.blue}}>Filesystem MCP</span>
            <button className="btn-ghost" style={{marginLeft:"auto",fontSize:".72rem",padding:"3px 10px"}} onClick={scan} disabled={scanning}>
              {scanning?<Dots/>:mt.scanBtn}
            </button>
          </div>
          {scanning && (
            <div className="scan-box">
              <div className="scan-line"/>
              {"Filesystem MCP bağlanıyor...\n/materials taranıyor...\n"+MCP_FILES.map(f=>`  ✓ ${f.name}`).join("\n")}
            </div>
          )}
          {scanned && (
            <div style={{background:th.accent+"18",border:`1px solid ${th.accent}33`,borderRadius:"7px",padding:".6rem .9rem",marginBottom:".8rem",fontSize:".78rem",color:th.accent}}>
              ✓ {MCP_FILES.length} {mt.filesIndexed}
            </div>
          )}
          <div className="file-grid" style={{marginBottom:"1rem"}}>
            {MCP_FILES.map((f,i)=>(
              <div className="file-card" key={i}>
                <div className="file-name">📄 {f.name}</div>
                <div className="file-meta"><span>{f.size}</span><span>·</span><span>{f.pages}s</span></div>
                <div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>{f.topics.map(tp=><span key={tp} className="topic-chip">{tp}</span>)}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:"7px"}}>
            <input className="eval-input" value={fsQuery} onChange={e=>setFsQuery(e.target.value)}
              placeholder={mt.askPH} onKeyDown={e=>e.key==="Enter"&&askFs()}/>
            <button className="btn-ai" onClick={askFs} disabled={fsClaude.loading||!fsQuery.trim()}>
              {fsClaude.loading?<span className="ldot ldot2">●</span>:mt.askBtn}
            </button>
          </div>
          {fsClaude.error && <ErrBox msg={fsClaude.error} onRetry={askFs}/>}
          {fsReply && (
            <div style={{marginTop:".8rem",padding:".9rem",background:th.elevated,borderRadius:"8px",fontSize:".82rem",lineHeight:1.75,whiteSpace:"pre-line",borderLeft:`3px solid ${th.blue}`,color:th.ink}}>
              <div className="ai-label" style={{color:th.blue,marginBottom:"4px"}}>📁 Filesystem MCP + AI</div>
              {fsReply}
            </div>
          )}
        </div>
      </div>

      {/* HTTP/RSS News */}
      <div className="card">
        <div className="card-title">
          📡 {mt.newsTitle}
          <span className="badge" style={{background:th.gold+"18",color:th.gold}}>HTTP/RSS MCP</span>
          <button className="btn-ai" style={{marginLeft:"auto",fontSize:".78rem",padding:"6px 14px"}} onClick={summarizeNews} disabled={newsClaude.loading}>
            {newsClaude.loading?<Dots/>:mt.summarizeBtn}
          </button>
        </div>
        {newsClaude.error && <ErrBox msg={newsClaude.error} onRetry={summarizeNews}/>}
        {newsSummary && (
          <div style={{background:th.elevated,border:`1px solid ${th.gold}33`,borderLeft:`3px solid ${th.gold}`,borderRadius:"9px",padding:"1rem",marginBottom:"1rem",fontSize:".85rem",lineHeight:1.75,whiteSpace:"pre-line",color:th.ink}}>
            <div className="ai-label" style={{color:th.gold,marginBottom:"5px"}}>📡 HTTP/RSS MCP + AI Özeti</div>
            {newsSummary}
          </div>
        )}
        <div style={{columns:"2",columnGap:"1.5rem"}}>
          {MCP_NEWS.map((n,i)=>{
            const tc=TAG_COLORS[n.tag]||{bg:th.elevated,tc:th.light};
            return (
              <div className="news-item" key={i} style={{breakInside:"avoid"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span className="news-tag" style={{background:tc.bg,color:tc.tc}}>{n.tag}</span>
                  <span className="news-source">{n.source} · {n.date}</span>
                </div>
                <div className="news-title">{n.title}</div>
                <div className="news-summary">{n.summary}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ── AUTH MODAL ────────────────────────────────────────────────
function AuthModal({ mode, setMode, onSuccess, onClose, lang, th }) {
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");

  function submit() {
    setErr("");
    if (!email.trim() || !pass.trim()) { setErr(lang==="tr"?"E-posta ve şifre gerekli.":"Email and password required."); return; }
    if (mode==="register" && !name.trim()) { setErr(lang==="tr"?"Ad gerekli.":"Name required."); return; }
    if (pass.length < 6) { setErr(lang==="tr"?"Şifre en az 6 karakter.":"Password must be 6+ chars."); return; }

    const users = JSON.parse(localStorage.getItem('lc_users')||'[]');

    if (mode==="register") {
      if (users.find(u=>u.email===email)) { setErr(lang==="tr"?"Bu e-posta zaten kayıtlı.":"Email already registered."); return; }
      const user = { id: Date.now(), name: name.trim(), email: email.trim(), createdAt: new Date().toISOString() };
      localStorage.setItem('lc_users', JSON.stringify([...users, { ...user, pass }]));
      localStorage.setItem('lc_user', JSON.stringify(user));
      onSuccess(user);
    } else {
      const found = users.find(u=>u.email===email && u.pass===pass);
      if (!found) { setErr(lang==="tr"?"E-posta veya şifre hatalı.":"Invalid email or password."); return; }
      const user = { id: found.id, name: found.name, email: found.email };
      localStorage.setItem('lc_user', JSON.stringify(user));
      onSuccess(user);
    }
  }

  const isReg = mode==="register";
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:380}}>
        <div className="modal-title">{isReg?(lang==="tr"?"Ücretsiz Kayıt":"Sign Up Free"):(lang==="tr"?"Giriş Yap":"Sign In")}</div>
        {isReg && (
          <div className="form-group">
            <label className="form-label">{lang==="tr"?"Ad Soyad":"Full Name"}</label>
            <input className="form-input" value={name} onChange={e=>setName(e.target.value)} placeholder={lang==="tr"?"Adınız":"Your name"} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">E-posta</label>
          <input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ornek@email.com" onKeyDown={e=>e.key==="Enter"&&submit()}/>
        </div>
        <div className="form-group">
          <label className="form-label">{lang==="tr"?"Şifre":"Password"}</label>
          <input className="form-input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder={lang==="tr"?"En az 6 karakter":"At least 6 chars"} onKeyDown={e=>e.key==="Enter"&&submit()}/>
        </div>
        {err && <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:7,padding:"8px 12px",fontSize:13,color:"#dc2626",marginBottom:".6rem"}}>{err}</div>}
        <div className="modal-btns">
          <button className="btn-cancel" onClick={onClose}>{lang==="tr"?"İptal":"Cancel"}</button>
          <button className="btn-save" onClick={submit}>{isReg?(lang==="tr"?"Kayıt Ol":"Sign Up"):(lang==="tr"?"Giriş":"Sign In")}</button>
        </div>
        <div style={{textAlign:"center",marginTop:".9rem",fontSize:".8rem",color:th.light}}>
          {isReg
            ? <>{lang==="tr"?"Zaten hesabın var mı?":"Already have an account?"} <button style={{background:"none",border:"none",color:th.accent,cursor:"pointer",fontWeight:600}} onClick={()=>setMode("login")}>{lang==="tr"?"Giriş Yap":"Sign In"}</button></>
            : <>{lang==="tr"?"Hesabın yok mu?":"No account?"} <button style={{background:"none",border:"none",color:th.accent,cursor:"pointer",fontWeight:600}} onClick={()=>setMode("register")}>{lang==="tr"?"Kayıt Ol":"Sign Up"}</button></>
          }
        </div>
      </div>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────
function App() {
  const [tab, setTab]   = useState("home");
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("tr");
  const [toasts,    setToasts]    = useState([]);
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register'
  const [authUser,  setAuthUser]  = useState(()=>{
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('lc_user') || 'null'); } catch { return null; }
  });

  const theme = THEMES[dark?"dark":"light"];

  // ✅ addToast — global hata bildirimi
  const addToast = useCallback((msg)=>{
    const id = Date.now() + Math.random();
    setToasts(p=>[...p,{id,msg}]);
    setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)), 4500);
  },[]);

  const dismissToast = useCallback((id)=>setToasts(p=>p.filter(x=>x.id!==id)),[]);

  // ✅ Context değeri — tüm bileşenler buradan t, th, lang, setTab alır
  const ctx = useMemo(()=>({
    lang, dark, tab, setTab,
    t: TR[lang],
    th: theme.th,
    addToast,
    authUser, setAuthUser, setAuthModal,
  }),[lang,dark,tab,setTab,addToast,theme,authUser,setAuthUser,setAuthModal]);

  const t = TR[lang].nav;
  const TABS = [
    {id:"home",    label:`🏠 ${t.home}`},
    {id:"exams",   label:`📅 ${t.exams}`},
    {id:"planner", label:`🤖 ${t.planner}`},
    {id:"courses", label:`🎓 ${t.courses}`},
    {id:"chat",    label:`💬 ${t.chat}`},
    {id:"mcp",     label:`🗄️ ${t.mcp}`},
  ];

  return (
    <AppCtx.Provider value={ctx}>
      {/* ✅ CSS tek kez enjekte edilir, tema CSS variables ile değiştirilir */}
      <style dangerouslySetInnerHTML={{__html:STATIC_CSS}}/>
      {/* CSS var'lar root div'de tanımlanır */}
      <div style={theme.vars}>
        <nav className="nav">
          <div className="nav-logo">Learn<em>Connect</em> <small>.net</small></div>
          <div className="nav-tabs">
            {TABS.map(tb=>(
              <button key={tb.id} className={`ntab ${tab===tb.id?"on":""}`} onClick={()=>setTab(tb.id)}>{tb.label}</button>
            ))}
          </div>
          <div className="nav-right">
            <button className="icon-btn" onClick={()=>setLang(l=>l==="tr"?"en":"tr")} title="Dil / Language">
              {lang==="tr"?"🇬🇧":"🇹🇷"}
            </button>
            <button className="icon-btn" onClick={()=>setDark(d=>!d)} title="Tema / Theme">
              {dark?"☀️":"🌙"}
            </button>
            {authUser
              ? <button className="cta-btn" onClick={()=>{
                  if(window.confirm(lang==="tr"?`${authUser.name} olarak çıkış yapılsın mı?`:`Sign out as ${authUser.name}?`)){
                    localStorage.removeItem('lc_user'); setAuthUser(null);
                    addToast(lang==="tr"?"Çıkış yapıldı.":"Signed out.");
                  }
                }}>👤 {authUser.name}</button>
              : <button className="cta-btn" onClick={()=>setAuthModal('register')}>{t.signup}</button>
            }
          </div>
        </nav>

        {tab==="home"    && <HomePage/>}
        {tab==="exams"   && <ExamTracker/>}
        {tab==="planner" && <StudyPlanner/>}
        {tab==="courses" && <CourseBrowser/>}
        {tab==="chat"    && <AIChat/>}
        {tab==="mcp"     && <MCPDashboard/>}

        {/* Auth Modal */}
        {authModal && (
          <AuthModal
            mode={authModal}
            setMode={setAuthModal}
            onSuccess={(user)=>{ setAuthUser(user); setAuthModal(null); addToast(lang==="tr"?`Hoş geldin, ${user.name}!`:`Welcome, ${user.name}!`); }}
            onClose={()=>setAuthModal(null)}
            lang={lang} th={theme.th}
          />
        )}
        {/* ✅ MobileNav — küçük ekranda görünür */}
        <MobileNav/>

        {/* ✅ Toast bildirimleri */}
        <Toasts toasts={toasts} dismiss={dismissToast}/>
      </div>
    </AppCtx.Provider>
  );
}

export default App
