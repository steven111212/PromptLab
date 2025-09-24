// 核心應用程式模組
// 負責應用程式的初始化、導航和基本事件處理

// 初始化應用程式
async function initializeApp() {
    setupEventListeners();
    await ConfigManager.loadConfigs();
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

// 初始化應用程式
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});
