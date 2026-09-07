/**
 * embed.js — Runtime resource embedding for standalone HTML export
 * ---
 * Responsabilidad:
 *   - recopilar CSS del documento en runtime
 *   - fetch de JS (mismo origen) para inlinning
 *   - convertir imágenes a data URIs via canvas
 *   - construir HTML standalone con todo inline
 *   - serializar DB, rutas de aprendizaje y datos SNIES
 *     como __EMBEDDED_DB, __EMBEDDED_LR, __EMBEDDED_SD
 *
 * Dependencias:
 *   - window.DB, window.__LEARNING_ROUTES, window.AppState (lectura)
 *   - fetch, document.styleSheets, canvas
 *
 * Estado:
 *   Estable. Integrado con storage.js → downloadHTML().
 */
window.__EMBED = {
  /**
   * Normaliza el markup del nodo #toast en el HTML exportado para que SIEMPRE
   * salga oculto y vacío, independientemente del estado transitorio del DOM vivo.
   * El builder toma document.documentElement.outerHTML, que puede capturar el
   * toast ya en "display:block" con el texto "⏳ Empaquetando…" fijado justo
   * antes (storage.js). Sin esta normalización, un archivo exportado (sobre todo
   * el ADMIN, que no lleva _adminHide) mostraría ese mensaje pegado de forma
   * permanente al abrirse.
   * @param {string} html
   * @returns {string}
   */
  _resetToastMarkup: function(html) {
    return html.replace(/<div id="toast"[^>]*>[\s\S]*?<\/div>/,
      '<div id="toast" class="toast" style="display:none"></div>');
  },

  collectCSS: function() {
    var parts = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
      var sheet = document.styleSheets[i];
      try {
        if (sheet.cssRules && sheet.cssRules.length) {
          var rules = [];
          for (var j = 0; j < sheet.cssRules.length; j++) {
            rules.push(sheet.cssRules[j].cssText);
          }
          parts.push(rules.join('\n'));
        }
      } catch(e) {}
    }
    return parts.join('\n\n');
  },

  fetchJS: function(src) {
    return fetch(src).then(function(r) {
      if (!r.ok) throw new Error('Failed to fetch ' + src);
      return r.text();
    });
  },

  imageToDataURI: function(img) {
    return new Promise(function(resolve) {
      var src = img.getAttribute('src');
      if (!src || src.indexOf('data:') === 0) { resolve(src || ''); return; }
      try {
        var c = document.createElement('canvas');
        c.width = img.naturalWidth || img.width || 100;
        c.height = img.naturalHeight || img.height || 100;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      } catch(e) { resolve(src); }
    });
  },

  /**
   * Construye HTML standalone editable (admin mode):
   * - Mismo proceso que buildStandalone pero SIN _adminHide
   * - Inyecta __UDEC_ADMIN_EXPORT__=true
   * - Embebe __EMBEDDED_DB/__EMBEDDED_LR (snapshot inicial del export) y ejecuta
   *   una hidratación por token: siembra localStorage solo si está ausente/inválido
   *   o si no fue sembrado por ESTE export; si fue sembrado por este export,
   *   conserva las ediciones del usuario. El Admin sigue siendo editable.
   * @see buildStandalone
   */
  buildStandaloneAdmin: function() {
    var self = this;
    var html = document.documentElement.outerHTML;
    var cssText = this.collectCSS();
    html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '');
    var _dbStr = JSON.stringify(_freshSourceDB()).replace(/<\//g, '<\\/');
    var _lrStr = JSON.stringify(_freshSourceLR()).replace(/<\//g, '<\\/');
    var _sdStr = JSON.stringify(window.AppState ? window.AppState.snies.SD || {} : {}).replace(/<\//g, '<\\/');
    var _rcStr = JSON.stringify(window.__rcRaw || null).replace(/<\//g, '<\\/');
    var _embedded = '<script>' +
      'window.__UDEC_ADMIN_EXPORT__=true;' +
      'window.__EMBEDDED_DB=' + _dbStr + ';' +
      'window.__EMBEDDED_LR=' + _lrStr + ';' +
      _adminHydrationJS(_exportToken()) +
      'window.__EMBEDDED_SD=' + _sdStr + ';' +
      'window.__EMBEDDED_RC=' + _rcStr + ';' +
      '<\/script>';
    html = html.replace('</head>', function() { return _embedded + '<style>' + cssText + '</style></head>'; });
    var scriptSrcs = [];
    html = html.replace(/<script[^>]+src="([^"]*)"[^>]*><\/script>/gi, function(m, src) {
      scriptSrcs.push(src);
      return '';
    });
    var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));
    return Promise.all([
      Promise.all(imgs.map(function(img) { return self.imageToDataURI(img); })),
      Promise.all(scriptSrcs.map(function(src) { return self.fetchJS(src).then(function(c) { return c; }, function() { return ''; }); }))
    ]).then(function(results) {
      var dataURIs = results[0];
      var jsCodes = results[1];
      imgs.forEach(function(img, i) {
        if (dataURIs[i]) {
          var oldSrc = img.getAttribute('src');
          if (oldSrc) {
            html = html.split(oldSrc).join(dataURIs[i]);
            try { html = html.split(new URL(oldSrc, location.href).href).join(dataURIs[i]); } catch(e) {}
          }
        }
      });
      var inlineScripts = scriptSrcs.map(function(s, i) {
        if (jsCodes[i]) return '<script>' + jsCodes[i] + '<\/script>';
        return '<script src="' + s + '"><\/script>';
      }).join('\n');
      html = html.replace('</body>', function() { return inlineScripts + '\n</body>'; });
      return self._resetToastMarkup(html);
    });
  },

  /**
   * Construye HTML standalone: CSS, JS, imágenes inline.
   * Retorna Promise que resuelve el string HTML.
   */
  buildStandalone: function() {
    var self = this;
    var html = document.documentElement.outerHTML;
    var cssText = this.collectCSS();

    html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '');
    var _dbStr   = JSON.stringify(_freshSourceDB()).replace(/<\//g, '<\\/');
    var _lrStr   = JSON.stringify(_freshSourceLR()).replace(/<\//g, '<\\/');
    var _sdStr   = JSON.stringify(window.AppState ? window.AppState.snies.SD || {} : {}).replace(/<\//g, '<\\/');
    var _rcStr   = JSON.stringify(window.__rcRaw || null).replace(/<\//g, '<\\/');
    var _embedded = '<script>' +
      'window.__EMBEDDED_DB=' + _dbStr + ';' +
      'window.__EMBEDDED_LR=' + _lrStr + ';' +
      'window.__EMBEDDED_SD=' + _sdStr + ';' +
      'window.__EMBEDDED_RC=' + _rcStr + ';' +
      '<\/script>';
    var _adminHide = '/* UDEC EXPORT MODE - READ ONLY */' +
      '.tools-dropdown{display:none!important}' +
      '#panel-editor,#tb-editor,.edit-node-btn,.toast{display:none!important}' +
      'button.btn-upload,' +
      'button[onclick*="restoreRCDefaults"],' +
      'button[onclick*="_sniesImportClick"],button[onclick*="_sniesResetClick"],' +
      'button[onclick*="removeSniesProgram"],' +
      'a[data-action="reset-db"],button[data-action="download-html"],' +
      'button[data-action="reset-db"],' +
      'button[data-action="show-tab"][data-tab="editor"],' +
      'button[data-action="edit-lr-from-modal"],' +
      'button[onclick*="downloadDB"]{display:none!important}';
    html = html.replace('</head>', function() { return _embedded + '<style>' + cssText + _adminHide + '</style></head>'; });

    var scriptSrcs = [];
    html = html.replace(/<script[^>]+src="([^"]*)"[^>]*><\/script>/gi, function(m, src) {
      scriptSrcs.push(src);
      return '';
    });

    var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));

    return Promise.all([
      Promise.all(imgs.map(function(img) { return self.imageToDataURI(img); })),
      Promise.all(scriptSrcs.map(function(src) { return self.fetchJS(src).then(function(c) { return c; }, function() { return ''; }); }))
    ]).then(function(results) {
      var dataURIs = results[0];
      var jsCodes = results[1];

      imgs.forEach(function(img, i) {
        if (dataURIs[i]) {
          var oldSrc = img.getAttribute('src');
          if (oldSrc) {
            // Reemplazar formas relativas y absolutas (outerHTML puede resolver URLs)
            html = html.split(oldSrc).join(dataURIs[i]);
            try { html = html.split(new URL(oldSrc, location.href).href).join(dataURIs[i]); } catch(e) {}
          }
        }
      });

      var inlineScripts = scriptSrcs.map(function(s, i) {
        if (jsCodes[i]) return '<script>' + jsCodes[i] + '<\/script>';
        return '<script src="' + s + '"><\/script>';
      }).join('\n');

      html = html.replace('</body>', function() { return inlineScripts + '\n</body>'; });
      return self._resetToastMarkup(html);
    });
  }
};
