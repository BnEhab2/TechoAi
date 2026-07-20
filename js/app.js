/* ═══════════════════════════════════════════════════════════════════════════
   TECHO — Core Application Engine (Vanilla ES6 JavaScript)
   SUTech Official AI Digital Assistant
   ═══════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initParticleBackground();
  initSidebar();
  initTabNavigation();
  initThemeAndLang();
  initChatStudio();
  initScrollReveal();
});

/* ── 1. Sidebar Drawer Toggle ── */
function initSidebar() {
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const closeBtn = document.getElementById('sidebar-close-btn');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  if (sidebarToggle) sidebarToggle.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Close sidebar on link click
  document.querySelectorAll('.sidebar-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      closeSidebar();
    });
  });
}

/* ── 2. Tab Navigation Manager (Home, Chat, Identity) ── */
function initTabNavigation() {
  const hash = window.location.hash.replace('#', '') || 'home';
  switchTab(hash);
}

function switchTab(tabId) {
  const links = document.querySelectorAll('[data-tab-link]');
  const panels = document.querySelectorAll('.tab-panel');

  let activePanel = document.getElementById(`tab-${tabId}`);
  if (!activePanel) {
    tabId = 'home';
    activePanel = document.getElementById('tab-home');
  }

  links.forEach(l => {
    if (l.getAttribute('data-tab-link') === tabId) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  panels.forEach(p => p.classList.remove('active'));
  if (activePanel) activePanel.classList.add('active');

  window.history.replaceState(null, null, `#${tabId}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tabId === 'home') {
    setTimeout(initScrollReveal, 100);
  }
}

/* ── 3. Theme & Language Manager ── */
function initThemeAndLang() {
  const themeBtns = document.querySelectorAll('.theme-toggle-btn');
  const langBtns = document.querySelectorAll('.lang-toggle-btn');

  const savedTheme = localStorage.getItem('sutech_techo_theme') || 'dark';
  const savedLang = localStorage.getItem('sutech_techo_lang') || 'en';

  applyTheme(savedTheme);
  applyLang(savedLang);

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  });

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('lang');
      const next = current === 'en' ? 'ar' : 'en';
      applyLang(next);
    });
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sutech_techo_theme', theme);
  
  const themeBtns = document.querySelectorAll('.theme-toggle-btn');
  themeBtns.forEach(btn => {
    btn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun" style="color:gold;"></i>' 
      : '<i class="fa-solid fa-moon" style="color:#4C2E91;"></i>';
  });
}

function applyLang(lang) {
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  localStorage.setItem('sutech_techo_lang', lang);

  const langBtns = document.querySelectorAll('.lang-toggle-btn');
  langBtns.forEach(btn => {
    btn.innerHTML = lang === 'en' ? '<i class="fa-solid fa-globe"></i> AR' : '<i class="fa-solid fa-globe"></i> EN';
  });
}

/* ── 4. Chat Studio Interactive Logic (ChatGPT Style) ── */
function initChatStudio() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const feed = document.getElementById('chat-messages-container');
  const hero = document.getElementById('chat-initial-hero');

  if (!sendBtn || !input || !feed) return;

  async function sendMessage(userText) {
    if (!userText) return;

    // Hide initial hero greeting on first message
    if (hero) hero.classList.add('hidden');

    // Append User Message Row
    const userRow = document.createElement('div');
    userRow.className = 'chat-msg-row user-row';
    userRow.innerHTML = `<div class="chat-msg-bubble user fw-medium" dir="auto">${escapeHtml(userText)}</div>`;
    feed.appendChild(userRow);

    input.value = '';
    feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });

    // Append Assistant Message Row with Flipped Techo Avatar
    const assistantRow = document.createElement('div');
    assistantRow.className = 'chat-msg-row assistant-row';

    assistantRow.innerHTML = `
      <img src="public/images/TECHO CHATBOT rgb -12.svg" class="chat-avatar-flipped" alt="Techo AI" title="Techo AI" />
      <div class="chat-msg-bubble assistant" dir="auto">
        <div class="chat-assistant-header">
          <span class="fw-bold">Techo AI</span>
        </div>
        <div class="chat-content-body" dir="auto"><span class="typing-cursor"></span></div>
      </div>
    `;

    feed.appendChild(assistantRow);
    feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });

    const contentBody = assistantRow.querySelector('.chat-content-body');

    // Call Python Backend API (server.py on port 5000)
    try {
      const API_BASE = window.location.port === '5000' ? '' : 'http://localhost:5000';
      const sessionId = window.__techoSessionId || (window.__techoSessionId = 'sess_' + Date.now());
      
      console.log(`[Techo] Sending to ${API_BASE}/api/chat:`, userText);
      
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, session_id: sessionId })
      });

      console.log(`[Techo] Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('[Techo] AI Reply received:', data.reply?.substring(0, 80));
        streamResponse(contentBody, data.reply || 'حصل مشكلة، جرب تبعت تاني يا فنان!');
      } else {
        const errText = await response.text().catch(() => 'Unknown error');
        console.warn('[Techo] API error response:', errText);
        streamResponse(contentBody, getTechoReply(userText));
      }
    } catch (err) {
      console.warn("[Techo] Backend connection failed — make sure server.py is running on port 5000:", err.message);
      streamResponse(contentBody, getTechoReply(userText));
    }
  }


  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function parseMarkdown(text) {
    if (!text) return '';
    
    // Trim leading/trailing whitespace and newlines from the message
    text = text.trim();

    // Escape HTML to prevent XSS
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 1. Code Blocks: ```lang\n...\n```
    const codeBlocks = [];
    html = html.replace(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)(?:```|$)/g, (match, code) => {
      const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
      codeBlocks.push(`<pre><code>${code}</code></pre>`);
      return placeholder;
    });

    // 2. Inline Code: `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 3. Bold: **bold**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 4. Italic: *italic*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 5. Lists (bullet and ordered)
    const lines = html.split('\n');
    let inList = false;
    let inOrderedList = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // If it's a code block placeholder, leave it as is
      if (line.startsWith('__CODE_BLOCK_PLACEHOLDER_')) {
        continue;
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        let content = line.substring(2).trim();
        if (!inList) {
          lines[i] = '<ul><li>' + content + '</li>';
          inList = true;
        } else {
          lines[i] = '<li>' + content + '</li>';
        }
      } else if (/^\d+\.\s/.test(line)) {
        let content = line.replace(/^\d+\.\s/, '').trim();
        if (!inOrderedList) {
          lines[i] = '<ol><li>' + content + '</li>';
          inOrderedList = true;
        } else {
          lines[i] = '<li>' + content + '</li>';
        }
      } else {
        let prefix = '';
        if (inList) {
          prefix += '</ul>';
          inList = false;
        }
        if (inOrderedList) {
          prefix += '</ol>';
          inOrderedList = false;
        }
        
        if (line === '') {
          lines[i] = prefix;
        } else {
          lines[i] = prefix + line + '<br>';
        }
      }
    }

    let suffix = '';
    if (inList) suffix += '</ul>';
    if (inOrderedList) suffix += '</ol>';
    
    html = lines.join('') + suffix;

    // Clean up trailing <br>s
    html = html.replace(/(?:<br>)+$/, '');

    // Restore code blocks
    codeBlocks.forEach((block, idx) => {
      html = html.replace(`__CODE_BLOCK_PLACEHOLDER_${idx}__`, block);
    });

    return html;
  }

  function streamResponse(element, text) {
    let index = 0;
    element.innerHTML = '';

    const interval = setInterval(() => {
      if (index < text.length) {
        element.innerHTML = parseMarkdown(text.substring(0, index + 1)) + `<span class="typing-cursor"></span>`;
        index++;
        feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
      } else {
        clearInterval(interval);
        element.innerHTML = parseMarkdown(text); // Final HTML render
        feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
      }
    }, 15);
  }

  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    sendMessage(text);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value.trim());
    }
  });

  // Topic Buttons (Admissions, Programs, Scholarships, Campus Life)
  document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const topic = btn.getAttribute('data-topic') || btn.textContent.trim();
      sendMessage(`tell me about ${topic}`);
    });
  });
}

function getTechoReply(query) {
  const q = query.toLowerCase();

  if (q.includes('admission') || q.includes('شروط') || q.includes('قبول')) {
    return "🎓 **SUTech Admissions**: Applications for the upcoming academic year are now open! You can submit your high school certificate and apply directly via the university portal.";
  } else if (q.includes('program') || q.includes('برامج') || q.includes('تخصص')) {
    return "📖 **SUTech Programs**: We offer top-accredited technology programs including Computer Science & AI, Mechatronics, Design & Digital Media, and Energy Systems.";
  } else if (q.includes('scholarship') || q.includes('منح')) {
    return "🏅 **Scholarships**: SUTech provides up to 100% merit-based scholarships for high achievers, athletic champions, and STEM leaders.";
  } else if (q.includes('campus') || q.includes('حياة')) {
    return "👥 **Campus Life**: Enjoy vibrant student clubs, innovation labs, sports complexes, and hackathons hosted right on campus!";
  }

  return `I'm **Techo**, your AI study companion at SUTech! 🎓 How else can I assist you with your courses, admissions, or campus services?`;
}

/* ── 5. Floating Cloud & Starfield Particle Engine ── */
function initParticleBackground() {
  const canvas = document.getElementById('bg-stars-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particleColors = ['#00C2DE', '#6E3FBF', '#FF5B00', '#FFFFFF', '#A78BFA'];
  const particles = [];
  const particleCount = Math.min(110, Math.max(60, Math.floor((width * height) / 12000)));

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.6,
      alpha: Math.random() * 0.7 + 0.2,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      color: particleColors[Math.floor(Math.random() * particleColors.length)]
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.005;
      const clampedAlpha = Math.max(0.15, Math.min(0.85, p.alpha));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = clampedAlpha;
      ctx.shadowBlur = p.radius * 4;
      ctx.shadowColor = p.color;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }

  animate();
}

/* ── 6. ScrollReveal IntersectionObserver Engine ── */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-element');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
      }
    });
  }, {
    threshold: 0.1,
    root: document.getElementById('tab-home')
  });

  elements.forEach(el => observer.observe(el));
}
