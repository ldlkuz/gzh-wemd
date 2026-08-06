/* ═══════════════════════════════════════════════════════════════
   WeMD 主题设计工作台 · JavaScript
   ═══════════════════════════════════════════════════════════════ */

// ── State ──
let currentProjectId = null;
let currentProject = null;
let currentProfileType = 'brand'; // 'brand' | 'creator'
let statePollingTimer = null;

// ── 视图切换 ──
function showView(viewName) {
  // 停止轮询
  if (statePollingTimer && viewName !== 'generating') {
    clearInterval(statePollingTimer);
    statePollingTimer = null;
  }
  document.getElementById('emptyState').style.display = viewName === 'empty' ? 'flex' : 'none';
  document.getElementById('profileFormView').style.display = viewName === 'profile' ? '' : 'none';
  document.getElementById('generatingView').style.display = viewName === 'generating' ? 'flex' : 'none';
  document.getElementById('projectDetail').classList.toggle('active', viewName === 'detail');
}

// ── API Helper ──
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Initialization ──
async function initWorkspace() {
  if (!confirm('确定要初始化工作区吗？\n\n此操作会清空所有项目数据，不可撤销。')) return;
  try {
    await api('/api/init', { method: 'POST' });
    showToast('工作区已初始化', 'success');
    currentProjectId = null;
    currentProject = null;
    document.getElementById('projectDetail').classList.remove('active');
    document.getElementById('emptyState').style.display = 'flex';
    loadProjects();
  } catch (e) {
    showToast('初始化失败: ' + e.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
//  PROJECT LIST
// ═══════════════════════════════════════════════════════════════
async function loadProjects() {
  try {
    const data = await api('/api/projects');
    const list = document.getElementById('projectList');
    const count = document.getElementById('projectCount');

    if (data.projects.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px">暂无项目，点击上方新建</div>';
      count.textContent = '';
      return;
    }

    count.textContent = data.projects.length + ' 个';

    list.innerHTML = data.projects.map(p => {
      const typeClass = p.profileType === 'brand' ? 'badge-brand' : 'badge-creator';
      const typeLabel = p.profileType === 'brand' ? '品牌' : '创作者';
      const statusBadge = p.status === 'APPROVED' || p.status === 'EXPORTED'
        ? '<span class="badge badge-approved">✓ 已通过</span>'
        : p.status === 'PREVIEW'
        ? '<span class="badge badge-reviewing">△ 可预览</span>'
        : p.status === 'GENERATING'
        ? '<span class="badge badge-reviewing">⏳ 生成中</span>'
        : p.status === 'READY'
        ? '<span class="badge badge-draft">✓ 待生成</span>'
        : '<span class="badge badge-draft">· 新建</span>';
      const active = p.id === currentProjectId ? 'active' : '';
      const hasBlueprint = p.hasBlueprint ? '<span class="badge-dot emerald"></span>' : '<span class="badge-dot muted"></span>';
      const hasTheme = p.hasTheme ? '<span class="badge-dot emerald"></span>' : '<span class="badge-dot muted"></span>';

      return `<div class="project-card ${active}" onclick="selectProject('${p.id}')">
        <div class="card-name">
          <span class="badge ${typeClass}">${typeLabel}</span>
          ${p.name}
          <span style="margin-left:auto;font-size:14px;cursor:pointer;opacity:0;transition:var(--transition)" class="delete-btn" onclick="event.stopPropagation();deleteProject('${p.id}','${p.name.replace(/'/g, "\\'")}')">&times;</span>
        </div>
        <div class="card-meta">
          ${statusBadge}
          <span class="cap">${hasBlueprint}蓝图</span>
          <span class="cap">${hasTheme}主题</span>
          <span class="cap">${p.reviewCount || 0}审</span>
        </div>
      </div>`;
    }).join('');

    if (currentProjectId && data.projects.some(p => p.id === currentProjectId)) {
      loadProjectDetail(currentProjectId);
    }
  } catch (e) {
    document.getElementById('projectList').innerHTML =
      `<div style="text-align:center;padding:24px;color:var(--coral);font-size:13px">加载失败: ${e.message}</div>`;
  }
}

// ── 删除项目 ──
async function deleteProject(id, name) {
  if (!confirm('确定要删除项目 "' + name + '" 吗？\n此操作不可撤销。')) return;
  try {
    await api('/api/projects/' + id, { method: 'DELETE' });
    showToast('项目 "' + name + '" 已删除', 'info');
    if (currentProjectId === id) {
      currentProjectId = null;
      currentProject = null;
      document.getElementById('projectDetail').classList.remove('active');
      document.getElementById('emptyState').style.display = 'flex';
    }
    loadProjects();
  } catch (e) {
    showToast('删除失败: ' + e.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
//  PROJECT DETAIL
// ═══════════════════════════════════════════════════════════════
async function selectProject(id) {
  currentProjectId = id;

  // 读取项目状态，决定显示哪个视图
  try {
    const state = await api('/api/projects/' + id + '/state');
    const status = state.status;
    if (status === 'NEW') {
      // 获取项目详情以确定 profileType
      const detail = await api('/api/projects/' + id);
      currentProfileType = detail.project?.profileType || 'brand';
      setupProfileForm(currentProfileType);
      showView('profile');
      loadProjects();
    } else if (status === 'GENERATING') {
      showView('generating');
      startStatePolling(id);
      loadProjects();
    } else if (status === 'READY') {
      // READY 但未 GENERATING — 等待 Skill 触发
      showView('generating');
      document.getElementById('generatingTitle').textContent = '等待开始生成...';
      document.getElementById('generatingStep').textContent = '品牌资料已就绪，请在 Trae 中继续';
      startStatePolling(id);
      loadProjects();
    } else {
      // PREVIEW / APPROVED / EXPORTED → 显示详情
      showView('detail');
      await loadProjectDetail(id);
      loadProjects();
    }
  } catch {
    // state.json 不存在，回退到详情视图
    showView('detail');
    await loadProjectDetail(id);
    loadProjects();
  }
}

// ── 根据 profileType 设置表单字段显示 ──
function setupProfileForm(profileType) {
  currentProfileType = profileType;
  const isBrand = profileType === 'brand';

  // 切换品牌/创作者专属区块
  document.getElementById('pf-brand-section').style.display = isBrand ? '' : 'none';
  document.getElementById('pf-creator-section').style.display = isBrand ? 'none' : '';

  // 切换名称标签
  document.getElementById('pf-name-label').innerHTML = isBrand
    ? '品牌名称 <span class="req">*</span>'
    : '创作者名称 <span class="req">*</span>';

  // Logo 必填标记：Brand 必填，Creator 可选
  document.getElementById('pf-logo-req').style.display = isBrand ? '' : 'none';

  // 切换标题
  document.getElementById('profileFormTitle').textContent = isBrand
    ? '填写品牌资料'
    : '填写创作者资料';
  document.getElementById('profileFormSub').textContent = isBrand
    ? '完成后点击保存，Skill 将自动开始生成主题'
    : '完成后点击保存，Skill 将自动开始生成主题';

  // 清空表单（切换项目时重置）
  ['pf-name', 'pf-description', 'pf-keywords', 'pf-slogan', 'pf-website',
   'pf-contentDirection', 'pf-reference', 'pf-slogan-creator'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) el.value = '';
  });
  document.getElementById('pf-logo').value = '';
  document.getElementById('pf-brandSpec').value = '';
  resetLogoPreview();
}

// ── Logo 预览 ──
function resetLogoPreview() {
  const preview = document.getElementById('pf-logo-preview');
  preview.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">预览</span>';
  preview.dataset.path = '';
}

function showLogoPreview(file) {
  const preview = document.getElementById('pf-logo-preview');
  if (!file) {
    resetLogoPreview();
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.innerHTML = `<img src="${e.target.result}" style="max-width:100%;max-height:100%;object-fit:contain">`;
  };
  reader.readAsDataURL(file);
}

// 监听 Logo 文件选择
document.addEventListener('DOMContentLoaded', () => {
  const logoInput = document.getElementById('pf-logo');
  if (logoInput) {
    logoInput.addEventListener('change', (e) => {
      showLogoPreview(e.target.files[0]);
    });
  }
});

// ── 上传单个文件（返回相对路径或 null） ──
async function uploadAsset(file, type) {
  if (!file) return null;
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const res = await api('/api/projects/' + currentProjectId + '/upload', {
    method: 'POST',
    body: JSON.stringify({
      type,
      fileName: file.name,
      base64,
      mimeType: file.type,
    }),
  });
  return res.path;
}

// ── 提交品牌资料 ──
async function submitProfile(saveOnly) {
  const name = document.getElementById('pf-name').value.trim();
  const description = document.getElementById('pf-description').value.trim();
  const keywordsRaw = document.getElementById('pf-keywords').value.trim();
  const isBrand = currentProfileType === 'brand';

  if (!name || !description || !keywordsRaw) {
    showToast('请填写必填项（名称、介绍、关键词）', 'error');
    return;
  }

  // Brand 必填 Logo；Creator 的内容方向必填
  const logoFile = document.getElementById('pf-logo').files[0];
  if (isBrand && !logoFile) {
    showToast('请上传品牌 Logo（必填）', 'error');
    return;
  }
  if (!isBrand) {
    const contentDirection = document.getElementById('pf-contentDirection').value.trim();
    if (!contentDirection) {
      showToast('请填写内容方向（必填）', 'error');
      return;
    }
  }

  // 上传文件（如果有）
  let logoPath = null;
  let brandSpecPath = null;
  try {
    if (logoFile) {
      showToast('正在上传 Logo...', 'info');
      logoPath = await uploadAsset(logoFile, 'logo');
    }
    if (isBrand) {
      const brandSpecFile = document.getElementById('pf-brandSpec').files[0];
      if (brandSpecFile) {
        showToast('正在上传品牌规范 PDF...', 'info');
        brandSpecPath = await uploadAsset(brandSpecFile, 'brandSpec');
      }
    }
  } catch (e) {
    showToast('文件上传失败: ' + e.message, 'error');
    return;
  }

  const keywords = keywordsRaw.split(/[,，、\s]+/).filter(Boolean);
  const primaryColor = document.getElementById('pf-primaryColor').value;

  // 构建 profile（根据 profileType 区分字段）
  const profile = isBrand
    ? {
        profileType: 'brand',
        brandName: name,
        description,
        keywords,
        primaryColor,
        logo: logoPath,
        slogan: document.getElementById('pf-slogan').value.trim() || undefined,
        website: document.getElementById('pf-website').value.trim() || undefined,
        brandSpec: brandSpecPath || undefined,
      }
    : {
        profileType: 'creator',
        name,
        description,
        keywords,
        primaryColor,
        logo: logoPath || undefined,
        contentDirection: document.getElementById('pf-contentDirection').value.trim(),
        reference: document.getElementById('pf-reference').value.trim() || undefined,
        slogan: document.getElementById('pf-slogan-creator').value.trim() || undefined,
      };

  try {
    await api('/api/projects/' + currentProjectId + '/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
    showToast(saveOnly ? '资料已保存' : '资料已提交，状态已更新为 READY', 'success');

    if (saveOnly) {
      showView('profile');
    } else {
      // 切换到等待生成视图
      showView('generating');
      document.getElementById('generatingTitle').textContent = '等待开始生成...';
      document.getElementById('generatingStep').textContent = '品牌资料已就绪，请回到 Trae 继续';
      startStatePolling(currentProjectId);
    }
    loadProjects();
  } catch (e) {
    showToast('提交失败: ' + e.message, 'error');
  }
}

// ── 状态轮询（GENERATING 状态时） ──
function startStatePolling(projectId) {
  if (statePollingTimer) clearInterval(statePollingTimer);
  statePollingTimer = setInterval(async () => {
    try {
      const state = await api('/api/projects/' + projectId + '/state');
      if (state.status === 'GENERATING' && state.progress) {
        document.getElementById('generatingTitle').textContent = '正在生成主题...';
        document.getElementById('generatingStep').textContent = state.progress.current || '处理中...';
        document.getElementById('generatingProgressFill').style.width = state.progress.percent + '%';
        document.getElementById('generatingPercent').textContent = state.progress.percent + '%';
      } else if (state.status === 'PREVIEW') {
        // 生成完成，切换到详情视图
        clearInterval(statePollingTimer);
        statePollingTimer = null;
        showToast('主题生成完成！', 'success');
        showView('detail');
        await loadProjectDetail(projectId);
        loadProjects();
      } else if (state.status === 'NEW') {
        // 生成失败
        clearInterval(statePollingTimer);
        statePollingTimer = null;
        document.getElementById('generatingTitle').textContent = '生成失败';
        document.getElementById('generatingStep').textContent = '请回到 Trae 查看错误信息';
      }
    } catch {
      // 忽略轮询错误
    }
  }, 2000);
}

async function loadProjectDetail(id) {
  try {
    const data = await api('/api/projects/' + id);
    currentProject = data.project;

    // Title
    document.getElementById('detailTitle').textContent = data.project.name;
    const typeLabel = data.project.profileType === 'brand' ? '品牌' : '创作者';
    const statusLabel = data.project.status === 'APPROVED' ? '✓ 已通过'
      : data.project.status === 'PREVIEW' ? '△ 可预览'
      : data.project.status === 'GENERATING' ? '⏳ 生成中'
      : data.project.status === 'READY' ? '✓ 待生成'
      : data.project.status === 'EXPORTED' ? '✓ 已导出'
      : data.project.status;
    document.getElementById('detailSub').textContent =
      typeLabel + ' · ' + statusLabel + ' · 创建于 ' + formatTime(data.project.createdAt);

    // Show download button if theme exists
    document.getElementById('downloadBtn').style.display = data.project.themePackage ? '' : 'none';

    // Overview grid
    document.getElementById('overviewGrid').innerHTML =
      '<div class="info-card"><div class="label">状态</div><div class="value">' + data.project.status + '</div></div>' +
      '<div class="info-card"><div class="label">类型</div><div class="value">' + (data.project.profileType === 'brand' ? '🏢 品牌' : '✏️ 创作者') + '</div></div>' +
      '<div class="info-card"><div class="label">Blueprint</div><div class="value ' + (data.project.designBlueprint ? 'emerald' : '') + '">' + (data.project.designBlueprint ? '✓ 已生成' : '— 未生成') + '</div></div>' +
      '<div class="info-card"><div class="label">Theme</div><div class="value ' + (data.project.themePackage ? 'emerald' : '') + '">' + (data.project.themePackage ? '✓ 已编译' : '— 未编译') + '</div></div>' +
      '<div class="info-card"><div class="label">审核记录</div><div class="value amber">' + data.project.reviewRecords.length + ' 条</div></div>' +
      '<div class="info-card"><div class="label">决策日志</div><div class="value">' + data.project.decisionLog.length + ' 条</div></div>' +
      '<div class="info-card"><div class="label">素材文件</div><div class="value">' + data.materials.length + ' 个</div></div>' +
      '<div class="info-card"><div class="label">组件版本</div><div class="value">' + data.versions.length + ' 个</div></div>';

    // Design Memory
    const dm = data.project.designMemory || {};
    document.getElementById('memoryInfo').innerHTML =
      '<div>已确认风格: <strong>' + (Object.keys(dm.componentStyles || {}).length) + '</strong> 个</div>' +
      '<div>被拒绝方案: <strong>' + (dm.rejectedApproaches?.length || 0) + '</strong> 个</div>' +
      '<div style="margin-top:6px;font-size:11px;color:var(--text-muted)">' +
        '偏好: ' + (dm.preferences?.decorationLevel || '—') + ' · ' + (dm.preferences?.patternDensity || '—') + ' · ' + (dm.preferences?.cornerStyle || '—') +
      '</div>';

    // Profile
    const p = data.project.profile || {};
    const logoHtml = p.logo
      ? '<div>Logo: <img src="/api/projects/' + currentProjectId + '/assets/logo/' + p.logo.split('/').pop() + '" style="height:24px;vertical-align:middle"></div>'
      : '<div>Logo: —</div>';
    document.getElementById('profileInfo').innerHTML =
      '<div>名称: ' + (p.brandName || p.name || '—') + '</div>' +
      '<div>关键词: ' + ((p.keywords || []).join(', ') || '—') + '</div>' +
      '<div>主色: ' + (p.primaryColor ? '<span style="display:inline-block;width:12px;height:12px;background:' + p.primaryColor + ';border-radius:2px;vertical-align:middle"></span> ' + p.primaryColor : '—') + '</div>' +
      logoHtml +
      (p.slogan ? '<div>Slogan: ' + p.slogan + '</div>' : '') +
      (p.website ? '<div>官网: <a href="' + p.website + '" target="_blank" style="color:var(--accent)">' + p.website + '</a></div>' : '') +
      (p.contentDirection ? '<div>方向: ' + p.contentDirection + '</div>' : '') +
      (p.reference ? '<div>参考: <a href="' + p.reference + '" target="_blank" style="color:var(--accent)">' + p.reference + '</a></div>' : '') +
      (p.brandSpec ? '<div>品牌规范: <span style="color:var(--success)">已上传 PDF</span></div>' : '');

    // Other tabs
    loadBlueprint(id);
    loadBrandSystem(data.project.designBlueprint?.brandSystem || null);
    loadComponents(id);
    loadVersions(id);
    loadReviews(data.project);
  } catch (e) {
    showToast('加载项目详情失败: ' + e.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
//  TAB SWITCHING
// ═══════════════════════════════════════════════════════════════
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
}

// ═══════════════════════════════════════════════
//  BRANDSYSTEM
// ═══════════════════════════════════════════════
function loadBrandSystem(brandSystem) {
  const viewer = document.getElementById('brandsystemViewer');
  viewer.textContent = brandSystem ? JSON.stringify(brandSystem, null, 2) : '暂无品牌系统数据';
}

// ═══════════════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════════════
async function loadComponents(id) {
  try {
    const data = await api('/api/projects/' + id + '/components');
    const list = document.getElementById('componentList');
    const count = document.getElementById('componentCount');

    if (data.components.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px">暂无组件，点击上方新建</div>';
      count.textContent = '0 个组件';
      return;
    }

    count.textContent = data.components.length + ' 个组件';

    list.innerHTML = data.components.map(c => {
      const statusColor = c.status === 'approved' ? 'var(--emerald)' : c.status === 'locked' ? 'var(--coral)' : c.status === 'reviewing' ? 'var(--sunshine)' : 'var(--text-muted)';
      const statusBg = c.status === 'approved' ? 'var(--emerald-bg)' : c.status === 'locked' ? 'var(--coral-bg)' : c.status === 'reviewing' ? 'var(--sunshine-bg)' : 'rgba(255,255,255,0.05)';
      const statusLabel = c.status === 'approved' ? '✓ 已通过' : c.status === 'locked' ? '🔒 已锁定' : c.status === 'reviewing' ? '△ 审核中' : c.status === 'revision-requested' ? '✎ 需修改' : '· ' + c.status;

      return '<div class="info-panel" style="cursor:pointer" onclick="showComponentDetail(\'' + c.type + '\')">' +
        '<div class="panel-label" style="display:flex;align-items:center;justify-content:space-between">' +
          '<span>' + getComponentZhName(c.type, c.name) + ' (' + c.type + ')</span>' +
          '<span style="display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:4px;background:' + statusBg + ';color:' + statusColor + ';font-size:11px;font-weight:600">' + statusLabel + '</span>' +
        '</div>' +
        '<div class="panel-body" style="font-size:12px;color:var(--text-muted)">' +
          'v' + c.currentVersion + ' | ' + c.versions.length + ' 个版本' +
          (c.approvedVersion ? ' | 已通过: v' + c.approvedVersion : '') +
          (c.assetRefs.length > 0 ? ' | ' + c.assetRefs.length + ' 个资源' : '') +
        '</div>' +
      '</div>';
    }).join('');
  } catch (e) {
    document.getElementById('componentList').innerHTML =
      '<div style="text-align:center;padding:24px;color:var(--coral);font-size:13px">加载失败: ' + e.message + '</div>';
  }
}

function showComponentDetail(type) {
  if (!currentProjectId) return;

  showModal('组件详情: ' + type, [
    { text: '关闭', class: 'btn' },
    { text: '新建版本', class: 'btn btn-primary', action: async () => {
      await showCreateComponentVersionModal(type);
    }},
    { text: '驳回', class: 'btn btn-danger', action: async () => {
      await showComponentReviewModal(type);
    }},
  ], async function() {
    try {
      const data = await api('/api/projects/' + currentProjectId + '/components/' + type);
      const c = data.component;
      if (!c) return '<div style="color:var(--coral)">组件不存在</div>';

      let html = '<div class="info-grid" style="grid-template-columns:1fr 1fr 1fr">' +
        '<div class="info-card"><div class="label">状态</div><div class="value" style="font-size:14px">' + c.status + '</div></div>' +
        '<div class="info-card"><div class="label">当前版本</div><div class="value" style="font-size:14px">v' + c.currentVersion + '</div></div>' +
        '<div class="info-card"><div class="label">已通过版本</div><div class="value" style="font-size:14px">' + (c.approvedVersion ? 'v' + c.approvedVersion : '—') + '</div></div>' +
      '</div>';

      if (c.versions && c.versions.length > 0) {
        html += '<div class="version-timeline" style="margin-top:12px">';
        c.versions.slice().reverse().forEach(v => {
          const compat = v.compatibility?.status || '—';
          const compatColor = compat === 'passed' ? 'var(--emerald)' : compat === 'passed-with-warnings' ? 'var(--sunshine)' : 'var(--coral)';
          html += '<div class="version-item ' + (v.version === c.currentVersion ? 'current' : '') + '">' +
            '<div class="v-header">' +
              '<span class="v-num">v' + v.version + '</span>' +
              '<span class="v-status" style="background:' + (v.status === 'approved' ? 'var(--emerald-bg)' : v.status === 'locked' ? 'var(--coral-bg)' : 'rgba(255,255,255,0.05)') + ';color:' + (v.status === 'approved' ? 'var(--emerald)' : v.status === 'locked' ? 'var(--coral)' : 'var(--text-muted)') + '">' + v.status + '</span>' +
              '<span style="color:var(--text-muted);font-size:11px">' + v.changeLog + '</span>' +
            '</div>' +
            '<div class="v-meta">' +
              '<span>' + formatTime(v.createdAt) + '</span>' +
              '<span>' + (v.createdBy === 'user' ? '手动' : 'AI') + '</span>' +
              '<span style="color:' + compatColor + '">兼容: ' + compat + '</span>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';
      } else {
        html += '<div style="color:var(--text-muted);font-size:13px;padding:16px 0">暂无版本记录</div>';
      }

      if (c.review) {
        html += '<div class="constraint-group"><div class="cg-label" style="color:var(--text-secondary)">审核记录</div>' +
          '<div class="constraint-item" style="color:var(--text-secondary)">' +
            '状态: ' + c.review.status + ' | 评分: ' + (c.review.score || '—') + ' | 备注: ' + (c.review.comments?.join(', ') || '—') +
          '</div></div>';
      }

      return html;
    } catch (e) {
      return '<div style="color:var(--coral)">加载失败: ' + e.message + '</div>';
    }
  });
}

function showCreateComponentModal() {
  showModal('新建组件', [
    { text: '取消', class: 'btn' },
    { text: '创建', class: 'btn btn-primary', action: async () => {
      const type = document.getElementById('newCompType').value.trim();
      const name = document.getElementById('newCompName').value.trim();
      if (!type || !name) { highlightFormErrors(['newCompType', 'newCompName']); showToast('请填写完整信息', 'error'); return; }
      await api('/api/projects/' + currentProjectId + '/components', {
        method: 'POST',
        body: JSON.stringify({ type, name }),
      });
      showToast('组件 "' + name + '" 创建成功', 'success');
      hideModal();
      loadComponents(currentProjectId);
    }},
  ], function() {
    return '<div class="form-group"><label>组件类型</label><input type="text" id="newCompType" placeholder="例如: hero-banner" /><div class="error-msg">请输入组件类型</div></div>' +
      '<div class="form-group"><label>组件名称</label><input type="text" id="newCompName" placeholder="例如: 主视觉Banner" /><div class="error-msg">请输入组件名称</div></div>';
  });
}

async function showCreateComponentVersionModal(type) {
  showModal('新建版本: ' + type, [
    { text: '取消', class: 'btn' },
    { text: '创建版本', class: 'btn btn-primary', action: async () => {
      const variant = document.getElementById('newVerVariant').value.trim();
      const instruction = document.getElementById('newVerInstruction').value.trim();
      if (!variant) { highlightFormErrors(['newVerVariant']); showToast('请填写变体名', 'error'); return; }
      await api('/api/projects/' + currentProjectId + '/components/' + type + '/versions', {
        method: 'POST',
        body: JSON.stringify({
          variant,
          variantCss: document.getElementById('newVerCss').value || '',
          instruction: instruction || '新建版本',
          sourceHtml: document.getElementById('newVerSource').value || '',
          publishHtml: '',
        }),
      });
      showToast('版本已创建', 'success');
      hideModal();
      loadComponents(currentProjectId);
    }},
  ], function() {
    return '<div class="form-group"><label>变体名</label><input type="text" id="newVerVariant" placeholder="hero-featured" /><div class="error-msg">请输入变体名</div></div>' +
      '<div class="form-group"><label>修改说明</label><input type="text" id="newVerInstruction" placeholder="优化背景渐变" /></div>' +
      '<div class="form-group"><label>Variant CSS（可选）</label><textarea id="newVerCss" rows="3" placeholder="/* 组件样式 */"></textarea></div>' +
      '<div class="form-group"><label>Source HTML（可选）</label><textarea id="newVerSource" rows="3" placeholder="<div>...</div>"></textarea></div>';
  });
}

async function showComponentReviewModal(type) {
  showModal('驳回组件: ' + type, [
    { text: '取消', class: 'btn' },
    { text: '确认驳回', class: 'btn btn-danger', action: async () => {
      const comments = [document.getElementById('reviewCompComments').value || '需要调整'];
      await api('/api/projects/' + currentProjectId + '/components/' + type + '/review', {
        method: 'POST',
        body: JSON.stringify({ status: 'revision-requested', comments }),
      });
      showToast('组件已驳回，AI 将根据意见重新设计', 'info');
      hideModal();
      loadComponents(currentProjectId);
    }},
  ], function() {
    return '<div class="form-group"><label>驳回意见</label><textarea id="reviewCompComments" rows="4" placeholder="请输入需要调整的具体意见…"></textarea></div>' +
      '<div style="color:var(--text-muted);font-size:12px;line-height:1.6">提示：组件默认已通过，驳回后 AI 将根据您的意见重新设计该组件。</div>';
  });
}

// ═══════════════════════════════════════════════════════════════
//  BLUEPRINT
// ═══════════════════════════════════════════════════════════════
async function loadBlueprint(id) {
  try {
    const data = await api('/api/projects/' + id + '/blueprint');
    const viewer = document.getElementById('blueprintViewer');
    viewer.textContent = data.blueprint ? JSON.stringify(data.blueprint, null, 2) : '暂无设计蓝图数据';
  } catch {
    document.getElementById('blueprintViewer').textContent = '加载失败';
  }
}

// ═══════════════════════════════════════════════════════════════
//  VERSIONS
// ═══════════════════════════════════════════════════════════════
async function loadVersions(id) {
  try {
    const data = await api('/api/projects/' + id + '/versions');
    const timeline = document.getElementById('versionTimeline');
    if (data.versions.length === 0) {
      timeline.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:16px 0">暂无版本记录</div>';
      return;
    }
    timeline.innerHTML = data.versions.map(g =>
      '<div class="version-group">' +
        '<div class="vg-name">' + g.component + '</div>' +
        g.versions.map((v, i) => {
          const isLast = i === g.versions.length - 1;
          const statusClass = v.status === 'locked' ? 'locked' : v.status === 'approved' ? 'approved' : isLast ? 'current' : '';
          const statusLabel = v.status === 'locked' ? '🔒 已锁定' : v.status === 'approved' ? '✓ 已通过' : v.status === 'reviewing' ? '△ 审核中' : '· 草稿';
          const statusColor = v.status === 'locked' ? 'var(--coral)' : v.status === 'approved' ? 'var(--emerald)' : 'var(--text-muted)';
          return '<div class="version-item ' + statusClass + '">' +
            '<div class="v-header">' +
              '<span class="v-num">v' + v.version + '</span>' +
              '<span class="v-status" style="background:' + statusColor.replace(')', '-bg)').replace('var(--coral)', 'rgba(248,113,113,0.1)').replace('var(--emerald)', 'rgba(74,222,128,0.1)').replace('var(--text-muted)', 'rgba(255,255,255,0.05)') + ';color:' + statusColor + '">' + statusLabel + '</span>' +
              '<span style="color:var(--text-muted);font-size:11px">' + v.changeLog + '</span>' +
            '</div>' +
            '<div class="v-meta"><span>' + formatTime(v.createdAt) + '</span><span>' + (v.createdBy === 'user' ? '手动' : 'AI') + '</span></div>' +
          '</div>';
        }).join('') +
      '</div>'
    ).join('');
  } catch {
    document.getElementById('versionTimeline').innerHTML = '<div style="color:var(--coral);font-size:13px">加载失败</div>';
  }
}

// ═══════════════════════════════════════════════════════════════
//  REVIEWS
// ═══════════════════════════════════════════════════════════════
function loadReviews(project) {
  const list = document.getElementById('reviewList');
  if (!project.reviewRecords || project.reviewRecords.length === 0) {
    list.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px 0">暂无审核记录</div>';
    return;
  }
  list.innerHTML = project.reviewRecords.map(r => {
    const statusIcon = r.status === 'approved' ? '✓' : r.status === 'rejected' ? '✗' : '△';
    const statusColor = r.status === 'approved' ? 'var(--emerald)' : r.status === 'rejected' ? 'var(--coral)' : 'var(--sunshine)';
    const statusBg = r.status === 'approved' ? 'var(--emerald-bg)' : r.status === 'rejected' ? 'var(--coral-bg)' : 'var(--sunshine-bg)';
    return '<div class="review-item">' +
      '<div class="r-info">' +
        '<span class="r-stage">' + r.stage + '</span> ' +
        '<span style="display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:4px;background:' + statusBg + ';color:' + statusColor + ';font-size:11px;font-weight:600">' + statusIcon + ' ' + r.status + '</span>' +
        '<div class="r-date">' + formatTime(r.createdAt) + (r.score ? ' · 评分: ' + r.score : '') + (r.feedback ? ' · ' + r.feedback : '') + '</div>' +
      '</div>' +
      '<div class="r-actions">' +
        (r.status === 'pending'
          ? '<button class="btn btn-danger btn-xs" onclick="showRejectModal(\'' + r.stage + '\')">驳回</button>'
          : '') +
      '</div>' +
    '</div>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  REVIEW ACTIONS
// ═══════════════════════════════════════════════════════════════
async function submitForReview(stage) {
  if (!currentProjectId) return;
  try {
    await api('/api/projects/' + currentProjectId + '/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'submit', stage }),
    });
    showToast('已提交 ' + stage + ' 审核', 'success');
    loadProjectDetail(currentProjectId);
  } catch (e) {
    showToast('提交失败: ' + e.message, 'error');
  }
}

function showRejectModal(stage) {
  showModal('驳回审核', [
    { text: '取消', class: 'btn' },
    { text: '驳回', class: 'btn btn-danger', action: async () => {
      const feedback = document.getElementById('rejectFeedback').value || '需要调整';
      await api('/api/projects/' + currentProjectId + '/review', {
        method: 'POST',
        body: JSON.stringify({ action: 'reject', stage, feedback }),
      });
      showToast(stage + ' 已驳回', 'info');
      hideModal();
      loadProjectDetail(currentProjectId);
    }},
  ], function() {
    return '<div class="form-group">' +
      '<label>驳回原因</label>' +
      '<textarea id="rejectFeedback" rows="3" placeholder="描述需要调整的方向…">需要调整设计方向</textarea>' +
    '</div>';
  });
}

// ═══════════════════════════════════════════════════════════════
//  DOWNLOAD THEME
// ═══════════════════════════════════════════════════════════════
function downloadTheme() {
  if (!currentProjectId) return;
  const link = document.createElement('a');
  link.href = '/api/projects/' + currentProjectId + '/download';
  link.download = '';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('正在下载主题包…', 'info');
}

// ═══════════════════════════════════════════════════════════════
//  REFRESH
// ═══════════════════════════════════════════════════════════════
async function refreshProject() {
  if (currentProjectId) {
    await loadProjectDetail(currentProjectId);
    showToast('已刷新', 'info');
  }
}

// ═══════════════════════════════════════════════════════════════
//  NEW PROJECT MODAL
// ═══════════════════════════════════════════════════════════════
function showNewProjectModal() {
  showModal('新建项目', [
    { text: '取消', class: 'btn' },
    { text: '创建项目', class: 'btn btn-primary', action: async () => {
      const name = document.getElementById('newProjectName').value.trim();
      const type = document.getElementById('newProjectType').value;

      if (!name) { highlightFormErrors(['newProjectName']); showToast('请输入项目名称', 'error'); return; }

      const profile = { name };
      const createResult = await api('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name, profileType: type, profile }),
      });
      const projectId = createResult.project?.id || name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-');
      showToast('项目 "' + name + '" 创建成功', 'success');
      hideModal();
      loadProjects();
      selectProject(projectId);
    }},
  ], function() {
    return '<div class="form-group">' +
      '<label>项目名称</label>' +
      '<input type="text" id="newProjectName" placeholder="例如: 云帆科技" />' +
      '<div class="error-msg">请输入项目名称</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>项目类型</label>' +
      '<select id="newProjectType">' +
        '<option value="brand">🏢 品牌项目（企业/产品公众号，专业商务风）</option>' +
        '<option value="creator">✍️ 创作者项目（个人/自媒体，个性表达风）</option>' +
      '</select>' +
    '</div>';
  });
}

// ═══════════════════════════════════════════════════════════════
//  ROLLBACK MODAL
// ═══════════════════════════════════════════════════════════════
function showRollbackModal() {
  if (!currentProjectId) return;
  showModal('回退版本', [
    { text: '取消', class: 'btn' },
    { text: '执行回退', class: 'btn btn-danger', action: async () => {
      const component = document.getElementById('rollbackComponent').value.trim();
      const version = parseInt(document.getElementById('rollbackVersion').value);
      const reason = document.getElementById('rollbackReason').value.trim() || '用户要求恢复旧版本';

      if (!component || !version) { highlightFormErrors(['rollbackComponent', 'rollbackVersion']); showToast('请填写完整信息', 'error'); return; }

      await api('/api/projects/' + currentProjectId + '/versions/rollback', {
        method: 'POST',
        body: JSON.stringify({ component, version, reason }),
      });
      showToast('已回退到 v' + version, 'success');
      hideModal();
      loadVersions(currentProjectId);
    }},
  ], function() {
    return '<div class="form-group">' +
      '<label>组件名</label>' +
      '<input type="text" id="rollbackComponent" placeholder="例如: hero-banner" />' +
      '<div class="error-msg">请输入组件名</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>目标版本号</label>' +
      '<input type="number" id="rollbackVersion" min="1" placeholder="1" />' +
      '<div class="error-msg">请输入版本号</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>回退原因</label>' +
      '<input type="text" id="rollbackReason" value="用户要求恢复旧版本" />' +
    '</div>';
  });
}

// ═══════════════════════════════════════════════════════════════
//  MODAL
//  ═══════════════════════════════════════════════════════════════
//  showModal(title, buttons, bodyFn)
//    title   — string
//    buttons — array of { text, class, action }
//    bodyFn  — function returning HTML string
// ═══════════════════════════════════════════════════════════════
function showModal(title, buttons, bodyFn) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = typeof bodyFn === 'function' ? bodyFn() : bodyFn;
  const actionsDiv = document.getElementById('modalActions');
  actionsDiv.innerHTML = '';
  buttons.forEach((b, idx) => {
    const btn = document.createElement('button');
    btn.className = b.class || 'btn';
    btn.textContent = b.text || '';
    if (b.action) {
      btn.addEventListener('click', b.action);
    } else {
      btn.addEventListener('click', hideModal);
    }
    actionsDiv.appendChild(btn);
  });
  document.getElementById('modalOverlay').classList.add('visible');
}

function hideModal() {
  document.getElementById('modalOverlay').classList.remove('visible');
}

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
function showToast(msg, type) {
  type = type || 'info';
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  const icons = { success: '✓', error: '✗', info: 'i' };
  toast.innerHTML = '<span style="font-weight:700;font-family:var(--font-mono)">' + (icons[type] || '') + '</span> ' + msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ═══════════════════════════════════════════════════════════════
//  UTILITY
// ═══════════════════════════════════════════════════════════════
function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ── 表单验证错误高亮 ──
function highlightFormErrors(fieldIds) {
  document.querySelectorAll('.form-group.has-error').forEach(el => el.classList.remove('has-error'));
  let first = null;
  fieldIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const g = el.closest('.form-group');
      if (g) g.classList.add('has-error');
      if (!first) { first = el; el.focus(); }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
//  THREE-COLUMN REVIEW WORKBENCH
// ═══════════════════════════════════════════════════════════════

let wbActive = false;
let wbSelectedType = null;
let wbComponents = [];
let wbCurrentVersionData = null;

// ── Toggle between tab view and review workbench ──
function toggleWorkbench() {
  wbActive = !wbActive;
  const layout = document.querySelector('.main-layout');
  const wb = document.getElementById('reviewWorkbench');
  const btn = document.getElementById('wbToggleBtn');
  const hint = document.getElementById('wbHint');

  if (wbActive) {
    layout.style.display = 'none';
    wb.classList.add('active');
    btn.textContent = '✕ 关闭工作台';
    btn.classList.add('btn-primary');
    if (hint) hint.style.display = 'none';
    // 更新顶部栏项目名
    if (currentProject) {
      document.getElementById('wbTopbarProject').textContent = currentProject.name;
    }
    wbLoadComponents();
  } else {
    layout.style.display = 'grid';
    wb.classList.remove('active');
    btn.textContent = '⊞ 审核工作台';
    btn.classList.remove('btn-primary');
    if (hint) hint.style.display = 'none';
  }
}

// 审核工作台按钮 hover 提示
document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('wbToggleBtn');
  const hint = document.getElementById('wbHint');
  if (btn && hint) {
    btn.addEventListener('mouseenter', function() { if (!wbActive) hint.style.display = 'inline'; });
    btn.addEventListener('mouseleave', function() { hint.style.display = 'none'; });
  }
});

// ── 组件中文名映射 ──
const COMPONENT_ZH_NAMES = {
  "hero-banner": "顶部横幅",
  "toc-nav": "目录导航",
  "numbered-heading": "编号标题",
  "section-title": "小节标题",
  "quote-card": "引用卡片",
  "callout-pro": "高级提示框",
  "stats-block": "数据统计",
  "faq": "常见问题",
  "share-card": "分享卡片",
  "cta-card": "行动号召",
  "tag-label": "标签组",
  "follow-bar": "关注引导",
  "divider-fancy": "装饰分割线",
  "styled-table": "美化表格",
  "timeline": "时间线",
  "code-frame": "代码框",
  "article-section": "文章段落",
  "magazine-cover": "杂志封面",
  "section-divider": "章节分隔",
  "image-card": "图片卡片",
  "text-card": "正文卡片",
  "full-quote": "整行引用",
  "two-column-cards": "双栏卡片",
  "end-card": "结尾致谢",
  "product-card": "产品卡片",
  "brand-sign": "品牌签名",
  "resource-list": "资料清单",
  "testimonial-card": "推荐引用",
  "series-nav": "系列导航",
  "code-block": "代码块",
  "image-compare": "图片对比",
  "callout": "提示框",
  "table": "表格",
  "accordion": "折叠面板",
  "steps": "步骤指南",
  "divider": "分割线",
  "pullquote": "突出引用",
  "related-posts": "相关文章",
  "image-grid": "图片网格",
  "author-card": "作者卡片",
  "copyright-notice": "版权声明",
  "qr-card": "二维码卡片",
  "image-text-row": "图文混排",
  "image-caption": "图片说明",
};
function getComponentZhName(type, fallback) {
  return COMPONENT_ZH_NAMES[type] || fallback;
}

// ── CSS 选择器匹配检查 ──
// 检查组件 variant CSS 中的选择器是否在预览 HTML 中有匹配元素
function checkCssSelectorMatch() {
  const styleTag = document.getElementById('wbPreviewStyle');
  if (!styleTag || !styleTag.textContent) {
    return { total: 0, matched: 0, unmatched: 0, rules: [] };
  }

  const css = styleTag.textContent;
  // 提取 CSS 规则块，支持多行
  const ruleRegex = /([^{]+)\{([^}]*)\}/g;
  const rules = [];
  let match;
  while ((match = ruleRegex.exec(css)) !== null) {
    const rawSelectors = match[1].trim();
    const declarations = match[2].trim();
    if (!rawSelectors || !declarations) continue;

    // 分割逗号分隔的多个选择器
    const selectors = rawSelectors.split(',').map(s => s.trim()).filter(Boolean);
    for (const sel of selectors) {
      try {
        const elements = document.querySelectorAll(sel);
        rules.push({
          selector: sel,
          matched: elements.length > 0,
          count: elements.length,
          declarations: declarations.replace(/\s+/g, ' ').slice(0, 60),
        });
      } catch (e) {
        // 选择器语法错误（如含伪元素），跳过但记录
        rules.push({
          selector: sel,
          matched: false,
          count: 0,
          declarations: '(选择器语法异常)',
          error: true,
        });
      }
    }
  }

  const matched = rules.filter(r => r.matched).length;
  const unmatched = rules.filter(r => !r.matched).length;
  return { total: rules.length, matched, unmatched, rules };
}

function updateCssMatchStatus() {
  const result = checkCssSelectorMatch();
  const statusEl = document.getElementById('wbRenderStatus');
  const matchCount = document.getElementById('rcMatchCount');
  const unmatchCount = document.getElementById('rcUnmatchCount');
  const rulesEl = document.getElementById('wbRenderRules');

  if (result.total === 0) {
    statusEl.textContent = '无 CSS 规则';
    statusEl.className = 'wb-rc-status';
    matchCount.textContent = '0 个匹配';
    unmatchCount.textContent = '0 个未匹配';
    rulesEl.innerHTML = '<div style="color:var(--text-muted);font-size:11px;padding:4px 0">暂无 CSS 规则可检查</div>';
    return;
  }

  if (result.unmatched === 0) {
    statusEl.textContent = '✓ 全部匹配';
    statusEl.className = 'wb-rc-status pass';
  } else if (result.matched === 0) {
    statusEl.textContent = '✗ 全部未匹配';
    statusEl.className = 'wb-rc-status fail';
  } else {
    statusEl.textContent = '⚠ 部分未匹配';
    statusEl.className = 'wb-rc-status warn';
  }

  matchCount.textContent = `${result.matched} 个匹配`;
  unmatchCount.textContent = `${result.unmatched} 个未匹配`;

  rulesEl.innerHTML = result.rules.map(r => {
    const cls = r.matched ? 'match' : 'unmatch';
    const countText = r.matched ? `(${r.count} 元素)` : '(无匹配)';
    return `<div class="wb-rc-rule ${cls}">
      <span class="rc-dot"></span>
      <span class="rc-sel">${r.selector}</span>
      <span class="rc-count">${countText}</span>
    </div>`;
  }).join('');
}

// ── Load components into workbench sidebar ──
async function wbLoadComponents() {
  if (!currentProjectId) return;
  try {
    const data = await api('/api/projects/' + currentProjectId + '/components');
    wbComponents = data.components || [];
    const list = document.getElementById('wbCompList');
    const count = document.getElementById('wbCompCount');

    if (wbComponents.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:12px">暂无组件</div>';
      count.textContent = '0';
      return;
    }

    count.textContent = wbComponents.length;

    // Sort: approved first, then reviewing, then draft
    const sortOrder = { approved: 0, locked: 1, reviewing: 2, 'revision-requested': 3, draft: 4, 'not-generated': 5 };
    wbComponents.sort((a, b) => (sortOrder[a.status] || 99) - (sortOrder[b.status] || 99));

    list.innerHTML = wbComponents.map(c => {
      const indicatorClass = c.status === 'approved' ? 'approved' : c.status === 'locked' ? 'locked' : c.status === 'reviewing' ? 'reviewing' : c.status === 'revision-requested' ? 'revision-requested' : 'draft';
      const statusClass = indicatorClass;
      const statusLabel = c.status === 'approved' ? '已通过' : c.status === 'locked' ? '已锁定' : c.status === 'reviewing' ? '审核中' : c.status === 'revision-requested' ? '需修改' : '草稿';
      const active = c.type === wbSelectedType ? 'active' : '';

      return `<div class="wb-comp-item ${active}" onclick="wbSelectComponent('${c.type}')">
        <div class="wb-comp-indicator ${indicatorClass}"></div>
        <div class="wb-comp-info">
          <div class="wb-comp-name">${getComponentZhName(c.type, c.name)}</div>
          <div class="wb-comp-meta">
            <span>v${c.currentVersion}</span>
            <span>${c.versions.length} 版本</span>
          </div>
        </div>
        <span class="wb-comp-status ${statusClass}">${statusLabel}</span>
      </div>`;
    }).join('');

    // Auto-select first if none selected
    if (!wbSelectedType && wbComponents.length > 0) {
      wbSelectComponent(wbComponents[0].type);
    }
  } catch (e) {
    document.getElementById('wbCompList').innerHTML =
      '<div style="text-align:center;padding:24px;color:var(--coral);font-size:12px">加载失败: ' + e.message + '</div>';
  }
}

// ── Select a component and show preview ──
async function wbSelectComponent(type) {
  wbSelectedType = type;
  wbLoadComponents(); // refresh active state

  // Show preview
  document.getElementById('wbPreviewEmpty').style.display = 'none';
  document.getElementById('wbPreviewContent').style.display = 'block';

  try {
    const data = await api('/api/projects/' + currentProjectId + '/components/' + type);
    const comp = data.component;
    if (!comp) return;

    const latestVersion = comp.versions[comp.versions.length - 1];
    if (!latestVersion) {
      document.getElementById('wbPhonePreview').innerHTML = '<p style="color:var(--text-muted)">暂无版本数据</p>';
      return;
    }
    wbCurrentVersionData = latestVersion;
    wbResetEditMode();

    // Title
    document.getElementById('wbPreviewTitle').textContent = comp.name;
    document.getElementById('wbPreviewVariant').textContent = latestVersion.variant;

    // Phone preview — #wemd 容器已在 HTML 中静态定义，这里只填充内容
    let previewHtml = '';
    if (latestVersion.sourceHtml) {
      previewHtml = latestVersion.sourceHtml;
    } else {
      // 无 sourceHtml 时，根据组件类型生成演示 HTML
      previewHtml = generateDemoHtml(comp.type, latestVersion.variant);
    }

    // Apply variant CSS to the preview
    const phoneInner = document.getElementById('wbPhonePreview');
    phoneInner.innerHTML = previewHtml;
    // Inject variant CSS — 注入到 #wemd 容器内，确保作用域一致
    let styleTag = document.getElementById('wbPreviewStyle');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'wbPreviewStyle';
      // 挂载到 phone-frame 内部，与 #wemd 同级
      phoneInner.closest('.wb-phone-frame').appendChild(styleTag);
    }
    styleTag.textContent = latestVersion.variantCss || '';

    // 检查 CSS 选择器匹配
    updateCssMatchStatus();

    // Version selector
    const select = document.getElementById('wbVersionSelect');
    select.innerHTML = comp.versions.map((v, i) =>
      '<option value="' + i + '" ' + (i === comp.versions.length - 1 ? 'selected' : '') + '>' +
      'v' + v.version + ' — ' + v.status + (v.status === 'approved' ? ' ✓' : '') +
      '</option>'
    ).join('');

    // Version info
    wbUpdateVersionInfo(latestVersion);

    // Version history
    const history = document.getElementById('wbVersionHistory');
    history.innerHTML = comp.versions.slice().reverse().map(v => {
      const statusIcon = v.status === 'approved' ? '✓' : v.status === 'locked' ? '🔒' : v.status === 'reviewing' ? '△' : '·';
      const statusColor = v.status === 'approved' ? 'var(--emerald)' : v.status === 'locked' ? 'var(--coral)' : 'var(--text-muted)';
      return '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04)">' +
        '<span style="color:' + statusColor + ';font-weight:600">' + statusIcon + ' v' + v.version + '</span>' +
        '<span style="flex:1;color:var(--text-secondary)">' + (v.changeLog || v.instruction || '—') + '</span>' +
        '<span style="font-size:10px">' + formatTime(v.createdAt) + '</span>' +
      '</div>';
    }).join('');

  } catch (e) {
    document.getElementById('wbPhonePreview').innerHTML = '<p style="color:var(--coral)">加载失败: ' + e.message + '</p>';
  }
}

// ── Update version info panel ──
function wbUpdateVersionInfo(version) {
  const elCurrent = document.getElementById('wbVerCurrent');
  const elAuthor = document.getElementById('wbVerAuthor');
  const elChangeLog = document.getElementById('wbVerChangeLog');
  if (elCurrent) elCurrent.textContent = 'v' + version.version;
  if (elAuthor) elAuthor.textContent = version.createdBy === 'user' ? '手动' : 'AI';
  if (elChangeLog) elChangeLog.textContent = version.changeLog || version.instruction || '—';
}

// ── Switch version from selector ──
async function wbSwitchVersion() {
  const select = document.getElementById('wbVersionSelect');
  const idx = parseInt(select.value);
  if (isNaN(idx)) return;

  try {
    const data = await api('/api/projects/' + currentProjectId + '/components/' + wbSelectedType);
    const comp = data.component;
    if (!comp || !comp.versions[idx]) return;

    const version = comp.versions[idx];
    wbCurrentVersionData = version;
    wbResetEditMode();
    wbUpdateVersionInfo(version);

    // Update preview — #wemd 容器已在 HTML 中静态定义，这里只填充内容
    const phoneInner = document.getElementById('wbPhonePreview');
    if (version.sourceHtml) {
      phoneInner.innerHTML = version.sourceHtml;
    } else {
      // 无 sourceHtml 时，根据组件类型生成演示 HTML
      phoneInner.innerHTML = generateDemoHtml(wbSelectedType, version.variant);
    }
    let styleTag = document.getElementById('wbPreviewStyle');
    if (styleTag) {
      styleTag.textContent = version.variantCss || '';
    }

    // 检查 CSS 选择器匹配
    updateCssMatchStatus();
  } catch (e) {
    showToast('切换版本失败: ' + e.message, 'error');
  }
}

// ── Reject component（驳回后自动触发 AI 重生） ──
async function wbReject() {
  if (!currentProjectId || !wbSelectedType) return;
  const comment = document.getElementById('wbReviewComment').value.trim() || '需要调整设计方向';
  const rejectBtn = event?.target;
  if (rejectBtn) {
    rejectBtn.disabled = true;
    rejectBtn.textContent = 'AI 重生中…';
  }
  try {
    const result = await api('/api/projects/' + currentProjectId + '/components/' + wbSelectedType + '/review', {
      method: 'POST',
      body: JSON.stringify({ status: 'revision-requested', comments: [comment] }),
    });

    if (result.regeneratedVersion) {
      showToast('已驳回，AI 已基于原方案生成新版本 v' + result.regeneratedVersion.version, 'success');
    } else if (result.warning) {
      showToast('已驳回，但 ' + result.warning, 'info');
    } else {
      showToast('组件 ' + wbSelectedType + ' 已驳回', 'info');
    }

    document.getElementById('wbReviewComment').value = '';
    wbLoadComponents();
    // 重新选中该组件，显示重生后的新版本
    wbSelectComponent(wbSelectedType);
  } catch (e) {
    showToast('驳回失败: ' + e.message, 'error');
  } finally {
    if (rejectBtn) {
      rejectBtn.disabled = false;
      rejectBtn.textContent = '✗ 驳回';
    }
  }
}

// ── Lock component ──
async function wbLock() {
  if (!currentProjectId || !wbSelectedType) return;
  try {
    await api('/api/projects/' + currentProjectId + '/components/' + wbSelectedType + '/review', {
      method: 'POST',
      body: JSON.stringify({ status: 'locked', comments: ['组件已锁定'] }),
    });
    showToast('组件 ' + wbSelectedType + ' 已锁定', 'success');
    wbLoadComponents();
  } catch (e) {
    showToast('锁定失败: ' + e.message, 'error');
  }
}

// ── 源码编辑模式 ──
let wbEditing = false;
let wbOriginalCss = '';

// 重置到查看模式，填充当前版本 CSS 到编辑器
function wbResetEditMode() {
  wbEditing = false;
  const editor = document.getElementById('wbSourceEditor');
  const css = wbCurrentVersionData?.variantCss || '';
  wbOriginalCss = css;
  editor.value = css;
  editor.readOnly = true;
  editor.classList.remove('dirty');

  // 按钮状态
  document.getElementById('wbEditToggleBtn').style.display = '';
  document.getElementById('wbRevertBtn').style.display = 'none';
  document.getElementById('wbSaveBtn').style.display = 'none';
  document.getElementById('wbChangelogInput').style.display = 'none';
  document.getElementById('wbChangelogInput').value = '';
  document.getElementById('wbEditHint').textContent = '点击「修改」编辑源码，预览实时更新；改错可点「恢复」放弃修改';
}

// 切换到编辑模式
function wbToggleEditMode() {
  if (!wbCurrentVersionData) { showToast('请先选择组件', 'error'); return; }
  wbEditing = true;
  const editor = document.getElementById('wbSourceEditor');
  editor.readOnly = false;
  editor.focus();
  editor.classList.remove('dirty');

  document.getElementById('wbEditToggleBtn').style.display = 'none';
  document.getElementById('wbRevertBtn').style.display = '';
  document.getElementById('wbSaveBtn').style.display = '';
  document.getElementById('wbChangelogInput').style.display = '';
  document.getElementById('wbEditHint').textContent = '编辑中：预览实时更新。填写修改说明后点「保存新版本」，改错点「恢复」';
}

// 编辑时实时更新预览 + 标记 dirty
function wbOnSourceEdit() {
  if (!wbEditing) return;
  const editor = document.getElementById('wbSourceEditor');
  const css = editor.value;
  // 实时更新预览样式（直接注入编辑器中的原始 CSS）
  let styleTag = document.getElementById('wbPreviewStyle');
  if (styleTag) {
    styleTag.textContent = css;
  }
  // dirty 标记
  if (css !== wbOriginalCss) {
    editor.classList.add('dirty');
  } else {
    editor.classList.remove('dirty');
  }
}

// 恢复到原版本（放弃修改）
function wbRevertEdit() {
  if (!confirm('放弃当前修改，恢复到原版本？')) return;
  wbResetEditMode();
  // 恢复预览
  let styleTag = document.getElementById('wbPreviewStyle');
  if (styleTag) {
    styleTag.textContent = wbOriginalCss;
  }
  updateCssMatchStatus();
  showToast('已恢复到原版本', 'info');
}

// 保存新版本（从内联输入框取修改说明）
async function wbSaveEdit() {
  if (!currentProjectId || !wbSelectedType || !wbCurrentVersionData) return;
  const editor = document.getElementById('wbSourceEditor');
  const newCss = editor.value;

  if (newCss === wbOriginalCss) {
    showToast('内容未修改，无需保存', 'info');
    return;
  }

  const changeLog = document.getElementById('wbChangelogInput').value.trim();
  if (!changeLog) {
    showToast('请填写修改说明', 'error');
    document.getElementById('wbChangelogInput').focus();
    return;
  }

  const saveBtn = document.getElementById('wbSaveBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中…';
  }

  try {
    await api('/api/projects/' + currentProjectId + '/components/' + wbSelectedType + '/versions', {
      method: 'POST',
      body: JSON.stringify({
        variant: wbCurrentVersionData.variant,
        variantCss: newCss,
        instruction: changeLog,
        sourceHtml: wbCurrentVersionData.sourceHtml || '',
        publishHtml: '',
      }),
    });
    showToast('新版本已创建', 'success');
    wbLoadComponents();
    wbSelectComponent(wbSelectedType);
  } catch (e) {
    showToast('保存失败: ' + e.message, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 保存新版本';
    }
  }
}

// ── 切换主题样式显示（开/关） ──
let wbStyleEnabled = true;
function wbTogglePreviewStyle() {
  wbStyleEnabled = !wbStyleEnabled;
  const styleTag = document.getElementById('wbPreviewStyle');
  if (styleTag) {
    styleTag.disabled = !wbStyleEnabled;
  }
  const btn = document.getElementById('wbStyleToggle');
  if (btn) {
    btn.textContent = wbStyleEnabled ? '🎨 渲染开' : '📄 渲染关';
    btn.style.borderColor = wbStyleEnabled ? 'var(--periwinkle)' : 'var(--text-muted)';
    btn.style.color = wbStyleEnabled ? 'var(--periwinkle)' : 'var(--text-muted)';
  }
  // 切换后重新检查 CSS 匹配
  updateCssMatchStatus();
  showToast(wbStyleEnabled ? '渲染样式已启用' : '渲染样式已禁用，显示原始 HTML', 'info');
}

// ── Compare versions: CSS 行级 diff ──
async function wbCompareVersions() {
  if (!currentProjectId || !wbSelectedType) return;
  const modal = document.getElementById('wbCompareModal');
  modal.classList.add('visible');

  try {
    const data = await api('/api/projects/' + currentProjectId + '/components/' + wbSelectedType);
    const comp = data.component;
    if (!comp || comp.versions.length < 2) {
      document.getElementById('wbCompareBody').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">需要至少 2 个版本才能对比</div>';
      return;
    }

    const versions = comp.versions;
    const latest = versions[versions.length - 1];
    const prev = versions[versions.length - 2];

    // 版本选择器：允许用户选择对比的两个版本
    let versionOptions = versions.map(v => 'v' + v.version).join(' / ');

    // 计算行级 diff
    const oldLines = (prev?.variantCss || '').split('\n');
    const newLines = (latest?.variantCss || '').split('\n');
    const diffLines = computeLineDiff(oldLines, newLines);

    let html = '<div style="margin-bottom:12px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
      '<span class="cc-label">对比: v' + prev.version + ' → v' + latest.version + '</span>' +
      '<span style="font-size:11px;color:var(--text-muted)">' + versionOptions + '</span>' +
      '<div style="margin-left:auto;display:flex;gap:12px;font-size:11px">' +
        '<span><span class="diff-added">■</span> 新增</span>' +
        '<span><span class="diff-removed">■</span> 删除</span>' +
        '<span><span class="diff-unchanged">■</span> 不变</span>' +
      '</div>' +
    '</div>';

    // 版本元信息摘要
    html += '<div class="wb-compare-grid" style="margin-bottom:16px">' +
      '<div class="wb-compare-col">' +
        '<div class="cc-label">v' + prev.version + '（上一版）</div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">' +
          '<div>修改: ' + escapeHtml(prev.changeLog || prev.instruction || '—') + '</div>' +
          '<div>创建者: ' + (prev.createdBy === 'user' ? '手动' : 'AI') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="wb-compare-col">' +
        '<div class="cc-label">v' + latest.version + '（当前）</div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">' +
          '<div>修改: ' + escapeHtml(latest.changeLog || latest.instruction || '—') + '</div>' +
          '<div>创建者: ' + (latest.createdBy === 'user' ? '手动' : 'AI') + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    // CSS 行级 diff
    html += '<div class="cc-label" style="margin-bottom:8px">CSS 源码差异</div>';
    html += '<pre style="background:var(--bg-card);padding:12px;border-radius:8px;font-size:12px;max-height:500px;overflow:auto;font-family:var(--font-mono);line-height:1.6;border:1px solid var(--border)">';

    for (const dl of diffLines) {
      const escaped = escapeHtml(dl.text);
      if (dl.type === 'added') {
        html += '<div class="diff-added" style="background:rgba(52,211,153,0.1);padding:1px 8px;border-left:3px solid var(--emerald);margin-left:-3px">+ ' + escaped + '</div>';
      } else if (dl.type === 'removed') {
        html += '<div class="diff-removed" style="background:rgba(255,138,128,0.1);padding:1px 8px;border-left:3px solid var(--coral);margin-left:-3px">- ' + escaped + '</div>';
      } else {
        html += '<div class="diff-unchanged" style="padding:1px 8px;color:var(--text-muted)">&nbsp;&nbsp;' + escaped + '</div>';
      }
    }

    html += '</pre>';

    document.getElementById('wbCompareBody').innerHTML = html;
  } catch (e) {
    document.getElementById('wbCompareBody').innerHTML = '<div style="color:var(--coral)">加载失败: ' + e.message + '</div>';
  }
}

// ── 简易 LCS 行级 diff 算法 ──
function computeLineDiff(oldLines, newLines) {
  const m = oldLines.length;
  const n = newLines.length;
  // LCS 表
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  // 回溯生成 diff
  const result = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'unchanged', text: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', text: newLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', text: oldLines[i - 1] });
      i--;
    }
  }
  return result;
}

// ── HTML 转义 ──
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wbCloseCompare() {
  document.getElementById('wbCompareModal').classList.remove('visible');
}

// ═══════════════════════════════════════════════════════════════
//  ARTICLES
// ═══════════════════════════════════════════════════════════════

let currentArticleSource = null;

// ── 打开 Markdown 预览模态框 ──
function showArticleImportModal() {
  const prevContent = currentArticleSource?.content || '';
  const prevTitle = currentArticleSource?.title || '';

  showModal('预览 Markdown 主题效果', [
    { text: '取消', class: 'btn' },
    { text: '预览效果', class: 'btn btn-primary', action: async () => {
      const content = document.getElementById('articleContent').value.trim();
      const title = document.getElementById('articleTitle').value.trim();
      if (!content) { highlightFormErrors(['articleContent']); showToast('请粘贴 Markdown 内容', 'error'); return; }
      currentArticleSource = { content, title };
      hideModal();
      await previewArticle(content, title);
    }},
  ], function() {
    return '<div class="form-group"><label>文章标题（可选）</label><input type="text" id="articleTitle" value="' + escapeAttr(prevTitle) + '" placeholder="文章标题" /></div>' +
      '<div class="form-group"><label>Markdown 内容</label>' +
      '<textarea id="articleContent" rows="10" placeholder="粘贴 Markdown 内容…" style="font-family:var(--font-mono);font-size:12px">' + escapeHtml(prevContent) + '</textarea>' +
      '<div class="error-msg">请粘贴 Markdown 内容</div></div>';
  });
}

// ── 预览文章（调用后端：Markdown → 主题化 HTML + 主题 CSS） ──
async function previewArticle(content, title) {
  try {
    const data = await api('/api/projects/' + currentProjectId + '/articles/preview', {
      method: 'POST',
      body: JSON.stringify({ content, title }),
    });
    showArticlePreview(data);
  } catch (e) {
    showToast('预览失败: ' + e.message, 'error');
  }
}

// ── 保存当前文章（套用品牌组件） ──
async function saveCurrentArticle() {
  if (!currentArticleSource) { showToast('请先预览 Markdown', 'error'); return; }
  const { content, title } = currentArticleSource;
  try {
    const data = await api('/api/projects/' + currentProjectId + '/articles/apply', {
      method: 'POST',
      body: JSON.stringify({ content, title }),
    });
    showToast('文章 "' + data.title + '" 已保存', 'success');
    loadArticles(currentProjectId);
  } catch (e) {
    showToast('保存失败: ' + e.message, 'error');
  }
}

// ── Load articles ──
async function loadArticles(id) {
  try {
    const data = await api('/api/projects/' + id + '/articles');
    const list = document.getElementById('articleList');

    if (data.articles.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px">暂无文章，点击上方导入</div>';
      return;
    }

    list.innerHTML = data.articles.map(a => {
      const meta = a.metadata || {};
      return '<div class="info-panel" style="cursor:pointer" onclick="loadArticlePreview(\'' + a.id + '\')">' +
        '<div class="panel-label">' + a.title + '</div>' +
        '<div class="panel-body" style="font-size:12px;color:var(--text-muted)">' +
          meta.wordCount + ' 字 · ' + meta.estimatedReadTime + ' 分钟 · 创建于 ' + formatTime(a.createdAt) +
        '</div>' +
      '</div>';
    }).join('');
  } catch (e) {
    document.getElementById('articleList').innerHTML = '<div style="color:var(--coral);font-size:13px">加载失败: ' + e.message + '</div>';
  }
}

// ── Load article preview ──
async function loadArticlePreview(articleId) {
  try {
    const data = await api('/api/projects/' + currentProjectId + '/articles/' + articleId);
    showArticlePreview(data);
  } catch (e) {
    showToast('加载失败: ' + e.message, 'error');
  }
}

// ── Show article preview (theme-styled) ──
function showArticlePreview(data) {
  const preview = document.getElementById('articlePreview');
  preview.style.display = 'block';

  document.getElementById('articleMeta').textContent =
    data.metadata.wordCount + ' 字 · ' + data.metadata.estimatedReadTime + ' 分钟阅读' +
    (data.metadata.hasImages ? ' · 📷' : '') +
    (data.metadata.hasQuotes ? ' · 💬' : '') +
    (data.metadata.hasLists ? ' · 📋' : '') +
    (data.metadata.hasCode ? ' · 💻' : '');

  // 渲染主题化预览：包一层 #wemd 容器，注入主题组件 CSS
  const contentEl = document.getElementById('articlePreviewContent');
  contentEl.innerHTML = '<div id="wemd">' + data.html + '</div>';

  let styleTag = document.getElementById('articleThemeStyle');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'articleThemeStyle';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = data.themeCss || '';

  document.getElementById('articleMapping').innerHTML =
    '<div style="display:flex;flex-wrap:wrap;gap:4px">' +
    (data.mapping || []).map(m =>
      '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;font-size:11px">' +
      '<span style="color:var(--amber);font-weight:600">' + m.block.type + '</span>' +
      '<span style="color:var(--text-muted)">→</span>' +
      '<span style="color:var(--text-secondary)">' + m.component + '</span>' +
      '</span>'
    ).join('') +
    '</div>';

  // 切换到文章标签
  switchTab('articles');
}

// ═══════════════════════════════════════════════════════════════
//  DEMO HTML GENERATOR（前端 fallback，用于无 sourceHtml 时）
// ═══════════════════════════════════════════════════════════════
function generateDemoHtml(componentType, variant) {
  const htmlMap = {
    "hero-banner": `<section class="wemd-hero-banner" data-variant="${variant}">
  <h1 class="wemd-hero-title">探索未来科技</h1>
  <p class="wemd-hero-subtitle">用创新驱动变革，让技术赋能每一个梦想</p>
</section>`,
    "stats-block": `<div class="wemd-stats-block" data-variant="${variant}">
  <div class="wemd-stat-item">
    <div class="wemd-stat-value">99.9%</div>
    <div class="wemd-stat-label">可用率</div>
  </div>
  <div class="wemd-stat-item">
    <div class="wemd-stat-value">10M+</div>
    <div class="wemd-stat-label">用户数</div>
  </div>
  <div class="wemd-stat-item">
    <div class="wemd-stat-value">150+</div>
    <div class="wemd-stat-label">国家覆盖</div>
  </div>
</div>`,
    "brand-sign": `<div class="wemd-brand-sign" data-variant="${variant}">
  <div class="wemd-brand-logo"></div>
  <div class="wemd-brand-info">
    <div class="wemd-brand-name">品牌名称</div>
    <div class="wemd-brand-desc">用心打造每一款产品</div>
  </div>
</div>`,
    "divider": `<hr class="wemd-divider" data-variant="${variant}" />`,
    "callout": `<div class="wemd-callout" data-variant="${variant}">
  <div class="wemd-callout-title">💡 提示</div>
  <div class="wemd-callout-content">这是一个重要的提示信息，用于吸引读者注意关键内容。</div>
</div>`,
    "testimonial-card": `<div class="wemd-testimonial-card" data-variant="${variant}">
  <p class="wemd-testimonial-text">"这款产品彻底改变了我们的工作方式，团队效率提升了 300%。"</p>
  <div class="wemd-testimonial-author">— 张三，CTO</div>
</div>`,
    "code-block": `<pre class="wemd-code-block" data-variant="${variant}"><code>function greet(name) {
  return \`你好, \${name}!\`;
}
console.log(greet("世界"));</code></pre>`,
    "pullquote": `<blockquote class="wemd-pullquote" data-variant="${variant}">
  技术的意义不在于本身，而在于它能为人类创造什么价值。
</blockquote>`,
    "steps": `<ol class="wemd-steps" data-variant="${variant}">
  <li class="wemd-step">注册账号并完成实名认证</li>
  <li class="wemd-step">选择适合你的产品方案</li>
  <li class="wemd-step">开始使用，享受高效工作体验</li>
</ol>`,
    "accordion": `<div class="wemd-accordion" data-variant="${variant}">
  <details class="wemd-accordion-item">
    <summary class="wemd-accordion-header">产品功能概述</summary>
    <div class="wemd-accordion-body">我们提供全方位的解决方案，覆盖从数据采集到智能分析的完整链路。</div>
  </details>
</div>`,
    "image-compare": `<div class="wemd-image-compare" data-variant="${variant}" style="margin:1em 0;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <div style="padding:10px 14px;font-size:12px;font-weight:600;color:#666;background:#f8f9fa;border-bottom:1px solid #eee">图片对比</div>
  <div style="display:flex;height:140px">
    <div style="flex:1;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:13px;font-weight:600;position:relative">
      <span style="position:absolute;top:8px;left:8px;font-size:10px;background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:4px">优化前</span>
      <div style="text-align:center;opacity:0.6">
        <div style="font-size:24px;margin-bottom:4px">◐</div>
        <div style="font-size:10px">原始图像</div>
      </div>
    </div>
    <div style="width:2px;background:#fff;box-shadow:0 0 4px rgba(0,0,0,0.15);position:relative;z-index:1">
      <div style="width:24px;height:24px;background:#fff;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);box-shadow:0 1px 4px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:12px;color:#666">↔</div>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f093fb,#f5576c);color:#fff;font-size:13px;font-weight:600;position:relative">
      <span style="position:absolute;top:8px;right:8px;font-size:10px;background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:4px">优化后</span>
      <div style="text-align:center;opacity:0.6">
        <div style="font-size:24px;margin-bottom:4px">◑</div>
        <div style="font-size:10px">增强图像</div>
      </div>
    </div>
  </div>
</div>`,
    "table": `<table class="wemd-table" data-variant="${variant}">
  <thead><tr><th>功能</th><th>基础版</th><th>专业版</th></tr></thead>
  <tbody>
    <tr><td>数据分析</td><td>✓</td><td>✓</td></tr>
    <tr><td>API 接入</td><td>—</td><td>✓</td></tr>
    <tr><td>技术支持</td><td>邮件</td><td>7×24 小时</td></tr>
  </tbody>
</table>`,
    "timeline": `<div class="wemd-timeline" data-variant="${variant}">
  <div class="wemd-timeline-item">
    <div class="wemd-timeline-date">2024 Q1</div>
    <div class="wemd-timeline-content">产品立项与市场调研</div>
  </div>
  <div class="wemd-timeline-item">
    <div class="wemd-timeline-date">2024 Q2</div>
    <div class="wemd-timeline-content">核心功能开发与内测</div>
  </div>
  <div class="wemd-timeline-item">
    <div class="wemd-timeline-date">2024 Q3</div>
    <div class="wemd-timeline-content">正式版上线</div>
  </div>
</div>`,
    "toc-nav": `<nav class="wemd-toc-nav" data-variant="${variant}">
  <div class="wemd-toc-title">目录</div>
  <ul class="wemd-toc-list">
    <li class="wemd-toc-item">第一章：引言</li>
    <li class="wemd-toc-item">第二章：核心概念</li>
    <li class="wemd-toc-item">第三章：实践方法</li>
    <li class="wemd-toc-item">第四章：总结</li>
  </ul>
</nav>`,
    "numbered-heading": `<h2 class="wemd-numbered-heading" data-variant="${variant}">
  <span class="wemd-numbered-index">01</span>
  <span class="wemd-numbered-title">章节标题</span>
</h2>`,
    "section-title": `<h3 class="wemd-section-title" data-variant="${variant}">段落小标题文字</h3>`,
    "quote-card": `<blockquote class="wemd-quote-card" data-variant="${variant}">
  <p class="wemd-quote-text">"生活不止眼前的苟且，还有诗和远方的田野。"</p>
  <cite class="wemd-quote-author">— 高晓松</cite>
</blockquote>`,
    "callout-pro": `<div class="wemd-callout-pro" data-variant="${variant}">
  <div class="wemd-callout-icon">💡</div>
  <div class="wemd-callout-body">
    <strong class="wemd-callout-title">提示标题</strong>
    <p class="wemd-callout-desc">这是一个重要的提示信息，用于吸引读者注意关键内容。</p>
  </div>
</div>`,
    "faq": `<div class="wemd-faq" data-variant="${variant}">
  <details class="wemd-faq-item" open>
    <summary class="wemd-faq-question">什么是 WeMD？</summary>
    <div class="wemd-faq-answer">WeMD 是一款专注于微信公众号排版的主题设计工具。</div>
  </details>
  <details class="wemd-faq-item">
    <summary class="wemd-faq-question">如何开始使用？</summary>
    <div class="wemd-faq-answer">选择主题模板，编辑文章内容，一键导出即可。</div>
  </details>
</div>`,
    "share-card": `<div class="wemd-share-card" data-variant="${variant}">
  <p class="wemd-share-text">觉得有用就分享给朋友吧</p>
  <div class="wemd-share-buttons">
    <span class="wemd-share-btn">分享到朋友圈</span>
    <span class="wemd-share-btn">分享给好友</span>
  </div>
</div>`,
    "cta-card": `<div class="wemd-cta-card" data-variant="${variant}">
  <h3 class="wemd-cta-title">立即报名</h3>
  <p class="wemd-cta-subtitle">限时优惠，名额有限</p>
  <p class="wemd-cta-body">加入我们，开启你的学习之旅</p>
  <a class="wemd-cta-button" href="#">立即报名 →</a>
</div>`,
    "tag-label": `<div class="wemd-tag-label" data-variant="${variant}">
  <span class="wemd-tag">前端开发</span>
  <span class="wemd-tag">Vue3</span>
  <span class="wemd-tag">TypeScript</span>
  <span class="wemd-tag">工程化</span>
</div>`,
    "follow-bar": `<div class="wemd-follow-bar" data-variant="${variant}">
  <span class="wemd-follow-hint">点击关注，获取更多干货</span>
  <span class="wemd-follow-btn">关注</span>
</div>`,
    "divider-fancy": `<div class="wemd-divider-fancy" data-variant="${variant}">
  <span class="wemd-divider-line"></span>
  <span class="wemd-divider-icon">✦</span>
  <span class="wemd-divider-line"></span>
</div>`,
    "styled-table": `<div class="wemd-styled-table" data-variant="${variant}">
  <table class="wemd-table">
    <thead><tr><th>功能</th><th>基础版</th><th>专业版</th></tr></thead>
    <tbody>
      <tr><td>数据分析</td><td>✓</td><td>✓</td></tr>
      <tr><td>API 接入</td><td>—</td><td>✓</td></tr>
      <tr><td>技术支持</td><td>邮件</td><td>7×24 小时</td></tr>
    </tbody>
  </table>
</div>`,
    "code-frame": `<div class="wemd-code-frame" data-variant="${variant}">
  <div class="wemd-code-header">
    <span class="wemd-code-lang">JavaScript</span>
  </div>
  <pre class="wemd-code-body"><code>function greet(name) {
  return \`你好, \${name}!\`;
}
console.log(greet("世界"));</code></pre>
</div>`,
    "article-section": `<div class="wemd-article-section" data-variant="${variant}">
  <div class="wemd-section-marker">§</div>
  <div class="wemd-section-content">
    <p>引用原文第 1-3 段内容，作为文章的背景介绍和上下文铺垫。</p>
  </div>
</div>`,
    "magazine-cover": `<div class="wemd-magazine-cover" data-variant="${variant}">
  <div class="wemd-cover-subtitle">Summer Breeze</div>
  <h2 class="wemd-cover-title">盛夏时光</h2>
  <div class="wemd-cover-divider"></div>
  <p class="wemd-cover-desc">愿所有美好<br>如夏日微风一般如期而至。</p>
</div>`,
    "section-divider": `<div class="wemd-section-divider" data-variant="${variant}">
  <span class="wemd-section-part">PART 01</span>
  <h3 class="wemd-section-title">夏日故事</h3>
</div>`,
    "image-card": `<figure class="wemd-image-card" data-variant="${variant}">
  <div class="wemd-image-card-img" style="background:#e8f4f8;height:160px;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px">🖼️ 图片占位</div>
  <figcaption class="wemd-image-card-caption">图片说明文字</figcaption>
</figure>`,
    "text-card": `<div class="wemd-text-card" data-variant="${variant}">
  <p>七月盛夏，阳光透过树叶洒落在地面。</p>
  <p>微风轻轻吹过，带来了青草与花朵的香气。</p>
</div>`,
    "full-quote": `<blockquote class="wemd-full-quote" data-variant="${variant}">
  <p>愿这个夏天，所有期待都有回应。</p>
</blockquote>`,
    "two-column-cards": `<div class="wemd-two-column-cards" data-variant="${variant}">
  <div class="wemd-two-col-item">
    <span class="wemd-col-icon">☀️</span>
    <h4 class="wemd-col-title">阳光</h4>
    <p class="wemd-col-desc">每一天都充满能量</p>
  </div>
  <div class="wemd-two-col-item">
    <span class="wemd-col-icon">🍃</span>
    <h4 class="wemd-col-title">微风</h4>
    <p class="wemd-col-desc">吹散所有烦恼</p>
  </div>
</div>`,
    "end-card": `<div class="wemd-end-card" data-variant="${variant}">
  <h2 class="wemd-end-title">Thanks</h2>
  <p class="wemd-end-subtitle">感谢阅读 · 期待下次相遇</p>
</div>`,
    "product-card": `<div class="wemd-product-card" data-variant="${variant}">
  <div class="wemd-product-badge">限时特惠</div>
  <div class="wemd-product-img" style="background:linear-gradient(135deg,#667eea,#764ba2);height:140px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px">⭐</div>
  <div class="wemd-product-body">
    <h3 class="wemd-product-title">星空投影灯 Pro</h3>
    <p class="wemd-product-desc">360° 全景星空投影，卧室露营两用品</p>
    <div class="wemd-product-price">
      <span class="wemd-price-current">¥399</span>
      <span class="wemd-price-original">¥599</span>
    </div>
    <div class="wemd-product-rating">⭐⭐⭐⭐⭐ 4.8</div>
    <a class="wemd-product-btn" href="#">立即抢购</a>
  </div>
</div>`,
    "resource-list": `<div class="wemd-resource-list" data-variant="${variant}">
  <h3 class="wemd-resource-title">配套资料包</h3>
  <div class="wemd-resource-items">
    <div class="wemd-resource-item">
      <span class="wemd-resource-type">📄</span>
      <div class="wemd-resource-info">
        <span class="wemd-resource-name">Vue3 入门讲义 PDF</span>
        <span class="wemd-resource-meta">PDF / 12MB</span>
      </div>
      <span class="wemd-resource-tag">推荐</span>
    </div>
    <div class="wemd-resource-item">
      <span class="wemd-resource-type">📦</span>
      <div class="wemd-resource-info">
        <span class="wemd-resource-name">配套源码压缩包</span>
        <span class="wemd-resource-meta">ZIP / 38MB</span>
      </div>
    </div>
  </div>
</div>`,
    "series-nav": `<div class="wemd-series-nav" data-variant="${variant}">
  <div class="wemd-series-header">
    <span class="wemd-series-name">Vue3 从 0 到 1</span>
    <span class="wemd-series-progress">3/10</span>
  </div>
  <div class="wemd-series-bar">
    <div class="wemd-series-bar-fill" style="width:30%"></div>
  </div>
  <div class="wemd-series-links">
    <a class="wemd-series-prev">← Setup 语法糖的正确姿势</a>
    <a class="wemd-series-next">Ref 和 Reactive：到底怎么选？ →</a>
  </div>
</div>`,
    "image-grid": `<div class="wemd-image-grid" data-variant="${variant}">
  <div class="wemd-grid-img" style="background:#e8f4f8;height:100px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999">🖼️</div>
  <div class="wemd-grid-img" style="background:#f0e6ff;height:100px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999">🖼️</div>
  <div class="wemd-grid-img" style="background:#fff3e0;height:100px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999">🖼️</div>
</div>`,
    "author-card": `<div class="wemd-author-card" data-variant="${variant}">
  <div class="wemd-author-avatar" style="width:48px;height:48px;border-radius:50%;background:#667eea;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px">A</div>
  <div class="wemd-author-info">
    <strong class="wemd-author-name">作者名称</strong>
    <span class="wemd-author-bio">前端工程师，技术写作者</span>
  </div>
</div>`,
    "related-posts": `<div class="wemd-related-posts" data-variant="${variant}">
  <h3 class="wemd-related-title">相关推荐</h3>
  <ul class="wemd-related-list">
    <li class="wemd-related-item"><a href="#">深入理解 Vue3 响应式原理</a></li>
    <li class="wemd-related-item"><a href="#">TypeScript 高级类型详解</a></li>
    <li class="wemd-related-item"><a href="#">前端工程化实践指南</a></li>
  </ul>
</div>`,
    "copyright-notice": `<div class="wemd-copyright-notice" data-variant="${variant}">
  <p>© 2026 WeMD Team. All rights reserved.</p>
  <p>未经许可，不得转载</p>
</div>`,
    "qr-card": `<div class="wemd-qr-card" data-variant="${variant}">
  <div class="wemd-qr-code" style="width:80px;height:80px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;color:#999">QR</div>
  <div class="wemd-qr-info">
    <p class="wemd-qr-text">扫码关注公众号</p>
    <p class="wemd-qr-desc">获取更多精彩内容</p>
  </div>
</div>`,
    "image-text-row": `<div class="wemd-image-text-row" data-variant="${variant}">
  <div class="wemd-itr-img" style="width:80px;height:80px;border-radius:8px;background:linear-gradient(135deg,#a8edea,#fed6e3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px">🌅</div>
  <div class="wemd-itr-text">
    <p class="wemd-itr-title">标题文字</p>
    <p class="wemd-itr-desc">描述文字，简要说明内容</p>
  </div>
</div>`,
    "image-caption": `<figure class="wemd-image-caption" data-variant="${variant}">
  <div class="wemd-ic-img" style="height:120px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px">🖼️</div>
  <figcaption class="wemd-ic-caption">这是一张精美的示例图片，展示了产品的核心功能</figcaption>
</figure>`,
  };

  return htmlMap[componentType] || `<div class="wemd-${componentType}" data-variant="${variant}" style="padding:2em 1em;text-align:center;color:#999">
  <p style="font-size:1.1em;margin-bottom:0.5em">${componentType}</p>
  <p style="font-size:0.85em">暂无组件预览</p>
</div>`;
}

// ═══════════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════════

loadProjects();
