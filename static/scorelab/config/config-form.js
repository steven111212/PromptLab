// 配置表單模組
// 負責配置表單的UI管理和顯示功能

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
    configFormTitle.textContent = isEdit ? '編輯專案' : '新增專案';
    
    // 生成表單HTML
    configForm.innerHTML = generateConfigFormHTML();
    
    // 根據編輯模式設定按鈕文字
    setTimeout(() => {
        const saveButtonText = document.getElementById('saveButtonText');
        const saveButtonTextStep4 = document.getElementById('saveButtonTextStep4');
        
        if (saveButtonText) {
            saveButtonText.textContent = isEdit ? '儲存專案' : '創建專案';
        }
        if (saveButtonTextStep4) {
            saveButtonTextStep4.textContent = isEdit ? '儲存專案' : '創建專案';
        }
        
        // 更新頂部的保存按鈕文字
        const topSaveButton = document.querySelector('#configFormActions .btn-success');
        if (topSaveButton) {
            topSaveButton.innerHTML = `<i class="fas fa-save me-2"></i>${isEdit ? '儲存專案' : '創建專案'}`;
        }
    }, 100);
    
    // 如果是編輯模式，載入專案數據
    if (isEdit && config) {
        await ConfigLoader.loadConfigToForm(config);
    } else {
        // 新增模式，重置表單
        FormValidation.resetScoringCriteriaList();
    }
    
    // 初始化動態測試表單功能
    setTimeout(() => {
        initializeDynamicTestForm();
    }, 100);
}

// 生成專案表單HTML
function generateConfigFormHTML() {
    return `
        <div class="config-form-container">
            <!-- 進度指示器 -->
            <div class="progress-steps mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="step active clickable" data-step="1" onclick="jumpToStep(1)">
                        <span class="step-number">1</span>
                        <span class="step-label">API設定</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="step clickable" data-step="2" onclick="jumpToStep(2)">
                        <span class="step-number">2</span>
                        <span class="step-label">上傳問題集及測試API</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="step clickable" data-step="3" onclick="jumpToStep(3)">
                        <span class="step-number">3</span>
                        <span class="step-label">評分標準</span>
                    </div>
                </div>
            </div>

            <form id="configFormContent" onsubmit="return false;">
                <!-- 步驟 1: API設定 -->
                <div class="form-step" id="step1" style="display: block;">
                    <div class="step-header mb-4">
                        <h5 class="text-primary"><i class="fas fa-robot me-2"></i>API設定</h5>
                        <p class="text-muted">設定專案名稱和要測試的API端點</p>
                    </div>
                    
                    <!-- 專案名稱 -->
                    <div class="row mb-4">
                        <div class="col-md-8">
                            <label class="form-label">專案名稱 *</label>
                            <input type="text" class="form-control form-control-lg" id="configName" placeholder="例如：台電客服評測" required>
                            <small class="form-text text-muted">請勿使用特殊字符: < > : " / \\ | ? *</small>
                        </div>
                    </div>
                    
                    <!-- HTTP Request 設定 -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-globe me-2"></i>HTTP 請求設定</h6>
                        </div>
                        <div class="card-body">
                            <!-- HTTPS 支援 -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">使用 HTTPS:</label>
                                </div>
                                <div class="col-md-9">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="useHttps">
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
                                            <input type="text" class="form-control" id="httpPath" required>
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
                                    <input type="text" class="form-control" id="httpHost" required>
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
                                            <input type="text" class="form-control" id="authValue" >
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Request Body 設定 -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-code me-2"></i>Request Body 設定</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label class="form-label">Request Body 原始內容</label>
                                    <textarea class="form-control" id="requestBody" rows="6" ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 進階設定 -->
                    <div class="row mb-4">
                        <div class="col-md-8">
                            <label class="form-label">Response Transform</label>
                            <input type="text" class="form-control" id="transformResponse">
                            <small class="form-text text-muted">例如：json.response, json.choices[0].message.content</small>
                        </div>
                    </div>
                    
                    
                    <div class="step-navigation mt-4">
                        <div class="d-flex justify-content-end">
                            <div class="btn-group">
                                <button type="button" class="btn btn-primary" onclick="nextStep(2)">
                                    下一步：上傳問題集及測試API <i class="fas fa-arrow-right ms-2"></i>
                                </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="cancelConfigForm()">
                                    <i class="fas fa-times me-2"></i>取消
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 步驟 2: 上傳問題集及測試API -->
                <div class="form-step" id="step2" style="display: none;">
                    <div class="step-header mb-4">
                        <h5 class="text-primary"><i class="fas fa-upload me-2"></i>上傳問題集及測試API</h5>
                        <p class="text-muted">上傳測試問題並測試API連接</p>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="questionSource" id="questionSourceUpload" value="upload" checked onchange="toggleQuestionInput()">
                                <label class="form-check-label" for="questionSourceUpload">
                                    <i class="fas fa-file-csv me-2"></i>上傳CSV檔案
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- 上傳測試集檔案 -->
                    <div id="uploadQuestionsSection" class="mb-4">
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
                                        請確保欄位名稱與 API Request Body 中的變量名稱與CSV檔案中的欄位名稱一致
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
                    
                    <!-- API測試區域 -->
                    <div class="card mb-4 border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0"><i class="fas fa-flask me-2"></i>API測試</h6>
                        </div>
                        <div class="card-body">
                            <p class="text-muted mb-3">測試您設定的API是否能正常運作</p>
                            
                            <!-- 測試方式選擇 -->
                            <div class="mb-3">
                                <label class="form-label">測試方式</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="testMode" id="testModeManual" value="manual" checked onchange="toggleTestMode()">
                                    <label class="form-check-label" for="testModeManual">
                                        <i class="fas fa-keyboard me-2"></i>手動輸入測試問題
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="testMode" id="testModeCSV" value="csv" onchange="toggleTestMode()">
                                    <label class="form-check-label" for="testModeCSV">
                                        <i class="fas fa-file-csv me-2"></i>使用CSV資料測試
                                    </label>
                                </div>
                            </div>
                            
                            <!-- 手動輸入模式 -->
                            <div id="manualTestMode" class="mb-3">
                                <div id="dynamicTestForm">
                                    <!-- 動態生成的測試表單將在這裡顯示 -->
                                </div>
                            </div>
                            
                            <!-- CSV資料測試模式 -->
                            <div id="csvTestMode" class="mb-3" style="display: none;">
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    <strong>提示：</strong>測試時會使用上傳檔案的第一筆資料
                                </div>
                                <div class="row">
                                    <div class="col-md-8">
                                        <label class="form-label">測試資料</label>
                                        <div class="form-control-plaintext bg-light p-2 rounded">
                                            <i class="fas fa-file-csv me-2 text-success"></i>
                                            將使用CSV檔案的第一筆資料進行測試
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 統一的測試按鈕區域 -->
                            <div class="row mt-3">
                                <div class="col-12">
                                    <div class="d-flex justify-content-center">
                                        <button type="button" class="btn btn-info btn-lg px-4" onclick="executeAPITest()" id="unifiedTestButton">
                                            <i class="fas fa-play me-2"></i>測試API
                                        </button>
                                    </div>
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
                                    <small><i class="fas fa-lightbulb me-1"></i>請檢查API設定是否正確，包括URL、認證資訊和請求格式</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="step-navigation mt-4">
                        <div class="d-flex justify-content-between">
                            <button type="button" class="btn btn-outline-secondary" onclick="prevStep(1)">
                                <i class="fas fa-arrow-left me-2"></i>上一步
                            </button>
                            <button type="button" class="btn btn-outline-success" onclick="nextStep(3)">
                                下一步：評分標準（可選） <i class="fas fa-arrow-right ms-2"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 步驟 3: 評分標準配置（可選） -->
                <div class="form-step" id="step3" style="display: none;">
                    <div class="step-header mb-4">
                        <h5 class="text-success"><i class="fas fa-chart-line me-2"></i>評分標準設定</h5>
                        <p class="text-muted">這個步驟是可選的。你可以跳過此步驟直接創建專案，或者設定評分標準來自動評估API回覆品質。</p>
                    
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

                            <!-- 回覆長度檢查 -->
                            <div class="mb-3">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableJavascript" onchange="ScoringCriteria.toggleJavascriptConfig()">
                                    <label class="form-check-label" for="enableJavascript">
                                        <i class="fas fa-ruler me-2"></i>回覆長度檢查
                                    </label>
                                </div>
                                <div id="javascriptConfig" style="display: none;" class="mt-2 ps-4">
                                    <div class="row">
                                        <div class="col-12 mb-2">
                                            <label class="form-label small">驗證條件</label>
                                            <select class="form-select form-select-sm" id="javascriptCondition" onchange="ScoringCriteria.updateJavascriptCondition()">
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
                                        <i class="fas fa-calculator me-2"></i>BERT Score (F1)
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableBertRecall">
                                    <label class="form-check-label" for="enableBertRecall">
                                        <i class="fas fa-calculator me-2"></i>BERT Recall
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableBertPrecision">
                                    <label class="form-check-label" for="enableBertPrecision">
                                        <i class="fas fa-calculator me-2"></i>BERT Precision
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
                            <!-- Grader Provider 配置 -->
                            <div class="mb-4">
                                <h6 class="text-success mb-3">
                                    <i class="fas fa-cogs me-2"></i>Grader Provider 配置
                                </h6>
                                <p class="text-muted small mb-3">選擇要使用哪個 LLM 服務來進行評分</p>
                                
                                <div class="mb-3">
                                    <label class="form-label small">選擇 LLM 提供者 *</label>
                                    <select class="form-select form-select-sm" id="llmProvider" onchange="ScoringCriteria.updateLLMProviderConfig()" required>
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

                            <hr class="my-4">

                            <!-- 評分方式選擇 -->
                            <div class="mb-3">
                                <h6 class="text-success mb-3">
                                    <i class="fas fa-chart-line me-2"></i>評分方式選擇
                                </h6>
                                <p class="text-muted small mb-3">選擇要使用的評分方式</p>
                            </div>

                            <!-- 事實性檢查評分 -->
                            <div class="mb-3">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableFactuality" onchange="ScoringCriteria.toggleFactualityConfig()">
                                    <label class="form-check-label" for="enableFactuality">
                                        <i class="fas fa-check-double me-2"></i>事實性檢查
                                    </label>
                                </div>
                                <div id="factualityConfig" style="display: none;" class="mt-2 ps-4">
                                    <div class="row">
                                        <div class="col-12 mb-2">
                                            <label class="form-label small">選擇變數</label>
                                            <select class="form-select form-select-sm" id="factualityVariable">
                                                <option value="">請選擇CSV檔案中的變數</option>
                                            </select>
                                            <small class="form-text text-muted">從已配置的CSV檔案中選擇變數</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- G-Eval 評分 -->
                            <div class="mb-3">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableGEval" onchange="ScoringCriteria.toggleGEvalConfig()">
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
                                                <button type="button" class="btn btn-outline-danger btn-sm" onclick="ScoringCriteria.removeGEvalCriteria(this)">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="ScoringCriteria.addGEvalCriteria()">
                                            <i class="fas fa-plus"></i> 添加評分標準
                                        </button>
                                    </div>
                                    
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
                        <div class="text-muted">
                            <small><i class="fas fa-info-circle me-1"></i>請使用右上角的按鈕來儲存或取消專案</small>
                        </div>
                    </div>
                </div>
            </div>

            </form>
        </div>
    `;
}

// 全域變數儲存CSV資料
window.csvData = null;

// 切換完整內容顯示
function toggleFullContent(button) {
    const cellContent = button.parentElement;
    const fullContent = button.getAttribute('data-full-content');
    const truncated = fullContent.substring(0, 50) + '...';
    
    if (button.textContent === '顯示更多') {
        cellContent.innerHTML = fullContent + 
            '<button type="button" class="btn btn-link btn-sm p-0 ms-1" onclick="toggleFullContent(this)" data-full-content="' + fullContent.replace(/"/g, '&quot;') + '">顯示較少</button>';
    } else {
        cellContent.innerHTML = truncated + 
            '<button type="button" class="btn btn-link btn-sm p-0 ms-1" onclick="toggleFullContent(this)" data-full-content="' + fullContent.replace(/"/g, '&quot;') + '">顯示更多</button>';
    }
}

// 切換測試資料內容顯示（已移除預覽功能，保留函數避免錯誤）
function toggleTestDataContent(button) {
    // 預覽功能已移除，此函數保留以避免錯誤
}

// 切換JSON預覽顯示
function toggleJSONPreview(button) {
    const jsonDiv = button.parentElement;
    const fullContent = button.getAttribute('data-full-content');
    const truncated = fullContent.substring(0, 300) + '...';
    
    if (button.textContent === '顯示更多') {
        jsonDiv.innerHTML = '<pre>' + fullContent + '</pre>' + 
            '<button type="button" class="btn btn-link btn-sm p-0 ms-1" onclick="toggleJSONPreview(this)" data-full-content="' + fullContent.replace(/"/g, '&quot;') + '">顯示較少</button>';
    } else {
        jsonDiv.innerHTML = '<pre>' + truncated + '</pre>' + 
            '<button type="button" class="btn btn-link btn-sm p-0 ms-1" onclick="toggleJSONPreview(this)" data-full-content="' + fullContent.replace(/"/g, '&quot;') + '">顯示更多</button>';
    }
}

// 處理CSV上傳
// 使用更簡單但更可靠的CSV解析方法
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                // 處理轉義的引號 ""
                current += '"';
                i += 2; // 跳過兩個引號
                continue;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
            i++;
            continue;
        }
        
        current += char;
        i++;
    }
    
    // 添加最後一個欄位
    result.push(current.trim());
    
    return result;
}

function handleCSVUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        
        // 使用更簡單的CSV解析方法
        const lines = csv.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            showAlert('CSV檔案格式不正確', 'error');
            return;
        }
        
        // 解析標題行
        const headers = lines[0].split(',').map(h => h.trim());
        console.log('CSV標題:', headers);
        
        // 解析資料行
        const csvData = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const cells = [];
            let current = '';
            let inQuotes = false;
            let j = 0;
            
            while (j < line.length) {
                const char = line[j];
                
                if (char === '"') {
                    if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
                        // 轉義引號
                        current += '"';
                        j += 2;
                        continue;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    cells.push(current.trim());
                    current = '';
                    j++;
                    continue;
                }
                
                current += char;
                j++;
            }
            
            // 添加最後一個欄位
            cells.push(current.trim());
            
            // 確保欄位數量匹配
            if (cells.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = cells[index] || '';
                });
                csvData.push(row);
                console.log(`第${i}行解析結果:`, cells);
            } else {
                console.warn(`第${i}行欄位數量不匹配: 期望${headers.length}, 實際${cells.length}`);
            }
        }
        
        console.log('解析後的CSV資料:', csvData);
        
        // 儲存到全域變數
        window.csvData = csvData;
        
        // 更新事實性檢查變數選項（從當前上傳的檔案）
        if (window.ScoringCriteria && window.ScoringCriteria.updateFactualityVariables) {
            window.ScoringCriteria.updateFactualityVariables(headers);
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
        for (let i = 0; i < Math.min(5, csvData.length); i++) {
            tableHTML += '<tr>';
            headers.forEach(header => {
                const content = csvData[i][header] || '';
                const truncated = content.length > 50 ? content.substring(0, 50) + '...' : content;
                const showMoreBtn = content.length > 50 ? 
                    `<button type="button" class="btn btn-link btn-sm p-0 ms-1" onclick="toggleFullContent(this)" data-full-content="${content.replace(/"/g, '&quot;')}">顯示更多</button>` : '';
                
                tableHTML += `<td>
                    <div class="csv-cell-content">
                        ${truncated}
                        ${showMoreBtn}
                    </div>
                </td>`;
            });
            tableHTML += '</tr>';
        }
        
        tableHTML += '</tbody>';
        table.innerHTML = tableHTML;
        preview.style.display = 'block';
        
        // 更新API測試區域
        updateAPITestWithCSV();
        
        showAlert(`成功載入CSV檔案，包含 ${csvData.length} 個測試問題`, 'success');
    };
    
    reader.readAsText(file);
}

// 更新API測試區域以支援CSV資料
function updateAPITestWithCSV() {
    if (window.csvData && window.csvData.length > 0) {
        // 更新統一測試按鈕狀態
        updateUnifiedTestButton();
    }
}

// 切換測試模式
function toggleTestMode() {
    const manualMode = document.getElementById('manualTestMode');
    const csvMode = document.getElementById('csvTestMode');
    const testModeManual = document.getElementById('testModeManual');
    
    if (testModeManual.checked) {
        manualMode.style.display = 'block';
        csvMode.style.display = 'none';
        // 生成動態測試表單
        generateDynamicTestForm();
    } else {
        manualMode.style.display = 'none';
        csvMode.style.display = 'block';
    }
    
    // 更新統一測試按鈕的狀態
    updateUnifiedTestButton();
}

// 更新統一測試按鈕的狀態
function updateUnifiedTestButton() {
    const testModeManual = document.getElementById('testModeManual');
    const unifiedButton = document.getElementById('unifiedTestButton');
    
    if (unifiedButton) {
        if (testModeManual && testModeManual.checked) {
            // 手動模式：檢查是否有有效的輸入
            const hasValidInput = checkManualTestInput();
            unifiedButton.disabled = !hasValidInput;
        } else {
            // CSV模式：檢查是否有上傳的CSV檔案
            const hasCSVData = window.csvData && window.csvData.length > 0;
            unifiedButton.disabled = !hasCSVData;
        }
    }
}

// 檢查手動測試輸入是否有效
function checkManualTestInput() {
    const fields = analyzeRequestBody();
    
    if (fields.length === 0) {
        // 傳統模式：檢查testQuestion
        const testQuestion = document.getElementById('testQuestion');
        return testQuestion && testQuestion.value.trim() !== '';
    } else {
        // 動態表單模式：檢查所有欄位
        for (const field of fields) {
            const inputElement = document.getElementById(`testField_${field.name}`);
            if (!inputElement || inputElement.value.trim() === '') {
                return false;
            }
        }
        return true;
    }
}

// 統一的API測試執行函數
async function executeAPITest() {
    const testModeManual = document.getElementById('testModeManual');
    
    if (testModeManual && testModeManual.checked) {
        // 手動模式：使用動態表單測試
        await testAPIWithDynamicForm();
    } else {
        // CSV模式：使用CSV資料測試
        await testAPIWithCSV();
    }
}

// 更新測試按鈕的一致性
function updateTestButtonConsistency() {
    const testModeManual = document.getElementById('testModeManual');
    const manualMode = document.getElementById('manualTestMode');
    const csvMode = document.getElementById('csvTestMode');
    
    // 確保兩個模式都使用相同的按鈕ID和樣式
    if (testModeManual && testModeManual.checked) {
        // 手動模式：確保按鈕在動態表單中
        const dynamicForm = document.getElementById('dynamicTestForm');
        if (dynamicForm) {
            const existingButton = dynamicForm.querySelector('#testAPIButton');
            if (!existingButton) {
                // 如果沒有按鈕，添加一個
                const buttonContainer = dynamicForm.querySelector('.d-flex.align-items-end');
                if (buttonContainer) {
                    buttonContainer.innerHTML = `
                        <button type="button" class="btn btn-info w-100" onclick="testAPIWithDynamicForm()" id="testAPIButton">
                            <i class="fas fa-play me-2"></i>測試API
                        </button>
                    `;
                }
            }
        }
    } else {
        // CSV模式：確保按鈕存在且可用
        const csvButton = document.getElementById('testCSVButton');
        if (csvButton) {
            csvButton.disabled = false;
            csvButton.innerHTML = '<i class="fas fa-play me-2"></i>測試API';
        }
    }
}

// 分析request body並提取需要填寫的欄位
function analyzeRequestBody() {
    const requestBody = document.getElementById('requestBody').value;
    if (!requestBody.trim()) {
        return [];
    }
    
    try {
        // 嘗試解析JSON
        const jsonBody = JSON.parse(requestBody);
        return extractFieldsFromJSON(jsonBody);
    } catch (error) {
        // 如果不是JSON，嘗試解析其他格式
        return extractFieldsFromText(requestBody);
    }
}

// 從JSON中提取欄位
function extractFieldsFromJSON(obj, prefix = '') {
    const fields = [];
    
    for (const [key, value] of Object.entries(obj)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'string') {
            // 檢查是否包含變數（如 {{prompt}}, {{question}} 等）
            if (value.includes('{{') && value.includes('}}')) {
                const variables = value.match(/\{\{([^}]+)\}\}/g);
                if (variables) {
                    variables.forEach(variable => {
                        const varName = variable.replace(/\{\{|\}\}/g, '');
                        if (!fields.find(f => f.name === varName)) {
                            fields.push({
                                name: varName,
                                path: fieldPath,
                                type: 'string',
                                placeholder: `請輸入${varName}`,
                                defaultValue: ''
                            });
                        }
                    });
                }
            }
        } else if (typeof value === 'object' && value !== null) {
            // 遞歸處理嵌套對象
            fields.push(...extractFieldsFromJSON(value, fieldPath));
        }
    }
    
    return fields;
}

// 從文本中提取欄位
function extractFieldsFromText(text) {
    const fields = [];
    const variablePattern = /\{\{([^}]+)\}\}/g;
    let match;
    
    while ((match = variablePattern.exec(text)) !== null) {
        const varName = match[1];
        if (!fields.find(f => f.name === varName)) {
            fields.push({
                name: varName,
                path: 'text',
                type: 'string',
                placeholder: `請輸入${varName}`,
                defaultValue: ''
            });
        }
    }
    
    return fields;
}

// 生成動態測試表單
function generateDynamicTestForm() {
    const fields = analyzeRequestBody();
    const testFormContainer = document.getElementById('dynamicTestForm');
    
    if (!testFormContainer) {
        console.error('找不到動態測試表單容器');
        return;
    }
    
    if (fields.length === 0) {
        // 沒有找到變數，顯示傳統的單一輸入框
        testFormContainer.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <label class="form-label">測試問題</label>
                    <input type="text" class="form-control" id="testQuestion" placeholder="輸入一個測試問題，例如：你好，請自我介紹" value="你好，請自我介紹" oninput="updateUnifiedTestButton()">
                </div>
            </div>
        `;
    } else {
        // 生成多欄位表單
        let formHTML = '<div class="row">';
        
        fields.forEach((field, index) => {
            const colClass = fields.length === 1 ? 'col-12' : 'col-md-6';
            formHTML += `
                <div class="${colClass} mb-3">
                    <label class="form-label">${field.name}</label>
                    <input type="text" class="form-control" id="testField_${field.name}" 
                           placeholder="${field.placeholder}" value="${field.defaultValue}" oninput="updateUnifiedTestButton()">
                </div>
            `;
        });
        
        formHTML += '</div>';
        testFormContainer.innerHTML = formHTML;
    }
    
    // 更新統一按鈕狀態
    updateUnifiedTestButton();
}

// 使用動態表單測試API
async function testAPIWithDynamicForm() {
    const fields = analyzeRequestBody();
    const testButton = document.getElementById('unifiedTestButton');
    const testResult = document.getElementById('testResult');
    const testError = document.getElementById('testError');
    
    // 隱藏之前的結果
    testResult.style.display = 'none';
    testError.style.display = 'none';
    
    // 設置按鈕為載入狀態
    testButton.disabled = true;
    testButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>測試中...';
    
    try {
        // 收集API配置
        const apiConfig = collectAPIConfig();
        
        if (!apiConfig.isValid) {
            throw new Error(apiConfig.error);
        }
        
        // 構建請求，替換request body中的變數
        let requestBody = apiConfig.requestBody;
        
        if (fields.length === 0) {
            // 使用傳統的 {{prompt}} 替換
            const testQuestion = document.getElementById('testQuestion').value.trim();
            if (!testQuestion) {
                throw new Error('請輸入測試問題');
            }
            requestBody = requestBody.replace(/\{\{prompt\}\}/g, testQuestion);
        } else {
            // 使用動態表單的值替換
            fields.forEach(field => {
                const inputElement = document.getElementById(`testField_${field.name}`);
                if (inputElement) {
                    const value = inputElement.value.trim();
                    if (!value) {
                        throw new Error(`請填寫 ${field.name} 欄位`);
                    }
                    requestBody = requestBody.replace(new RegExp(`\\{\\{${field.name}\\}\\}`, 'g'), value);
                }
            });
        }
        
        // 構建請求配置
        const requestConfig = {
            method: apiConfig.httpMethod,
            url: buildAPIRequest(apiConfig, '').url,
            headers: buildAPIRequest(apiConfig, '').headers,
            body: requestBody,
            transformResponse: apiConfig.transformResponse
        };
        
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

// 載入測試資料（簡化版本，只使用第一筆資料）
function loadTestData() {
    // 這個函數現在不需要做任何事情，因為我們直接使用第一筆資料
    // 保留函數以避免錯誤，但內容為空
}

// 使用CSV資料測試API
async function testAPIWithCSV() {
    const testButton = document.getElementById('unifiedTestButton');
    const testResult = document.getElementById('testResult');
    const testError = document.getElementById('testError');
    
    if (!window.csvData || window.csvData.length === 0) {
        showAlert('請先上傳CSV檔案', 'warning');
        return;
    }
    
    // 直接使用第一筆資料
    const testData = window.csvData[0];
    
    // 隱藏之前的結果
    testResult.style.display = 'none';
    testError.style.display = 'none';
    
    // 設置按鈕為載入狀態
    testButton.disabled = true;
    testButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>測試中...';
    
    try {
        // 收集API配置
        const apiConfig = collectAPIConfig();
        
        if (!apiConfig.isValid) {
            throw new Error(apiConfig.error);
        }
        
        // 構建請求（使用CSV資料）
        const requestConfig = buildAPIRequestWithCSVData(apiConfig, testData);
        
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
            body: JSON.stringify({
                config: requestConfig,
                testData: testData
            })
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // 如果有轉換設定，只顯示轉換後的結果
            if (result.transformedResponse) {
                document.getElementById('apiResponse').textContent = result.transformedResponse;
                document.getElementById('transformedResult').style.display = 'none';
            } else {
                // 如果沒有轉換設定，顯示原始回應
                document.getElementById('apiResponse').textContent = JSON.stringify(result.response, null, 2);
                document.getElementById('transformedResult').style.display = 'none';
            }
            
            testResult.style.display = 'block';
            showAlert(`API測試成功！回應時間: ${responseTime}ms`, 'success');
        } else {
            throw new Error(result.error || 'API測試失敗');
        }
        
    } catch (error) {
        console.error('API測試錯誤:', error);
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = error.message;
        }
        if (testError) {
            testError.style.display = 'block';
        }
        showAlert(`API測試失敗: ${error.message}`, 'danger');
    } finally {
        // 恢復按鈕狀態
        if (testButton) {
            testButton.disabled = false;
            testButton.innerHTML = '<i class="fas fa-play me-2"></i>測試API';
        }
    }
}

// 從已配置的CSV檔案中獲取變數
async function loadFactualityVariablesFromConfig() {
    console.log('loadFactualityVariablesFromConfig 被調用');
    
    // 檢查是否有已配置的CSV檔案
    const csvFileInput = document.getElementById('csvFile');
    console.log('csvFileInput:', csvFileInput);
    
    if (csvFileInput && csvFileInput.files.length > 0) {
        console.log('找到上傳的CSV檔案，開始讀取');
        // 如果有上傳的檔案，直接讀取檔案內容並解析headers
        const file = csvFileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            console.log('從上傳檔案解析到的headers:', headers);
            
            // 更新事實性檢查變數選項
            if (window.ScoringCriteria && window.ScoringCriteria.updateFactualityVariables) {
                window.ScoringCriteria.updateFactualityVariables(headers);
            }
        };
        reader.readAsText(file);
    } else {
        // 如果沒有上傳檔案，嘗試從已配置的CSV檔案中獲取
        console.log('沒有上傳檔案，嘗試從已配置的CSV檔案中獲取headers');
        
        // 檢查是否有選中的配置
        const selectedConfig = ConfigManager.selectedConfig();
        if (selectedConfig && selectedConfig.id) {
            console.log('找到選中的配置:', selectedConfig.id);
            
            try {
                const response = await fetch(`/api/get-csv-headers/${selectedConfig.id}`);
                const result = await response.json();
                
                if (response.ok && result.success) {
                    console.log('從已配置CSV檔案獲取到的headers:', result.headers);
                    console.log('檔案名稱:', result.filename);
                    
                    // 更新事實性檢查變數選項
                    if (window.ScoringCriteria && window.ScoringCriteria.updateFactualityVariables) {
                        window.ScoringCriteria.updateFactualityVariables(result.headers);
                    }
                } else {
                    console.log('無法從已配置CSV檔案獲取headers:', result.error);
                    console.log('請先上傳CSV檔案');
                }
            } catch (error) {
                console.error('獲取已配置CSV headers失敗:', error);
                console.log('請先上傳CSV檔案');
            }
        } else {
            console.log('沒有選中的配置，請先上傳CSV檔案');
        }
    }
}

// 切換問題輸入方式
function toggleQuestionInput() {
    const questionSource = document.querySelector('input[name="questionSource"]:checked');
    if (!questionSource) return;
    
    const questionSourceValue = questionSource.value;
    const uploadSection = document.getElementById('uploadQuestionsSection');
    
    console.log('切換問題輸入方式:', questionSourceValue);
    
    if (questionSourceValue === 'upload') {
        // 檔案上傳模式：顯示檔案上傳區域
        if (uploadSection) {
            uploadSection.style.display = 'block';
            console.log('設置 uploadSection display: block');
        }
        console.log('切換到檔案上傳模式');
    }
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
    if (ConfigManager.selectedConfig()) {
        ConfigManager.showConfigDetails(ConfigManager.selectedConfig());
    } else {
        // 沒有選中配置，顯示提示
        configDetails.innerHTML = '<p class="text-muted">請選擇一個配置檔案查看詳情，或點擊「新增配置」創建新配置</p>';
    }
}

// 取消配置表單
function cancelConfigForm() {
    hideConfigForm();
}

// 添加request body監聽器
function addRequestBodyListener() {
    const requestBodyElement = document.getElementById('requestBody');
    if (requestBodyElement) {
        requestBodyElement.addEventListener('input', function() {
            // 如果當前是手動輸入模式，重新生成表單
            const testModeManual = document.getElementById('testModeManual');
            if (testModeManual && testModeManual.checked) {
                generateDynamicTestForm();
            }
        });
    }
}

// 初始化動態表單功能
function initializeDynamicTestForm() {
    // 添加request body監聽器
    addRequestBodyListener();
    
    // 如果當前是手動輸入模式，生成初始表單
    const testModeManual = document.getElementById('testModeManual');
    if (testModeManual && testModeManual.checked) {
        generateDynamicTestForm();
    }
}

// 匯出配置表單相關的函數供其他模組使用
window.ConfigForm = {
    showConfigForm,
    generateConfigFormHTML,
    handleCSVUpload,
    updateAPITestWithCSV,
    toggleTestMode,
    loadTestData,
    testAPIWithCSV,
    toggleFullContent,
    toggleTestDataContent,
    toggleJSONPreview,
    toggleQuestionInput,
    hideConfigForm,
    cancelConfigForm,
    generateDynamicTestForm,
    analyzeRequestBody,
    testAPIWithDynamicForm,
    initializeDynamicTestForm,
    updateUnifiedTestButton,
    executeAPITest,
    checkManualTestInput
};
