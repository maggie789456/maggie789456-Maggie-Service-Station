// ==================== 主页面交互逻辑 ====================

document.addEventListener('DOMContentLoaded', () => {

  // ---- 侧边导航点击滚动 ----
  const navLinks = document.querySelectorAll('.sidebar-nav a[data-target]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.dataset.target;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // 移动端关闭侧边栏
      if (window.innerWidth <= 900) {
        document.querySelector('.sidebar').classList.remove('open');
      }
    });
  });

  // ---- 滚动时高亮当前导航 ----
  const sections = document.querySelectorAll('.section');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom >= 120) {
        current = sec.id;
      }
    });
    if (current) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.target === current);
      });
    }
  });

  // ---- 加载类目指引 ----
  loadCategoryGuide();

  // ---- 加载近期资讯 ----
  loadHotWords();
  loadNotices();
});

// ==================== 视觉优化PDF高清渲染 ====================
var visPdfRendered = false;
var VIS_PDF_SCALE = 2; // 高清渲染倍数

function showVisPdf() {
  const area = document.getElementById('vis-pdf-area');
  if (area.classList.contains('hidden')) {
    area.classList.remove('hidden');
    area.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!visPdfRendered) {
      visPdfRendered = true;
      renderVisPdf();
    }
  } else {
    area.classList.add('hidden');
  }
}

function renderVisPdf() {
  var container = document.getElementById('vis-pdf-canvas-container');
  if (!container) return;
  var pdfUrl = container.dataset.pdf;

  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:300px;color:#ccc;font-size:15px;">📄 PDF加载中…</div>';

  if (!window.pdfjsLib) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:300px;color:#ff6a00;font-size:15px;">⚠️ PDF.js库加载失败，请使用上方下载按钮下载查看</div>';
    return;
  }

  var loadingTask = pdfjsLib.getDocument(encodeURI(pdfUrl));
  loadingTask.promise.then(function(pdf) {
    container.innerHTML = '';

    // 工具栏
    var toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#3b3d40;color:#ddd;font-size:13px;';
    toolbar.innerHTML = '<span>📄 共 ' + pdf.numPages + ' 页</span><span class="page-info" style="color:#aaa;">高清渲染中…</span>';
    container.appendChild(toolbar);

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 0;';
    container.appendChild(wrapper);

    var renderedCount = 0;

    function renderPage(num) {
      pdf.getPage(num).then(function(page) {
        var containerWidth = container.clientWidth;
        if (containerWidth < 100) containerWidth = 1200;
        var baseViewport = page.getViewport({ scale: 1 });
        var displayScale = containerWidth / baseViewport.width;
        var renderScaleVal = displayScale * VIS_PDF_SCALE;
        var renderViewport = page.getViewport({ scale: renderScaleVal });

        var pageDiv = document.createElement('div');
        pageDiv.style.cssText = 'position:relative;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);line-height:0;width:' + (baseViewport.width * displayScale) + 'px;';

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        canvas.style.cssText = 'display:block;width:100%;height:auto;';
        pageDiv.appendChild(canvas);

        var pageNum = document.createElement('div');
        pageNum.style.cssText = 'position:absolute;bottom:4px;right:6px;background:rgba(0,0,0,0.5);color:#fff;font-size:11px;padding:1px 6px;border-radius:3px;line-height:1.4;';
        pageNum.textContent = num + ' / ' + pdf.numPages;
        pageDiv.appendChild(pageNum);

        wrapper.appendChild(pageDiv);

        var renderContext = {
          canvasContext: ctx,
          viewport: renderViewport
        };
        page.render(renderContext).promise.then(function() {
          renderedCount++;
          var info = toolbar.querySelector('.page-info');
          if (info) {
            if (num < pdf.numPages) {
              info.textContent = '已渲染 ' + renderedCount + '/' + pdf.numPages + ' 页';
            } else {
              info.textContent = '✅ 全部 ' + pdf.numPages + ' 页已加载';
            }
          }
          if (num < pdf.numPages) {
            renderPage(num + 1);
          }
        });
      });
    }
    renderPage(1);
  }).catch(function(error) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:300px;color:#ff6a00;font-size:15px;">⚠️ PDF加载失败，请使用上方下载按钮下载查看</div>';
  });
}

// ==================== 类目指引 ====================
async function loadCategoryGuide() {
  try {
    const resp = await fetch('data/category_guide.json');
    const data = await resp.json();
    const container = document.getElementById('category-container');
    
    // 定义两大板块分类
    const jacketCats = ['外套夹克\n（男士时尚路径）', '外套夹克\n（户外运动路径）', '户外套装'];
    const shirtCats = ['衬衫', 'T恤裤子'];
    
    let html = '';
    
    // 外套夹克板块
    html += '<div style="grid-column:1/-1;"><h3 style="color:var(--primary);font-size:18px;margin-bottom:12px;padding:8px 16px;background:var(--primary-light);border-radius:8px;">🧥 外套夹克</h3></div>';
    jacketCats.forEach(cat => {
      if (data[cat]) {
        html += renderCatCard(cat, data[cat]);
      }
    });
    
    // 衬衫亨利衫板块
    html += '<div style="grid-column:1/-1;margin-top:20px;"><h3 style="color:var(--primary);font-size:18px;margin-bottom:12px;padding:8px 16px;background:var(--primary-light);border-radius:8px;">👕 衬衫 / 亨利衫</h3></div>';
    shirtCats.forEach(cat => {
      if (data[cat]) {
        html += renderCatCard(cat, data[cat]);
      }
    });
    
    container.innerHTML = html;
  } catch(e) {
    document.getElementById('category-container').innerHTML = '<div style="color:var(--red);">类目数据加载失败，请确保 data/category_guide.json 存在</div>';
  }
}

function renderCatCard(catName, subCats) {
  // 清理类目名称中的换行
  const displayName = catName.replace(/\n/g, ' ').trim();
  let html = `<div class="cat-card">
    <div class="cat-card-header" onclick="this.parentElement.querySelector('.cat-card-body').classList.toggle('hidden')" style="cursor:pointer;user-select:none;">${displayName}</div>
    <div class="cat-card-body">`;
  
  for (const [subName, paths] of Object.entries(subCats)) {
    html += `<div class="cat-sub-item">
      <div class="sub-title">${subName}</div>`;
    
    if (Array.isArray(paths) && paths.length > 1) {
      // 多个路径，每个路径单独一行，各自带复制按钮
      paths.forEach((path, idx) => {
        const pathId = 'path-' + Math.random().toString(36).substr(2, 9);
        html += `<div class="sub-path" style="margin-bottom:6px;">
          <span id="${pathId}">📍 ${path}</span>
          <button class="copy-btn" onclick="copyToClipboard(document.getElementById('${pathId}').innerText.replace('📍 ',''))" style="margin-left:8px;padding:2px 10px;font-size:12px;border:1px solid var(--primary);background:var(--primary-light);color:var(--primary);border-radius:4px;cursor:pointer;white-space:nowrap;">📋 复制</button>
        </div>`;
      });
    } else {
      // 单个路径，合并显示
      const pathText = Array.isArray(paths) ? paths.join('；') : String(paths);
      const pathId = 'path-' + Math.random().toString(36).substr(2, 9);
      html += `<div class="sub-path">
        <span id="${pathId}">📍 ${pathText}</span>
        <button class="copy-btn" onclick="copyToClipboard(document.getElementById('${pathId}').innerText.replace('📍 ',''))" style="margin-left:8px;padding:2px 10px;font-size:12px;border:1px solid var(--primary);background:var(--primary-light);color:var(--primary);border-radius:4px;cursor:pointer;white-space:nowrap;">📋 复制</button>
      </div>`;
    }
    
    html += `</div>`;
  }
  
  html += `</div></div>`;
  return html;
}

// ==================== 近期资讯 ====================
async function loadHotWords() {
  try {
    const resp = await fetch('data/hot-words.txt');
    const text = await resp.text();
    // 转义HTML标签，保留换行
    const safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    document.getElementById('hot-words').innerHTML = safe.replace(/\n/g,'<br>');
  } catch(e) {
    document.getElementById('hot-words').textContent = '加载失败，请确保 data/hot-words.txt 存在';
  }
}

async function loadNotices() {
  try {
    const resp = await fetch('data/notifications.txt');
    const text = await resp.text();
    // 转义HTML标签，保留换行
    const safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    document.getElementById('notices').innerHTML = safe.replace(/\n/g,'<br>');
  } catch(e) {
    document.getElementById('notices').textContent = '加载失败，请确保 data/notifications.txt 存在';
  }
}

// ==================== 最新款式资讯PDF渲染 ====================
var latestPdfRendered = false;

function showLatestPdf(pdfUrl, itemEl) {
  // 高亮选中项
  document.querySelectorAll('.latest-info-item').forEach(el => el.classList.remove('active'));
  if (itemEl) itemEl.classList.add('active');

  var area = document.getElementById('latest-pdf-area');
  var container = document.getElementById('latest-pdf-canvas-container');
  var downloadBtn = document.getElementById('latest-pdf-download');
  var titleEl = document.getElementById('latest-pdf-title');

  // 设置标题和下载链接
  var titleText = itemEl ? itemEl.querySelector('.latest-item-title').textContent : '资讯详情';
  titleEl.textContent = '📄 ' + titleText;
  downloadBtn.href = pdfUrl;
  container.dataset.pdf = pdfUrl;

  if (area.classList.contains('hidden')) {
    area.classList.remove('hidden');
    area.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // 每次切换PDF都重新渲染
  renderLatestPdf(pdfUrl);
}

function renderLatestPdf(pdfUrl) {
  var container = document.getElementById('latest-pdf-canvas-container');
  if (!container || !pdfUrl) return;

  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:300px;color:#ccc;font-size:15px;">📄 PDF加载中…</div>';

  if (!window.pdfjsLib) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:300px;color:#ff6a00;font-size:15px;">⚠️ PDF.js库加载失败，请使用上方下载按钮下载查看</div>';
    return;
  }

  // 对URL中的非ASCII字符进行编码，防止中文路径加载失败
  var encodedUrl = encodeURI(pdfUrl);

  var loadingTask = pdfjsLib.getDocument(encodedUrl);
  loadingTask.promise.then(function(pdf) {
    container.innerHTML = '';

    // 工具栏
    var toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#3b3d40;color:#ddd;font-size:13px;';
    toolbar.innerHTML = '<span>📄 共 ' + pdf.numPages + ' 页</span><span class="page-info" style="color:#aaa;">高清渲染中…</span>';
    container.appendChild(toolbar);

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 0;';
    container.appendChild(wrapper);

    var renderedCount = 0;
    var LATEST_PDF_SCALE = 2;

    function renderPage(num) {
      pdf.getPage(num).then(function(page) {
        var containerWidth = container.clientWidth;
        if (containerWidth < 100) containerWidth = 1200;
        var baseViewport = page.getViewport({ scale: 1 });
        var displayScale = containerWidth / baseViewport.width;
        var renderScaleVal = displayScale * LATEST_PDF_SCALE;
        var renderViewport = page.getViewport({ scale: renderScaleVal });

        var pageDiv = document.createElement('div');
        pageDiv.style.cssText = 'position:relative;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);line-height:0;width:' + (baseViewport.width * displayScale) + 'px;';

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        canvas.style.cssText = 'display:block;width:100%;height:auto;';
        pageDiv.appendChild(canvas);

        var pageNum = document.createElement('div');
        pageNum.style.cssText = 'position:absolute;bottom:4px;right:6px;background:rgba(0,0,0,0.5);color:#fff;font-size:11px;padding:1px 6px;border-radius:3px;line-height:1.4;';
        pageNum.textContent = num + ' / ' + pdf.numPages;
        pageDiv.appendChild(pageNum);

        wrapper.appendChild(pageDiv);

        var renderContext = {
          canvasContext: ctx,
          viewport: renderViewport
        };
        page.render(renderContext).promise.then(function() {
          renderedCount++;
          var info = toolbar.querySelector('.page-info');
          if (info) {
            if (num < pdf.numPages) {
              info.textContent = '已渲染 ' + renderedCount + '/' + pdf.numPages + ' 页';
            } else {
              info.textContent = '✅ 全部 ' + pdf.numPages + ' 页已加载';
            }
          }
          if (num < pdf.numPages) {
            renderPage(num + 1);
          }
        });
      });
    }
    renderPage(1);
  }).catch(function(error) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:300px;color:#ff6a00;font-size:15px;">⚠️ PDF加载失败，请使用上方下载按钮下载查看</div>';
  });
}

// 通用复制函数
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => alert('已复制：' + text)).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); alert('已复制：' + text); }
  catch(e) { alert('复制失败，请手动选择复制'); }
  document.body.removeChild(ta);
}
