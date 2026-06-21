'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { AlertTriangle, Lock, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmModalProps {
    open: boolean;
    itemName: string | number;
    itemType?: 'Table' | 'Area' | 'Floor';
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    open,
    itemName,
    itemType = 'Table',
    onClose,
    onConfirm
}) => {
    const { t } = useTranslation();
    const translatedType = t(`components.delete_modal.types.${itemType}`, { defaultValue: itemType });

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 1001,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--card)',
                                borderRadius: 16,
                                width: '90%',
                                maxWidth: 480,
                                overflow: 'hidden',
                                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    padding: '32px',
                                    borderBottom: '1px solid var(--border)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                    {/* Warning Icon */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 12,
                                            background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            boxShadow: '0 4px 16px rgba(255, 77, 79, 0.3)',
                                        }}
                                    >
                                        <AlertTriangle className="text-white w-6 h-6 shrink-0" strokeWidth={2.5} />
                                    </motion.div>

                                    <div style={{ flex: 1 }}>
                                        <h2 style={{
                                            margin: '0 0 8px 0',
                                            fontSize: 22,
                                            fontWeight: 700,
                                            color: 'var(--text)',
                                            letterSpacing: '-0.02em',
                                        }}>
                                            {t("components.delete_modal.title", { item: translatedType })}
                                        </h2>
                                        <p style={{
                                            margin: 0,
                                            fontSize: 14,
                                            color: 'var(--text-muted)',
                                            lineHeight: 1.6,
                                        }}>
                                            {t("components.delete_modal.subtitle")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '32px' }}>
                                <div style={{
                                    padding: '20px',
                                    borderRadius: 12,
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                }}>
                                    <p style={{
                                        margin: '0 0 12px 0',
                                        fontSize: 14,
                                        color: 'var(--text-muted)',
                                        fontWeight: 500,
                                    }}>
                                        {t("components.delete_modal.warning")}
                                    </p>
                                    <div style={{
                                        padding: '12px 16px',
                                        borderRadius: 8,
                                        background: 'rgba(255, 77, 79, 0.1)',
                                        border: '1px solid rgba(255, 77, 79, 0.2)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Lock className="text-[#ff4d4f] w-5 h-5 shrink-0" strokeWidth={2} />
                                            <span style={{
                                                fontSize: 16,
                                                fontWeight: 700,
                                                color: '#ff4d4f',
                                                letterSpacing: '-0.01em',
                                            }}>
                                                {translatedType} {itemName}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: 20,
                                    padding: '16px',
                                    borderRadius: 8,
                                    background: 'rgba(255, 77, 79, 0.05)',
                                    border: '1px solid rgba(255, 77, 79, 0.15)',
                                }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 13,
                                        color: '#ff4d4f',
                                        lineHeight: 1.5,
                                        fontWeight: 500,
                                    }}>
                                        {t("components.delete_modal.data_loss_warning")}
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div
                                style={{
                                    padding: '24px 32px',
                                    borderTop: '1px solid var(--border)',
                                    background: 'var(--surface)',
                                    display: 'flex',
                                    gap: 12,
                                }}
                            >
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        borderRadius: 10,
                                        border: '2px solid var(--border)',
                                        background: 'var(--card)',
                                        color: 'var(--text)',
                                        fontSize: 15,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    {t("components.delete_modal.cancel")}
                                </motion.button>
                                <motion.button
                                    whileHover={{
                                        scale: 1.02,
                                        boxShadow: '0 8px 24px rgba(255, 77, 79, 0.4)'
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onConfirm}
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        borderRadius: 10,
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                                        color: '#fff',
                                        fontSize: 15,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        boxShadow: '0 4px 16px rgba(255, 77, 79, 0.3)',
                                        letterSpacing: '-0.01em',
                                    }}>
                                    <Trash2 className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                                    {t("components.delete_modal.confirm")}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body,
    );
};
