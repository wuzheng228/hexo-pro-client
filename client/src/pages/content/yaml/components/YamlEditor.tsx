import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';

interface YamlEditorProps {
  id: string;
  initialValue: string;
  height: string;
  onChange?: (value: string) => void;
}

const YamlEditor: React.FC<YamlEditorProps> = ({ id, initialValue, height, onChange }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(initialValue);

  // 初始化编辑器
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      // 配置编辑器
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: initialValue,
        language: 'yaml',
        theme: 'vs',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        wordWrap: 'on',
        tabSize: 2,
        fontSize: window.innerWidth <= 768 ? 12 : 14, // 移动端字体更小
      });

      // 添加编辑器内容变化事件监听
      if (onChange) {
        editorRef.current.onDidChangeModelContent(() => {
          const newValue = editorRef.current?.getValue() || '';
          setValue(newValue);
          onChange(newValue);
        });
      }

      // 为编辑器添加getValue方法，方便外部获取内容
      (document.getElementById(id) as any).getValue = () => {
        return editorRef.current?.getValue() || '';
      };
      
      // 为编辑器添加layout方法，方便外部调整大小
      (document.getElementById(id) as any).layout = () => {
        if (editorRef.current) {
          editorRef.current.layout();
        }
      };
      
      // 监听窗口大小变化，自动调整编辑器大小
      const handleResize = () => {
        if (editorRef.current) {
          editorRef.current.layout();
          // 根据屏幕大小调整字体
          editorRef.current.updateOptions({
            fontSize: window.innerWidth <= 768 ? 12 : 14
          });
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    return () => {
      // 组件卸载时清理编辑器实例
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [id, initialValue]); // 添加initialValue作为依赖项，确保编辑器初始化时使用最新的initialValue

  // 处理initialValue变化
  useEffect(() => {
    if (editorRef.current && initialValue !== value) {
      // 使用setValue更新编辑器内容，避免重新创建编辑器实例
      editorRef.current.setValue(initialValue);
      setValue(initialValue);
    }
  }, [initialValue]);
  
  // 处理height变化
  useEffect(() => {
    if (editorRef.current && containerRef.current) {
      containerRef.current.style.height = height;
      editorRef.current.layout();
    }
  }, [height]);

  return (
    <div id={id} ref={containerRef} style={{ height, width: '100%', border: '1px solid #d9d9d9', borderRadius: '2px' }} />
  );
};

export default YamlEditor;