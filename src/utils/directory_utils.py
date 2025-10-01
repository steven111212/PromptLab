"""目錄管理工具"""
import os
from pathlib import Path


def ensure_directories():
    """確保必要的目錄存在"""
    directories = ['configs', 'results', 'temp']
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
