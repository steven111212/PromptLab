"""配置管理服務"""
import os
import yaml
import time
import re
import base64
import shutil
from pathlib import Path


class ConfigService:
    """配置管理相關服務"""
    
    def __init__(self, configs_dir='configs'):
        self.configs_dir = Path(configs_dir)
    
    def get_configs(self):
        """獲取所有配置"""
        try:
            configs = []
            
            if self.configs_dir.exists():
                # 遍歷所有子目錄
                for config_dir in self.configs_dir.iterdir():
                    if config_dir.is_dir():
                        config_file = config_dir / 'promptfooconfig.yaml'
                        if config_file.exists():
                            try:
                                with open(config_file, 'r', encoding='utf-8') as f:
                                    content = f.read()
                                    config = yaml.safe_load(content)
                                    
                                    configs.append({
                                        'id': config_dir.name,
                                        'name': config.get('description', config_dir.name),
                                        'directory': config_dir.name,
                                        'filename': 'promptfooconfig.yaml',
                                        'content': content,
                                        'parsed': config,
                                        'hasProviders': bool(config.get('providers')),
                                        'hasDefaultTest': bool(config.get('defaultTest')),
                                        'hasAssert': bool(config.get('defaultTest', {}).get('assert') or config.get('assert')),
                                        'testCount': len(config.get('tests', []))
                                    })
                            except Exception as e:
                                print(f"讀取配置檔案 {config_file} 失敗: {e}")
                                continue
            
            return configs, 200
        except Exception as e:
            return {'error': str(e)}, 500
    
    def get_config(self, config_id):
        """獲取特定配置"""
        try:
            config_dir = self.configs_dir / config_id
            config_file = config_dir / 'promptfooconfig.yaml'
            
            print(f"嘗試讀取配置: {config_file}")
            print(f"配置文件是否存在: {config_file.exists()}")
            
            if not config_file.exists():
                print(f"配置文件不存在: {config_file}")
                return {'error': f'配置檔案不存在: {config_file}'}, 404
            
            with open(config_file, 'r', encoding='utf-8') as f:
                content = f.read()
                config = yaml.safe_load(content)
            
            print(f"成功讀取配置: {config_id}")
            
            return {
                'id': config_id,
                'directory': config_id,
                'filename': 'promptfooconfig.yaml',
                'content': content,
                'parsed': config
            }, 200
        except Exception as e:
            print(f"讀取配置錯誤: {e}")
            return {'error': str(e)}, 500
    
    def check_config_files(self, config_id):
        """檢查配置相關檔案是否存在"""
        try:
            config_dir = self.configs_dir / config_id
            config_file = config_dir / 'promptfooconfig.yaml'
            
            if not config_file.exists():
                return {'error': '配置檔案不存在'}, 404
            
            with open(config_file, 'r', encoding='utf-8') as f:
                content = f.read()
                config = yaml.safe_load(content)
            
            # 檢查 tests 中提到的 CSV 檔案
            missing_files = []
            existing_files = []
            
            if 'tests' in config:
                for test_file in config['tests']:
                    file_path = config_dir / test_file
                    if file_path.exists():
                        existing_files.append(test_file)
                    else:
                        missing_files.append(test_file)
            
            return {
                'config_id': config_id,
                'missing_files': missing_files,
                'existing_files': existing_files,
                'has_tests': 'tests' in config,
                'needs_upload': len(missing_files) > 0
            }, 200
            
        except Exception as e:
            print(f"檢查檔案錯誤: {e}")
            return {'error': str(e)}, 500
    
    def save_config(self, name, content, uploaded_file=None):
        """保存配置"""
        try:
            if not name:
                return {'error': '請提供配置名稱'}, 400
            
            # 驗證YAML格式
            try:
                yaml.safe_load(content)
            except yaml.YAMLError as e:
                return {'error': f'YAML格式錯誤: {str(e)}'}, 400
            
            # 生成配置ID - 保留中文名稱
            # 移除或替換檔案名中的無效字符，但保留中文字符
            config_id = re.sub(r'[<>:"/\\|?*]', '-', name)
            config_id = re.sub(r'-+', '-', config_id)  # 合併多個連字符
            config_id = config_id.strip('-')  # 移除首尾連字符
            
            # 如果清理後的名稱為空，使用預設名稱
            if not config_id:
                config_id = 'config'
            
            # 確保檔案名不會太長
            if len(config_id) > 50:
                config_id = config_id[:50]
            
            # 添加時間戳以避免重複
            timestamp = str(int(time.time()))[-6:]  # 取時間戳後6位
            config_id = f"{config_id}-{timestamp}"
            
            # 創建配置目錄
            config_dir = self.configs_dir / config_id
            config_dir.mkdir(parents=True, exist_ok=True)
            
            # 在目錄下創建 promptfooconfig.yaml 檔案
            config_file_path = config_dir / 'promptfooconfig.yaml'
            
            # 保存檔案
            try:
                with open(config_file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                # 如果有上傳的檔案，保存到配置目錄
                if uploaded_file:
                    file_content = base64.b64decode(uploaded_file['content'])
                    file_path = config_dir / uploaded_file['filename']
                    with open(file_path, 'wb') as f:
                        f.write(file_content)
                    print(f"上傳檔案已保存: {file_path}")
                
                print(f"配置已保存: {config_file_path}")
                
                return {
                    'id': config_id,
                    'message': '配置已保存',
                    'directory': config_id,
                    'filename': 'promptfooconfig.yaml'
                }, 200
            except OSError as e:
                print(f"檔案保存錯誤: {e}")
                return {'error': f'檔案保存失敗: {str(e)}'}, 500
            
        except Exception as e:
            print(f"配置保存錯誤: {e}")
            return {'error': f'配置保存失敗: {str(e)}'}, 500
    
    def update_config(self, config_id, name, content, uploaded_file=None):
        """更新配置"""
        try:
            if not name:
                return {'error': '請提供配置名稱'}, 400
            
            # 驗證YAML格式
            try:
                yaml.safe_load(content)
            except yaml.YAMLError as e:
                return {'error': f'YAML格式錯誤: {str(e)}'}, 400
            
            # 找到配置目錄
            config_dir = self.configs_dir / config_id
            if not config_dir.exists():
                return {'error': '配置不存在'}, 404
            
            # 更新 promptfooconfig.yaml 檔案
            config_file_path = config_dir / 'promptfooconfig.yaml'
            
            try:
                with open(config_file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                # 處理檔案上傳
                if uploaded_file:
                    file_content = base64.b64decode(uploaded_file['content'])
                    file_path = config_dir / uploaded_file['filename']
                    with open(file_path, 'wb') as f:
                        f.write(file_content)
                    print(f"上傳檔案已更新: {file_path}")
                
                return {
                    'id': config_id,
                    'message': '配置已更新',
                    'directory': config_id,
                    'filename': 'promptfooconfig.yaml'
                }, 200
            except OSError as e:
                return {'error': f'檔案更新失敗: {str(e)}'}, 500
            
        except Exception as e:
            print(f"配置更新錯誤: {e}")
            return {'error': f'配置更新失敗: {str(e)}'}, 500
    
    def delete_config(self, config_id):
        """刪除配置"""
        try:
            # 找到配置目錄
            config_dir = self.configs_dir / config_id
            if not config_dir.exists():
                return {'error': '配置不存在'}, 404
            
            # 刪除整個目錄
            shutil.rmtree(config_dir)
            
            return {'message': '配置已刪除'}, 200
            
        except Exception as e:
            print(f"配置刪除錯誤: {e}")
            return {'error': f'配置刪除失敗: {str(e)}'}, 500
