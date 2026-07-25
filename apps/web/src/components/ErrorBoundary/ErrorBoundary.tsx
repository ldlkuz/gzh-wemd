import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f9fafb",
            color: "#1a1a1a",
            fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
            padding: "20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "16px",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              maxWidth: "500px",
              width: "100%",
            }}
          >
            <h1
              style={{
                margin: "0 0 10px",
                fontSize: "20px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              WeMD 遇到错误
            </h1>
            <p
              style={{
                margin: "0 0 24px",
                color: "#4b5563",
                lineHeight: 1.6,
                fontSize: "14px",
              }}
            >
              抱歉，编辑器运行过程中发生意外异常。
              <br />
              您可以复制下方错误信息进行反馈，或尝试刷新页面。
            </p>
            {this.state.error && (
              <div
                style={{
                  position: "relative",
                  margin: "0 0 20px",
                  textAlign: "left",
                }}
              >
                <pre
                  style={{
                    backgroundColor: "#f3f4f6",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    overflow: "auto",
                    color: "#ef4444",
                    maxHeight: "200px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    marginBottom: 0,
                  }}
                >
                  {this.state.error.stack || this.state.error.message}
                </pre>
              </div>
            )}
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: "#07c160",
                  color: "white",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#06ad56")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#07c160")
                }
              >
                重新加载
              </button>
              <button
                onClick={() => {
                  if (this.state.error) {
                    const text =
                      this.state.error.stack || this.state.error.message;
                    // 安全检查：Clipboard API 是否可用
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard
                        .writeText(text)
                        .then(() => {
                          const btn = document.getElementById("btn-copy-error");
                          if (btn) btn.innerText = "已复制";
                          setTimeout(() => {
                            if (btn) btn.innerText = "复制错误信息";
                          }, 2000);
                        })
                        .catch((err) => {
                          console.error("Failed to copy error:", err);
                          const btn = document.getElementById("btn-copy-error");
                          if (btn) btn.innerText = "复制失败";
                          setTimeout(() => {
                            if (btn) btn.innerText = "复制错误信息";
                          }, 2000);
                        });
                    } else {
                      // Fallback or alert
                      alert("无法访问剪贴板，请手动截图。");
                    }
                  }
                }}
                id="btn-copy-error"
                style={{
                  backgroundColor: "white",
                  color: "#4b5563",
                  border: "1px solid #e5e7eb",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9fafb")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                复制错误信息
              </button>
              <a
                href={`https://github.com/tenngoxars/WeMD/issues/new?title=${encodeURIComponent(
                  `[Crash] ${this.state.error?.message || "Unknown Error"}`,
                )}&body=${encodeURIComponent(
                  `**Error Message**:\n${this.state.error?.message}\n\n**Stack Trace**:\n\`\`\`\n${
                    this.state.error?.stack || ""
                  }\n\`\`\``,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: "white",
                  color: "#4b5563",
                  border: "1px solid #e5e7eb",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9fafb")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                去 GitHub 反馈
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
