// ==========================================
// Content Loader - メインサイト用
// Supabaseから管理画面で保存したコンテンツを読み込み、DOMに反映する
// ==========================================
(function() {
  'use strict';

  var CONFIG = window.SITE_CONFIG;
  if (!CONFIG) return;

  var IS_TEST = CONFIG.TEST_MODE === true;
  var sb = (!IS_TEST && CONFIG.SUPABASE_URL !== 'YOUR_SUPABASE_URL')
    ? supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)
    : null;

  // メニューのhrefとセクションIDのマッピング
  var MENU_MAP = {
    about: '#about',
    service: '#service',
    sales: '#sales',
    works: '#works',
    clients: '#clients',
    company: '#company'
  };

  async function loadContent() {
    try {
      var content = {};

      if (IS_TEST) {
        // テストモード: ローカルストレージから読み込み
        var stored = {};
        try { stored = JSON.parse(localStorage.getItem('ws_admin_content') || '{}'); } catch(e) {}
        Object.keys(stored).forEach(function(key) { content[key] = stored[key].content; });
        if (Object.keys(content).length === 0) return;
      } else if (sb) {
        var { data, error } = await sb.from('site_content').select('*');
        if (error || !data || data.length === 0) return;
        data.forEach(function(row) { content[row.section_id] = row.content; });
      } else {
        return;
      }

      if (content.message) applyMessage(content.message);
      if (content.about) applyAbout(content.about);
      if (content.service) applyService(content.service);
      if (content.sales) applySales(content.sales);
      if (content.works) applyWorks(content.works);
      if (content.clients) applyClients(content.clients);
      if (content.company) applyCompany(content.company);
      if (content.news) applyHomeNews(content.news);

      // メニュー・フッター更新
      updateMenus(content);
    } catch (e) {
      console.warn('Content load error:', e);
    }
  }

  // ===== Apply Functions =====

  function applyMessage(c) {
    // メッセージ文
    if (c.lines) {
      var textsEl = document.querySelector('.p-home-message__texts');
      if (textsEl) {
        textsEl.innerHTML = c.lines.map(function(line) { return '<p>' + escHtml(line) + '</p>'; }).join('');
      }
    }
    // Our Vision テキスト
    if (c.visionText) {
      setText('.p-home-vision__text', c.visionText);
    }
    // 背景テキスト
    if (c.bgText) {
      setText('.p-service-show__bg', c.bgText);
    }
    // カウント
    if (c.countLabel) setText('.p-service-show__count-label', c.countLabel);
    if (c.countNumber) setText('.p-service-show__count-number', c.countNumber);
    if (c.countText) setText('.p-service-show__count-text', c.countText);
    // ビジョンカード
    if (c.items && c.items.length) {
      // 左テキスト
      var leftItems = document.querySelectorAll('.p-service-show__left-item');
      var rightItems = document.querySelectorAll('.p-service-show__right-item');
      var faces = document.querySelectorAll('.p-service-show__face img');
      var spCards = document.querySelectorAll('.p-home-message__sp-card');

      c.items.forEach(function(item, i) {
        if (leftItems[i]) {
          var enEl = leftItems[i].querySelector('.p-service-show__left-en');
          var jaEl = leftItems[i].querySelector('.p-service-show__left-ja');
          if (enEl) enEl.textContent = item.en;
          if (jaEl) jaEl.textContent = item.ja;
        }
        if (rightItems[i]) {
          var numEl = rightItems[i].querySelector('.p-service-show__right-num');
          var titleEl = rightItems[i].querySelector('.p-service-show__right-title');
          if (numEl) numEl.textContent = item.num;
          if (titleEl) titleEl.innerHTML = item.title;
        }
        if (faces[i] && item.image) {
          faces[i].src = item.image;
        }
        // SP cards
        if (spCards[i]) {
          var spNum = spCards[i].querySelector('.p-home-message__sp-card-num');
          var spEn = spCards[i].querySelector('.p-home-message__sp-card-en');
          var spJa = spCards[i].querySelector('.p-home-message__sp-card-ja');
          var spTitle = spCards[i].querySelector('.p-home-message__sp-card-title');
          var spImg = spCards[i].querySelector('.p-home-message__sp-card-img img');
          if (spNum) spNum.textContent = item.num;
          if (spEn) spEn.textContent = item.en;
          if (spJa) spJa.textContent = item.ja;
          if (spTitle) spTitle.textContent = item.title;
          if (spImg && item.image) spImg.src = item.image;
        }
      });
    }
  }

  function applyAbout(c) {
    if (c.title) setText('.p-about__title', c.title);
    if (c.subtitle) setText('.p-about__subtitle', c.subtitle);
    if (c.lead) setHtml('.p-about__lead', c.lead);
    if (c.text) setHtml('.p-about__text', c.text);
  }

  function applyService(c) {
    if (c.title) setText('.p-service__title', c.title);
    if (c.subtitle) setText('.p-service__subtitle', c.subtitle);
    if (c.items) {
      var items = document.querySelectorAll('.p-service__item');
      c.items.forEach(function(item, i) {
        if (!items[i]) return;
        var titleJa = items[i].querySelector('.p-service__item-title');
        var titleEn = items[i].querySelector('.p-service__item-title-en');
        var text = items[i].querySelector('.p-service__item-text');
        if (titleJa) titleJa.textContent = item.titleJa;
        if (titleEn) titleEn.textContent = item.titleEn;
        if (text) text.innerHTML = item.text;
      });
    }
  }

  function applySales(c) {
    if (c.title) setText('.p-sales__title', c.title);
    if (c.subtitle) setText('.p-sales__subtitle', c.subtitle);
    if (c.years) {
      var accordion = document.querySelector('.p-sales__accordion');
      if (!accordion) return;
      accordion.innerHTML = '';
      c.years.forEach(function(yearData) {
        var yearDiv = document.createElement('div');
        yearDiv.className = 'p-sales__year';
        var cardsHtml = '';
        (yearData.quarters || []).forEach(function(q) {
          var rowsHtml = '';
          (q.rows || []).forEach(function(row) {
            rowsHtml += '<tr><td>' + escHtml(row.month) + '</td><td>' + escHtml(row.store) + '</td><td class="p-sales__td-amount">' + escHtml(row.amount) + '</td></tr>';
          });
          cardsHtml += '<div class="p-sales__card">' +
            '<button class="p-sales__card-header" type="button" aria-expanded="false">' +
            '<span class="p-sales__card-label">' + escHtml(q.label) + '</span>' +
            '<span class="p-sales__card-icon"></span></button>' +
            '<div class="p-sales__card-body"><div class="p-sales__card-body-inner">' +
            '<table class="p-sales__table"><thead><tr><th>月</th><th>催事店舗名</th><th class="p-sales__th-amount">売上金額</th></tr></thead>' +
            '<tbody>' + rowsHtml + '</tbody></table></div></div></div>';
        });
        yearDiv.innerHTML = '<h3 class="p-sales__year-title">' + escHtml(yearData.year) + '年</h3>' +
          '<div class="p-sales__cards">' + cardsHtml + '</div>';
        accordion.appendChild(yearDiv);
      });
      // Re-bind accordion events
      accordion.querySelectorAll('.p-sales__card-header').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var expanded = this.getAttribute('aria-expanded') === 'true';
          this.setAttribute('aria-expanded', String(!expanded));
          this.nextElementSibling.classList.toggle('is-open');
        });
      });
    }
  }

  function applyWorks(c) {
    if (c.title) setText('.p-works__title', c.title);
    if (c.subtitle) setText('.p-works__subtitle', c.subtitle);
    if (c.slides) {
      var carousel = document.getElementById('worksCarousel');
      if (!carousel) return;
      carousel.innerHTML = '';
      c.slides.forEach(function(slide, i) {
        var slideEl = document.createElement('div');
        slideEl.className = 'p-works__slide';
        slideEl.dataset.slide = i;
        slideEl.dataset.location = slide.location || '';
        slideEl.dataset.company = slide.company || '';
        slideEl.dataset.product = slide.product || '';
        slideEl.innerHTML = '<img src="' + escAttr(slide.image || '') + '" alt="' + escAttr(slide.location || '') + '">';
        carousel.appendChild(slideEl);
      });
      // Update total count
      var totalEl = document.getElementById('worksNumTotal');
      if (totalEl) totalEl.textContent = String(c.slides.length).padStart(2, '0');
    }
  }

  function applyClients(c) {
    if (c.title) setText('.p-clients__title', c.title);
    if (c.subtitle) setText('.p-clients__subtitle', c.subtitle);
    if (c.items) {
      var grid = document.querySelector('.p-clients__grid');
      if (grid) {
        grid.innerHTML = '';
        c.items.forEach(function(name, i) {
          var div = document.createElement('div');
          div.className = 'p-clients__item js-reveal js-reveal--delay' + ((i % 4) + 1);
          div.textContent = name;
          grid.appendChild(div);
        });
      }
    }
    if (c.note !== undefined) {
      var noteEl = document.querySelector('.p-clients__note');
      if (noteEl) noteEl.textContent = c.note;
    }
  }

  function applyCompany(c) {
    if (c.title) setText('.p-company__title', c.title);
    if (c.subtitle) setText('.p-company__subtitle', c.subtitle);
    if (c.rows) {
      var table = document.querySelector('.p-company__table');
      if (table) {
        table.innerHTML = '';
        c.rows.forEach(function(row) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<th>' + escHtml(row.label) + '</th><td>' + escHtml(row.value) + '</td>';
          table.appendChild(tr);
        });
      }
    }
  }

  // ===== Home News Update =====

  function applyHomeNews(c) {
    if (!c.items || c.items.length === 0) return;
    var list = document.querySelector('.c-news-list');
    if (!list) return;
    list.innerHTML = '';
    // 最新3件のみ表示
    c.items.slice(0, 3).forEach(function(item) {
      var li = document.createElement('li');
      li.className = 'c-news-list__item';
      li.innerHTML =
        '<a class="c-news-list__link" href="news.html">' +
        '<div class="c-news-list__head"><time class="c-news-list__date">' + escHtml(item.date) + '</time>' +
        '<span class="c-news-list__category">' + escHtml(item.category) + '</span></div>' +
        '<div class="c-news-list__body"><h3 class="c-news-list__title">' + escHtml(item.title) + '</h3>' +
        '<span class="c-news-list__dot"></span></div></a>';
      list.appendChild(li);
    });
  }

  // ===== Menu Update =====

  function updateMenus(content) {
    // セクション名が変更されている場合、メニューとフッターを更新
    Object.keys(MENU_MAP).forEach(function(sectionId) {
      var c = content[sectionId];
      if (!c || !c.menuTitle) return;
      var href = MENU_MAP[sectionId];

      // ヘッダーメニュー
      document.querySelectorAll('.g-header-nav__link').forEach(function(link) {
        if (link.getAttribute('href') === href) {
          link.textContent = c.menuTitle;
        }
      });

      // フッターメニュー
      document.querySelectorAll('.g-footer__nav-link').forEach(function(link) {
        if (link.getAttribute('href') === href) {
          link.textContent = c.menuTitle;
        }
      });
    });
  }

  // ===== Helpers =====

  function setText(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function setHtml(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.innerHTML = value;
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function escAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ===== Run =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContent);
  } else {
    loadContent();
  }
})();
