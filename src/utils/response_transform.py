"""響應轉換工具"""
import json


def apply_response_transform(response_data, transform_config):
    """應用響應轉換配置"""
    try:
        # 簡單的點記法解析，例如 "json.response" 或 "json.choices[0].message.content"
        if not transform_config or transform_config == 'json':
            return response_data
        
        # 移除 "json." 前綴（如果有的話）
        path = transform_config.replace('json.', '') if transform_config.startswith('json.') else transform_config
        
        # 分割路徑
        parts = []
        current_part = ""
        in_brackets = False
        
        for char in path:
            if char == '[':
                if current_part:
                    parts.append(current_part)
                    current_part = ""
                in_brackets = True
            elif char == ']':
                if current_part:
                    parts.append(int(current_part))  # 陣列索引
                    current_part = ""
                in_brackets = False
            elif char == '.' and not in_brackets:
                if current_part:
                    parts.append(current_part)
                    current_part = ""
            else:
                current_part += char
        
        if current_part:
            parts.append(current_part)
        
        # 應用路徑
        result = response_data
        for part in parts:
            if isinstance(result, dict) and part in result:
                result = result[part]
            elif isinstance(result, list) and isinstance(part, int) and 0 <= part < len(result):
                result = result[part]
            else:
                return f"路徑 '{transform_config}' 在響應中不存在"
        
        return result
        
    except Exception as e:
        return f"Transform處理錯誤: {str(e)}"
