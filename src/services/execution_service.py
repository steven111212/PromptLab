"""配置執行服務"""
import subprocess
from pathlib import Path


class ExecutionService:
    """配置執行相關服務"""
    
    def run_config(self, config_id):
        """執行配置"""
        try:
            # 找到配置目錄
            config_dir = Path('configs') / config_id
            if not config_dir.exists():
                return {'error': '配置不存在'}, 404
            
            # 檢查 promptfooconfig.yaml 是否存在
            config_file = config_dir / 'promptfooconfig.yaml'
            if not config_file.exists():
                return {'error': '配置檔案不存在'}, 404
            
            print(f"開始執行配置: {config_id}")
            print(f"配置目錄: {config_dir}")
            
            # 在配置目錄中執行 promptfoo eval
            try:
                result = subprocess.run(
                    'promptfoo eval',
                    cwd=str(config_dir),
                    shell=True,
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    errors='replace',
                    timeout=300  # 5分鐘超時
                )
                
                # 檢查是否成功執行（即使有測試失敗，只要沒有嚴重錯誤就算成功）
                if result.returncode == 0 or (result.returncode != 0 and "Evaluation complete" in result.stdout):
                    return {
                        'message': '配置執行成功',
                        'output': result.stdout,
                        'config_id': config_id,
                        'return_code': result.returncode
                    }, 200
                else:
                    return {
                        'error': '配置執行失敗',
                        'output': result.stdout,
                        'error_output': result.stderr,
                        'return_code': result.returncode
                    }, 500
                    
            except subprocess.TimeoutExpired:
                return {'error': '配置執行超時（5分鐘）'}, 500
            except FileNotFoundError:
                return {'error': '找不到 promptfoo 命令，請確保已安裝 promptfoo'}, 500
            
        except Exception as e:
            print(f"配置執行錯誤: {e}")
            return {'error': f'配置執行失敗: {str(e)}'}, 500
