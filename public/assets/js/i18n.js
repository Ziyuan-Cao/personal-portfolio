'use strict';

(() => {
  const defaultLocale = "en";
  const storageKey = "portfolio-locale";
  const locales = {
    en: { label: "English", dateLocale: "en" },
    ja: { label: "日本語", dateLocale: "ja" },
    "zh-CN": { label: "简体中文", dateLocale: "zh-CN" },
  };

  const messages = {
    en: {
      "site.title": "Ziyuan Cao - Personal Portfolio",
      "language.label": "Language",
      "profile.name": "Ziyuan Cao",
      "profile.role": "Game Engine Developer",
      "sidebar.showContacts": "Show Contacts",
      "contact.email": "Email",
      "contact.phone": "Phone",
      "contact.birthday": "Birthday",
      "contact.location": "Location",
      "contact.locationValue": "Shinjuku, Tokyo, Japan",
      "social.github": "GitHub profile",
      "nav.about": "About",
      "nav.resume": "Resume",
      "nav.portfolio": "Portfolio",
      "nav.blog": "Blog",
      "nav.news": "News",
      "nav.contact": "Contact",
      "about.title": "About me",
      "about.intro": "I'm a game engine developer from Guangzhou, Guangdong, China, working in game development and game engine technology.",
      "about.services": "What I'm doing",
      "about.pipeline": "Pipeline design",
      "about.engine": "Game engine development",
      "about.animation": "Animation development",
      "about.uePlugin": "UE plugin development",
      "about.learning": "Learning and building.",
      "news.title": "News",
      "news.intro": "The latest news, updated automatically from the sources I follow.",
      "news.reload": "Reload",
      "news.reloading": "Reloading…",
      "news.notLoaded": "Not loaded yet",
      "news.filters": "News filters",
      "news.source": "Source",
      "news.allSources": "All sources",
      "news.search": "Search",
      "news.searchPlaceholder": "Search titles and summaries",
      "news.order": "Order",
      "news.newest": "Newest first",
      "news.oldest": "Oldest first",
      "news.loading": "Loading news…",
      "news.more": "Load more",
      "news.empty": "No news matches these filters yet.",
      "news.unavailable": "Date unavailable",
      "news.justNow": "Just now",
      "news.hoursAgo": "{count}h ago",
      "news.daysAgo": "{count}d ago",
      "news.found": "Found {time}",
      "news.collected": "Collected {time}",
      "news.awaiting": "Waiting for the first scheduled collection",
      "news.loadError": "Could not load news. {message}",
      "resume.title": "Resume",
      "resume.education": "Education",
      "resume.tmu": "Graduate School of Tokyo Metropolitan University",
      "resume.industrialArt": "Department of Industrial Art",
      "resume.systemsDesign": "Faculty of Systems Design",
      "resume.mukaiLab": "Mukai Laboratory",
      "resume.swpu": "Southwest Petroleum University",
      "resume.computerScience": "School of Computer Science",
      "resume.experience": "Experience",
      "resume.siliconStudio": "Silicon Studio",
      "resume.present": "2024 — Present",
      "resume.ue5": "Learning about UE5 and rendering pipelines.",
      "resume.polyphony": "Internship at Polyphony Digital",
      "resume.threejs": "Learned about Three.js.",
      "resume.lingchuang": "Internship at Guangzhou Lingchuang",
      "resume.ue4": "Learned about UE4.",
      "resume.skills": "My skills",
      "resume.rendering": "Rendering",
      "resume.animation": "Animation",
      "resume.mayaPlugin": "Maya plugin development",
      "resume.uePlugin": "UE plugin development",
      "resume.languages": "Languages I speak",
      "language.english": "English",
      "language.japanese": "Japanese",
      "language.chinese": "Chinese",
      "language.cantonese": "Cantonese",
      "portfolio.title": "Portfolio",
      "portfolio.all": "All",
      "portfolio.paper": "Paper",
      "portfolio.renderingApplication": "Rendering Application",
      "portfolio.gameApplication": "Game Application",
      "portfolio.select": "Select category",
      "portfolio.loading": "Loading projects…",
      "portfolio.empty": "No portfolio projects are currently published.",
      "portfolio.loadError": "Could not load portfolio projects. {message}",
      "blog.eyebrow": "Notes from the build",
      "blog.title": "Blog",
      "blog.loading": "Loading posts…",
      "blog.empty": "No blog posts are currently published.",
      "blog.read": "Read article ↗",
      "blog.readLabel": "Read {title}",
      "blog.allPosts": "← All posts",
      "blog.journal": "Journal / {number}",
      "blog.sources": "Sources and further reading",
      "blog.docs": "Read with the docs open",
      "blog.keywordSources": "Sources by keyword",
      "blog.keywordDetails": "Explore {count} keyword explanations",
      "blog.keywordMeaning": "What it means",
      "blog.keywordEquation": "Equation",
      "blog.keywordAiNote": "AI research connection",
      "blog.currentAiResearch": "Current AI research",
      "blog.more": "Read more notes →",
      "blog.defaultClosing": "The useful result is not only the technique, but a clearer model of where its assumptions and trade-offs live.",
      "blog.notFound": "That post could not be found.",
      "blog.loadError": "Could not load blog posts. {message}",
      "contact.title": "Contact",
    },
    ja: {
      "site.title": "ソウ シゲン - ポートフォリオ",
      "language.label": "言語",
      "profile.name": "ソウ シゲン",
      "profile.role": "ゲームエンジン開発者",
      "sidebar.showContacts": "連絡先を表示",
      "contact.email": "メール",
      "contact.phone": "電話",
      "contact.birthday": "生年月日",
      "contact.location": "所在地",
      "contact.locationValue": "日本・東京・新宿",
      "social.github": "GitHubプロフィール",
      "nav.about": "プロフィール",
      "nav.resume": "経歴",
      "nav.portfolio": "作品",
      "nav.blog": "ブログ",
      "nav.news": "ニュース",
      "nav.contact": "連絡先",
      "about.title": "プロフィール",
      "about.intro": "中国広東省広州市出身のゲームエンジン開発者です。ゲーム開発とゲームエンジン技術に取り組んでいます。",
      "about.services": "取り組んでいること",
      "about.pipeline": "パイプライン設計",
      "about.engine": "ゲームエンジン開発",
      "about.animation": "アニメーション開発",
      "about.uePlugin": "UEプラグイン開発",
      "about.learning": "学びながら開発しています。",
      "news.title": "ニュース",
      "news.intro": "フォローしている情報源から自動更新された最新ニュースです。",
      "news.reload": "再読み込み",
      "news.reloading": "再読み込み中…",
      "news.notLoaded": "まだ読み込まれていません",
      "news.filters": "ニュースフィルター",
      "news.source": "情報源",
      "news.allSources": "すべての情報源",
      "news.search": "検索",
      "news.searchPlaceholder": "タイトルと概要を検索",
      "news.order": "並び順",
      "news.newest": "新しい順",
      "news.oldest": "古い順",
      "news.loading": "ニュースを読み込み中…",
      "news.more": "さらに読み込む",
      "news.empty": "条件に一致するニュースはありません。",
      "news.unavailable": "日付不明",
      "news.justNow": "たった今",
      "news.hoursAgo": "{count}時間前",
      "news.daysAgo": "{count}日前",
      "news.found": "{time}に確認",
      "news.collected": "収集日時：{time}",
      "news.awaiting": "最初の定期収集を待っています",
      "news.loadError": "ニュースを読み込めませんでした。{message}",
      "resume.title": "経歴",
      "resume.education": "学歴",
      "resume.tmu": "東京都立大学大学院",
      "resume.industrialArt": "インダストリアルアート学域",
      "resume.systemsDesign": "システムデザイン研究科",
      "resume.mukaiLab": "向井研究室",
      "resume.swpu": "西南石油大学",
      "resume.computerScience": "コンピュータサイエンス学部",
      "resume.experience": "職歴",
      "resume.siliconStudio": "シリコンスタジオ勤務",
      "resume.present": "2024年 — 現在",
      "resume.ue5": "UE5とレンダリングパイプラインを研究しています。",
      "resume.polyphony": "ポリフォニー・デジタル インターン",
      "resume.threejs": "Three.jsを学びました。",
      "resume.lingchuang": "広州霊創 インターン",
      "resume.ue4": "UE4を学びました。",
      "resume.skills": "スキル",
      "resume.rendering": "レンダリング",
      "resume.animation": "アニメーション",
      "resume.mayaPlugin": "Mayaプラグイン開発",
      "resume.uePlugin": "UEプラグイン開発",
      "resume.languages": "使用言語",
      "language.english": "英語",
      "language.japanese": "日本語",
      "language.chinese": "中国語",
      "language.cantonese": "広東語",
      "portfolio.title": "作品",
      "portfolio.all": "すべて",
      "portfolio.paper": "論文",
      "portfolio.renderingApplication": "レンダリングアプリ",
      "portfolio.gameApplication": "ゲームアプリ",
      "portfolio.select": "カテゴリを選択",
      "portfolio.loading": "作品を読み込み中…",
      "portfolio.empty": "公開中の作品はありません。",
      "portfolio.loadError": "作品を読み込めませんでした。{message}",
      "blog.eyebrow": "開発ノート",
      "blog.title": "ブログ",
      "blog.loading": "記事を読み込み中…",
      "blog.empty": "公開中の記事はありません。",
      "blog.read": "記事を読む ↗",
      "blog.readLabel": "「{title}」を読む",
      "blog.allPosts": "← 記事一覧",
      "blog.journal": "開発ノート / {number}",
      "blog.sources": "参考資料と関連リンク",
      "blog.docs": "ドキュメントと一緒に読む",
      "blog.keywordSources": "キーワード別の資料",
      "blog.keywordDetails": "{count}件のキーワード解説を表示",
      "blog.keywordMeaning": "意味",
      "blog.keywordEquation": "数式",
      "blog.keywordAiNote": "AI研究との関連",
      "blog.currentAiResearch": "最新のAI研究",
      "blog.more": "ほかの記事を読む →",
      "blog.defaultClosing": "重要なのは手法そのものだけでなく、その前提とトレードオフを明確に理解することです。",
      "blog.notFound": "記事が見つかりませんでした。",
      "blog.loadError": "記事を読み込めませんでした。{message}",
      "contact.title": "連絡先",
    },
    "zh-CN": {
      "site.title": "曹梓源 - 个人作品集",
      "language.label": "语言",
      "profile.name": "曹梓源",
      "profile.role": "游戏引擎开发工程师",
      "sidebar.showContacts": "显示联系方式",
      "contact.email": "邮箱",
      "contact.phone": "电话",
      "contact.birthday": "生日",
      "contact.location": "所在地",
      "contact.locationValue": "日本东京新宿",
      "social.github": "GitHub 个人主页",
      "nav.about": "关于我",
      "nav.resume": "履历",
      "nav.portfolio": "作品",
      "nav.blog": "博客",
      "nav.news": "资讯",
      "nav.contact": "联系",
      "about.title": "关于我",
      "about.intro": "我是一名来自中国广东广州的游戏引擎开发工程师，专注于游戏开发和游戏引擎技术。",
      "about.services": "目前专注",
      "about.pipeline": "管线设计",
      "about.engine": "游戏引擎开发",
      "about.animation": "动画开发",
      "about.uePlugin": "UE 插件开发",
      "about.learning": "持续学习与实践。",
      "news.title": "资讯",
      "news.intro": "自动汇总我关注的信息源中的最新动态。",
      "news.reload": "重新加载",
      "news.reloading": "正在重新加载…",
      "news.notLoaded": "尚未加载",
      "news.filters": "资讯筛选",
      "news.source": "来源",
      "news.allSources": "全部来源",
      "news.search": "搜索",
      "news.searchPlaceholder": "搜索标题和摘要",
      "news.order": "排序",
      "news.newest": "最新优先",
      "news.oldest": "最早优先",
      "news.loading": "正在加载资讯…",
      "news.more": "加载更多",
      "news.empty": "没有符合筛选条件的资讯。",
      "news.unavailable": "日期未知",
      "news.justNow": "刚刚",
      "news.hoursAgo": "{count}小时前",
      "news.daysAgo": "{count}天前",
      "news.found": "发现于{time}",
      "news.collected": "采集于{time}",
      "news.awaiting": "等待首次定时采集",
      "news.loadError": "无法加载资讯。{message}",
      "resume.title": "履历",
      "resume.education": "教育经历",
      "resume.tmu": "东京都立大学研究生院",
      "resume.industrialArt": "工业艺术专业",
      "resume.systemsDesign": "系统设计研究科",
      "resume.mukaiLab": "向井研究室",
      "resume.swpu": "西南石油大学",
      "resume.computerScience": "计算机科学学院",
      "resume.experience": "工作经历",
      "resume.siliconStudio": "就职于 Silicon Studio",
      "resume.present": "2024年 — 至今",
      "resume.ue5": "学习 UE5 与渲染管线。",
      "resume.polyphony": "Polyphony Digital 实习",
      "resume.threejs": "学习了 Three.js。",
      "resume.lingchuang": "广州灵创实习",
      "resume.ue4": "学习了 UE4。",
      "resume.skills": "专业技能",
      "resume.rendering": "渲染",
      "resume.animation": "动画",
      "resume.mayaPlugin": "Maya 插件开发",
      "resume.uePlugin": "UE 插件开发",
      "resume.languages": "语言能力",
      "language.english": "英语",
      "language.japanese": "日语",
      "language.chinese": "中文",
      "language.cantonese": "粤语",
      "portfolio.title": "作品",
      "portfolio.all": "全部",
      "portfolio.paper": "论文",
      "portfolio.renderingApplication": "渲染应用",
      "portfolio.gameApplication": "游戏应用",
      "portfolio.select": "选择分类",
      "portfolio.loading": "正在加载作品…",
      "portfolio.empty": "目前没有已发布的作品。",
      "portfolio.loadError": "无法加载作品。{message}",
      "blog.eyebrow": "开发笔记",
      "blog.title": "博客",
      "blog.loading": "正在加载文章…",
      "blog.empty": "目前没有已发布的文章。",
      "blog.read": "阅读文章 ↗",
      "blog.readLabel": "阅读《{title}》",
      "blog.allPosts": "← 所有文章",
      "blog.journal": "开发笔记 / {number}",
      "blog.sources": "参考资料与延伸阅读",
      "blog.docs": "配合文档阅读",
      "blog.keywordSources": "按关键词列出的资料",
      "blog.keywordDetails": "展开{count}个关键词说明",
      "blog.keywordMeaning": "含义",
      "blog.keywordEquation": "公式",
      "blog.keywordAiNote": "与AI研究的联系",
      "blog.currentAiResearch": "当前AI研究",
      "blog.more": "阅读更多笔记 →",
      "blog.defaultClosing": "有价值的不只是技术本身，更是清楚理解它的前提与取舍。",
      "blog.notFound": "未找到这篇文章。",
      "blog.loadError": "无法加载博客文章。{message}",
      "contact.title": "联系",
    },
  };

  function normalizeLocale(value) {
    const locale = String(value || "").toLowerCase();
    if (locale.startsWith("zh")) return "zh-CN";
    if (locale.startsWith("ja")) return "ja";
    return "en";
  }

  function initialLocale() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && locales[stored]) return stored;
    } catch {}
    return normalizeLocale(navigator.languages?.[0] || navigator.language);
  }

  let locale = initialLocale();

  function interpolate(message, values = {}) {
    return message.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
  }

  function t(key, values) {
    return interpolate(messages[locale]?.[key] ?? messages[defaultLocale][key] ?? key, values);
  }

  function deepMerge(base, overlay) {
    if (Array.isArray(overlay)) {
      return overlay.map((value, index) => deepMerge(Array.isArray(base) ? base[index] : undefined, value));
    }
    if (!overlay || typeof overlay !== "object") return overlay ?? base;
    const result = base && typeof base === "object" && !Array.isArray(base) ? structuredClone(base) : {};
    for (const [key, value] of Object.entries(overlay)) result[key] = deepMerge(result[key], value);
    return result;
  }

  function localizeContent(content) {
    if (!content || typeof content !== "object") return content;
    const overlay = content.locales?.[locale];
    const localized = overlay ? deepMerge(content, overlay) : structuredClone(content);
    delete localized.locales;
    return localized;
  }

  function applyDocumentTranslations() {
    document.documentElement.lang = locale;
    document.title = t("site.title");
    for (const node of document.querySelectorAll("[data-i18n]")) node.textContent = t(node.dataset.i18n);
    for (const node of document.querySelectorAll("[data-i18n-placeholder]")) node.placeholder = t(node.dataset.i18nPlaceholder);
    for (const node of document.querySelectorAll("[data-i18n-aria-label]")) node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
    const picker = document.querySelector("[data-locale-select]");
    if (picker) picker.value = locale;
  }

  function setLocale(nextLocale) {
    const normalized = normalizeLocale(nextLocale);
    if (!locales[normalized]) return;
    locale = normalized;
    try { localStorage.setItem(storageKey, locale); } catch {}
    applyDocumentTranslations();
    window.dispatchEvent(new CustomEvent("portfolio:localechange", { detail: { locale } }));
  }

  window.portfolioI18n = {
    locales,
    t,
    get locale() { return locale; },
    get dateLocale() { return locales[locale].dateLocale; },
    localizeContent,
    setLocale,
    apply: applyDocumentTranslations,
  };

  document.addEventListener("DOMContentLoaded", () => {
    applyDocumentTranslations();
    document.querySelector("[data-locale-select]")?.addEventListener("change", (event) => setLocale(event.target.value));
  });
})();
