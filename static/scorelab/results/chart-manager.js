// 圖表管理模組
// 處理主頁面的統計圖表功能

class ChartManager {
    static currentChart = null;
    static currentData = null;

    // 初始化圖表
    static initializeChart(detail) {
        this.currentData = detail;
        this.createChartByType('assertions', detail);
    }

    // 切換圖表類型
    static switchType(evalId, type) {
        if (this.currentData) {
            this.createChartByType(type, this.currentData);
        }
    }

    // 根據類型創建圖表
    static createChartByType(type, detail) {
        const ctx = document.getElementById('combinedChart');
        if (!ctx) return;
        
        // 檢查 Chart.js 是否可用
        if (typeof Chart === 'undefined') {
            console.error('Chart.js 未載入');
            ctx.getContext('2d').font = '14px Arial';
            ctx.getContext('2d').fillText('Chart.js 載入失敗', 50, 100);
            return;
        }

        // 銷毀舊圖表
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }

        switch (type) {
            case 'assertions':
                this.createAssertionsChart(detail);
                break;
            case 'latency':
                this.createLatencyChart(detail);
                break;
            case 'passing':
                this.createPassingRateChart(detail);
                break;
            default:
                this.createAssertionsChart(detail);
        }
    }

    // 創建 Assertions 圖表
    static createAssertionsChart(detail) {
        this.currentChart = ChartUtils.createAssertionsChart(detail, 'combinedChart');
    }

    // 創建 Latency 圖表
    static createLatencyChart(detail) {
        this.currentChart = ChartUtils.createLatencyChart(detail, 'combinedChart');
    }

    // 創建 Passing Rate 分佈圖表
    static createPassingRateChart(detail) {
        const ctx = document.getElementById('combinedChart');
        
        // 計算每個測試的通過率
        const passingRates = [];
        detail.details.forEach(test => {
            if (test.assertions && test.assertions.length > 0) {
                const passCount = test.assertions.filter(a => a.pass).length;
                const totalCount = test.assertions.length;
                const rate = (passCount / totalCount) * 100;
                passingRates.push(rate);
            } else {
                // 如果沒有 assertions，根據 success 判斷
                passingRates.push(test.success ? 100 : 0);
            }
        });

        if (passingRates.length === 0) {
            ctx.getContext('2d').font = '14px Arial';
            ctx.getContext('2d').fillText('無 Passing Rate 數據', 50, 100);
            return;
        }

        // 創建通過率分佈
        const rateBins = [0, 0, 0, 0, 0]; // 0-20%, 21-40%, 41-60%, 61-80%, 81-100%
        const rateLabels = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
        
        passingRates.forEach(rate => {
            if (rate <= 20) rateBins[0]++;
            else if (rate <= 40) rateBins[1]++;
            else if (rate <= 60) rateBins[2]++;
            else if (rate <= 80) rateBins[3]++;
            else rateBins[4]++;
        });

        this.currentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: rateLabels,
                datasets: [{
                    data: rateBins,
                    backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#28a745'],
                    borderColor: ['#c82333', '#e8590c', '#e0a800', '#1aa179', '#1e7e34'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Passing Rate 分佈 (${passingRates.length} 個測試)`
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // 銷毀當前圖表
    static destroy() {
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
        this.currentData = null;
    }
}

// 導出到全局作用域
window.ChartManager = ChartManager;
