// ==========================================
// Menu Loader - サブページ用（news.html, blog.html等）
// 管理画面で変更されたセクション名をメニュー・フッターに反映する
// ==========================================
(function() {
  'use strict';

  var MENU_MAP = {
    about: 'index.html#about',
    service: 'index.html#service',
    sales: 'index.html#sales',
    works: 'index.html#works',
    clients: 'index.html#clients',
    company: 'index.html#company'
  };

  async function updateMenus() {
    try {
      var resp = await fetch('/api/content');
      if (!resp.ok) return;
      var data = await resp.json();

      data.forEach(function(row) {
        var href = MENU_MAP[row.section_id];
        if (!href || !row.content || !row.content.menuTitle) return;
        var menuTitle = row.content.menuTitle;

        document.querySelectorAll('.g-header-nav__link, .g-footer__nav-link').forEach(function(link) {
          if (link.getAttribute('href') === href) {
            link.textContent = menuTitle;
          }
        });
      });
    } catch (e) {
      console.warn('Menu load error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateMenus);
  } else {
    updateMenus();
  }
})();
