import { FolderOpen } from 'lucide-react';
import { useFileSystem } from '../../hooks/useFileSystem';
import './Welcome.css';

export function Welcome() {
    const { selectWorkspace } = useFileSystem();

    return (
        <div className="welcome-container">
            <div className="welcome-content">
                <img
                    src="./favicon-dark.svg"
                    alt="WeMD Logo"
                    className="welcome-logo"
                />
                <h1>欢迎使用 WeMD</h1>
                <p>请选择一个文件夹作为工作区以开始写作</p>
                <button className="btn-primary" onClick={selectWorkspace}>
                    <FolderOpen size={20} />
                    选择工作区文件夹
                </button>
            </div>
        </div>
    );
}
