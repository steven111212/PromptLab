// 主要的評估結果管理模組
// 依賴：evaluation-api.js, chart-manager.js, modal-charts.js, result-filters.js

// 載入評估結果列表
async function loadEvaluationResults() {
    const container = document.getElementById('resultsTable');
    const dashboard = document.getElementById('resultsDashboard');
    
    console.log('[Results] 開始載入評估結果列表');
    const loadStartTime = Date.now();
    
    // 顯示骨架屏
    container.innerHTML = `
        <div class="skeleton-card">
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-short"></div>
        </div>
        <div class="skeleton-card">
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-short"></div>
        </div>
        <div class="skeleton-card">
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-short"></div>
        </div>
    `;
    
    // 清空儀表板顯示載入中
    if (dashboard) {
        dashboard.innerHTML = `
            <div class="col-12">
                <div class="text-center text-muted py-3">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    載入統計數據中...
                </div>
            </div>
        `;
    }
    
    try {
        const results = await EvaluationAPI.getResults();
        const loadDuration = Date.now() - loadStartTime;
        console.log(`[Results] 評估結果載入完成，耗時：${loadDuration}ms，結果數：${results?.length || 0}`);
        
        if (!results || results.length === 0) {
            console.log('[Results] 沒有評估結果');
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    目前沒有評估結果
                </div>
            `;
            // 清空儀表板
            if (dashboard) dashboard.innerHTML = '';
            return;
        }
        
        console.log('[Results] 開始渲染評估結果...');
        
        // 從本地存儲載入書籤
        loadBookmarks();
        
        // 設置結果到篩選器
        if (window.ResultFilters) {
            window.ResultFilters.setResults(results);
        }
        
        // 渲染統計儀表板
        renderDashboard(results);
        
        // 設置篩選器事件監聽
        setupFilterListeners();
        
        // 初始渲染結果
        renderResults(results);
        
        console.log('[Results] 評估結果渲染完成');
        
    } catch (error) {
        const loadDuration = Date.now() - loadStartTime;
        console.error(`[Results] 載入評估結果失敗（耗時${loadDuration}ms）:`, error);
        console.error('[Results] 錯誤堆棧:', error.stack);
        
        const errorHtml = `
            <div class="alert alert-danger">
                <h5 class="alert-heading">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    載入評估結果失敗
                </h5>
                <hr>
                <p class="mb-2"><strong>錯誤訊息：</strong> ${error.message}</p>
                <p class="mb-2"><strong>耗時：</strong> ${loadDuration}ms</p>
                <p class="mb-0"><strong>建議：</strong></p>
                <ul class="mb-0">
                    <li>檢查後端服務是否正常運行</li>
                    <li>打開瀏覽器開發者工具（F12）查看 Console 和 Network 標籤</li>
                    <li>檢查 API 端點 <code>/api/evaluation-results</code> 是否可訪問</li>
                    ${error.message.includes('超時') ? '<li class="text-warning">請求超時，請檢查網絡連接或後端響應速度</li>' : ''}
                    ${error.message.includes('Failed to fetch') ? '<li class="text-warning">無法連接到後端，請確認服務器正在運行</li>' : ''}
                </ul>
                <hr>
                <button class="btn btn-primary btn-sm mt-2" onclick="loadEvaluationResults()">
                    <i class="fas fa-sync-alt me-1"></i>重新載入
                </button>
            </div>
        `;
        
        container.innerHTML = errorHtml;
        if (dashboard) dashboard.innerHTML = '';
    }
}

// 導航到評估詳情頁面
function navigateToEvaluationDetail(evalId) {
    console.log(`[Detail] 導航到評估詳情頁面: ${evalId}`);
    
    // 切換到詳情視圖
    document.getElementById('results').style.display = 'none';
    document.getElementById('config').style.display = 'none';
    
    // 獲取或創建詳情容器
    let detailContainer = document.getElementById('evaluation-detail');
    if (!detailContainer) {
        console.log('[Detail] 創建新的詳情容器');
        detailContainer = document.createElement('div');
        detailContainer.id = 'evaluation-detail';
        detailContainer.className = 'tab-content';
        document.querySelector('.container-fluid').appendChild(detailContainer);
    } else {
        console.log('[Detail] 使用現有詳情容器，清空舊內容');
        // 清空舊內容，避免殘留
        detailContainer.innerHTML = '';
    }
    
    // 確保容器可見
    detailContainer.style.display = 'block';
    
    // 載入評估詳情
    loadEvaluationDetail(evalId);
}

// 載入評估詳情
async function loadEvaluationDetail(evalId) {
    const container = document.getElementById('evaluation-detail');
    
    // 容器驗證
    if (!container) {
        console.error('[Detail] 找不到評估詳情容器！');
        Toast.error('系統錯誤：找不到顯示容器');
        return;
    }
    
    console.log(`[Detail] 開始載入評估詳情: ${evalId}`);
    const detailStartTime = Date.now();
    
    try {
        // 顯示載入中
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">載入中...</span>
                </div>
                <p class="mt-3 text-muted">正在載入評估詳情...</p>
            </div>
        `;
        
        const detail = await EvaluationAPI.getDetail(evalId);
        const detailDuration = Date.now() - detailStartTime;
        console.log(`[Detail] 評估詳情數據載入完成，耗時：${detailDuration}ms`);
        
        // 數據驗證
        if (!detail) {
            throw new Error('無法獲取評估詳情數據');
        }
        
        if (!detail.details || !Array.isArray(detail.details)) {
            throw new Error('評估數據格式錯誤：缺少測試案例詳情');
        }
        
        if (detail.details.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    此評估沒有測試案例數據
                    <button class="btn btn-outline-secondary btn-sm ms-3" onclick="backToResults()">
                        <i class="fas fa-arrow-left me-1"></i>返回列表
                    </button>
                </div>
            `;
            return;
        }
        
        // 計算統計信息
        const totalTests = detail.details.length;
        const passedTests = detail.details.filter(t => t && t.success).length;
        const failedTests = totalTests - passedTests;
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';
        
        // 計算延遲統計
        const latencies = detail.details.map(t => t.latency || 0).filter(l => l > 0);
        const avgLatency = latencies.length > 0 
            ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) 
            : 0;
        const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
        const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
        
        const detailHtml = `
            <div class="px-3">
                <!-- 標題欄 - 超緊湊版 -->
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h5 class="mb-0">
                            <i class="fas fa-chart-line me-2 text-primary"></i>
                            評估詳細結果 <small class="text-muted" style="font-size: 0.75rem;">ID: ${evalId.substring(0, 12)}...</small>
                        </h5>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="backToResults()">
                        <i class="fas fa-arrow-left me-1"></i>返回列表
                    </button>
                </div>
                
                <!-- 超緊湊型統計卡片 -->
                <div class="row g-2 mb-2">
                    <div class="col-md-3">
                        <div class="detail-stat-card info">
                            <div class="detail-stat-icon">
                                <i class="fas fa-list-check"></i>
                            </div>
                            <div class="detail-stat-value">${totalTests}</div>
                            <div class="detail-stat-label">總測試數</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="detail-stat-card success">
                            <div class="detail-stat-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="detail-stat-value">${passedTests}</div>
                            <div class="detail-stat-label">✓ 通過</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="detail-stat-card danger">
                            <div class="detail-stat-icon">
                                <i class="fas fa-times-circle"></i>
                            </div>
                            <div class="detail-stat-value">${failedTests}</div>
                            <div class="detail-stat-label">✗ 失敗</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="detail-stat-card ${passRate >= 80 ? 'success' : passRate >= 60 ? 'warning' : 'danger'}">
                            <div class="detail-stat-icon">
                                <i class="fas fa-percentage"></i>
                            </div>
                            <div class="detail-stat-value">${passRate}%</div>
                            <div class="detail-stat-label">通過率</div>
                        </div>
                    </div>
                </div>

                <!-- 延遲統計 - 超緊湊版 -->
                ${avgLatency > 0 ? `
                <div class="card border-0 mb-2" style="background: #f9fafb; border: 1px solid #e5e7eb !important;">
                    <div class="card-body py-1 px-2">
                        <div class="d-flex justify-content-around align-items-center" style="font-size: 0.875rem;">
                            <div>
                                <span class="text-muted" style="font-size: 0.75rem;">平均延遲</span>
                                <strong class="ms-1">
                                    <i class="fas fa-clock text-info" style="font-size: 0.75rem;"></i>
                                    ${avgLatency}ms
                                </strong>
                            </div>
                            <div class="text-muted" style="font-size: 0.75rem;">|</div>
                            <div>
                                <span class="text-muted" style="font-size: 0.75rem;">最快</span>
                                <strong class="ms-1">
                                    <i class="fas fa-bolt text-success" style="font-size: 0.75rem;"></i>
                                    ${minLatency}ms
                                </strong>
                            </div>
                            <div class="text-muted" style="font-size: 0.75rem;">|</div>
                            <div>
                                <span class="text-muted" style="font-size: 0.75rem;">最慢</span>
                                <strong class="ms-1">
                                    <i class="fas fa-hourglass-half text-warning" style="font-size: 0.75rem;"></i>
                                    ${maxLatency}ms
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- 篩選工具欄 -->
                <div class="detail-filter-bar">
                    <div class="row align-items-center g-2">
                        <div class="col-md-7">
                            <div class="filter-btn-group">
                                <button class="filter-btn active" onclick="filterTestCases('all')" data-filter="all">
                                    <i class="fas fa-list"></i>
                                    全部 (${totalTests})
                                </button>
                                <button class="filter-btn" onclick="filterTestCases('passed')" data-filter="passed">
                                    <i class="fas fa-check-circle text-success"></i>
                                    通過 (${passedTests})
                                </button>
                                <button class="filter-btn" onclick="filterTestCases('failed')" data-filter="failed">
                                    <i class="fas fa-times-circle text-danger"></i>
                                    失敗 (${failedTests})
                                </button>
                            </div>
                        </div>
                        <div class="col-md-5">
                            <input type="text" class="form-control form-control-sm" id="testCaseSearch" 
                                   placeholder="🔍 搜索測試案例..." 
                                   onkeyup="searchTestCases()">
                        </div>
                    </div>
                </div>
                
                <!-- 測試案例詳情表格 -->
                ${generateTestCaseTable(detail)}
            </div>
        `;
        
        container.innerHTML = detailHtml;
        
        // 儲存詳細數據供彈出視窗和篩選使用
        window.currentEvalDetail = detail;
        
        console.log('[Detail] 評估詳情頁面渲染完成');
        console.log('[Detail] currentEvalDetail 已更新，包含', detail.details?.length || 0, '個測試案例');
        
        // 生成圖表（如果需要）
        // generateCharts(detail);
        
    } catch (error) {
        const detailDuration = Date.now() - detailStartTime;
        console.error(`[Detail] 載入評估詳細結果失敗（耗時${detailDuration}ms）:`, error);
        console.error('[Detail] 錯誤堆棧:', error.stack);
        
        const errorHtml = `
            <div class="alert alert-danger m-3">
                <h5 class="alert-heading">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    載入詳細結果失敗
                </h5>
                <hr>
                <p class="mb-2"><strong>錯誤訊息：</strong> ${error.message}</p>
                <p class="mb-2"><strong>耗時：</strong> ${detailDuration}ms</p>
                <hr>
                <button class="btn btn-secondary btn-sm" onclick="backToResults()">
                    <i class="fas fa-arrow-left me-1"></i>返回列表
                </button>
                <button class="btn btn-primary btn-sm ms-2" onclick="navigateToEvaluationDetail('${evalId}')">
                    <i class="fas fa-sync-alt me-1"></i>重新載入
                </button>
            </div>
        `;
        
        if (container) {
            container.innerHTML = errorHtml;
        }
    }
}

// 生成測試案例表格
function generateTestCaseTable(detail) {
    try {
        // 數據驗證
        if (!detail || !detail.details || detail.details.length === 0) {
            return `
                <div class="alert alert-warning">
                    <i class="fas fa-info-circle me-2"></i>
                    沒有測試案例數據
                </div>
            `;
        }
        
        // 動態獲取所有變數欄位
        const allVariables = new Set();
        detail.details.forEach(test => {
            if (test && test.variables && typeof test.variables === 'object') {
                Object.keys(test.variables).forEach(key => allVariables.add(key));
            }
        });
        const variableKeys = Array.from(allVariables);

        // 如果沒有任何變數欄位，添加一個默認列
        if (variableKeys.length === 0) {
            variableKeys.push('測試案例');
        }

        return `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-transparent border-0 pt-3">
                    <h5 class="mb-0">
                        <i class="fas fa-clipboard-list me-2 text-primary"></i>
                        測試案例詳情
                    </h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 800px; overflow-y: auto;">
                        <table class="table test-case-table mb-0" id="testCaseTable">
                            <thead>
                                <tr>
                                    <th style="width: 50px;">#</th>
                                    ${variableKeys.map(key => 
                                        `<th style="min-width: 200px;">${escapeHtml(key)}</th>`
                                    ).join('')}
                                    <th style="min-width: 350px;">Output & Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${detail.details.map((test, index) => {
                                    try {
                                        return generateTestCaseRow(test, index, variableKeys, detail.id);
                                    } catch (rowError) {
                                        console.error(`生成測試案例行 ${index + 1} 失敗:`, rowError);
                                        return `
                                            <tr>
                                                <td colspan="${variableKeys.length + 2}" class="text-danger">
                                                    <i class="fas fa-exclamation-triangle me-2"></i>
                                                    測試案例 #${index + 1} 數據格式錯誤
                                                </td>
                                            </tr>
                                        `;
                                    }
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('生成測試案例表格失敗:', error);
        return `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                生成測試案例表格失敗: ${error.message}
            </div>
        `;
    }
}

// HTML 轉義函數
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// 生成測試案例行
function generateTestCaseRow(test, index, variableKeys, evalId) {
    // 數據驗證
    if (!test) {
        return `
            <tr>
                <td colspan="${variableKeys.length + 2}" class="text-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    測試案例數據為空
                </td>
            </tr>
        `;
    }
    
    const rowClass = test.success ? 'test-passed' : 'test-failed';
    
    return `
        <tr class="${rowClass}" data-test-status="${test.success ? 'passed' : 'failed'}">
            <td style="text-align: center; font-weight: 600; color: #6b7280;">
                ${index + 1}
            </td>
            ${variableKeys.map(key => {
                let value = '';
                try {
                    value = test.variables?.[key] || '';
                    // 確保value是字符串
                    if (typeof value !== 'string') {
                        value = JSON.stringify(value);
                    }
                } catch (e) {
                    console.error(`讀取變數 ${key} 失敗:`, e);
                    value = '<span class="text-danger">數據錯誤</span>';
                }
                
                return `
                    <td style="word-wrap: break-word;">
                        <div class="variable-content">
                            ${value && value.length > 100 ? 
                                `<div class="variable-short" id="var_short_${index}_${key}">
                                    ${escapeHtml(value.substring(0, 100))}...
                                    <br><button class="btn btn-link btn-sm p-0 mt-1" onclick="toggleVariableContent(${index}, '${key}')">顯示更多</button>
                                </div>
                                <div class="variable-full" id="var_full_${index}_${key}" style="display: none;">
                                    ${escapeHtml(value)}
                                    <br><button class="btn btn-link btn-sm p-0 mt-1" onclick="toggleVariableContent(${index}, '${key}')">顯示較少</button>
                                </div>` : 
                                (value ? escapeHtml(value) : '<span class="text-muted">-</span>')
                            }
                        </div>
                    </td>
                `;
            }).join('')}
            <td style="word-wrap: break-word;">
                ${generateOutputResultCell(test, index, evalId)}
            </td>
        </tr>
    `;
}

// 生成輸出結果單元格
function generateOutputResultCell(test, index, evalId) {
    try {
        // 數據驗證
        if (!test) {
            return '<span class="text-danger">測試數據為空</span>';
        }
        
        const passCount = test.assertions?.filter(a => a && a.pass).length || 0;
        const totalCount = test.assertions?.length || 0;
        
        // 延遲信息
        const latency = test.latency || 0;
        let latencyClass = 'latency-normal';
        if (latency < 1000) latencyClass = 'latency-fast';
        else if (latency > 3000) latencyClass = 'latency-slow';
        
        // 安全地獲取輸出內容
        let outputContent = '';
        if (test.output) {
            outputContent = String(test.output);
        } else if (test.error) {
            outputContent = `<span class="text-danger">${escapeHtml(String(test.error))}</span>`;
        } else {
            outputContent = '<em class="text-muted">無輸出</em>';
        }

        return `
            <div>
                <!-- 狀態和延遲並排，詳情按鈕在右側 -->
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge ${test.success ? 'bg-success' : 'bg-danger'}" style="font-size: 13px;">
                            <i class="fas fa-${test.success ? 'check-circle' : 'times-circle'} me-1"></i>
                            ${test.success ? '通過' : '失敗'}
                        </span>
                        ${latency > 0 ? `
                            <span class="latency-badge ${latencyClass}">
                                <i class="fas fa-clock me-1" style="font-size: 0.75rem;"></i>${latency}ms
                            </span>
                        ` : ''}
                    </div>
                    ${test.assertions && test.assertions.length > 0 ? `
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="showTestDetails(${index}, '${evalId}')"
                                title="查看評分詳情">
                            <i class="fas fa-chart-bar me-1"></i>評分
                        </button>
                    ` : '<span class="text-muted small">無評分數據</span>'}
                </div>
                
                <!-- 失敗原因 -->
                ${!test.success && test.grading_info?.reason ? 
                    `<div class="mb-2 text-danger" style="font-size: 0.85rem; padding: 0.5rem; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px;">
                        <i class="fas fa-exclamation-circle me-1"></i>
                        <strong>失敗原因:</strong> ${escapeHtml(String(test.grading_info.reason))}
                    </div>` : ''
                }
                
                <!-- Output 預覽 -->
                <div class="mt-2">
                    <div class="small text-muted mb-1"><strong>Output:</strong></div>
                    ${test.output && String(test.output).length > 500 ? 
                        `<div class="output-short" id="output_short_${index}">
                            <div class="bg-light p-2 rounded" style="font-size: 0.875rem; line-height: 1.5; max-height: 250px; overflow-y: auto; white-space: pre-line; word-break: break-word;">
                                ${escapeHtml(String(test.output).substring(0, 500).trim())}...
                            </div>
                            <div class="mt-2">
                                <button class="btn btn-link btn-sm p-0" onclick="toggleOutputContent(${index})">
                                    <i class="fas fa-chevron-down me-1"></i>顯示更多
                                </button>
                            </div>
                        </div>
                        <div class="output-full" id="output_full_${index}" style="display: none;">
                            <div class="bg-light p-2 rounded" style="font-size: 0.875rem; line-height: 1.5; max-height: 400px; overflow-y: auto; white-space: pre-line; word-break: break-word;">
                                ${escapeHtml(String(test.output).trim())}
                            </div>
                            <div class="mt-2">
                                <button class="btn btn-link btn-sm p-0" onclick="toggleOutputContent(${index})">
                                    <i class="fas fa-chevron-up me-1"></i>顯示較少
                                </button>
                            </div>
                        </div>` : 
                        `<div class="bg-light p-2 rounded" style="font-size: 0.875rem; line-height: 1.5; max-height: 250px; overflow-y: auto; white-space: pre-line; word-break: break-word;">
                            ${outputContent}
                        </div>`
                    }
                </div>
            </div>
        `;
    } catch (error) {
        console.error('生成輸出結果單元格失敗:', error);
        return `<div class="text-danger"><i class="fas fa-exclamation-triangle me-1"></i>數據格式錯誤</div>`;
    }
}

// 返回結果列表
function backToResults() {
    console.log('[Detail] 返回評估結果列表');
    
    const detailContainer = document.getElementById('evaluation-detail');
    const resultsContainer = document.getElementById('results');
    
    if (detailContainer) {
        detailContainer.style.display = 'none';
        console.log('[Detail] 評估詳情容器已隱藏');
    }
    
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
        console.log('[Results] 評估結果容器已顯示');
    }
    
    // 更新導航標籤
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const resultsTab = document.querySelector('[data-tab="results"]');
    if (resultsTab) {
        resultsTab.classList.add('active');
    }
    
    // 不清除 window.currentEvalDetail，保留以備後用
    console.log('[Detail] 返回操作完成');
}

// 篩選測試案例
function filterTestCases(filter) {
    // 更新按鈕狀態
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // 篩選表格行
    const table = document.getElementById('testCaseTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const status = row.getAttribute('data-test-status');
        if (filter === 'all') {
            row.style.display = '';
        } else if (filter === 'passed' && status === 'passed') {
            row.style.display = '';
        } else if (filter === 'failed' && status === 'failed') {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// 搜索測試案例
function searchTestCases() {
    const searchInput = document.getElementById('testCaseSearch');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase();
    const table = document.getElementById('testCaseTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(query)) {
            // 只顯示匹配搜索且符合當前篩選的行
            const currentFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter');
            const status = row.getAttribute('data-test-status');
            
            if (!currentFilter || currentFilter === 'all') {
                row.style.display = '';
            } else if (currentFilter === status) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        } else {
            row.style.display = 'none';
        }
    });
}

// 切換變數內容顯示
function toggleVariableContent(testIndex, variableName) {
    const shortElement = document.getElementById(`var_short_${testIndex}_${variableName}`);
    const fullElement = document.getElementById(`var_full_${testIndex}_${variableName}`);
    
    if (shortElement && fullElement) {
        if (shortElement.style.display === 'none') {
            shortElement.style.display = 'block';
            fullElement.style.display = 'none';
        } else {
            shortElement.style.display = 'none';
            fullElement.style.display = 'block';
        }
    }
}

// 切換輸出內容顯示
function toggleOutputContent(testIndex) {
    const shortElement = document.getElementById(`output_short_${testIndex}`);
    const fullElement = document.getElementById(`output_full_${testIndex}`);
    
    if (shortElement && fullElement) {
        if (shortElement.style.display === 'none') {
            shortElement.style.display = 'block';
            fullElement.style.display = 'none';
        } else {
            shortElement.style.display = 'none';
            fullElement.style.display = 'block';
        }
    }
}

// 顯示測試詳細資訊
async function showTestDetails(testIndex, evalId) {
    try {
        // 使用已經載入的數據而不是重新請求 API
        const detail = window.currentEvalDetail;
        if (!detail) {
            console.error('找不到評估詳細數據');
            Toast.error('找不到評估數據，請重新載入頁面');
            return;
        }
        const test = detail.details[testIndex];
        
        // 生成 Assertions 表格的 HTML
        const assertionsHtml = test.assertions && test.assertions.length > 0 ? 
            test.assertions.map(assertion => `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center; width: 60px;">
                        ${assertion.pass ? 
                            '<i class="fas fa-check-circle text-success" style="font-size: 1.2rem;"></i>' : 
                            '<i class="fas fa-times-circle text-danger" style="font-size: 1.2rem;"></i>'
                        }
                    </td>
                    <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center; width: 100px;">
                        <span class="badge ${assertion.pass ? 'bg-success' : 'bg-danger'}" style="font-size: 0.9rem;">
                            ${assertion.score !== undefined ? (assertion.score * 100).toFixed(0) + '%' : 'N/A'}
                        </span>
                    </td>
                    <td style="border: 1px solid #dee2e6; padding: 12px; width: 120px;">
                        <span class="badge ${assertion.type === 'g-eval' ? 'bg-primary' : 
                                           assertion.type === 'javascript' ? 'bg-warning text-dark' : 
                                           assertion.type === 'python' ? 'bg-info' :
                                           assertion.type === 'bert-score' ? 'bg-success' : 
                                           assertion.type === 'factuality' ? 'bg-success' : 'bg-secondary'}" 
                              style="font-size: 0.85rem;">
                            ${assertion.type || 'unknown'}
                        </span>
                    </td>
                    <td style="border: 1px solid #dee2e6; padding: 12px; max-width: 250px; word-wrap: break-word;">
                        <div style="font-size: 0.9rem; line-height: 1.4;">
                            ${assertion.value ? 
                                (assertion.value.length > 150 ? 
                                    assertion.value.substring(0, 150) + '...' : 
                                    assertion.value) : 
                                '<span class="text-muted">無值</span>'
                            }
                        </div>
                    </td>
                    <td style="border: 1px solid #dee2e6; padding: 12px; word-wrap: break-word;">
                        <div style="font-size: 0.9rem; line-height: 1.4;">
                            ${assertion.reason || '<span class="text-muted">無原因說明</span>'}
                        </div>
                    </td>
                </tr>
            `).join('') : 
            '<tr><td colspan="5" class="text-center text-muted py-4">無 Assertion 資料</td></tr>';

        const modalHtml = `
            <div class="modal fade" id="testDetailModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-light">
                            <h5 class="modal-title">
                                <i class="fas fa-chart-bar me-2 text-primary"></i>
                                評分詳情 - 案例 #${testIndex + 1}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                            <div class="table-responsive">
                                <table class="table table-hover table-sm mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th style="width: 60px; text-align: center;">結果</th>
                                            <th style="width: 100px; text-align: center;">分數</th>
                                            <th style="width: 120px;">類型</th>
                                            <th style="max-width: 250px;">期望值</th>
                                            <th>評分原因</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${assertionsHtml}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer bg-light py-2">
                            <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>關閉
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 移除舊的模態框
        const existingModal = document.getElementById('testDetailModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 添加新的模態框到頁面
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('testDetailModal'));
        modal.show();
        
        // 模態框關閉後移除DOM元素
        document.getElementById('testDetailModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
        
    } catch (error) {
        console.error('載入測試詳細資訊失敗:', error);
        alert('載入測試詳細資訊失敗: ' + error.message);
    }
}

// 自動載入結果
function autoLoadResults() {
    const resultsContainer = document.getElementById('resultsTable');
    const resultsTab = document.getElementById('results');
    
    if (resultsContainer && resultsTab && resultsTab.style.display !== 'none') {
        loadEvaluationResults();
    }
}

// 頁面載入時自動載入結果
document.addEventListener('DOMContentLoaded', autoLoadResults);

// 切換到結果頁面時自動載入
document.querySelectorAll('[data-tab="results"]').forEach(tab => {
    tab.addEventListener('click', autoLoadResults);
});

// 生成圖表
function generateCharts(detail) {
    // 生成延遲分佈圖
    generateLatencyChart(detail);
    
    // 生成 BERT Score F1 分佈圖
    generateBertScoreChart(detail);
}

// 生成延遲分佈圖
function generateLatencyChart(detail) {
    const ctx = document.getElementById('latencyChart');
    if (!ctx) return;
    
    // 收集延遲數據
    const latencies = detail.details
        .map(test => test.latency)
        .filter(latency => latency !== undefined && latency !== null)
        .map(latency => parseFloat(latency));
    
    if (latencies.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-muted text-center">無延遲數據</p>';
        return;
    }
    
    // 計算分佈
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    const binSize = Math.max(10, Math.ceil((maxLatency - minLatency) / 10));
    const bins = {};
    
    latencies.forEach(latency => {
        const bin = Math.floor(latency / binSize) * binSize;
        bins[bin] = (bins[bin] || 0) + 1;
    });
    
    const labels = Object.keys(bins).map(Number).sort((a, b) => a - b);
    const data = labels.map(label => bins[label]);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(label => `${label}-${label + binSize}ms`),
            datasets: [{
                label: 'Count',
                data: data,
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Latency (ms)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Count: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

// 生成 BERT Score F1 分佈圖
function generateBertScoreChart(detail) {
    const ctx = document.getElementById('bertScoreChart');
    if (!ctx) return;
    
    // 收集 BERT Score F1 數據
    const bertScores = [];
    detail.details.forEach(test => {
        if (test.assertions) {
            test.assertions.forEach(assertion => {
                if (assertion.type === 'python' && assertion.score !== undefined) {
                    // 檢查是否是 BERT Score F1
                    if (assertion.reason && assertion.reason.includes('BERTScore F1')) {
                        bertScores.push(parseFloat(assertion.score));
                    }
                }
            });
        }
    });
    
    if (bertScores.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-muted text-center">無 BERT Score F1 數據</p>';
        return;
    }
    
    // 計算分佈
    const minScore = Math.min(...bertScores);
    const maxScore = Math.max(...bertScores);
    const binSize = Math.max(0.1, Math.ceil((maxScore - minScore) / 10 * 10) / 10);
    const bins = {};
    
    bertScores.forEach(score => {
        const bin = Math.floor(score / binSize) * binSize;
        bins[bin] = (bins[bin] || 0) + 1;
    });
    
    const labels = Object.keys(bins).map(Number).sort((a, b) => a - b);
    const data = labels.map(label => bins[label]);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(label => `${label.toFixed(1)}-${(label + binSize).toFixed(1)}`),
            datasets: [{
                label: 'Count',
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'BERT Score F1'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Count: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

// ==================== Phase 3: 新增功能 ====================

// 渲染統計儀表板
function renderDashboard(results) {
    const dashboard = document.getElementById('resultsDashboard');
    if (!dashboard) return;
    
    // 計算統計數據
    const totalCount = results.length;
    const avgPassRate = totalCount > 0 
        ? (results.reduce((sum, r) => sum + (parseFloat(r.pass_rate) || 0), 0) / totalCount).toFixed(1)
        : 0;
    
    // 計算最近7天的數據
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentResults = results.filter(r => new Date(r.created) >= sevenDaysAgo);
    
    // 找到最高分
    const maxPassRate = results.length > 0
        ? Math.max(...results.map(r => parseFloat(r.pass_rate) || 0))
        : 0;
    const bestResult = results.find(r => parseFloat(r.pass_rate) === maxPassRate);
    
    dashboard.innerHTML = `
        <div class="col-md-3">
            <div class="stat-card">
                <div class="stat-card-icon" style="background: #eff6ff; color: #3b82f6;">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <div class="stat-card-content">
                    <div class="stat-card-label">總評測數</div>
                    <div class="stat-card-value">${totalCount}</div>
                    <div class="stat-card-change positive">
                        <i class="fas fa-arrow-up me-1"></i>本週 +${recentResults.length}
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card">
                <div class="stat-card-icon" style="background: #d1fae5; color: #10b981;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-card-content">
                    <div class="stat-card-label">平均通過率</div>
                    <div class="stat-card-value">${avgPassRate}%</div>
                    <div class="stat-card-change ${avgPassRate >= 80 ? 'positive' : 'negative'}">
                        <i class="fas fa-${avgPassRate >= 80 ? 'arrow-up' : 'arrow-down'} me-1"></i>${avgPassRate >= 80 ? '表現良好' : '需要改善'}
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card">
                <div class="stat-card-icon" style="background: #fef3c7; color: #f59e0b;">
                    <i class="fas fa-fire"></i>
                </div>
                <div class="stat-card-content">
                    <div class="stat-card-label">最近 7 天</div>
                    <div class="stat-card-value">${recentResults.length}</div>
                    <div class="stat-card-change positive">
                        <i class="fas fa-clock me-1"></i>活躍測試
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card">
                <div class="stat-card-icon" style="background: #fce7f3; color: #ec4899;">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stat-card-content">
                    <div class="stat-card-label">最高分</div>
                    <div class="stat-card-value">${maxPassRate}%</div>
                    <div class="stat-card-change" style="color: #6b7280;">
                        <i class="fas fa-trophy me-1"></i>${bestResult ? (bestResult.description || '未命名').substring(0, 15) : '-'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 設置篩選器事件監聽
function setupFilterListeners() {
    // 搜索框
    const searchInput = document.getElementById('resultSearchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (window.ResultFilters) {
                    window.ResultFilters.setSearch(e.target.value);
                    const filtered = window.ResultFilters.getFilteredResults();
                    renderResults(filtered);
                    updateFilterUI();
                }
            }, 300);
        });
    }
    
    // 時間範圍篩選
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    if (dateRangeFilter) {
        dateRangeFilter.addEventListener('change', function(e) {
            if (window.ResultFilters) {
                window.ResultFilters.setDateRangeFilter(e.target.value);
                const filtered = window.ResultFilters.getFilteredResults();
                renderResults(filtered);
                updateFilterUI();
            }
        });
    }
    
    // 通過率篩選
    const passRateFilter = document.getElementById('passRateFilter');
    if (passRateFilter) {
        passRateFilter.addEventListener('change', function(e) {
            if (window.ResultFilters) {
                window.ResultFilters.setPassRateFilter(e.target.value);
                const filtered = window.ResultFilters.getFilteredResults();
                renderResults(filtered);
                updateFilterUI();
            }
        });
    }
    
    // 排序
    const sortByFilter = document.getElementById('sortByFilter');
    if (sortByFilter) {
        sortByFilter.addEventListener('change', function(e) {
            const [sortBy, sortOrder] = e.target.value.split('-');
            if (window.ResultFilters) {
                window.ResultFilters.setSort(sortBy, sortOrder);
                const filtered = window.ResultFilters.getFilteredResults();
                renderResults(filtered);
            }
        });
    }
}

// 渲染結果表格
function renderResults(results) {
    const container = document.getElementById('resultsTable');
    if (!container) return;
    
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                沒有符合條件的評估結果
            </div>
        `;
        return;
    }
    
    const resultsHtml = `
        <div class="card border-0 shadow-sm">
            <div class="table-responsive">
                <table class="table table-enhanced mb-0">
                    <thead>
                        <tr>
                            <th style="width: 50px;"></th>
                            <th>評估ID</th>
                            <th>創建時間</th>
                            <th>描述</th>
                            <th style="text-align: center;">測試數量</th>
                            <th style="text-align: center;">通過率</th>
                            <th style="text-align: center;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(result => {
                            const displayId = result.id.length > 8 ? 
                                result.id.substring(0, 8) + '...' : result.id;
                            const passRate = parseFloat(result.pass_rate) || 0;
                            const passRateClass = passRate >= 80 ? 'high' : passRate >= 60 ? 'medium' : 'low';
                            const bookmarked = isBookmarked(result.id);
                            const tags = getResultTags(result.id);
                            
                            return `
                                <tr>
                                    <td>
                                        <i class="fas fa-star bookmark-btn ${bookmarked ? 'bookmarked' : ''}" 
                                           onclick="toggleBookmark('${result.id}')"
                                           title="${bookmarked ? '取消收藏' : '收藏'}"></i>
                                    </td>
                                    <td>
                                        <span class="badge bg-secondary" title="${result.id}">
                                            ${displayId}
                                        </span>
                                    </td>
                                    <td>${result.created}</td>
                                    <td>
                                        <div>
                                            ${result.description || '<span class="text-muted">無描述</span>'}
                                        </div>
                                        ${tags.length > 0 ? `
                                            <div class="mt-1">
                                                ${tags.map(tag => `<span class="result-tag ${tag}">${tag}</span>`).join('')}
                                            </div>
                                        ` : ''}
                                    </td>
                                    <td style="text-align: center;">
                                        <span class="badge bg-info">
                                            ${result.dataset_count}
                                        </span>
                                    </td>
                                    <td style="text-align: center;">
                                        <div>
                                            <span class="badge bg-${passRate >= 80 ? 'success' : passRate >= 60 ? 'warning' : 'danger'}">
                                                ${passRate}%
                                            </span>
                                        </div>
                                        <div class="pass-rate-bar">
                                            <div class="pass-rate-fill ${passRateClass}" style="width: ${passRate}%"></div>
                                        </div>
                                    </td>
                                    <td style="text-align: center;">
                                        <div class="d-flex gap-2 justify-content-center align-items-center">
                                            <button class="btn btn-sm btn-outline-primary" 
                                                    onclick="navigateToEvaluationDetail('${result.id}')">
                                                <i class="fas fa-eye me-1"></i>查看
                                            </button>
                                            <div class="dropdown quick-actions">
                                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                                        type="button" data-bs-toggle="dropdown">
                                                    <i class="fas fa-ellipsis-v"></i>
                                                </button>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li>
                                                        <a class="dropdown-item" href="#" onclick="addResultTag('${result.id}')">
                                                            <i class="fas fa-tag me-2"></i>添加標籤
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a class="dropdown-item" href="#" onclick="exportResult('${result.id}')">
                                                            <i class="fas fa-download me-2"></i>導出結果
                                                        </a>
                                                    </li>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li>
                                                        <a class="dropdown-item text-danger" href="#" onclick="deleteResult('${result.id}')">
                                                            <i class="fas fa-trash me-2"></i>刪除
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    container.innerHTML = resultsHtml;
}

// 更新篩選UI
function updateFilterUI() {
    if (!window.ResultFilters) return;
    
    const stats = window.ResultFilters.getFilterStats();
    const activeFilters = stats.activeFilters;
    
    // 更新篩選統計
    const filterStats = document.getElementById('filterStats');
    if (filterStats) {
        filterStats.textContent = `顯示 ${stats.filtered} / ${stats.total} 個結果`;
    }
    
    // 更新活動篩選器標籤
    const activeFiltersContainer = document.getElementById('activeFilters');
    const activeFilterTags = document.getElementById('activeFilterTags');
    
    if (activeFiltersContainer && activeFilterTags) {
        if (activeFilters.length > 0) {
            activeFiltersContainer.style.display = 'block';
            activeFilterTags.innerHTML = activeFilters.map(filter => `
                <span class="filter-tag">
                    ${filter.label}
                    <i class="fas fa-times remove-filter" onclick="removeFilter('${filter.type}', '${filter.value}')"></i>
                </span>
            `).join('');
        } else {
            activeFiltersContainer.style.display = 'none';
        }
    }
}

// 移除篩選器
function removeFilter(type, value) {
    if (window.ResultFilters) {
        window.ResultFilters.removeFilter(type, value);
        const filtered = window.ResultFilters.getFilteredResults();
        renderResults(filtered);
        updateFilterUI();
    }
}

// 清除所有篩選器
function clearAllFilters() {
    if (window.ResultFilters) {
        window.ResultFilters.clearAllFilters();
        const filtered = window.ResultFilters.getFilteredResults();
        renderResults(filtered);
        updateFilterUI();
        
        // 重置表單
        document.getElementById('resultSearchInput').value = '';
        document.getElementById('dateRangeFilter').value = 'all';
        document.getElementById('passRateFilter').value = 'all';
        document.getElementById('sortByFilter').value = 'date-desc';
    }
}

// ==================== 書籤功能 ====================

let bookmarks = [];

// 載入書籤
function loadBookmarks() {
    const stored = localStorage.getItem('resultBookmarks');
    bookmarks = stored ? JSON.parse(stored) : [];
}

// 保存書籤
function saveBookmarks() {
    localStorage.setItem('resultBookmarks', JSON.stringify(bookmarks));
}

// 切換書籤
function toggleBookmark(resultId) {
    const index = bookmarks.indexOf(resultId);
    if (index > -1) {
        bookmarks.splice(index, 1);
        Toast.info('已取消收藏');
    } else {
        bookmarks.push(resultId);
        Toast.success('已收藏');
    }
    saveBookmarks();
    
    // 更新圖標
    const icon = document.querySelector(`.bookmark-btn[onclick="toggleBookmark('${resultId}')"]`);
    if (icon) {
        icon.classList.toggle('bookmarked');
    }
}

// 檢查是否已收藏
function isBookmarked(resultId) {
    return bookmarks.includes(resultId);
}

// ==================== 標籤功能 ====================

let resultTags = {};

// 載入標籤
function loadResultTags() {
    const stored = localStorage.getItem('resultTags');
    resultTags = stored ? JSON.parse(stored) : {};
}

// 保存標籤
function saveResultTags() {
    localStorage.setItem('resultTags', JSON.stringify(resultTags));
}

// 獲取結果的標籤
function getResultTags(resultId) {
    return resultTags[resultId] || [];
}

// 添加標籤
function addResultTag(resultId) {
    const tagName = prompt('輸入標籤名稱（例如：重要、基準線、生產環境）：');
    if (tagName && tagName.trim()) {
        const tag = tagName.trim();
        if (!resultTags[resultId]) {
            resultTags[resultId] = [];
        }
        if (!resultTags[resultId].includes(tag)) {
            resultTags[resultId].push(tag);
            saveResultTags();
            Toast.success(`已添加標籤：${tag}`);
            // 重新渲染
            if (window.ResultFilters) {
                const filtered = window.ResultFilters.getFilteredResults();
                renderResults(filtered);
            }
        }
    }
}

// 導出結果
function exportResult(resultId) {
    Toast.info('導出功能開發中...');
    // TODO: 實現導出功能
}

// 刪除結果
function deleteResult(resultId) {
    window.ConfirmDialog.confirmDelete('此評估結果', async () => {
        try {
            // TODO: 調用刪除API
            Toast.success('刪除成功！');
            await loadEvaluationResults();
        } catch (error) {
            Toast.error('刪除失敗: ' + error.message);
        }
    });
}

// 刷新結果
function refreshResults() {
    loadEvaluationResults();
}

// 載入標籤
loadResultTags();

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否在結果頁面並且結果容器可見
    const resultsContainer = document.getElementById('resultsTable');
    const resultsTab = document.getElementById('results');
    
    if (resultsContainer && resultsTab && resultsTab.style.display !== 'none') {
        loadEvaluationResults();
    }
});
