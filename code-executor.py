#!/usr/bin/env python3
"""
AI Code Studio - Code Execution Backend
Provides secure code execution for various languages in the notebook environment.
"""

import sys
import io
import contextlib
import traceback
import json
import subprocess
import tempfile
import os
from pathlib import Path
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CodeExecutor:
    """Secure code execution engine supporting multiple languages"""
    
    def __init__(self):
        self.supported_languages = {
            'python': self.execute_python,
            'javascript': self.execute_javascript,
            'sql': self.execute_sql,
            'r': self.execute_r,
            'html': self.execute_html
        }
        self.timeout = 30  # 30 second timeout
        
    def execute_code(self, code, language, context=None):
        """Main execution method"""
        try:
            if language not in self.supported_languages:
                return {
                    'success': False,
                    'error': f'Language "{language}" not supported',
                    'output': '',
                    'execution_time': 0
                }
            
            start_time = time.time()
            result = self.supported_languages[language](code, context or {})
            execution_time = time.time() - start_time
            
            result['execution_time'] = execution_time
            return result
            
        except Exception as e:
            logger.error(f"Execution error: {e}")
            return {
                'success': False,
                'error': str(e),
                'output': '',
                'execution_time': 0
            }
    
    def execute_python(self, code, context):
        """Execute Python code safely"""
        try:
            # Capture stdout and stderr
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()
            
            # Create a restricted execution environment
            exec_globals = {
                '__builtins__': {
                    # Safe built-ins only
                    'print': print,
                    'len': len,
                    'str': str,
                    'int': int,
                    'float': float,
                    'bool': bool,
                    'list': list,
                    'dict': dict,
                    'tuple': tuple,
                    'set': set,
                    'range': range,
                    'enumerate': enumerate,
                    'zip': zip,
                    'map': map,
                    'filter': filter,
                    'sorted': sorted,
                    'sum': sum,
                    'min': min,
                    'max': max,
                    'abs': abs,
                    'round': round,
                    'type': type,
                    'isinstance': isinstance,
                    'hasattr': hasattr,
                    'getattr': getattr,
                    'dir': dir,
                    'help': help
                }
            }
            
            # Add common data science libraries if available
            try:
                import pandas as pd
                import numpy as np
                import matplotlib.pyplot as plt
                import seaborn as sns
                
                exec_globals['pd'] = pd
                exec_globals['np'] = np
                exec_globals['plt'] = plt
                exec_globals['sns'] = sns
                
                # Configure matplotlib for non-interactive backend
                plt.switch_backend('Agg')
                
            except ImportError:
                logger.info("Data science libraries not available")
            
            # Add context variables
            exec_globals.update(context)
            
            # Redirect stdout/stderr
            with contextlib.redirect_stdout(stdout_capture), \
                 contextlib.redirect_stderr(stderr_capture):
                
                # Execute the code
                exec(code, exec_globals)
            
            output = stdout_capture.getvalue()
            error_output = stderr_capture.getvalue()
            
            if error_output:
                return {
                    'success': False,
                    'error': error_output,
                    'output': output
                }
            
            return {
                'success': True,
                'error': '',
                'output': output or 'Code executed successfully (no output)'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Python execution error: {str(e)}\n{traceback.format_exc()}",
                'output': stdout_capture.getvalue() if 'stdout_capture' in locals() else ''
            }
    
    def execute_javascript(self, code, context):
        """Execute JavaScript code using Node.js"""
        try:
            # Create a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                # Add context variables
                context_code = ""
                for key, value in context.items():
                    if isinstance(value, (str, int, float, bool)):
                        context_code += f"const {key} = {json.dumps(value)};\n"
                
                f.write(context_code + code)
                temp_file = f.name
            
            try:
                # Execute using Node.js
                result = subprocess.run(
                    ['node', temp_file],
                    capture_output=True,
                    text=True,
                    timeout=self.timeout
                )
                
                if result.returncode == 0:
                    return {
                        'success': True,
                        'error': '',
                        'output': result.stdout or 'Code executed successfully (no output)'
                    }
                else:
                    return {
                        'success': False,
                        'error': result.stderr,
                        'output': result.stdout
                    }
            finally:
                os.unlink(temp_file)
                
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': f'Code execution timed out after {self.timeout} seconds',
                'output': ''
            }
        except FileNotFoundError:
            return {
                'success': False,
                'error': 'Node.js not found. Please install Node.js to execute JavaScript code.',
                'output': ''
            }
        except Exception as e:
            return {
                'success': False,
                'error': f"JavaScript execution error: {str(e)}",
                'output': ''
            }
    
    def execute_sql(self, code, context):
        """Execute SQL code using SQLite"""
        try:
            import sqlite3
            
            # Create in-memory database
            conn = sqlite3.connect(':memory:')
            cursor = conn.cursor()
            
            # Create sample tables if context provides data
            if 'data' in context and isinstance(context['data'], dict):
                for table_name, data in context['data'].items():
                    if isinstance(data, list) and data:
                        # Create table from first row keys
                        columns = list(data[0].keys()) if data[0] else []
                        if columns:
                            create_sql = f"CREATE TABLE {table_name} ({', '.join(columns)})"
                            cursor.execute(create_sql)
                            
                            # Insert data
                            placeholders = ', '.join(['?' for _ in columns])
                            insert_sql = f"INSERT INTO {table_name} VALUES ({placeholders})"
                            for row in data:
                                cursor.execute(insert_sql, [row[col] for col in columns])
            
            # Execute the SQL code
            output_lines = []
            for statement in code.split(';'):
                statement = statement.strip()
                if not statement:
                    continue
                    
                cursor.execute(statement)
                
                # If it's a SELECT statement, fetch results
                if statement.upper().strip().startswith('SELECT'):
                    results = cursor.fetchall()
                    column_names = [description[0] for description in cursor.description]
                    
                    output_lines.append(f"Query: {statement}")
                    output_lines.append(f"Columns: {', '.join(column_names)}")
                    output_lines.append(f"Results ({len(results)} rows):")
                    
                    for row in results[:100]:  # Limit to 100 rows
                        output_lines.append(str(row))
                    
                    if len(results) > 100:
                        output_lines.append(f"... and {len(results) - 100} more rows")
                    output_lines.append("")
                else:
                    output_lines.append(f"Executed: {statement}")
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'error': '',
                'output': '\n'.join(output_lines) or 'SQL executed successfully'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"SQL execution error: {str(e)}",
                'output': ''
            }
    
    def execute_r(self, code, context):
        """Execute R code"""
        try:
            # Create a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.R', delete=False) as f:
                # Add context setup
                context_code = ""
                for key, value in context.items():
                    if isinstance(value, (str, int, float, bool)):
                        if isinstance(value, str):
                            context_code += f'{key} <- "{value}"\n'
                        else:
                            context_code += f'{key} <- {str(value).lower() if isinstance(value, bool) else value}\n'
                
                f.write(context_code + code)
                temp_file = f.name
            
            try:
                # Execute using Rscript
                result = subprocess.run(
                    ['Rscript', temp_file],
                    capture_output=True,
                    text=True,
                    timeout=self.timeout
                )
                
                if result.returncode == 0:
                    return {
                        'success': True,
                        'error': '',
                        'output': result.stdout or 'R code executed successfully (no output)'
                    }
                else:
                    return {
                        'success': False,
                        'error': result.stderr,
                        'output': result.stdout
                    }
            finally:
                os.unlink(temp_file)
                
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': f'R code execution timed out after {self.timeout} seconds',
                'output': ''
            }
        except FileNotFoundError:
            return {
                'success': False,
                'error': 'R not found. Please install R to execute R code.',
                'output': ''
            }
        except Exception as e:
            return {
                'success': False,
                'error': f"R execution error: {str(e)}",
                'output': ''
            }
    
    def execute_html(self, code, context):
        """Execute/render HTML code"""
        try:
            # For HTML, we just validate and return the code
            # In a full implementation, you might use a headless browser
            
            if '<script>' in code.lower():
                return {
                    'success': False,
                    'error': 'JavaScript in HTML is not allowed for security reasons',
                    'output': ''
                }
            
            # Basic HTML validation
            if not code.strip():
                return {
                    'success': False,
                    'error': 'Empty HTML code',
                    'output': ''
                }
            
            return {
                'success': True,
                'error': '',
                'output': f'HTML rendered successfully:\n\n{code}',
                'html_content': code  # Special field for HTML rendering
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"HTML processing error: {str(e)}",
                'output': ''
            }

def main():
    """CLI interface for the code executor"""
    if len(sys.argv) < 3:
        print("Usage: python code-executor.py <language> <code>")
        print("Supported languages:", ', '.join(CodeExecutor().supported_languages.keys()))
        sys.exit(1)
    
    language = sys.argv[1]
    code = sys.argv[2]
    
    executor = CodeExecutor()
    result = executor.execute_code(code, language)
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()