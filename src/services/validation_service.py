"""配置驗證服務"""
import yaml


class ValidationService:
    """配置驗證相關服務"""
    
    def validate_config(self, content):
        """驗證配置"""
        try:
            # 驗證YAML格式
            try:
                parsed = yaml.safe_load(content)
            except yaml.YAMLError as e:
                return {
                    'valid': False,
                    'error': f'YAML格式錯誤: {str(e)}'
                }, 400
            
            validation = {
                'valid': True,
                'warnings': [],
                'errors': []
            }
            
            # 檢查必要欄位
            if not parsed.get('description'):
                validation['warnings'].append('缺少描述 (description)')
            
            if not parsed.get('providers') and not parsed.get('defaultTest'):
                validation['errors'].append('必須定義 providers 或 defaultTest')
                validation['valid'] = False
            
            if not parsed.get('tests') and not parsed.get('prompts'):
                validation['warnings'].append('建議定義測試問題 (tests 或 prompts)')
            
            # 檢查providers配置
            if parsed.get('providers'):
                for i, provider in enumerate(parsed['providers']):
                    if not provider.get('id'):
                        validation['errors'].append(f'Provider {i + 1} 缺少 id')
                        validation['valid'] = False
                    
                    config = provider.get('config', {})
                    
                    # 檢查是否有 URL 或 request 配置
                    if not config.get('url') and not config.get('request'):
                        validation['errors'].append(f'Provider {i + 1} 缺少 URL 或 request 配置')
                        validation['valid'] = False
                    
                    # 如果有 request 配置，檢查格式
                    if config.get('request'):
                        request_content = config['request']
                        if not isinstance(request_content, str):
                            validation['errors'].append(f'Provider {i + 1} 的 request 配置格式錯誤')
                            validation['valid'] = False
                        else:
                            # 檢查 request 是否包含必要的 HTTP 元素
                            lines = request_content.strip().split('\n')
                            if len(lines) < 1:
                                validation['errors'].append(f'Provider {i + 1} 的 request 配置內容不完整')
                                validation['valid'] = False
                            else:
                                # 檢查第一行是否是有效的 HTTP 方法行
                                first_line = lines[0].strip()
                                if not any(method in first_line for method in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']):
                                    validation['warnings'].append(f'Provider {i + 1} 的 request 配置可能缺少有效的 HTTP 方法')
                                
                                # 檢查是否包含 {{prompt}} 變量
                                if '{{prompt}}' not in request_content:
                                    validation['warnings'].append(f'Provider {i + 1} 的 request 配置建議包含 {{prompt}} 變量')
                    
                    # 檢查 useHttps 配置
                    if 'useHttps' in config:
                        if not isinstance(config['useHttps'], bool):
                            validation['warnings'].append(f'Provider {i + 1} 的 useHttps 應該是 true 或 false')
                    
                    # 檢查 transformResponse 配置
                    if not config.get('transformResponse'):
                        validation['warnings'].append(f'Provider {i + 1} 建議設置 transformResponse 以提取回應內容')
            
            # 檢查defaultTest配置
            if parsed.get('defaultTest'):
                if (parsed['defaultTest'].get('options', {}).get('provider') and 
                    not parsed['defaultTest']['options']['provider'].get('config', {}).get('url')):
                    validation['errors'].append('defaultTest.provider 缺少 URL')
                    validation['valid'] = False
            
            return validation, 200
        except Exception as e:
            return {
                'valid': False,
                'error': f'驗證失敗: {str(e)}'
            }, 500
