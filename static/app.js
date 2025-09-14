// 全域變數
let currentConfigs = [];
let selectedConfig = null;

// 初始化應用程式
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化應用程式
async function initializeApp() {
    setupEventListeners();
    await loadConfigs();
}

// 設置事件監聽器
function setupEventListeners() {
    // 側邊欄導航
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });
}

// 切換標籤頁
function switchTab(tab) {
    // 隱藏所有標籤內容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // 移除所有導航連結的 active 類別
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // 顯示選中的標籤內容
    const targetContent = document.getElementById(tab);
    if (targetContent) {
        targetContent.style.display = 'block';
    }
    
    // 添加 active 類別到選中的導航連結
    const targetLink = document.querySelector(`[data-tab="${tab}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
    
    // 根據標籤執行相應的初始化
    if (tab === 'results') {
        // 確保 loadEvaluationResults 函數已載入
        if (typeof loadEvaluationResults === 'function') {
            loadEvaluationResults();
        } else {
            console.warn('loadEvaluationResults 函數尚未載入');
            // 延遲重試
            setTimeout(() => {
                if (typeof loadEvaluationResults === 'function') {
                    loadEvaluationResults();
                } else {
                    console.error('loadEvaluationResults 函數載入失敗');
                }
            }, 100);
        }
    } else if (tab === 'result-detail') {
        // 詳細頁面的初始化在 navigateToEvaluationDetail 中處理
    }
}

// 載入配置列表
async function loadConfigs() {
    try {
        const response = await fetch('/api/configs');
        const configs = await response.json();
        currentConfigs = configs; // 更新全域變數
        
        const container = document.getElementById('configList');
        
        if (currentConfigs.length === 0) {
            container.innerHTML = `
                <div class="list-group-item border-0 text-center py-4">
                    <i class="fas fa-folder-open text-muted mb-2" style="font-size: 2rem; opacity: 0.5;"></i>
                    <p class="text-muted small mb-3">暫無配置檔案</p>
                    <button class="btn btn-primary btn-sm" onclick="showNewConfigForm()">
                        <i class="fas fa-plus me-1"></i>新增第一個配置
                    </button>
                </div>
            `;
            return;
        }
        
        const html = currentConfigs.map(config => `
            <div class="list-group-item list-group-item-action border-0 config-item" 
                 data-config-id="${config.id}" 
                 onclick="selectConfig('${config.id}')" 
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
                    <div class="dropdown" onclick="event.stopPropagation();">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a class="dropdown-item" href="#" onclick="runConfig('${config.id}')">
                                    <i class="fas fa-play me-2 text-success"></i>執行
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" onclick="editConfig('${config.id}')">
                                    <i class="fas fa-edit me-2 text-primary"></i>編輯
                                </a>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item text-danger" href="#" onclick="deleteConfig('${config.id}')">
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
    configFormTitle.textContent = '配置詳情';
    
    // 顯示配置詳情
    const configName = config.parsed?.description || config.name || config.id || '未命名配置';
    
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
                    <button class="btn btn-success" onclick="runConfig('${config.id}')">
                        <i class="fas fa-play me-2"></i>執行配置
                    </button>
                    <button class="btn btn-primary" onclick="editConfig('${config.id}')">
                        <i class="fas fa-edit me-2"></i>編輯配置
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteConfig('${config.id}')">
                                <i class="fas fa-trash me-2"></i>刪除配置
                            </a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- 配置預覽卡片 -->
            <div class="card border-0 bg-light">
                <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-secondary">
                        <i class="fas fa-code me-2"></i>配置內容預覽
                    </h6>
                    <button class="btn btn-sm btn-outline-secondary" onclick="copyConfigContent('${config.id}')">
                        <i class="fas fa-copy me-1"></i>複製
                    </button>
                </div>
                <div class="card-body">
                    <pre class="bg-white p-3 rounded border" style="max-height: 400px; overflow-y: auto; font-size: 0.875rem;"><code>${config.content}</code></pre>
                </div>
            </div>
        </div>
    `;
}

// 複製配置內容
function copyConfigContent(configId) {
    const config = currentConfigs.find(c => c.id === configId);
    if (config) {
        navigator.clipboard.writeText(config.content).then(() => {
            showAlert('配置內容已複製到剪貼簿', 'success');
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
        await showConfigForm(config, true);
        
    } catch (error) {
        console.error('載入配置詳情失敗:', error);
        showAlert('載入配置詳情失敗', 'danger');
    }
}

// 顯示新增配置表單
function showNewConfigForm() {
    selectedConfig = null;
    showConfigForm(null, false);
}

// 顯示配置表單
async function showConfigForm(config, isEdit) {
    const configDetails = document.getElementById('configDetails');
    const configForm = document.getElementById('configForm');
    const configFormTitle = document.getElementById('configFormTitle');
    const configFormActions = document.getElementById('configFormActions');
    
    // 隱藏詳情，顯示表單
    configDetails.style.display = 'none';
    configForm.style.display = 'block';
    configFormActions.style.display = 'block';
    configFormTitle.textContent = isEdit ? '編輯配置' : '新增配置';
    
    // 生成表單HTML
    configForm.innerHTML = generateConfigFormHTML();
    
    // 根據編輯模式設定按鈕文字
    setTimeout(() => {
        const saveButtonText = document.getElementById('saveButtonText');
        const saveButtonTextStep4 = document.getElementById('saveButtonTextStep4');
        
        if (saveButtonText) {
            saveButtonText.textContent = isEdit ? '儲存配置' : '創建配置';
        }
        if (saveButtonTextStep4) {
            saveButtonTextStep4.textContent = isEdit ? '儲存配置' : '創建配置';
        }
        
        // 更新頂部的保存按鈕文字
        const topSaveButton = document.querySelector('#configFormActions .btn-success');
        if (topSaveButton) {
            topSaveButton.innerHTML = `<i class="fas fa-save me-2"></i>${isEdit ? '儲存配置' : '創建配置'}`;
        }
    }, 100);
    
    // 如果是編輯模式，載入配置數據
    if (isEdit && config) {
        await loadConfigToForm(config);
    } else {
        // 新增模式，重置表單
        resetScoringCriteriaList();
    }
    
}

// 生成配置表單HTML
function generateConfigFormHTML() {
    return `
        <div class="config-form-container">
            <!-- 進度指示器 -->
            <div class="progress-steps mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="step active clickable" data-step="1" onclick="jumpToStep(1)">
                        <span class="step-number">1</span>
                        <span class="step-label">基本設定</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="step clickable" data-step="2" onclick="jumpToStep(2)">
                        <span class="step-number">2</span>
                        <span class="step-label">API配置</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="step clickable" data-step="3" onclick="jumpToStep(3)">
                        <span class="step-number">3</span>
                        <span class="step-label">測試問題</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="step clickable" data-step="4" onclick="jumpToStep(4)">
                        <span class="step-number">4</span>
                        <span class="step-label">評分標準</span>
                    </div>
                </div>
            </div>

            <form id="configFormContent" onsubmit="return false;">
                <!-- 步驟 1: 基本資訊 -->
                <div class="form-step" id="step1" style="display: block;">
                    <div class="step-header mb-4">
                        <h5 class="text-primary"><i class="fas fa-info-circle me-2"></i>基本資訊</h5>
                        <p class="text-muted">設定你的評測配置基本資訊</p>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-8">
                            <label class="form-label">配置名稱 *</label>
                            <input type="text" class="form-control form-control-lg" id="configName" placeholder="例如：台電客服評測" required>
                            <small class="form-text text-muted">請勿使用特殊字符: < > : " / \\ | ? *</small>
                        </div>
                    </div>
                    
                    <div class="step-navigation mt-4">
                        <div class="d-flex justify-content-end">
                            <div class="btn-group">
                        <button type="button" class="btn btn-primary" onclick="nextStep(2)">
                            下一步：API配置 <i class="fas fa-arrow-right ms-2"></i>
                        </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="cancelConfigForm()">
                                    <i class="fas fa-times me-2"></i>取消
                        </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 步驟 2: API配置 -->
                <div class="form-step" id="step2" style="display: none;">
                    <div class="step-header mb-4">
                        <h5 class="text-primary"><i class="fas fa-robot me-2"></i>被測API配置</h5>
                        <p class="text-muted">配置要測試的API端點和請求格式</p>
                    </div>
                    
                    <!-- HTTP Request 配置 -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-globe me-2"></i>HTTP 請求配置</h6>
                        </div>
                        <div class="card-body">
                            <!-- HTTPS 支援 -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">使用 HTTPS:</label>
                                </div>
                                <div class="col-md-9">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="useHttps" checked>
                                        <label class="form-check-label" for="useHttps">
                                            啟用 HTTPS 安全連線
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- HTTP 方法 -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">HTTP 方法:</label>
                                </div>
                                <div class="col-md-9">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <select class="form-select" id="httpMethod">
                                                <option value="POST">POST</option>
                                                <option value="GET">GET</option>
                                                <option value="PUT">PUT</option>
                                                <option value="PATCH">PATCH</option>
                                            </select>
                                        </div>
                        <div class="col-md-8">
                                            <input type="text" class="form-control" id="httpPath" placeholder="/chat/completions HTTP/1.1" required>
                            </div>
                                    </div>
                        </div>
                    </div>
                    
                            <!-- Host -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">Host:</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="text" class="form-control" id="httpHost" placeholder="api.deepseek.com" required>
                                </div>
                            </div>
                            
                            <!-- Content-Type -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">Content-Type:</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="text" class="form-control" id="httpContentType" placeholder="application/json" value="application/json" required>
                                </div>
                            </div>
                            
                            <!-- Authorization -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">Authorization:</label>
                                </div>
                                <div class="col-md-9">
                                    <div class="row">
                                        <div class="col-md-3">
                                            <select class="form-select" id="authType">
                                                <option value="none">無認證</option>
                                                <option value="bearer">Bearer Token</option>
                                                <option value="basic">Basic Auth</option>
                                                <option value="apikey">API Key</option>
                                                <option value="custom">自定義</option>
                                            </select>
                                        </div>
                                        <div class="col-md-9">
                                            <input type="text" class="form-control" id="authValue" placeholder="sk-56d9f30fdee64135abcfaaee7b34080a">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                    
                    <!-- Request Body 配置 -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-code me-2"></i>Request Body 配置</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                        <div class="col-12">
                                    <label class="form-label">Request Body 原始內容</label>
                                    <textarea class="form-control" id="requestBody" rows="6" placeholder='{"question": "{{prompt}}"}'></textarea>
                                    <small class="form-text text-muted">必須包含 {{prompt}} 變量</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 進階配置 -->
                    <div class="row mb-4">
                        <div class="col-md-8">
                            <label class="form-label">Response Transform</label>
                            <input type="text" class="form-control" id="transformResponse" placeholder="json.response">
                            <small class="form-text text-muted">例如：json.response, json.choices[0].message.content</small>
                        </div>
                    </div>
                    
                    <!-- API測試區域 -->
                    <div class="card mb-4 border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0"><i class="fas fa-flask me-2"></i>API測試</h6>
                        </div>
                        <div class="card-body">
                            <p class="text-muted mb-3">測試您配置的API是否能正常運作</p>
                            
                            <div class="row mb-3">
                                <div class="col-md-8">
                                    <label class="form-label">測試問題</label>
                                    <input type="text" class="form-control" id="testQuestion" placeholder="輸入一個測試問題，例如：你好，請自我介紹" value="你好，請自我介紹">
                                </div>
                                <div class="col-md-4 d-flex align-items-end">
                                    <button type="button" class="btn btn-info w-100" onclick="testAPI()" id="testAPIButton">
                                        <i class="fas fa-play me-2"></i>測試API
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 測試結果區域 -->
                            <div id="testResult" style="display: none;">
                                <hr>
                                <h6 class="text-success mb-3"><i class="fas fa-check-circle me-2"></i>測試結果</h6>
                                
                                <!-- 請求詳情 -->
                                <div class="mb-3">
                                    <label class="form-label small text-muted">請求詳情</label>
                                    <div class="bg-light p-2 rounded">
                                        <small id="requestDetails" class="text-muted"></small>
                                    </div>
                                </div>
                                
                                <!-- API回應 -->
                                <div class="mb-3">
                                    <label class="form-label small text-success">API回應</label>
                                    <div class="bg-success bg-opacity-10 p-3 rounded border border-success">
                                        <pre id="apiResponse" class="mb-0" style="white-space: pre-wrap; font-size: 14px;"></pre>
                                    </div>
                                </div>
                                
                                <!-- 處理後的結果 -->
                                <div id="transformedResult" style="display: none;">
                                    <label class="form-label small text-primary">處理後的結果</label>
                                    <div class="bg-primary bg-opacity-10 p-3 rounded border border-primary">
                                        <pre id="transformedResponse" class="mb-0" style="white-space: pre-wrap; font-size: 14px;"></pre>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 錯誤結果區域 -->
                            <div id="testError" style="display: none;">
                                <hr>
                                <h6 class="text-danger mb-3"><i class="fas fa-exclamation-circle me-2"></i>測試失敗</h6>
                                <div class="alert alert-danger">
                                    <strong>錯誤訊息：</strong>
                                    <pre id="errorMessage" class="mb-0 mt-2" style="white-space: pre-wrap; font-size: 14px;"></pre>
                                </div>
                                <div class="text-muted">
                                    <small><i class="fas fa-lightbulb me-1"></i>請檢查API配置是否正確，包括URL、認證資訊和請求格式</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="step-navigation mt-4">
                        <div class="d-flex justify-content-between">
                            <button type="button" class="btn btn-outline-secondary" onclick="prevStep(1)">
                            <i class="fas fa-arrow-left me-2"></i>上一步
                        </button>
                            <div class="btn-group">
                        <button type="button" class="btn btn-primary" onclick="nextStep(3)">
                            下一步：測試問題 <i class="fas fa-arrow-right ms-2"></i>
                        </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="cancelConfigForm()">
                                    <i class="fas fa-times me-2"></i>取消
                        </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 步驟 3: 測試問題配置 -->
                <div class="form-step" id="step3" style="display: none;">
                    <div class="step-header mb-4">
                        <h5 class="text-primary"><i class="fas fa-question-circle me-2"></i>測試問題配置</h5>
                        <p class="text-muted">選擇測試問題的來源</p>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="questionSource" id="questionSourceManual" value="manual" checked onchange="toggleQuestionInput()">
                                <label class="form-check-label" for="questionSourceManual">
                                    <i class="fas fa-keyboard me-2"></i>手動輸入
                                </label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="questionSource" id="questionSourceUpload" value="upload" onchange="toggleQuestionInput()">
                                <label class="form-check-label" for="questionSourceUpload">
                                    <i class="fas fa-file-csv me-2"></i>上傳CSV檔案
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- 手動輸入問題 -->
                    <div id="manualQuestionsSection" class="mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    <i class="fas fa-edit me-2"></i>手動輸入測試問題
                                </h6>
                            </div>
                            <div class="card-body">
                                <label class="form-label">測試問題</label>
                                <textarea class="form-control" id="testQuestions" rows="6" placeholder="請輸入測試問題，每行一個問題&#10;例如：&#10;什麼是台電？&#10;如何申請用電？&#10;電費如何計算？"></textarea>
                                <small class="form-text text-muted">每行一個問題</small>
                            </div>
                        </div>
                    </div>

                    <!-- 上傳測試集檔案 -->
                    <div id="uploadQuestionsSection" class="mb-4" style="display: none;">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    <i class="fas fa-upload me-2"></i>上傳測試集檔案
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <input type="file" class="form-control" id="csvFile" accept=".csv" onchange="handleCSVUpload(this)">
                                    <small class="form-text text-muted">
                                        <i class="fas fa-info-circle me-1"></i>
                                        CSV檔案應包含 "prompt" 欄位，可選包含 "expected" 欄位作為期望答案
                                    </small>
                                </div>
                                <div id="csvPreview" style="display: none;">
                                    <h6>檔案預覽：</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm table-bordered" id="csvPreviewTable">
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="step-navigation mt-4">
                        <div class="d-flex justify-content-between">
                            <button type="button" class="btn btn-outline-secondary" onclick="prevStep(2)">
                            <i class="fas fa-arrow-left me-2"></i>上一步
                        </button>
                            <div class="btn-group">
                        <button type="button" class="btn btn-outline-success me-2" onclick="nextStep(4)">
                            下一步：評分標準（可選） <i class="fas fa-arrow-right ms-2"></i>
                        </button>
                        <button type="button" class="btn btn-primary" onclick="saveConfiguration()">
                            <i class="fas fa-save me-2"></i><span id="saveButtonText">創建配置</span>
                        </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="cancelConfigForm()">
                                    <i class="fas fa-times me-2"></i>取消
                        </button>
                            </div>
                        </div>
                    </div>
                </div>

            <!-- 步驟 4: 評分標準配置（可選） -->
            <div class="form-step" id="step4" style="display: none;">
                <div class="step-header mb-4">
                    <h5 class="text-success"><i class="fas fa-chart-line me-2"></i>評分標準配置</h5>
                    <p class="text-muted">這個步驟是可選的。你可以跳過此步驟直接創建配置，或者設定評分標準來自動評估API回覆品質。</p>
                    
                    <div class="alert alert-info">
                        <i class="fas fa-lightbulb me-2"></i>
                        <strong>提示：</strong>如果你只想測試API是否正常運作，可以跳過評分配置。如果你想要量化評估回覆品質，建議設定評分標準。
                    </div>
                </div>

                <!-- 評分標準配置區域 -->
                <div class="row">
                    <!-- 左欄：Metric 評分 -->
                    <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header bg-primary text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-chart-line me-2"></i>metric評分
                            </h6>
                        </div>
                        <div class="card-body">
                            <p class="text-muted small mb-3">選擇一個或多個內建評分指標</p>

                            <!-- JavaScript 驗證 -->
                            <div class="mb-3">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableJavascript" onchange="toggleJavascriptConfig()">
                                    <label class="form-check-label" for="enableJavascript">
                                        <i class="fas fa-code me-2"></i>JavaScript 驗證
                                    </label>
                                </div>
                                <div id="javascriptConfig" style="display: none;" class="mt-2 ps-4">
                                    <div class="row">
                                        <div class="col-12 mb-2">
                                            <label class="form-label small">驗證條件</label>
                                            <select class="form-select form-select-sm" id="javascriptCondition" onchange="updateJavascriptCondition()">
                                    <option value="length">回覆長度檢查</option>
                                    <option value="custom">自定義條件</option>
                                </select>
                            </div>
                                        <div class="col-12" id="lengthConfig">
                                            <label class="form-label small">最小長度</label>
                                            <input type="number" class="form-control form-control-sm" id="minLength" value="100" min="1">
                            </div>
                                        <div class="col-12" id="customConfig" style="display: none;">
                                            <label class="form-label small">自定義表達式</label>
                                            <textarea class="form-control form-control-sm" id="customJavascript" rows="2" placeholder="output.length >= 100"></textarea>
                            </div>
                        </div>
                    </div>
                            </div>

                            <!-- 其他 Metric 評分選項 -->
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableFactuality">
                                    <label class="form-check-label" for="enableFactuality">
                                        <i class="fas fa-check-double me-2"></i>事實性檢查
                                    </label>
                </div>
            </div>

                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableSimilarity">
                                    <label class="form-check-label" for="enableSimilarity">
                                        <i class="fas fa-search me-2"></i>語義相似度
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableBertScore">
                                    <label class="form-check-label" for="enableBertScore">
                                        <i class="fas fa-calculator me-2"></i>BERT Score
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableRouge">
                                    <label class="form-check-label" for="enableRouge">
                                        <i class="fas fa-align-left me-2"></i>ROUGE Score
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableContains">
                                    <label class="form-check-label" for="enableContains">
                                        <i class="fas fa-search-plus me-2"></i>包含檢查
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableRegex">
                                    <label class="form-check-label" for="enableRegex">
                                        <i class="fas fa-code me-2"></i>正則表達式
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableWordCount">
                                    <label class="form-check-label" for="enableWordCount">
                                        <i class="fas fa-calculator me-2"></i>字數統計
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableSentiment">
                                    <label class="form-check-label" for="enableSentiment">
                                        <i class="fas fa-heart me-2"></i>情感分析
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableToxicity">
                                    <label class="form-check-label" for="enableToxicity">
                                        <i class="fas fa-shield-alt me-2"></i>毒性檢測
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableReadability">
                                    <label class="form-check-label" for="enableReadability">
                                        <i class="fas fa-eye me-2"></i>可讀性評估
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 右欄：Grader 評分 -->
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header bg-success text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-brain me-2"></i>grader評分
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info mb-3">
                                <i class="fas fa-info-circle me-2"></i>
                                如果你要使用 grader 評分，你需要配置 grader provider（評分者提供商），例如選用 OpenAI 並填寫對應的 API Key 和選擇模型等。
                            </div>

                            <!-- G-Eval 評分 -->
                            <div class="mb-3">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableGEval" onchange="toggleGEvalConfig()">
                                    <label class="form-check-label" for="enableGEval">
                                        <i class="fas fa-brain me-2"></i>G-Eval (LLM評分)
                                    </label>
                                </div>
                                <div id="gevalConfig" style="display: none;" class="mt-3">
                                    <div class="mb-3">
                                        <label class="form-label small">評分標準</label>
                                        <div id="gevalCriteriaList">
                                            <div class="input-group mb-2">
                                                <input type="text" class="form-control form-control-sm" placeholder="例如：回覆內容是否準確回答了用戶的問題">
                                                <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeGEvalCriteria(this)">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="addGEvalCriteria()">
                                            <i class="fas fa-plus"></i> 添加評分標準
                                        </button>
                                    </div>
                                    
                                    <hr class="my-3">
                                    <h6 class="text-success mb-3">
                                        <i class="fas fa-cogs me-2"></i>Grader Provider 配置
                                    </h6>
                                    <p class="text-muted small mb-3">選擇要使用哪個 LLM 服務來進行評分</p>
                                    
                                    <div class="mb-3">
                                        <label class="form-label small">選擇 LLM 提供者 *</label>
                                        <select class="form-select form-select-sm" id="llmProvider" onchange="updateLLMProviderConfig()" required>
                                            <option value="">請選擇 LLM 提供者</option>
                                            <option value="openai">OpenAI</option>
                                            <option value="anthropic">Anthropic (Claude)</option>
                                            <option value="azure-openai">Azure OpenAI</option>
                                            <option value="google">Google (Gemini)</option>
                                            <option value="custom">自定義 HTTP API</option>
                                        </select>
                                        <small class="form-text text-muted">這個 LLM 將用來評估被測試 API 的回覆品質</small>
                                    </div>
                                    
                                    <!-- LLM 提供者配置區域會在這裡動態顯示 -->
                                        <div id="llmProviderConfigArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="step-navigation mt-4">
                    <div class="d-flex justify-content-between">
                        <button type="button" class="btn btn-outline-secondary" onclick="prevStep(3)">
                        <i class="fas fa-arrow-left me-2"></i>上一步
                    </button>
                        <div class="btn-group">
                    <button type="button" class="btn btn-primary" onclick="saveConfiguration()">
                                <i class="fas fa-save me-2"></i><span id="saveButtonTextStep4">創建配置</span>
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="cancelConfigForm()">
                                <i class="fas fa-times me-2"></i>取消
                    </button>
                        </div>
                    </div>
                </div>
            </div>

            </form>
        </div>
    `;
}

// 步驟導航函數
function nextStep(stepNumber) {
    // 隱藏當前步驟
    const currentStep = document.querySelector('.form-step[style*="display: block"]');
    if (currentStep) {
        currentStep.style.display = 'none';
    }
    
    // 顯示目標步驟
    const targetStep = document.getElementById('step' + stepNumber);
    if (targetStep) {
        targetStep.style.display = 'block';
    }
    
    // 更新進度指示器
    updateProgressSteps(stepNumber);
    
    // 如果進入步驟3且有配置數據，重新顯示測試問題信息
    if (stepNumber === 3 && selectedConfig && selectedConfig.content) {
        showCurrentTestInfo(selectedConfig.content);
    }
}

function prevStep(stepNumber) {
    // 隱藏當前步驟
    const currentStep = document.querySelector('.form-step[style*="display: block"]');
    if (currentStep) {
        currentStep.style.display = 'none';
    }
    
    // 顯示目標步驟
    const targetStep = document.getElementById('step' + stepNumber);
    if (targetStep) {
        targetStep.style.display = 'block';
    }
    
    // 更新進度指示器
    updateProgressSteps(stepNumber);
    
    // 如果回到步驟3且有配置數據，重新顯示測試問題信息
    if (stepNumber === 3 && selectedConfig && selectedConfig.content) {
        showCurrentTestInfo(selectedConfig.content);
    }
}

function updateProgressSteps(activeStep) {
    // 移除所有步驟的 active 類
    const steps = document.querySelectorAll('.progress-steps .step');
    steps.forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    // 標記完成的步驟和當前步驟
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        if (stepNum < activeStep) {
            step.classList.add('completed');
        } else if (stepNum === activeStep) {
            step.classList.add('active');
        }
    });
}

// 直接跳轉到指定步驟
function jumpToStep(stepNumber) {
    // 隱藏當前步驟
    const currentStep = document.querySelector('.form-step[style*="display: block"]');
    if (currentStep) {
        currentStep.style.display = 'none';
    }
    
    // 顯示目標步驟
    const targetStep = document.getElementById('step' + stepNumber);
    if (targetStep) {
        targetStep.style.display = 'block';
    }
    
    // 更新進度指示器
    updateProgressSteps(stepNumber);
    
    // 如果跳轉到步驟3且有配置數據，重新顯示測試問題信息
    if (stepNumber === 3 && selectedConfig && selectedConfig.content) {
        showCurrentTestInfo(selectedConfig.content);
    }
}


// 處理CSV上傳
function handleCSVUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // 檢查是否有 prompt 欄位
        const promptIndex = headers.findIndex(h => h.toLowerCase() === 'prompt');
        if (promptIndex === -1) {
            showAlert('CSV檔案必須包含 "prompt" 欄位', 'danger');
            return;
        }
        
        // 顯示預覽
        const preview = document.getElementById('csvPreview');
        const table = document.getElementById('csvPreviewTable');
        
        let tableHTML = '<thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        // 顯示前5行數據
        for (let i = 1; i < Math.min(6, lines.length); i++) {
            if (lines[i].trim()) {
                const cells = lines[i].split(',').map(c => c.trim());
                tableHTML += '<tr>';
                cells.forEach(cell => {
                    tableHTML += `<td>${cell}</td>`;
                });
                tableHTML += '</tr>';
            }
        }
        
        tableHTML += '</tbody>';
        table.innerHTML = tableHTML;
        preview.style.display = 'block';
        
        showAlert(`成功載入CSV檔案，包含 ${lines.length - 1} 個測試問題`, 'success');
    };
    
    reader.readAsText(file);
}

// 測試API功能
async function testAPI() {
    const testButton = document.getElementById('testAPIButton');
    const testResult = document.getElementById('testResult');
    const testError = document.getElementById('testError');
    const testQuestion = document.getElementById('testQuestion').value.trim();
    
    if (!testQuestion) {
        showAlert('請輸入測試問題', 'warning');
        return;
    }
    
    // 隱藏之前的結果
    testResult.style.display = 'none';
    testError.style.display = 'none';
    
    // 設置按鈕為載入狀態
    testButton.disabled = true;
    testButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>測試中...';
    
    try {
        // 收集API配置
        const apiConfig = collectAPIConfig();
        
        console.log('收集到的API配置:', apiConfig);
        
        if (!apiConfig.isValid) {
            throw new Error(apiConfig.error);
        }
        
        // 構建請求
        const requestConfig = buildAPIRequest(apiConfig, testQuestion);
        
        console.log('構建的請求配置:', requestConfig);
        console.log('測試問題:', testQuestion);
        console.log('Request Body 替換後:', requestConfig.body);
        
        // 顯示請求詳情
        document.getElementById('requestDetails').textContent = 
            `${requestConfig.method} ${requestConfig.url}`;
        
        // 發送測試請求
        const startTime = Date.now();
        const response = await fetch('/api/test-api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestConfig)
        });
        
        const responseTime = Date.now() - startTime;
        const result = await response.json();
        
        console.log('API測試結果:', result);
        
        if (response.ok && result.success) {
            // 顯示成功結果
            displayTestSuccess(result, responseTime, apiConfig.transformResponse);
        } else {
            // 顯示錯誤
            throw new Error(result.error || '測試失敗');
        }
        
    } catch (error) {
        console.error('API測試錯誤:', error);
        displayTestError(error.message);
    } finally {
        // 恢復按鈕狀態
        testButton.disabled = false;
        testButton.innerHTML = '<i class="fas fa-play me-2"></i>測試API';
    }
}

// 收集API配置
function collectAPIConfig() {
    try {
        // 從表單獲取基本配置
        const useHttps = document.getElementById('useHttps')?.checked || false;
        const httpMethod = document.getElementById('httpMethod')?.value || 'POST';
        const httpPath = document.getElementById('httpPath')?.value?.trim();
        const httpHost = document.getElementById('httpHost')?.value?.trim();
        const httpContentType = document.getElementById('httpContentType')?.value?.trim();
        const authType = document.getElementById('authType')?.value;
        const authValue = document.getElementById('authValue')?.value?.trim();
        const requestBody = document.getElementById('requestBody')?.value?.trim();
        const transformResponse = document.getElementById('transformResponse')?.value?.trim();
        
        // 檢查必填欄位
        if (!httpHost) {
            return { isValid: false, error: '請填寫Host' };
        }
        
        if (!httpPath) {
            return { isValid: false, error: '請填寫HTTP路徑' };
        }
        
        if (!requestBody) {
            return { isValid: false, error: '請填寫Request Body' };
        }
        
        if (!requestBody.includes('{{prompt}}')) {
            return { isValid: false, error: 'Request Body必須包含{{prompt}}變量' };
        }
        
        return {
            isValid: true,
            useHttps,
            httpMethod,
            httpPath,
            httpHost,
            httpContentType,
            authType,
            authValue,
            requestBody,
            transformResponse
        };
    } catch (error) {
        return { isValid: false, error: '配置格式錯誤: ' + error.message };
    }
}

// 解析原始HTTP請求格式
function parseRawHttpRequest(requestText) {
    try {
        const lines = requestText.split('\n');
        let method = 'POST';
        let path = '/';
        let host = '';
        let useHttps = false;
        let contentType = 'application/json';
        let authorization = '';
        let body = '';
        let transformResponse = document.getElementById('transformResponse')?.value?.trim();
        
        let inBody = false;
        let bodyLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (i === 0) {
                // 第一行：方法和路徑
                const parts = line.split(' ');
                if (parts.length >= 2) {
                    method = parts[0];
                    path = parts[1];
                }
            } else if (line === '') {
                // 空行表示headers結束，body開始
                inBody = true;
            } else if (!inBody) {
                // Headers
                if (line.toLowerCase().startsWith('host:')) {
                    host = line.substring(5).trim();
                } else if (line.toLowerCase().startsWith('content-type:')) {
                    contentType = line.substring(13).trim();
                } else if (line.toLowerCase().startsWith('authorization:')) {
                    authorization = line.substring(14).trim();
                }
            } else {
                // Body
                bodyLines.push(line);
            }
        }
        
        body = bodyLines.join('\n').trim();
        
        // 檢查HTTPS
        if (host.includes('api.deepseek.com') || host.includes('api.openai.com')) {
            useHttps = true;
        }
        
        if (!host) {
            return { isValid: false, error: '無法解析Host' };
        }
        
        if (!body.includes('{{prompt}}')) {
            return { isValid: false, error: 'Request Body必須包含{{prompt}}變量' };
        }
        
        return {
            isValid: true,
            isRawRequest: true,
            useHttps,
            httpMethod: method,
            httpPath: path,
            httpHost: host,
            httpContentType: contentType,
            authorization,
            requestBody: body,
            transformResponse
        };
        
    } catch (error) {
        return { isValid: false, error: '解析HTTP請求格式錯誤: ' + error.message };
    }
}

// 構建API請求
function buildAPIRequest(config, testQuestion) {
    const protocol = config.useHttps ? 'https' : 'http';
    const url = `${protocol}://${config.httpHost}${config.httpPath.startsWith('/') ? config.httpPath : '/' + config.httpPath}`;
    
    console.log('構建URL詳情:');
    console.log('  - protocol:', protocol);
    console.log('  - host:', config.httpHost);
    console.log('  - path:', config.httpPath);
    console.log('  - 最終URL:', url);
    
    // 構建headers
    const headers = {
        'Content-Type': config.httpContentType || 'application/json'
    };
    
    // 添加認證
    if (config.authType && config.authValue) {
        switch (config.authType) {
            case 'bearer':
                headers['Authorization'] = `Bearer ${config.authValue}`;
                break;
            case 'basic':
                headers['Authorization'] = `Basic ${btoa(config.authValue)}`;
                break;
            case 'apikey':
                headers['Authorization'] = `Bearer ${config.authValue}`;
                break;
            case 'custom':
                headers['Authorization'] = config.authValue;
                break;
        }
    }
    
    console.log('構建的headers:', headers);
    
    // 替換prompt變量
    const body = config.requestBody.replace(/\{\{prompt\}\}/g, testQuestion);
    
    console.log('原始body:', config.requestBody);
    console.log('替換後body:', body);
    
    return {
        method: config.httpMethod,
        url: url,
        headers: headers,
        body: body,
        transformResponse: config.transformResponse
    };
}

// 顯示測試成功結果
function displayTestSuccess(result, responseTime, transformResponse) {
    const testResult = document.getElementById('testResult');
    const apiResponse = document.getElementById('apiResponse');
    const transformedResult = document.getElementById('transformedResult');
    
    // 只顯示根據transformResponse處理後的內容
    if (transformResponse && result.transformedResponse !== null && result.transformedResponse !== undefined) {
        // 顯示處理後的結果
        apiResponse.textContent = result.transformedResponse;
        
        // 更新標籤
        const apiResponseLabel = document.querySelector('label[for="apiResponse"]');
        if (apiResponseLabel) apiResponseLabel.textContent = 'API回應';
    } else {
        // 如果沒有transform或transform失敗，顯示錯誤信息
        apiResponse.textContent = 'Transform處理失敗或未配置，請檢查transformResponse設定';
        
        const apiResponseLabel = document.querySelector('label[for="apiResponse"]');
        if (apiResponseLabel) apiResponseLabel.textContent = 'API回應';
    }
    
    // 隱藏原始回應區域
    transformedResult.style.display = 'none';
    
    // 更新請求詳情，添加響應時間
    const requestDetails = document.getElementById('requestDetails');
    requestDetails.innerHTML = `${requestDetails.textContent} <span class="badge bg-success ms-2">${responseTime}ms</span>`;
    
    testResult.style.display = 'block';
    showAlert('API測試成功！', 'success');
}

// 顯示測試錯誤
function displayTestError(errorMessage) {
    const testError = document.getElementById('testError');
    const errorMessageElement = document.getElementById('errorMessage');
    
    errorMessageElement.textContent = errorMessage;
    testError.style.display = 'block';
    showAlert('API測試失敗', 'error');
}

// 創建/更新配置
async function saveConfiguration() {
    try {
        // 獲取配置名稱
        const configName = document.getElementById('configName').value;
        if (!configName.trim()) {
            showAlert('請輸入配置名稱', 'error');
            return;
        }
        
        // 生成配置內容
        const configContent = generateConfigFromForm();
        
        // 檢查是否有上傳的檔案
        let uploadedFile = null;
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput && csvFileInput.files.length > 0) {
            const file = csvFileInput.files[0];
            const fileContent = await readFileAsBase64(file);
            uploadedFile = {
                filename: file.name,
                content: fileContent
            };
        }
        
        // 判斷是創建新配置還是更新現有配置
        const isEdit = selectedConfig && selectedConfig.id;
        const url = isEdit ? `/api/configs/${selectedConfig.id}` : '/api/configs';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: configName,
                content: configContent,
                uploadedFile: uploadedFile
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert(isEdit ? '配置儲存成功！' : '配置創建成功！', 'success');
            // 刷新配置列表
            loadConfigs();
            
            if (isEdit) {
                // 編輯模式，重新載入配置詳情
                await selectConfig(selectedConfig.id);
            } else {
                // 新增模式，關閉表單
            cancelConfigForm();
            }
        } else {
            showAlert(`配置${isEdit ? '儲存' : '創建'}失敗: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error(`配置${selectedConfig && selectedConfig.id ? '儲存' : '創建'}時發生錯誤:`, error);
        showAlert(`配置${selectedConfig && selectedConfig.id ? '儲存' : '創建'}失敗: ` + error.message, 'error');
    }
}

// 顯示當前測試問題信息
function showCurrentTestInfo(yamlContent) {
    let testInfoHtml = '';
    
    // 優先檢查 tests: 是否有具體檔案
    if (yamlContent.includes('tests:')) {
        const testsMatch = yamlContent.match(/tests:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
        if (testsMatch) {
            const tests = testsMatch[1].trim().split('\n')
                .map(line => line.replace(/^\s*-\s*/, ''))
                .filter(line => line.trim());
            if (tests.length > 0) {
                // 解析檔案名稱（處理 file:// 前綴）
                const fileNames = tests.map(file => {
                    if (file.startsWith('file://')) {
                        return file.replace('file://', '');
                    }
                    return file;
                });
                
                testInfoHtml = `
                    <div class="alert alert-info mb-4">
                        <i class="fas fa-file-csv me-2"></i>
                        <strong>目前已配置的測試檔案：</strong>
                        <ul class="mb-0 mt-2">
                            ${fileNames.map(file => `<li><code>${file}</code></li>`).join('')}
                        </ul>
                        <small class="text-muted d-block mt-2">
                            <i class="fas fa-lightbulb me-1"></i>
                            如果要更改測試問題，可以上傳新的 CSV 檔案替換現有配置，或切換到手動輸入模式
                        </small>
                    </div>
                `;
            }
        }
    }
    // 如果沒有 tests: 或 tests: 為空，再檢查 prompts:
    else if (yamlContent.includes('prompts:')) {
        const promptsMatch = yamlContent.match(/prompts:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
        if (promptsMatch) {
            const prompts = promptsMatch[1].trim().split('\n')
                .map(line => line.replace(/^\s*-\s*["']?/, '').replace(/["']$/, ''))
                .filter(line => line.trim() && !line.includes('{{question}}') && !line.includes('{{prompt}}'));
            
            if (prompts.length > 0) {
                testInfoHtml = `
                    <div class="alert alert-success mb-4">
                        <i class="fas fa-list-ul me-2"></i>
                        <strong>目前已配置 ${prompts.length} 個測試問題：</strong>
                        <div class="mt-2 p-2 bg-light rounded">
                            ${prompts.slice(0, 3).map((prompt, index) => `<div class="small mb-1"><strong>${index + 1}.</strong> ${prompt}</div>`).join('')}
                            ${prompts.length > 3 ? `<div class="small text-muted">... 還有 ${prompts.length - 3} 個問題</div>` : ''}
                        </div>
                        <small class="text-muted d-block mt-2">
                            <i class="fas fa-lightbulb me-1"></i>
                            如果要修改問題，可以在手動輸入區域重新編輯
                        </small>
                    </div>
                `;
            } else {
                testInfoHtml = `
                    <div class="alert alert-warning mb-4">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>檢測到 prompts 配置但沒有具體問題</strong>
                    </div>
                `;
            }
        }
    }
    
    // 將測試問題提醒插入到測試問題配置區域
    if (testInfoHtml) {
        // 使用 setTimeout 確保 DOM 已經渲染完成
        setTimeout(() => {
            // 尋找步驟3的測試問題配置區域
            const step3 = document.getElementById('step3');
            if (step3) {
                // 移除舊的提醒
                const existingAlert = step3.querySelector('.alert');
                if (existingAlert) {
                    existingAlert.remove();
                }
                
                // 在步驟標題後插入提醒
                const stepHeader = step3.querySelector('.step-header');
                if (stepHeader) {
                    const infoDiv = document.createElement('div');
                    infoDiv.innerHTML = testInfoHtml;
                    stepHeader.insertAdjacentElement('afterend', infoDiv.firstElementChild);
                }
            } else {
                // 如果不是步驟式界面，使用原來的邏輯
            const questionConfigTitle = Array.from(document.querySelectorAll('h6')).find(h6 => 
                h6.textContent.includes('測試問題配置')
            );
            
            if (questionConfigTitle) {
                // 移除舊的提醒
                const existingAlert = questionConfigTitle.parentElement.querySelector('.alert');
                if (existingAlert) {
                    existingAlert.remove();
                }
                
                // 在測試問題配置標題後插入提醒
                const infoDiv = document.createElement('div');
                infoDiv.innerHTML = testInfoHtml;
                questionConfigTitle.parentElement.insertBefore(infoDiv.firstElementChild, questionConfigTitle.nextElementSibling);
            }
            }
        }, 200); // 增加延遲時間確保 DOM 完全渲染
    }
}

// 將配置載入到表單中
async function loadConfigToForm(config) {
    try {
        console.log('開始載入配置到表單:', config);
        
        // 解析 YAML 配置
        const yamlContent = config.content;
        console.log('YAML 內容:', yamlContent);
        
        // 檢查並顯示當前配置的測試問題信息
        showCurrentTestInfo(yamlContent);
        
        // 基本資訊
        const descriptionMatch = yamlContent.match(/description:\s*["']?([^"'\n]+)["']?/);
        if (descriptionMatch) {
            document.getElementById('configName').value = descriptionMatch[1];
            console.log('設置配置名稱:', descriptionMatch[1]);
        }
        
        // 檢查是否有 providers 配置（格式一）
        if (yamlContent.includes('providers:')) {
            // 解析 useHttps 配置
            const useHttpsMatch = yamlContent.match(/useHttps:\s*(true|false)/);
            if (useHttpsMatch) {
                document.getElementById('useHttps').checked = useHttpsMatch[1] === 'true';
            }
            
            // 解析 request 格式
            const requestMatch = yamlContent.match(/request:\s*\|\s*\n((?:.*\n)*?)(?=\n\s*transformResponse|\n\s*[a-zA-Z]|\n\s*$)/);
            if (requestMatch) {
                const requestLines = requestMatch[1].trim().split('\n');
                
                // 解析第一行：POST /chat/completions HTTP/1.1
                if (requestLines.length > 0) {
                    const firstLine = requestLines[0].trim();
                    const methodMatch = firstLine.match(/^(\w+)\s+([^\s]+)(?:\s+HTTP\/[\d.]+)?$/);
                    if (methodMatch) {
                        document.getElementById('httpMethod').value = methodMatch[1];
                        document.getElementById('httpPath').value = methodMatch[2];
                        console.log('解析到的方法:', methodMatch[1]);
                        console.log('解析到的路徑:', methodMatch[2]);
                    }
                }
                
                // 解析 Host
                const hostLine = requestLines.find(line => line.trim().startsWith('Host:'));
                if (hostLine) {
                    const hostValue = hostLine.replace('Host:', '').trim();
                    document.getElementById('httpHost').value = hostValue;
                }
                
                // 解析 Content-Type
                const contentTypeLine = requestLines.find(line => line.trim().startsWith('Content-Type:'));
                if (contentTypeLine) {
                    const contentTypeValue = contentTypeLine.replace('Content-Type:', '').trim();
                    document.getElementById('httpContentType').value = contentTypeValue;
                }
                
                // 解析 Authorization
                const authLine = requestLines.find(line => line.trim().startsWith('Authorization:'));
                if (authLine) {
                    const authValue = authLine.replace('Authorization:', '').trim();
                    if (authValue.startsWith('Bearer ')) {
                        document.getElementById('authType').value = 'bearer';
                        document.getElementById('authValue').value = authValue.replace('Bearer ', '');
                    } else if (authValue.startsWith('Basic ')) {
                        document.getElementById('authType').value = 'basic';
                        document.getElementById('authValue').value = authValue.replace('Basic ', '');
                    } else {
                        document.getElementById('authType').value = 'custom';
                        document.getElementById('authValue').value = authValue;
                    }
                }
                
                
                // 解析 body
                const bodyStart = requestLines.findIndex(line => line.trim() === '');
                if (bodyStart !== -1 && bodyStart < requestLines.length - 1) {
                    const bodyLines = requestLines.slice(bodyStart + 1);
                    // 過濾掉 transformResponse 相關的內容和空白行
                    const filteredBodyLines = bodyLines.filter(line => 
                        !line.trim().startsWith('transformResponse:') && 
                        line.trim() !== ''
                    );
                    // 移除開頭的空白行
                    const trimmedBodyLines = filteredBodyLines.filter((line, index) => {
                        // 如果是第一行且為空，則跳過
                        if (index === 0 && line.trim() === '') {
                            return false;
                        }
                        return true;
                    });
                    
                    const bodyText = trimmedBodyLines.join('\n');
                    
                    // 直接設置 Request Body 內容
                    document.getElementById('requestBody').value = bodyText;
                }
            }
            
            // 解析 transformResponse
            const transformMatch = yamlContent.match(/transformResponse:\s*([^\n]+)/);
            if (transformMatch) {
                document.getElementById('transformResponse').value = transformMatch[1].trim();
            }
        }
        
        // 測試問題信息已在 showCurrentTestInfo 函數中處理
        
        // 檢查評分標準
        if (yamlContent.includes('assert:')) {
            // 檢查 JavaScript 驗證
            if (yamlContent.includes('type: javascript')) {
                document.getElementById('enableJavascript').checked = true;
                toggleJavascriptConfig();
                
                const jsMatch = yamlContent.match(/type:\s*javascript\s*\n\s*value:\s*([^\n]+)/);
                if (jsMatch) {
                    const jsValue = jsMatch[1].trim();
                    if (jsValue.includes('length')) {
                        document.getElementById('javascriptCondition').value = 'length';
                        updateJavascriptCondition();
                        
                        const lengthMatch = jsValue.match(/length\s*>=\s*(\d+)/);
                        if (lengthMatch) {
                            document.getElementById('minLength').value = lengthMatch[1];
                        }
                    } else {
                        document.getElementById('javascriptCondition').value = 'custom';
                        updateJavascriptCondition();
                        document.getElementById('customJavascript').value = jsValue;
                    }
                }
            }
            
            // 檢查 G-Eval
            if (yamlContent.includes('type: g-eval') || yamlContent.includes('type: llm-rubric')) {
                document.getElementById('enableGEval').checked = true;
                toggleGEvalConfig();
                
                // 嘗試解析 G-Eval 配置
                const gevalMatch = yamlContent.match(/type:\s*(?:g-eval|llm-rubric)\s*\n\s*value:\s*([^\n]+)/);
                if (gevalMatch) {
                    // 清空現有的評分標準列表
                    const gevalCriteriaList = document.getElementById('gevalCriteriaList');
                    gevalCriteriaList.innerHTML = '';
                    
                    // 解析多行評分標準
                    const valueSection = yamlContent.match(/type:\s*(?:g-eval|llm-rubric)\s*\n\s*value:\s*\n((?:\s*-\s*.*\n?)*)/);
                    if (valueSection) {
                        const criteria = valueSection[1].trim().split('\n')
                            .map(line => line.replace(/^\s*-\s*["']?/, '').replace(/["']$/, ''))
                            .filter(line => line.trim());
                        
                        criteria.forEach(criterion => {
                            addGEvalCriteria();
                            const criteriaInputs = document.querySelectorAll('#gevalCriteriaList .input-group:last-child input');
                            if (criteriaInputs.length > 0) {
                                criteriaInputs[0].value = criterion;
                            }
                        });
                    } else {
                        // 單行評分標準
                        addGEvalCriteria();
                        const criteriaInputs = document.querySelectorAll('#gevalCriteriaList .input-group:last-child input');
                        if (criteriaInputs.length > 0) {
                            criteriaInputs[0].value = gevalMatch[1].replace(/["']/g, '');
                        }
                    }
                }
            }
        }
        
        console.log('配置已成功載入到表單');
        
    } catch (error) {
        console.error('載入配置到表單失敗:', error);
        showAlert('載入配置到表單失敗', 'danger');
    }
}


// 重置評分標準列表
function resetScoringCriteriaList() {
    // 重置 API 配置（安全檢查避免null錯誤）
    const httpPath = document.getElementById('httpPath');
    const httpHost = document.getElementById('httpHost');
    const httpContentType = document.getElementById('httpContentType');
    const requestBody = document.getElementById('requestBody');
    const transformResponse = document.getElementById('transformResponse');
    
    if (httpPath) httpPath.value = '';
    if (httpHost) httpHost.value = '';
    if (httpContentType) httpContentType.value = 'application/json';
    if (requestBody) requestBody.value = '';
    if (transformResponse) transformResponse.value = 'json.response';
    
    // 重置問題輸入方式（安全檢查）
    const questionSourceManual = document.getElementById('questionSourceManual');
    const testQuestions = document.getElementById('testQuestions');
    const questionFile = document.getElementById('questionFile');
    
    if (questionSourceManual) questionSourceManual.checked = true;
    if (testQuestions) testQuestions.value = '';
    if (questionFile) questionFile.value = '';
    
    try {
        toggleQuestionInput();
    } catch (e) {
        console.log('toggleQuestionInput 函數調用失敗:', e);
    }
    
    // 重置 JavaScript 配置（安全檢查）
    const enableJavascript = document.getElementById('enableJavascript');
    const javascriptConfig = document.getElementById('javascriptConfig');
    const javascriptCondition = document.getElementById('javascriptCondition');
    const minLength = document.getElementById('minLength');
    const customJavascript = document.getElementById('customJavascript');
    
    if (enableJavascript) enableJavascript.checked = false;
    if (javascriptConfig) javascriptConfig.style.display = 'none';
    if (javascriptCondition) javascriptCondition.value = 'length';
    if (minLength) minLength.value = '100';
    if (customJavascript) customJavascript.value = '';
    updateJavascriptCondition();
    
    // 重置 G-Eval 配置
    document.getElementById('enableGEval').checked = false;
    document.getElementById('gevalConfig').style.display = 'none';
    document.getElementById('gradingModelType').value = 'openai';
    document.getElementById('openaiModel').value = 'gpt-4';
    document.getElementById('gradingApiUrl').value = '';
    document.getElementById('gradingApiKey').value = '';
    document.getElementById('gradingModel').value = '';
    document.getElementById('gradingTransformResponse').value = 'json.choices[0].message.content';
    updateGradingModelFields();
    
    // 重置 G-Eval 評分標準列表
    const gevalCriteriaList = document.getElementById('gevalCriteriaList');
    gevalCriteriaList.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" placeholder="例如：不回答與旅行無關的問題">
            <button type="button" class="btn btn-outline-danger" onclick="removeGEvalCriteria(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}











// 預覽配置
function previewConfig() {
    const config = generateConfigFromForm();
    const preview = document.getElementById('configPreview');
    preview.textContent = config;
    new bootstrap.Modal(document.getElementById('configPreviewModal')).show();
}

// 從表單生成配置
function generateConfigFromForm() {
    const configName = document.getElementById('configName').value;
    
    // 獲取被測API配置
    const useHttps = document.getElementById('useHttps').checked;
    const httpMethod = document.getElementById('httpMethod').value;
    const httpPath = document.getElementById('httpPath').value;
    const httpHost = document.getElementById('httpHost').value;
    const httpContentType = document.getElementById('httpContentType').value;
    const authType = document.getElementById('authType').value;
    const authValue = document.getElementById('authValue').value;
    const transformResponse = document.getElementById('transformResponse').value;
    
    // 獲取 Request Body（直接使用原始文本）
    const requestBody = document.getElementById('requestBody').value;
    
    // 獲取測試問題配置
    const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
    const questionSource = questionSourceRadio ? questionSourceRadio.value : 'manual';
    let testsConfig = '';
    
    if (questionSource === 'manual') {
        // 手動輸入模式：生成 prompts 配置
        const testQuestions = document.getElementById('testQuestions').value;
        const questions = testQuestions.split('\n').filter(q => q.trim()).map(q => q.trim());
        if (questions.length > 0) {
            testsConfig = questions.map(q => `  - "${q}"`).join('\n');
        }
    } else if (questionSource === 'upload') {
        // 檔案上傳模式：生成 tests 配置
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput && csvFileInput.files.length > 0) {
            const questionFile = csvFileInput.files[0];
            testsConfig = `  - file://${questionFile.name}`;
        }
    }
    
    // 生成Providers配置（格式一）
    let providersConfig = '';
    
    if (httpPath && httpHost && httpContentType && requestBody) {
        providersConfig = `providers:
  - id: https
    config:`;
        
        // 添加 useHttps 配置
        if (useHttps) {
            providersConfig += `\n      useHttps: true`;
        }
        
        // 構建 request 內容
        const trimmedRequestBody = requestBody.trim();
        let requestContent = `${httpMethod} ${httpPath}\nHost: ${httpHost}\nContent-Type: ${httpContentType}`;
        
        // 添加 Authorization header
        if (authType !== 'none' && authValue) {
            let authHeader = '';
            switch (authType) {
                case 'bearer':
                    authHeader = `Authorization: Bearer ${authValue}`;
                    break;
                case 'basic':
                    authHeader = `Authorization: Basic ${authValue}`;
                    break;
                case 'apikey':
                    authHeader = `Authorization: ${authValue}`;
                    break;
                case 'custom':
                    authHeader = `Authorization: ${authValue}`;
                    break;
            }
            if (authHeader) {
                requestContent += `\n${authHeader}`;
            }
        }
        
        
        // 添加空行和 body
        requestContent += '\n';
        
        // 為 JSON body 添加正確的縮排
        if (trimmedRequestBody) {
            // 先格式化 JSON（如果是有效的 JSON）
            let formattedBody = trimmedRequestBody;
            try {
                const jsonObj = JSON.parse(trimmedRequestBody);
                formattedBody = JSON.stringify(jsonObj, null, 2);
            } catch (e) {
                // 不是有效的 JSON，保持原樣
                formattedBody = trimmedRequestBody;
            }
            requestContent += `\n${formattedBody}`;
        }
        
        // 添加 request 配置，統一縮排處理
        providersConfig += `\n      request: |\n${requestContent.split('\n').map(line => `        ${line}`).join('\n')}`;
        
        // 添加 transformResponse
        if (transformResponse.trim()) {
            providersConfig += `\n      transformResponse: ${transformResponse}`;
        }
    }
    
    // 生成評分標準配置
    let assertConfig = '';
    const asserts = [];
    
    // JavaScript 評分
    if (document.getElementById('enableJavascript').checked) {
        const condition = document.getElementById('javascriptCondition').value;
        if (condition === 'length') {
            const minLength = document.getElementById('minLength').value;
            asserts.push(`  - type: javascript
    value: output.length >= ${minLength}`);
        } else if (condition === 'custom') {
            const customJs = document.getElementById('customJavascript').value;
            if (customJs.trim()) {
                asserts.push(`  - type: javascript
    value: ${customJs.trim()}`);
            }
        }
    }
    
    // 檢查是否有選擇任何 Metric 評分選項
    const hasMetricScoring = document.getElementById('enableJavascript').checked ||
                            document.getElementById('enableFactuality').checked ||
                            document.getElementById('enableSimilarity').checked ||
                            document.getElementById('enableBertScore').checked ||
                            document.getElementById('enableRouge').checked ||
                            document.getElementById('enableContains').checked ||
                            document.getElementById('enableRegex').checked ||
                            document.getElementById('enableWordCount').checked ||
                            document.getElementById('enableSentiment').checked ||
                            document.getElementById('enableToxicity').checked ||
                            document.getElementById('enableReadability').checked;
    
    if (hasMetricScoring) {
        // Metric 評分 - 添加各種預設指標
        
        // 事實性檢查
        if (document.getElementById('enableFactuality') && document.getElementById('enableFactuality').checked) {
            asserts.push(`  - type: factuality
    value: "{{expected_answer}}"`);
        }
        
        // 語義相似度
        if (document.getElementById('enableSimilarity') && document.getElementById('enableSimilarity').checked) {
            asserts.push(`  - type: similar
    value: "{{expected_answer}}"
    threshold: 0.8`);
        }
        
        // BERT Score
        if (document.getElementById('enableBertScore') && document.getElementById('enableBertScore').checked) {
            asserts.push(`  - type: python
    value: get_assert_bert_f1(output, "{{expected_answer}}")
    threshold: 0.7`);
        }
        
        // ROUGE Score
        if (document.getElementById('enableRouge') && document.getElementById('enableRouge').checked) {
            asserts.push(`  - type: rouge
    value: "{{expected_answer}}"
    threshold: 0.6`);
        }
        
        // 包含檢查
        if (document.getElementById('enableContains') && document.getElementById('enableContains').checked) {
            asserts.push(`  - type: contains
    value: "{{expected_keywords}}"`);
        }
        
        // 正則表達式
        if (document.getElementById('enableRegex') && document.getElementById('enableRegex').checked) {
            asserts.push(`  - type: regex
    value: "^[\\s\\S]*台電[\\s\\S]*$"`);
        }
        
        // 字數統計
        if (document.getElementById('enableWordCount') && document.getElementById('enableWordCount').checked) {
            asserts.push(`  - type: javascript
    value: output.length >= 50 && output.length <= 500`);
        }
        
        // 情感分析
        if (document.getElementById('enableSentiment') && document.getElementById('enableSentiment').checked) {
            asserts.push(`  - type: sentiment
    value: positive
    threshold: 0.5`);
        }
        
        // 毒性檢測
        if (document.getElementById('enableToxicity') && document.getElementById('enableToxicity').checked) {
            asserts.push(`  - type: toxicity
    threshold: 0.1`);
        }
        
        // 可讀性評估
        if (document.getElementById('enableReadability') && document.getElementById('enableReadability').checked) {
            asserts.push(`  - type: readability
    threshold: 60`);
        }
    }
    
    // 檢查是否有選擇 LLM Grader 評分
    const hasLLMScoring = document.getElementById('enableGEval').checked;
    
    if (hasLLMScoring) {
        // LLM Grader 評分 - G-Eval
        if (document.getElementById('enableGEval') && document.getElementById('enableGEval').checked) {
        const criteriaInputs = document.querySelectorAll('#gevalCriteriaList input[type="text"]');
        const criteria = [];
        criteriaInputs.forEach(input => {
            if (input.value.trim()) {
                criteria.push(input.value.trim());
            }
        });
        
        if (criteria.length > 0) {
            let gevalConfig = `  - type: g-eval
    value:`;
            criteria.forEach(criterion => {
                gevalConfig += `\n      - ${criterion}`;
            });
            
                // 添加 LLM 提供者配置
                const llmProvider = document.getElementById('llmProvider').value;
                if (llmProvider) {
                    gevalConfig += `\n    options:
      provider: `;
                    
                    switch (llmProvider) {
                        case 'openai':
                            const openaiModel = document.getElementById('openaiModel').value;
                            gevalConfig += `openai:${openaiModel}`;
                            break;
                        case 'anthropic':
                            const anthropicModel = document.getElementById('anthropicModel').value;
                            gevalConfig += `anthropic:${anthropicModel}`;
                            break;
                        case 'azure-openai':
                            const azureDeployment = document.getElementById('azureDeployment').value;
                            gevalConfig += `azure:${azureDeployment}`;
                            break;
                        case 'google':
                            const googleModel = document.getElementById('googleModel').value;
                            gevalConfig += `google:${googleModel}`;
                            break;
                        case 'custom':
                            gevalConfig += `http`;
                            break;
                }
            }
            
            asserts.push(gevalConfig);
            }
        }
    }
    
    if (asserts.length > 0) {
        assertConfig = 'assert:\n' + asserts.join('\n');
    }
    
    // 生成完整配置
    let config = `description: "${configName}"`;

    if (providersConfig) {
        config += `\n\n${providersConfig}`;
    }
    
    // 處理測試問題配置 - 保留原有的 prompts 和 tests 欄位
    if (testsConfig) {
        if (questionSource === 'manual') {
            // 手動輸入模式：使用 prompts
            config += `\n\nprompts:\n${testsConfig}`;
        } else if (questionSource === 'upload') {
            // 檔案上傳模式：使用 tests
            config += `\n\ntests:\n${testsConfig}`;
        }
    }
    
    // 如果沒有新的測試配置，但原有配置中有 prompts 或 tests，需要保留
    if (!testsConfig && selectedConfig) {
        const originalContent = selectedConfig.content;
        
        // 檢查原有配置中是否有 prompts
        if (originalContent.includes('prompts:')) {
            const promptsMatch = originalContent.match(/prompts:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
            if (promptsMatch) {
                const promptsContent = promptsMatch[1].trim();
                if (promptsContent) {
                    config += `\n\nprompts:\n${promptsContent}`;
                }
            }
        }
        
        // 檢查原有配置中是否有 tests
        if (originalContent.includes('tests:')) {
            const testsMatch = originalContent.match(/tests:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
            if (testsMatch) {
                const testsContent = testsMatch[1].trim();
                if (testsContent) {
                    config += `\n\ntests:\n${testsContent}`;
                }
            }
        }
    }
    
    // 如果有評分標準，使用 defaultTest 格式
    if (assertConfig) {
        // 檢查是否有 G-Eval 評分
        const hasGEval = document.getElementById('enableGEval') && document.getElementById('enableGEval').checked;
        
        if (hasGEval) {
            // 有 LLM Grader 評分，需要添加 grader 提供者配置
            const llmProvider = document.getElementById('llmProvider').value;
            const graderConfig = generateGraderProviderConfig(llmProvider);
            
            if (graderConfig) {
                config += `\n\n# LLM Grader 提供者配置\n${graderConfig}`;
            }
            
            config += `\n\ndefaultTest:\n  ${assertConfig}`;
        } else {
            // 沒有 LLM Grader 評分，只需要 assert 配置
            config += `\n\ndefaultTest:\n  ${assertConfig}`;
        }
    }
    
    console.log('最終生成的配置:', config);
    return config;
}

// 生成 LLM Grader 提供者配置
function generateGraderProviderConfig(provider) {
    if (!provider) return null;
    
    let providerConfig = '';
    
    switch (provider) {
        case 'openai':
            const openaiModel = document.getElementById('openaiModel').value;
            const openaiApiKey = document.getElementById('openaiApiKey').value;
            const openaiTemperature = document.getElementById('openaiTemperature').value;
            const openaiMaxTokens = document.getElementById('openaiMaxTokens').value;
            const openaiBaseUrl = document.getElementById('openaiBaseUrl').value;
            
            providerConfig = `providers:
  - id: openai:${openaiModel}
    config:
      temperature: ${openaiTemperature}
      max_tokens: ${openaiMaxTokens}
      apiKey: ${openaiApiKey || 'sk-abc123'}`;
            
            if (openaiBaseUrl) {
                providerConfig += `\n      apiBaseUrl: ${openaiBaseUrl}`;
            }
            break;
            
        case 'anthropic':
            const anthropicModel = document.getElementById('anthropicModel').value;
            const anthropicApiKey = document.getElementById('anthropicApiKey').value;
            const anthropicMaxTokens = document.getElementById('anthropicMaxTokens').value;
            const anthropicTemperature = document.getElementById('anthropicTemperature').value;
            
            providerConfig = `providers:
  - id: anthropic:${anthropicModel}
    config:
      temperature: ${anthropicTemperature}
      max_tokens: ${anthropicMaxTokens}
      apiKey: ${anthropicApiKey || 'sk-ant-abc123'}`;
            break;
            
        case 'azure-openai':
            const azureEndpoint = document.getElementById('azureEndpoint').value;
            const azureApiKey = document.getElementById('azureApiKey').value;
            const azureDeployment = document.getElementById('azureDeployment').value;
            const azureTemperature = document.getElementById('azureTemperature').value;
            const azureMaxTokens = document.getElementById('azureMaxTokens').value;
            
            providerConfig = `providers:
  - id: azure:${azureDeployment}
    config:
      temperature: ${azureTemperature}
      max_tokens: ${azureMaxTokens}
      apiKey: ${azureApiKey || 'your-api-key'}
      apiBaseUrl: ${azureEndpoint || 'https://your-resource.openai.azure.com'}`;
            break;
            
        case 'google':
            const googleModel = document.getElementById('googleModel').value;
            const googleApiKey = document.getElementById('googleApiKey').value;
            const googleTemperature = document.getElementById('googleTemperature').value;
            const googleMaxTokens = document.getElementById('googleMaxTokens').value;
            
            providerConfig = `providers:
  - id: google:${googleModel}
    config:
      temperature: ${googleTemperature}
      max_tokens: ${googleMaxTokens}
      apiKey: ${googleApiKey || 'your-google-api-key'}`;
            break;
            
        case 'custom':
            const customUrl = document.getElementById('customUrl').value;
            const customApiKey = document.getElementById('customApiKey').value;
            const customModel = document.getElementById('customModel').value;
            const customTemperature = document.getElementById('customTemperature').value;
            const customMaxTokens = document.getElementById('customMaxTokens').value;
            
            providerConfig = `providers:
  - id: http
    config:
      url: ${customUrl || 'https://api.example.com/v1/chat/completions'}
      method: POST
      headers:
        Content-Type: application/json
        Authorization: Bearer ${customApiKey || 'your-api-key'}
      body:
        model: ${customModel || 'gpt-4'}
        temperature: ${customTemperature}
        max_tokens: ${customMaxTokens}
        messages:
          - role: user
            content: "{{prompt}}"
      transformResponse: json.choices[0].message.content`;
            break;
    }
    
    return providerConfig;
}

// 切換 JavaScript 配置顯示
function toggleJavascriptConfig() {
    const checkbox = document.getElementById('enableJavascript');
    const config = document.getElementById('javascriptConfig');
    config.style.display = checkbox.checked ? 'block' : 'none';
}

// 切換 G-Eval 配置顯示
function toggleGEvalConfig() {
    const checkbox = document.getElementById('enableGEval');
    const config = document.getElementById('gevalConfig');
    config.style.display = checkbox.checked ? 'block' : 'none';
}

// 更新 JavaScript 條件配置
function updateJavascriptCondition() {
    const condition = document.getElementById('javascriptCondition').value;
    const lengthConfig = document.getElementById('lengthConfig');
    const customConfig = document.getElementById('customConfig');
    
    if (condition === 'length') {
        lengthConfig.style.display = 'block';
        customConfig.style.display = 'none';
    } else if (condition === 'custom') {
        lengthConfig.style.display = 'none';
        customConfig.style.display = 'block';
    }
}

// 更新評分模型配置
function updateGradingModelFields() {
    const modelType = document.getElementById('gradingModelType').value;
    const openaiConfig = document.getElementById('openaiConfig');
    const httpConfig = document.getElementById('httpGradingConfig');
    
    if (modelType === 'openai') {
        openaiConfig.style.display = 'block';
        httpConfig.style.display = 'none';
    } else if (modelType === 'http') {
        openaiConfig.style.display = 'none';
        httpConfig.style.display = 'block';
    }
}

// 添加 G-Eval 評分標準
function addGEvalCriteria() {
    const list = document.getElementById('gevalCriteriaList');
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `
        <input type="text" class="form-control" placeholder="例如：不回答與旅行無關的問題">
        <button type="button" class="btn btn-outline-danger" onclick="removeGEvalCriteria(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    list.appendChild(div);
}

// 移除 G-Eval 評分標準
function removeGEvalCriteria(button) {
    button.parentElement.remove();
}





// 處理檔案上傳
function handleFileUpload() {
    const fileInput = document.getElementById('questionFile');
    const file = fileInput.files[0];
    
    if (file) {
        console.log('選擇的檔案:', file.name);
        // 這裡可以添加檔案驗證邏輯
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showAlert('請選擇CSV檔案', 'warning');
            fileInput.value = '';
            return;
        }
    }
}

// 讀取檔案為 Base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // 移除 data:type;base64, 前綴
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 切換問題輸入方式
function toggleQuestionInput() {
    const questionSource = document.querySelector('input[name="questionSource"]:checked');
    if (!questionSource) return;
    
    const questionSourceValue = questionSource.value;
    const manualSection = document.getElementById('manualQuestionsSection');
    const uploadSection = document.getElementById('uploadQuestionsSection');
    const testQuestions = document.getElementById('testQuestions');
    
    console.log('切換問題輸入方式:', questionSourceValue);
    
    if (questionSourceValue === 'manual') {
        // 手動輸入模式：顯示手動輸入區域，隱藏檔案上傳
        if (manualSection) {
            manualSection.style.display = 'block';
            console.log('設置 manualSection display: block');
        }
        if (uploadSection) {
            uploadSection.style.display = 'none';
            console.log('設置 uploadSection display: none');
        }
        if (testQuestions) testQuestions.required = false;
        console.log('切換到手動輸入模式');
    } else if (questionSourceValue === 'upload') {
        // 檔案上傳模式：隱藏手動輸入區域，顯示檔案上傳
        if (manualSection) {
            manualSection.style.display = 'none';
            console.log('設置 manualSection display: none');
        }
        if (uploadSection) {
            uploadSection.style.display = 'block';
            console.log('設置 uploadSection display: block');
        }
        if (testQuestions) testQuestions.required = false;
        console.log('切換到檔案上傳模式');
    }
}


// 創建/更新配置表單
async function saveConfigForm() {
    try {
        // 驗證表單
        if (!validateFriendlyForm()) {
            return;
        }
        
        const config = generateConfigFromForm();
        const name = document.getElementById('configName').value;
        
        // 處理檔案上傳
        let uploadedFile = null;
        const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
        const questionSource = questionSourceRadio ? questionSourceRadio.value : 'manual';
        if (questionSource === 'upload') {
            const questionFile = document.getElementById('questionFile').files[0];
            if (questionFile) {
                const fileContent = await readFileAsBase64(questionFile);
                uploadedFile = {
                    filename: questionFile.name,
                    content: fileContent
                };
            }
        }
        
        console.log('生成的配置內容:', config);
        console.log('配置名稱:', name);
        console.log('上傳檔案:', uploadedFile);
        
        // 判斷是創建新配置還是更新現有配置
        const isEdit = selectedConfig && selectedConfig.id;
        const url = isEdit ? `/api/configs/${selectedConfig.id}` : '/api/configs';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                content: config,
                uploadedFile: uploadedFile
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert(isEdit ? '配置儲存成功' : '配置創建成功', 'success');
            await loadConfigs();
            
            // 如果是編輯模式，顯示更新後的配置詳情
            if (isEdit) {
                await selectConfig(selectedConfig.id);
            } else {
                // 新增模式，隱藏表單，顯示提示
                hideConfigForm();
            }
        } else {
            showAlert((isEdit ? '儲存' : '創建') + '失敗: ' + result.error, 'danger');
        }
        
    } catch (error) {
        console.error('配置操作失敗:', error);
        showAlert('配置操作失敗', 'danger');
    }
}

// 取消配置表單
function cancelConfigForm() {
    hideConfigForm();
}

// 隱藏配置表單
function hideConfigForm() {
    const configDetails = document.getElementById('configDetails');
    const configForm = document.getElementById('configForm');
    const configFormTitle = document.getElementById('configFormTitle');
    const configFormActions = document.getElementById('configFormActions');
    
    // 隱藏表單，顯示詳情
    configForm.style.display = 'none';
    configFormActions.style.display = 'none';
    configDetails.style.display = 'block';
    configFormTitle.textContent = '配置詳情';
    
    // 如果有選中的配置，顯示其詳情
    if (selectedConfig) {
        showConfigDetails(selectedConfig);
    } else {
        // 沒有選中配置，顯示提示
        configDetails.innerHTML = '<p class="text-muted">請選擇一個配置檔案查看詳情，或點擊「新增配置」創建新配置</p>';
    }
}

// 保存友善配置（保留用於模態框）
async function saveFriendlyConfig() {
    try {
        // 驗證表單
        if (!validateFriendlyForm()) {
            return;
        }
        
        const config = generateConfigFromForm();
        const name = document.getElementById('configName').value;
        
        // 處理檔案上傳
        let uploadedFile = null;
        const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
        const questionSource = questionSourceRadio ? questionSourceRadio.value : 'manual';
        if (questionSource === 'upload') {
            const questionFile = document.getElementById('questionFile').files[0];
            if (questionFile) {
                const fileContent = await readFileAsBase64(questionFile);
                uploadedFile = {
                    filename: questionFile.name,
                    content: fileContent
                };
            }
        }
        
        console.log('生成的配置內容:', config);
        console.log('配置名稱:', name);
        console.log('上傳檔案:', uploadedFile);
        
        // 判斷是創建新配置還是更新現有配置
        const isEdit = selectedConfig && selectedConfig.id;
        const url = isEdit ? `/api/configs/${selectedConfig.id}` : '/api/configs';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                content: config,
                uploadedFile: uploadedFile
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert(isEdit ? '配置儲存成功' : '配置創建成功', 'success');
            bootstrap.Modal.getInstance(document.getElementById('friendlyConfigModal')).hide();
            bootstrap.Modal.getInstance(document.getElementById('configPreviewModal')).hide();
            await loadConfigs();
            // 清除選中的配置
            selectedConfig = null;
        } else {
            showAlert((isEdit ? '儲存' : '創建') + '失敗: ' + result.error, 'danger');
        }
        
    } catch (error) {
        console.error('創建配置失敗:', error);
        showAlert('創建配置失敗', 'danger');
    }
}

// 驗證友善表單
function validateFriendlyForm() {
    const configName = document.getElementById('configName').value;
    const httpPath = document.getElementById('httpPath').value;
    const httpHost = document.getElementById('httpHost').value;
    const httpContentType = document.getElementById('httpContentType').value;
    const requestBody = document.getElementById('requestBody').value;
    const testQuestions = document.getElementById('testQuestions').value;
    const questionSource = document.getElementById('questionSource').value;
    
    if (!configName.trim()) {
        showAlert('請輸入配置名稱', 'warning');
        return false;
    }
    
    // 檢查配置名稱是否包含無效字符
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(configName)) {
        showAlert('配置名稱不能包含以下字符: < > : " / \\ | ? *', 'warning');
        return false;
    }
    
    // 驗證 HTTP Request 配置
    if (!httpPath.trim()) {
        showAlert('請輸入 HTTP 路徑', 'warning');
        return false;
    }
    
    if (!httpHost.trim()) {
        showAlert('請輸入 Host', 'warning');
        return false;
    }
    
    if (!httpContentType.trim()) {
        showAlert('請輸入 Content-Type', 'warning');
        return false;
    }
    
    if (!requestBody.trim()) {
        showAlert('請輸入 Request Body', 'warning');
            return false;
        }
        
    // 檢查是否包含 {{prompt}} 變量
    if (!requestBody.includes('{{prompt}}')) {
        showAlert('Request Body 必須包含 {{prompt}} 變量', 'warning');
            return false;
    }
    
    // 驗證測試問題（可選，如果沒有配置測試問題也沒關係）
    const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
    const questionSourceValue = questionSourceRadio ? questionSourceRadio.value : 'manual';
    
    if (questionSourceValue === 'manual') {
        // 手動輸入模式：如果有輸入問題，驗證格式
        const questions = testQuestions.split('\n').filter(q => q.trim());
        // 不強制要求必須有問題，允許為空
    } else if (questionSourceValue === 'upload') {
        // 檔案上傳模式：如果有選擇檔案，驗證檔案
        const questionFile = document.getElementById('questionFile').files[0];
        // 不強制要求必須上傳檔案，允許為空
    }
    
    // 檢查是否有評分標準
    const enableJavascript = document.getElementById('enableJavascript').checked;
    const enableGEval = document.getElementById('enableGEval').checked;
    
    if (!enableJavascript && !enableGEval) {
        showAlert('請至少添加一個評分標準', 'warning');
        return false;
    }
    
    // 檢查評分標準是否有效
    let hasValidCriteria = false;
    
    if (enableJavascript) {
        const javascriptCondition = document.getElementById('javascriptCondition').value;
        if (javascriptCondition === 'length') {
            const minLength = document.getElementById('minLength').value;
            if (minLength && parseInt(minLength) > 0) {
            hasValidCriteria = true;
        }
        } else if (javascriptCondition === 'custom') {
            const customJavascript = document.getElementById('customJavascript').value;
            if (customJavascript && customJavascript.trim()) {
                hasValidCriteria = true;
            }
        }
    }
    
    if (enableGEval) {
        const criteriaList = document.querySelectorAll('#gevalCriteriaList .input-group input');
        if (criteriaList.length > 0) {
            hasValidCriteria = true;
        }
    }
    
    if (!hasValidCriteria) {
        showAlert('請確保評分標準配置正確', 'warning');
        return false;
    }
    
    return true;
}


// 執行配置
async function runConfig(configId) {
    if (confirm('確定要執行這個配置嗎？')) {
        try {
            showAlert('正在執行配置，請稍候...', 'info');
            
            const response = await fetch(`/api/configs/${configId}/run`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showAlert('配置執行成功！', 'success');
                console.log('執行結果:', result);
            } else {
                showAlert('執行失敗: ' + result.error, 'danger');
            }
        } catch (error) {
            console.error('執行配置失敗:', error);
            showAlert('執行失敗', 'danger');
        }
    }
}

// 刪除配置
async function deleteConfig(configId) {
    if (confirm('確定要刪除這個配置嗎？')) {
        try {
            const response = await fetch(`/api/configs/${configId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showAlert('配置刪除成功', 'success');
                // 重新載入配置列表
                await loadConfigs();
            } else {
                const result = await response.json();
                showAlert('刪除失敗: ' + result.error, 'danger');
            }
        } catch (error) {
            console.error('刪除配置失敗:', error);
            showAlert('刪除失敗', 'danger');
        }
    }
}

// 載入執行結果
async function loadResults() {
    try {
        const response = await fetch('/api/results');
        const results = await response.json();
        
        const container = document.getElementById('resultsList');
        
        if (!Array.isArray(results) || results.length === 0) {
            container.innerHTML = '<p class="text-muted">暫無執行結果</p>';
            return;
        }
        
        const html = results.map(result => {
            const passRate = parseFloat(result.pass_rate) || 0;
            let passRateClass = 'pass-rate-low';
            if (passRate === 100) {
                passRateClass = 'pass-rate-100';
            } else if (passRate >= 80) {
                passRateClass = 'pass-rate-80';
            }
            
            const createdDate = new Date(result.created_at).toLocaleString('zh-TW');
            
            return `
                <div class="card mb-3 result-card" onclick="showResultDetails('${result.id}')">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-3">
                                <h6 class="mb-1">${result.id}</h6>
                                <small class="text-muted">${createdDate}</small>
                            </div>
                            <div class="col-md-2">
                                <span class="badge bg-secondary">${result.description || '未命名'}</span>
                            </div>
                            <div class="col-md-2">
                                <span class="badge ${passRateClass} fs-6">${passRate.toFixed(2)}%</span>
                            </div>
                            <div class="col-md-2">
                                <span class="text-muted">${result.total_tests || 0} 測試</span>
                            </div>
                            <div class="col-md-3 text-end">
                                <small class="text-muted">
                                    ✅ ${result.success_count || 0} 通過 | 
                                    ❌ ${result.failure_count || 0} 失敗
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('載入結果失敗:', error);
        showAlert('載入結果失敗', 'danger');
    }
}

// 顯示結果詳情
async function showResultDetails(resultId) {
    try {
        const response = await fetch(`/api/results/${resultId}`);
        const result = await response.json();
        
        if (response.ok) {
            displayResultDetails(result);
        } else {
            showAlert('載入結果詳情失敗: ' + result.error, 'danger');
        }
        
    } catch (error) {
        console.error('載入結果詳情失敗:', error);
        showAlert('載入結果詳情失敗', 'danger');
    }
}

// 顯示結果詳情內容
function displayResultDetails(result) {
    const detailsContainer = document.getElementById('resultDetails');
    const titleElement = document.getElementById('resultDetailsTitle');
    const contentElement = document.getElementById('resultDetailsContent');
    
    // 設置標題
    titleElement.textContent = `結果詳情 - ${result.id}`;
    
    // 生成詳情內容
    const createdDate = new Date(result.created_at).toLocaleString('zh-TW');
    const passRate = parseFloat(result.pass_rate) || 0;
    let passRateClass = 'pass-rate-low';
    if (passRate === 100) {
        passRateClass = 'pass-rate-100';
    } else if (passRate >= 80) {
        passRateClass = 'pass-rate-80';
    }
    
    let testCasesHtml = '';
    if (result.test_cases && result.test_cases.length > 0) {
        testCasesHtml = result.test_cases.map((testCase, index) => {
            const resultClass = testCase.success ? 'test-result-pass' : 'test-result-fail';
            const statusIcon = testCase.success ? '✅' : '❌';
            const statusText = testCase.success ? 'PASS' : 'FAIL';
            
            return `
                <div class="${resultClass}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <span class="badge ${testCase.success ? 'bg-success' : 'bg-danger'} me-2">${statusIcon} ${statusText}</span>
                            <small class="text-muted">延遲: ${testCase.latency || 'N/A'}ms</small>
                        </div>
                    </div>
                    <div class="prompt-text">${testCase.prompt}</div>
                    <div class="output-text">${testCase.output || testCase.error || '無輸出'}</div>
                </div>
            `;
        }).join('');
    } else {
        testCasesHtml = '<p class="text-muted">無測試案例詳情</p>';
    }
    
    contentElement.innerHTML = `
        <div class="row mb-4">
            <div class="col-md-6">
                <h6>基本資訊</h6>
                <table class="table table-sm">
                    <tr><td><strong>ID:</strong></td><td>${result.id}</td></tr>
                    <tr><td><strong>描述:</strong></td><td>${result.description || '未命名'}</td></tr>
                    <tr><td><strong>執行時間:</strong></td><td>${createdDate}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>統計資訊</h6>
                <table class="table table-sm">
                    <tr><td><strong>通過率:</strong></td><td><span class="${passRateClass}">${passRate.toFixed(2)}%</span></td></tr>
                    <tr><td><strong>總測試數:</strong></td><td>${result.total_tests || 0}</td></tr>
                    <tr><td><strong>成功數:</strong></td><td>${result.success_count || 0}</td></tr>
                    <tr><td><strong>失敗數:</strong></td><td>${result.failure_count || 0}</td></tr>
                </table>
            </div>
        </div>
        
        <div class="mb-3">
            <h6>測試案例詳情</h6>
            ${testCasesHtml}
        </div>
    `;
    
    // 顯示詳情面板
    detailsContainer.style.display = 'block';
    
    // 滾動到詳情面板
    detailsContainer.scrollIntoView({ behavior: 'smooth' });
}

// 評估結果相關功能已移至 evaluation-results.js

// 隱藏結果詳情
function hideResultDetails() {
    const detailsContainer = document.getElementById('resultDetails');
    detailsContainer.style.display = 'none';
}

// 顯示警告訊息
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 自動移除警告
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// ==========================================
// 評分配置相關函數
// ==========================================

// 切換 JavaScript 配置
function toggleJavascriptConfig() {
    const checkbox = document.getElementById('enableJavascript');
    const config = document.getElementById('javascriptConfig');
    config.style.display = checkbox.checked ? 'block' : 'none';
}

// 更新 JavaScript 條件
function updateJavascriptCondition() {
    const condition = document.getElementById('javascriptCondition').value;
    const lengthConfig = document.getElementById('lengthConfig');
    const customConfig = document.getElementById('customConfig');
    
    if (condition === 'length') {
        lengthConfig.style.display = 'block';
        customConfig.style.display = 'none';
    } else {
        lengthConfig.style.display = 'none';
        customConfig.style.display = 'block';
    }
}

// 切換 G-Eval 配置
function toggleGEvalConfig() {
    const checkbox = document.getElementById('enableGEval');
    const config = document.getElementById('gevalConfig');
    config.style.display = checkbox.checked ? 'block' : 'none';
}

// 添加 G-Eval 評分標準
function addGEvalCriteria() {
    const container = document.getElementById('gevalCriteriaList');
    const newCriteria = document.createElement('div');
    newCriteria.className = 'input-group mb-2';
    newCriteria.innerHTML = `
        <input type="text" class="form-control" placeholder="例如：回覆能有效地解決用戶的問題">
        <button type="button" class="btn btn-outline-danger" onclick="removeGEvalCriteria(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newCriteria);
}

// 移除 G-Eval 評分標準
function removeGEvalCriteria(button) {
    const container = document.getElementById('gevalCriteriaList');
    if (container.children.length > 1) {
        button.parentElement.remove();
    } else {
        showAlert('至少需要保留一個評分標準', 'warning');
    }
}

// 更新 LLM 提供者配置
function updateLLMProviderConfig() {
    const provider = document.getElementById('llmProvider').value;
    const configArea = document.getElementById('llmProviderConfigArea');
    
    if (!configArea) return;
    
    // 清空配置區域
    configArea.innerHTML = '';
    
    if (!provider) return;
    
    let configHTML = '';
    
    switch (provider) {
        case 'openai':
            configHTML = `
                <div class="alert alert-warning alert-sm mb-3">
                    <small><i class="fas fa-key me-1"></i> 請填寫 OpenAI API 配置，這將用於 G-Eval 評分</small>
                </div>
                <div class="mb-3">
                    <label class="form-label small">OpenAI 模型 *</label>
                    <select class="form-select form-select-sm" id="openaiModel" required>
                        <option value="gpt-4o-mini">GPT-4o Mini (推薦，便宜快速)</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label small">API Key *</label>
                    <input type="password" class="form-control form-control-sm" id="openaiApiKey" placeholder="sk-..." required>
                    <small class="form-text text-muted">你的 OpenAI API Key</small>
                </div>
                <div class="row">
                    <div class="col-6 mb-2">
                        <label class="form-label small">Temperature</label>
                        <input type="number" class="form-control form-control-sm" id="openaiTemperature" value="0" min="0" max="2" step="0.1">
                        <small class="form-text text-muted">0 = 更一致</small>
                    </div>
                    <div class="col-6 mb-2">
                        <label class="form-label small">Max Tokens</label>
                        <input type="number" class="form-control form-control-sm" id="openaiMaxTokens" value="128" min="1" max="4096">
                        <small class="form-text text-muted">評分回覆長度</small>
                    </div>
                </div>
            `;
            break;
            
        case 'anthropic':
            configHTML = `
                <div class="alert alert-warning alert-sm mb-3">
                    <small><i class="fas fa-key me-1"></i> 請填寫 Anthropic API 配置，這將用於 G-Eval 評分</small>
                </div>
                <div class="mb-3">
                    <label class="form-label small">Anthropic 模型 *</label>
                    <select class="form-select form-select-sm" id="anthropicModel" required>
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (推薦)</option>
                        <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                        <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label small">API Key *</label>
                    <input type="password" class="form-control form-control-sm" id="anthropicApiKey" placeholder="sk-ant-..." required>
                    <small class="form-text text-muted">你的 Anthropic API Key</small>
                </div>
                <div class="row">
                    <div class="col-6 mb-2">
                        <label class="form-label small">Temperature</label>
                        <input type="number" class="form-control form-control-sm" id="anthropicTemperature" value="0" min="0" max="1" step="0.1">
                        <small class="form-text text-muted">0 = 更一致</small>
                    </div>
                    <div class="col-6 mb-2">
                        <label class="form-label small">Max Tokens</label>
                        <input type="number" class="form-control form-control-sm" id="anthropicMaxTokens" value="128" min="1" max="4096">
                        <small class="form-text text-muted">評分回覆長度</small>
                    </div>
                </div>
            `;
            break;
            
        case 'azure-openai':
            configHTML = `
                <div class="alert alert-warning alert-sm mb-3">
                    <small><i class="fas fa-key me-1"></i> 請填寫 Azure OpenAI 配置，這將用於 G-Eval 評分</small>
                </div>
                <div class="mb-3">
                    <label class="form-label small">Azure Endpoint *</label>
                    <input type="url" class="form-control form-control-sm" id="azureEndpoint" placeholder="https://your-resource.openai.azure.com" required>
                    <small class="form-text text-muted">你的 Azure OpenAI 端點</small>
                </div>
                <div class="mb-3">
                    <label class="form-label small">API Key *</label>
                    <input type="password" class="form-control form-control-sm" id="azureApiKey" placeholder="your-api-key" required>
                    <small class="form-text text-muted">你的 Azure OpenAI API Key</small>
                </div>
                <div class="mb-3">
                    <label class="form-label small">Deployment Name *</label>
                    <input type="text" class="form-control form-control-sm" id="azureDeployment" placeholder="gpt-4o" required>
                    <small class="form-text text-muted">你的模型部署名稱</small>
                </div>
                <div class="row">
                    <div class="col-6 mb-2">
                        <label class="form-label small">Temperature</label>
                        <input type="number" class="form-control form-control-sm" id="azureTemperature" value="0" min="0" max="2" step="0.1">
                        <small class="form-text text-muted">0 = 更一致</small>
                    </div>
                    <div class="col-6 mb-2">
                        <label class="form-label small">Max Tokens</label>
                        <input type="number" class="form-control form-control-sm" id="azureMaxTokens" value="128" min="1" max="4096">
                        <small class="form-text text-muted">評分回覆長度</small>
                    </div>
                </div>
            `;
            break;
            
        case 'google':
            configHTML = `
                <div class="mb-3">
                    <label class="form-label small">Google 模型</label>
                    <select class="form-select form-select-sm" id="googleModel">
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        <option value="gemini-pro">Gemini Pro</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label small">API Key</label>
                    <input type="password" class="form-control form-control-sm" id="googleApiKey" placeholder="your-google-api-key">
                </div>
                <div class="row">
                    <div class="col-6 mb-2">
                        <label class="form-label small">Temperature</label>
                        <input type="number" class="form-control form-control-sm" id="googleTemperature" value="0" min="0" max="2" step="0.1">
                    </div>
                    <div class="col-6 mb-2">
                        <label class="form-label small">Max Tokens</label>
                        <input type="number" class="form-control form-control-sm" id="googleMaxTokens" value="128" min="1" max="2048">
                    </div>
                </div>
            `;
            break;
            
        case 'custom':
            configHTML = `
                <div class="mb-3">
                    <label class="form-label small">API URL</label>
                    <input type="url" class="form-control form-control-sm" id="customUrl" placeholder="https://api.example.com/v1/chat/completions">
                </div>
                <div class="mb-3">
                    <label class="form-label small">API Key</label>
                    <input type="password" class="form-control form-control-sm" id="customApiKey" placeholder="your-api-key">
                </div>
                <div class="mb-3">
                    <label class="form-label small">模型名稱</label>
                    <input type="text" class="form-control form-control-sm" id="customModel" placeholder="gpt-4">
                </div>
                <div class="row">
                    <div class="col-6 mb-2">
                        <label class="form-label small">Temperature</label>
                        <input type="number" class="form-control form-control-sm" id="customTemperature" value="0" min="0" max="2" step="0.1">
                    </div>
                    <div class="col-6 mb-2">
                        <label class="form-label small">Max Tokens</label>
                        <input type="number" class="form-control form-control-sm" id="customMaxTokens" value="128" min="1" max="4096">
                    </div>
                </div>
            `;
            break;
    }
    
    configArea.innerHTML = configHTML;
}

// 更新配置預覽
function updateConfigPreview() {
    const provider = document.getElementById('llmProvider').value;
    const previewCode = document.getElementById('configPreviewCode');
    
    let config = {};
    
    switch (provider) {
        case 'openai':
            const model = document.getElementById('openaiModel').value;
            const apiKey = document.getElementById('openaiApiKey').value;
            const temperature = document.getElementById('openaiTemperature').value;
            const maxTokens = document.getElementById('openaiMaxTokens').value;
            const baseUrl = document.getElementById('openaiBaseUrl').value;
            
            config = {
                providers: [{
                    id: `openai:${model}`,
                    config: {
                        temperature: parseFloat(temperature),
                        max_tokens: parseInt(maxTokens),
                        apiKey: apiKey || 'sk-abc123'
                    }
                }]
            };
            
            if (baseUrl) {
                config.providers[0].config.apiBaseUrl = baseUrl;
            }
            break;
            
        case 'anthropic':
            const anthropicModel = document.getElementById('anthropicModel').value;
            const anthropicApiKey = document.getElementById('anthropicApiKey').value;
            const anthropicMaxTokens = document.getElementById('anthropicMaxTokens').value;
            const anthropicTemperature = document.getElementById('anthropicTemperature').value;
            
            config = {
                providers: [{
                    id: `anthropic:${anthropicModel}`,
                    config: {
                        temperature: parseFloat(anthropicTemperature),
                        max_tokens: parseInt(anthropicMaxTokens),
                        apiKey: anthropicApiKey || 'sk-ant-abc123'
                    }
                }]
            };
            break;
            
        case 'azure-openai':
            const azureEndpoint = document.getElementById('azureEndpoint').value;
            const azureApiKey = document.getElementById('azureApiKey').value;
            const azureDeployment = document.getElementById('azureDeployment').value;
            const azureTemperature = document.getElementById('azureTemperature').value;
            const azureMaxTokens = document.getElementById('azureMaxTokens').value;
            
            config = {
                providers: [{
                    id: `azure:${azureDeployment}`,
                    config: {
                        temperature: parseFloat(azureTemperature),
                        max_tokens: parseInt(azureMaxTokens),
                        apiKey: azureApiKey || 'your-api-key',
                        apiBaseUrl: azureEndpoint || 'https://your-resource.openai.azure.com'
                    }
                }]
            };
            break;
            
        case 'google':
            const googleModel = document.getElementById('googleModel').value;
            const googleApiKey = document.getElementById('googleApiKey').value;
            const googleTemperature = document.getElementById('googleTemperature').value;
            const googleMaxTokens = document.getElementById('googleMaxTokens').value;
            
            config = {
                providers: [{
                    id: `google:${googleModel}`,
                    config: {
                        temperature: parseFloat(googleTemperature),
                        max_tokens: parseInt(googleMaxTokens),
                        apiKey: googleApiKey || 'your-google-api-key'
                    }
                }]
            };
            break;
            
        case 'custom':
            const customUrl = document.getElementById('customUrl').value;
            const customApiKey = document.getElementById('customApiKey').value;
            const customModel = document.getElementById('customModel').value;
            const customTemperature = document.getElementById('customTemperature').value;
            const customMaxTokens = document.getElementById('customMaxTokens').value;
            
            config = {
                providers: [{
                    id: 'http',
                    config: {
                        url: customUrl || 'https://api.example.com/v1/chat/completions',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${customApiKey || 'your-api-key'}`
                        },
                        body: {
                            model: customModel || 'gpt-4',
                            temperature: parseFloat(customTemperature),
                            max_tokens: parseInt(customMaxTokens),
                            messages: [
                                {
                                    role: 'user',
                                    content: '{{prompt}}'
                                }
                            ]
                        },
                        transformResponse: 'json.choices[0].message.content'
                    }
                }]
            };
            break;
    }
    
    previewCode.textContent = JSON.stringify(config, null, 2);
}

// 監聽配置變更以更新預覽
document.addEventListener('DOMContentLoaded', function() {
    // 為所有配置輸入框添加變更監聽器
    const configInputs = document.querySelectorAll('.provider-config input, .provider-config select');
    configInputs.forEach(input => {
        input.addEventListener('input', updateConfigPreview);
        input.addEventListener('change', updateConfigPreview);
    });
});


