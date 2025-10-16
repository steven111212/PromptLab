// 配置管理模組
// 全域變數
let currentConfigs = [];
let selectedConfig = null;

// 載入配置列表
async function loadConfigs() {
    const container = document.getElementById('configList');
    
    // 顯示骨架屏
    container.innerHTML = `
        <div class="list-group-item border-0 skeleton-card">
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-short"></div>
        </div>
        <div class="list-group-item border-0 skeleton-card">
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-short"></div>
        </div>
        <div class="list-group-item border-0 skeleton-card">
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-short"></div>
        </div>
    `;
    
    try {
        const response = await fetch('/api/configs');
        const configs = await response.json();
        currentConfigs = configs; // 更新全域變數
        
        if (currentConfigs.length === 0) {
            container.innerHTML = `
                <div class="list-group-item border-0 text-center py-4">
                    <i class="fas fa-folder-open text-muted mb-2" style="font-size: 2rem; opacity: 0.5;"></i>
                    <p class="text-muted small mb-3">暫無配置檔案</p>
                    <button class="btn btn-primary btn-sm" onclick="ConfigManager.showNewConfigForm()">
                        <i class="fas fa-plus me-1"></i>新增第一個配置
                    </button>
                </div>
            `;
            return;
        }
        
        const html = currentConfigs.map(config => `
            <div class="list-group-item list-group-item-action border-0 config-item" 
                 data-config-id="${config.id}" 
                 onclick="ConfigManager.selectConfig('${config.id}')" 
                 style="cursor: pointer; transition: all 0.2s;">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1 text-dark">${config.name}</h6>
                        <p class="mb-1 small text-muted">
                            <i class="fas fa-file-code me-1"></i>${config.filename}
                        </p>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>最近修改
                        </small>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                type="button" data-bs-toggle="dropdown" 
                                onclick="event.stopPropagation()">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a class="dropdown-item" href="#" onclick="ConfigManager.runConfig('${config.id}')">
                                    <i class="fas fa-play me-2 text-success"></i>執行
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" onclick="ConfigManager.editConfig('${config.id}')">
                                    <i class="fas fa-edit me-2 text-primary"></i>編輯
                                </a>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item text-danger" href="#" onclick="ConfigManager.deleteConfig('${config.id}')">
                                    <i class="fas fa-trash me-2"></i>刪除
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('載入配置失敗:', error);
        showAlert('載入配置失敗', 'danger');
    }
}

// 選擇配置
async function selectConfig(configId) {
    try {
        // 更新選中狀態
        document.querySelectorAll('.config-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-config-id="${configId}"]`).classList.add('active');
        
        const response = await fetch(`/api/configs/${configId}`);
        const config = await response.json();
        
        selectedConfig = config;
        
        // 顯示配置詳情
        showConfigDetails(config);
        
    } catch (error) {
        console.error('載入配置詳情失敗:', error);
        showAlert('載入配置詳情失敗', 'danger');
    }
}

// 顯示配置詳情
function showConfigDetails(config) {
    const configDetails = document.getElementById('configDetails');
    const configForm = document.getElementById('configForm');
    const configFormTitle = document.getElementById('configFormTitle');
    const configFormActions = document.getElementById('configFormActions');
    
    // 隱藏表單，顯示詳情
    configForm.style.display = 'none';
    configFormActions.style.display = 'none';
    configDetails.style.display = 'block';
    configFormTitle.textContent = '專案詳情';
    
    // 顯示專案詳情
    const configName = config.parsed?.description || config.name || config.id || '未命名專案';
    
    configDetails.innerHTML = `
        <div class="config-detail-view">
            <!-- 配置標題區域 -->
            <div class="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h3 class="text-dark mb-2">${configName}</h3>
                    <div class="d-flex align-items-center text-muted">
                        <i class="fas fa-file-code me-2"></i>
                        <span class="me-3">${config.filename}</span>
                        <i class="fas fa-clock me-2"></i>
                        <span>最近修改</span>
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-success" onclick="ConfigManager.runConfig('${config.id}')">
                        <i class="fas fa-play me-2"></i>執行專案
                    </button>
                    <button class="btn btn-primary" onclick="ConfigManager.editConfig('${config.id}')">
                        <i class="fas fa-edit me-2"></i>編輯專案
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item text-danger" href="#" onclick="ConfigManager.deleteConfig('${config.id}')">
                                <i class="fas fa-trash me-2"></i>刪除專案
                            </a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- 配置預覽卡片 -->
            <div class="card border-0 bg-light">
                <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-secondary">
                        <i class="fas fa-eye me-2"></i>專案配置概覽
                    </h6>
                    <button class="btn btn-sm btn-outline-secondary" onclick="ConfigManager.copyConfigContent('${config.id}')">
                        <i class="fas fa-copy me-1"></i>複製原始配置
                    </button>
                </div>
                <div class="card-body">
                    ${window.ConfigPreview ? window.ConfigPreview.generateFriendlyPreview(config.content) : `<pre class="bg-white p-3 rounded border" style="max-height: 400px; overflow-y: auto; font-size: 0.875rem;"><code>${config.content}</code></pre>`}
                </div>
            </div>
        </div>
    `;
}

// 複製專案內容
function copyConfigContent(configId) {
    const config = currentConfigs.find(c => c.id === configId);
    if (config) {
        navigator.clipboard.writeText(config.content).then(() => {
            showAlert('專案內容已複製到剪貼簿', 'success');
        }).catch(() => {
            showAlert('複製失敗', 'danger');
        });
    }
}

// 編輯配置
async function editConfig(configId) {
    try {
        const response = await fetch(`/api/configs/${configId}`);
        const config = await response.json();
        
        selectedConfig = config;
        
        // 顯示編輯表單
        await ConfigForm.showConfigForm(config, true);
        
    } catch (error) {
        console.error('載入配置詳情失敗:', error);
        showAlert('載入配置詳情失敗', 'danger');
    }
}

// 顯示新增配置表單
function showNewConfigForm() {
    selectedConfig = null;
    ConfigForm.showConfigForm(null, false);
}

// 執行配置
async function runConfig(configId) {
    if (confirm('確定要執行這個配置嗎？')) {
        try {
            showAlert('正在執行配置，請稍候...', 'info');
            
            const response = await fetch(`/api/configs/${configId}/run`, {
                method: 'POST'
            });
            
            if (response.ok) {
                showAlert('配置執行成功！', 'success');
                // 可以選擇跳轉到結果頁面
                setTimeout(() => {
                    switchTab('results');
                }, 1000);
            } else {
                const error = await response.json();
                showAlert('配置執行失敗: ' + error.error, 'danger');
            }
        } catch (error) {
            console.error('執行配置失敗:', error);
            showAlert('執行配置失敗: ' + error.message, 'danger');
        }
    }
}

// 刪除配置
async function deleteConfig(configId) {
    // 找到配置名稱
    const config = currentConfigs.find(c => c.id === configId);
    const configName = config ? config.name : '此配置';
    
    // 使用確認對話框
    window.ConfirmDialog.confirmDelete(configName, async () => {
        try {
            const response = await fetch(`/api/configs/${configId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                Toast.success('配置刪除成功！');
                await loadConfigs(); // 重新載入配置列表
                
                // 如果刪除的是當前選中的配置，清除選中狀態
                if (selectedConfig && selectedConfig.id === configId) {
                    selectedConfig = null;
                    const configDetails = document.getElementById('configDetails');
                    const configForm = document.getElementById('configForm');
                    const configFormTitle = document.getElementById('configFormTitle');
                    const configFormActions = document.getElementById('configFormActions');
                    
                    if (configDetails) configDetails.style.display = 'none';
                    if (configForm) configForm.style.display = 'none';
                    if (configFormActions) configFormActions.style.display = 'none';
                    if (configFormTitle) configFormTitle.textContent = '配置管理';
                }
            } else {
                const error = await response.json();
                Toast.error('刪除失敗: ' + error.error);
            }
        } catch (error) {
            console.error('刪除配置失敗:', error);
            Toast.error('刪除配置失敗: ' + error.message);
        }
    });
}

// 匯出配置管理相關的變數和函數供其他模組使用
window.ConfigManager = {
    currentConfigs: () => currentConfigs,
    selectedConfig: () => selectedConfig,
    loadConfigs,
    selectConfig,
    showConfigDetails,
    copyConfigContent,
    editConfig,
    showNewConfigForm,
    runConfig,
    deleteConfig
};
