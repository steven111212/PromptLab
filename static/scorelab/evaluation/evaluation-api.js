// 評估 API 管理模組
// 處理所有與後端 API 的交互

class EvaluationAPI {
    // API 超時設置（30秒）
    static TIMEOUT = 30000;
    
    // 帶超時的 fetch
    static async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.TIMEOUT);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeout);
            return response;
        } catch (error) {
            clearTimeout(timeout);
            if (error.name === 'AbortError') {
                throw new Error('請求超時（30秒），請檢查網絡連接或後端服務');
            }
            throw error;
        }
    }
    
    // 獲取評估結果列表
    static async getResults() {
        const startTime = Date.now();
        console.log('[API] 開始獲取評估結果列表...');
        
        try {
            const response = await this.fetchWithTimeout('/api/evaluation-results');
            const duration = Date.now() - startTime;
            
            console.log(`[API] 評估結果列表響應：${response.status}, 耗時：${duration}ms`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[API] 評估結果列表錯誤響應：', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`[API] 成功獲取 ${data.length || 0} 個評估結果`);
            return data;
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`[API] 獲取評估結果失敗（耗時${duration}ms）:`, error);
            throw new Error(`獲取評估結果失敗: ${error.message}`);
        }
    }

    // 獲取評估詳細結果
    static async getDetail(evalId) {
        const startTime = Date.now();
        console.log(`[API] 開始獲取評估詳情: ${evalId}`);
        
        try {
            const response = await this.fetchWithTimeout(`/api/evaluation-results/${encodeURIComponent(evalId)}`);
            const duration = Date.now() - startTime;
            
            console.log(`[API] 評估詳情響應：${response.status}, 耗時：${duration}ms`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[API] 評估詳情錯誤響應：', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`[API] 成功獲取評估詳情，包含 ${data.details?.length || 0} 個測試案例`);
            return data;
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`[API] 獲取評估詳情失敗（耗時${duration}ms）:`, error);
            throw new Error(`獲取評估詳情失敗: ${error.message}`);
        }
    }

    // 開始新的評估
    static async startEvaluation(type, config = {}) {
        try {
            const response = await fetch('/api/start-evaluation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: type,
                    config: config
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('開始評估失敗:', error);
            throw new Error(`開始評估失敗: ${error.message}`);
        }
    }

    // 獲取評估狀態
    static async getEvaluationStatus(evalId) {
        try {
            const response = await fetch(`/api/evaluation-status/${encodeURIComponent(evalId)}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('獲取評估狀態失敗:', error);
            throw new Error(`獲取評估狀態失敗: ${error.message}`);
        }
    }

    // 刪除評估結果
    static async deleteResult(evalId) {
        try {
            const response = await fetch(`/api/evaluation-results/${encodeURIComponent(evalId)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('刪除評估結果失敗:', error);
            throw new Error(`刪除評估結果失敗: ${error.message}`);
        }
    }

    // 導出評估結果
    static async exportResult(evalId, format = 'json') {
        try {
            const response = await fetch(`/api/export-result/${encodeURIComponent(evalId)}?format=${format}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // 根據格式處理響應
            if (format === 'csv') {
                const blob = await response.blob();
                return blob;
            } else {
                return await response.json();
            }
        } catch (error) {
            console.error('導出評估結果失敗:', error);
            throw new Error(`導出評估結果失敗: ${error.message}`);
        }
    }

    // 獲取配置列表
    static async getConfigs() {
        try {
            const response = await fetch('/api/configs');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('獲取配置列表失敗:', error);
            throw new Error(`獲取配置列表失敗: ${error.message}`);
        }
    }

    // 保存配置
    static async saveConfig(configName, configData) {
        try {
            const response = await fetch('/api/configs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: configName,
                    data: configData
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('保存配置失敗:', error);
            throw new Error(`保存配置失敗: ${error.message}`);
        }
    }

    // 加載配置
    static async loadConfig(configName) {
        try {
            const response = await fetch(`/api/configs/${encodeURIComponent(configName)}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('加載配置失敗:', error);
            throw new Error(`加載配置失敗: ${error.message}`);
        }
    }
}

// 導出到全局作用域
window.EvaluationAPI = EvaluationAPI;
