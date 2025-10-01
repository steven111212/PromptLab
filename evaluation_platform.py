from flask import Flask
from flask_cors import CORS
import os
import sys
from pathlib import Path

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import modules
from src.routes.main_routes import register_main_routes
from src.routes.api_routes import register_api_routes
from src.routes.static_routes import register_static_routes
from src.utils.directory_utils import ensure_directories

# Create Flask app
app = Flask(__name__)
CORS(app)  # 啟用跨域支援

# 初始化目錄
ensure_directories()

# 註冊路由
register_main_routes(app)
register_api_routes(app)
register_static_routes(app)


if __name__ == '__main__':
    print("🚀 啟動LLM評測平台...")
    print("📊 平台功能:")
    print("   - TestRunner: 安全測試工具 (即將推出)")
    print("   - ScoreLab: 評分工具 (可用)")
    print("   - AttackGen: 測試集生成工具 (即將推出)")
    print("🌐 訪問地址:")
    print("   - 主頁: http://localhost:5500")
    print("   - ScoreLab: http://localhost:5500/scorelab")
    print("   - TestRunner: http://localhost:5500/testrunner")
    print("   - AttackGen: http://localhost:5500/attackgen")
    print("📝 請確保已安裝 promptfoo: pip install promptfoo")
    
    app.run(debug=True, host='0.0.0.0', port=5500)
