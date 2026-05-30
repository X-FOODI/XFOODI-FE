"use client";

import { useEffect, useState } from "react";
import authService from "@/lib/services/authService";
import { message } from "antd";
import {
  SafetyCertificateOutlined,
  CopyOutlined,
  DownloadOutlined,
  LockOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ArrowLeftOutlined
} from "@ant-design/icons";

export default function AdminSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ twoFactorEnabled: boolean; remainingBackupCodes: number } | null>(null);
  
  // Setup States
  const [setupData, setSetupData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Disable States
  const [disabling, setDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await authService.get2FAStatus();
      setStatus(res);
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể lấy thông tin trạng thái 2FA.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStartSetup = async () => {
    setActionLoading(true);
    try {
      const data = await authService.setup2FA();
      setSetupData(data);
      message.success("Đã tạo bí danh cấu hình 2FA!");
    } catch (err: any) {
      message.error(err.message || "Lỗi tạo cấu hình 2FA.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      message.error("Vui lòng cung cấp mã xác thực 6 chữ số.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await authService.enable2FA(verificationCode);
      setBackupCodes(res.backupCodes);
      message.success("Kích hoạt bảo mật 2FA thành công!");
      await fetchStatus();
    } catch (err: any) {
      message.error(err.message || "Mã xác thực không chính xác.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode || disableCode.length !== 6) {
      message.error("Vui lòng cung cấp mã xác thực 6 chữ số.");
      return;
    }

    setActionLoading(true);
    try {
      await authService.disable2FA(disableCode);
      message.success("Đã hủy kích hoạt bảo mật 2FA thành công.");
      setDisabling(false);
      setDisableCode("");
      setSetupData(null);
      setBackupCodes([]);
      await fetchStatus();
    } catch (err: any) {
      message.error(err.message || "Mã xác thực không hợp lệ. Không thể tắt 2FA.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    message.success("Đã sao chép khóa bí mật!");
  };

  const handleCopyBackupCodes = () => {
    if (backupCodes.length === 0) return;
    navigator.clipboard.writeText(backupCodes.join("\n"));
    message.success("Đã sao chép danh sách mã dự phòng!");
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const element = document.createElement("a");
    const file = new Blob([backupCodes.join("\n")], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "xfoodi-2fa-backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    message.success("Đã tải tệp mã dự phòng về máy!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Cấu hình bảo mật hệ thống
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Bảo vệ tài khoản quản trị viên tối cao bằng xác minh hai lớp (2FA).
          </p>
        </div>

        {/* 2FA Main Configuration Card */}
        <div 
          className="rounded-2xl p-6 transition-all duration-300 shadow-md"
          style={{ 
            background: "var(--card)", 
            border: "1px solid var(--border)",
            color: "var(--text)"
          }}
        >
          {status?.twoFactorEnabled ? (
            /* ACTIVE 2FA SCREEN */
            <div className="space-y-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-pulse"
                  style={{ 
                    background: "var(--success-soft)", 
                    color: "var(--success)", 
                    border: "1px solid var(--success-border)" 
                  }}
                >
                  <CheckCircleOutlined />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Google Authenticator (2FA) Đang Bật</h3>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Tài khoản của bạn đã được bảo vệ tối đa chống lại các cuộc tấn công đánh cắp mật khẩu.
                  </p>
                </div>
              </div>

              <div 
                className="p-4 rounded-xl text-sm leading-relaxed"
                style={{ 
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)"
                }}
              >
                <div className="flex items-start gap-3">
                  <WarningOutlined className="text-amber-500 text-lg mt-0.5" />
                  <div>
                    <span className="font-semibold">Mã dự phòng khôi phục:</span> Bạn còn{" "}
                    <span className="font-bold text-[var(--primary)]">{status.remainingBackupCodes}</span> mã dự phòng chưa sử dụng. 
                    Mỗi mã dự phòng chỉ có thể được dùng một lần để đăng nhập trong trường hợp bạn mất thiết bị Authenticator.
                  </div>
                </div>
              </div>

              {disabling ? (
                /* Secure Disabling Form */
                <form onSubmit={handleDisable2FA} className="p-4 rounded-xl border border-red-500/20 space-y-4 bg-red-500/5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Xác nhận tắt bảo mật 2FA
                    </label>
                    <p className="text-xs mb-3 text-red-400">
                      CẢNH BÁO: Tắt 2FA sẽ làm giảm đáng kể mức độ bảo mật cho tài khoản quản trị của bạn.
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Mã OTP 2FA hiện tại"
                      value={disableCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) setDisableCode(val);
                      }}
                      className="px-4 py-2.5 rounded-lg text-sm w-full font-mono text-center tracking-widest max-w-[200px]"
                      style={{
                        background: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        outline: "none"
                      }}
                      disabled={actionLoading}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      {actionLoading ? "Đang xử lý..." : "Xác nhận tắt"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDisabling(false);
                        setDisableCode("");
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      style={{
                        background: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        color: "var(--text)"
                      }}
                      disabled={actionLoading}
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setDisabling(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/5 border border-red-500/20 bg-transparent transition-all duration-300 cursor-pointer"
                >
                  Tắt bảo mật 2FA
                </button>
              )}
            </div>
          ) : (
            /* INACTIVE 2FA / SETUP PROCESS SCREEN */
            <div className="space-y-6">
              {!setupData ? (
                /* Screen 1: Introduction to Setup */
                <div className="space-y-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                      style={{ 
                        background: "var(--warning-soft)", 
                        color: "#b45309", 
                        border: "1px solid var(--warning-border)" 
                      }}
                    >
                      <SafetyCertificateOutlined />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Google Authenticator (2FA) Chưa Được Kích Hoạt</h3>
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        Tài khoản admin chưa được thiết lập 2FA. Kích hoạt lớp bảo mật này để ngăn chặn truy cập trái phép.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-bold">Tính năng bảo mật 2FA:</h4>
                    <ul className="text-xs space-y-2 list-disc list-inside" style={{ color: "var(--text-muted)" }}>
                      <li>Yêu cầu nhập mã xác thực OTP 6 số ngẫu nhiên từ điện thoại mỗi khi đăng nhập.</li>
                      <li>Khóa hoàn toàn các cuộc tấn công lừa đảo (phishing) hay dò mật khẩu (brute-force).</li>
                      <li>Đi kèm 10 mã khôi phục một lần khi bạn bị mất điện thoại.</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartSetup}
                    disabled={actionLoading}
                    className="px-5 py-3 rounded-xl text-xs font-bold text-white bg-[var(--primary)] hover:bg-[#ff5722] shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    Bắt đầu cấu hình 2FA
                  </button>
                </div>
              ) : backupCodes.length === 0 ? (
                /* Screen 2: Scan QR & Enter OTP Verification */
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSetupData(null)}
                      className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <ArrowLeftOutlined style={{ color: "var(--text)" }} />
                    </button>
                    <h3 className="text-lg font-bold">Cấu hình Authenticator App</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* QR Code Column */}
                    <div className="flex flex-col items-center p-4 rounded-2xl bg-white text-black shadow-inner border border-gray-100 max-w-[280px] mx-auto w-full">
                      <img 
                        src={setupData.qrCode} 
                        alt="QR Code" 
                        className="w-48 h-48 object-contain"
                      />
                      <span className="text-[10px] text-gray-400 mt-2 font-mono select-none">
                        Quét mã này bằng Google Authenticator
                      </span>
                    </div>

                    {/* Instruction & Validation Column */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Bước 1: Quét mã QR</span>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          Mở ứng dụng xác thực của bạn (như Google Authenticator hoặc Microsoft Authenticator) và quét mã QR ở bên cạnh.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Bước 2: Nhập khóa bí mật (Chọn thêm)</span>
                        <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-muted)" }}>
                          Nếu bạn không quét được mã, bạn có thể tự nhập khóa bí mật sau vào ứng dụng xác thực:
                        </p>
                        <div 
                          className="flex items-center justify-between p-2.5 rounded-lg font-mono text-xs select-all truncate"
                          style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}
                        >
                          <span className="truncate max-w-[200px]">{setupData.secret}</span>
                          <button
                            type="button"
                            onClick={handleCopySecret}
                            className="p-1 rounded hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
                            title="Sao chép khóa"
                          >
                            <CopyOutlined style={{ color: "var(--text)" }} />
                          </button>
                        </div>
                      </div>

                      {/* Step 3 Form */}
                      <form onSubmit={handleEnable2FA} className="space-y-3 pt-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] block">Bước 3: Nhập mã OTP xác thực</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            required
                            placeholder="Mã 6 chữ số"
                            value={verificationCode}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*$/.test(val)) setVerificationCode(val);
                            }}
                            className="px-4 py-2.5 rounded-xl text-sm font-mono text-center tracking-widest outline-none w-full max-w-[160px]"
                            style={{
                              background: "var(--bg-base)",
                              border: "1px solid var(--border)",
                              color: "var(--text)"
                            }}
                            disabled={actionLoading}
                          />
                          <button
                            type="submit"
                            disabled={actionLoading}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--primary)] hover:bg-[#ff5722] shadow-md transition-colors cursor-pointer"
                          >
                            {actionLoading ? "Đang xác thực..." : "Kích hoạt 2FA"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                /* Screen 3: Success Screen & Backup Codes download */
                <div className="space-y-6">
                  <div className="text-center space-y-3 py-4">
                    <div 
                      className="w-16 h-16 rounded-full inline-flex items-center justify-center text-4xl"
                      style={{ 
                        background: "var(--success-soft)", 
                        color: "var(--success)", 
                        border: "1px solid var(--success-border)" 
                      }}
                    >
                      <CheckCircleOutlined />
                    </div>
                    <h3 className="text-xl font-bold">Kích Hoạt Bảo Mật 2FA Thành Công!</h3>
                    <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
                      Lớp bảo mật 2 lớp hiện đã có hiệu lực cho tài khoản quản trị của bạn. 
                      Hãy sao lưu và lưu trữ 10 mã khôi phục dưới đây ở một nơi an toàn bên ngoài thiết bị này.
                    </p>
                  </div>

                  <div 
                    className="p-5 rounded-2xl border"
                    style={{ 
                      background: "var(--bg-base)", 
                      borderColor: "var(--border)" 
                    }}
                  >
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                      <span className="text-sm font-bold flex items-center gap-2">
                        <KeyOutlined className="text-amber-500" />
                        Mã Dự Phòng Khôi Phục (10 mã)
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCopyBackupCodes}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          style={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            color: "var(--text)"
                          }}
                        >
                          <CopyOutlined /> Sao chép
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadBackupCodes}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-white bg-[var(--primary)] border border-[var(--primary)] hover:bg-[#ff5722]"
                        >
                          <DownloadOutlined /> Tải về (.txt)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {backupCodes.map((code, index) => (
                        <div 
                          key={index}
                          className="py-2.5 px-1.5 text-center font-mono text-xs font-bold rounded-lg select-all border shadow-sm"
                          style={{ 
                            background: "var(--card)", 
                            borderColor: "var(--border)",
                            color: "var(--text)"
                          }}
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSetupData(null);
                        setBackupCodes([]);
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--primary)] border border-[var(--primary)] hover:bg-[#ff5722] transition-colors cursor-pointer"
                    >
                      Hoàn thành
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
