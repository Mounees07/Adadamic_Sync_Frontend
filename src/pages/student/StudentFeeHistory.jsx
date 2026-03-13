import React, { useEffect, useMemo, useState } from 'react';
import {
    CheckCircle,
    Clock,
    Download,
    FileText,
    RefreshCw,
    Receipt,
    Wallet,
} from 'lucide-react';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './StudentFeeHistory.css';

const RUPEE = '\u20B9';
const FEE_FILTERS = ['ALL', 'SUCCESS', 'PENDING', 'FAILED'];
const FEE_FILTER_LABELS = {
    ALL: 'All',
    SUCCESS: 'Success',
    PENDING: 'Pending',
    FAILED: 'Failed',
};
const FEE_FILTER_TO_STATUS = {
    SUCCESS: 'Paid',
    PENDING: 'Pending',
    FAILED: 'Overdue',
};
const PAYMENT_HISTORY_CACHE_KEY = 'latest_successful_payment';

const normalizeTransactionStatus = (status) => String(status || 'PENDING').trim().toUpperCase();

const formatCurrency = (value) =>
    `${RUPEE}${Number(value || 0).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
    })}`;

const formatDate = (value) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const FEE_STATUS_CONFIG = {
    Paid: { label: 'Paid', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    Pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    Overdue: { label: 'Overdue', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
};

const getFeeStatusConfig = (status) =>
    FEE_STATUS_CONFIG[status] || FEE_STATUS_CONFIG.Pending;

const sortTransactions = (records = []) =>
    [...records].map((record) => ({
        ...record,
        status: normalizeTransactionStatus(record.status),
    })).sort((a, b) => {
        const dateA = new Date(a.paymentDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.paymentDate || b.createdAt || 0).getTime();
        return dateB - dateA;
    });

const sortFeeRecords = (records = []) =>
    [...records].sort((a, b) => {
        const yearA = Number(a.semester || 0);
        const yearB = Number(b.semester || 0);
        if (yearA !== yearB) return yearB - yearA;
        return String(b.academicYear || '').localeCompare(String(a.academicYear || ''));
    });

const getCachedSuccessfulPayment = () => {
    try {
        const raw = localStorage.getItem(PAYMENT_HISTORY_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed ? { ...parsed, status: normalizeTransactionStatus(parsed.status) } : null;
    } catch (error) {
        console.error('Failed to read cached payment history:', error);
        return null;
    }
};

const mergeTransactions = (records = [], cachedPayment) => {
    if (!cachedPayment) return sortTransactions(records);

    const hasCachedRecord = records.some((record) =>
        record.transactionId === cachedPayment.transactionId
        || record.razorpayOrderId === cachedPayment.razorpayOrderId
    );

    return sortTransactions(hasCachedRecord ? records : [cachedPayment, ...records]);
};

const mergeFeeRecords = (records = [], cachedPayment) => {
    if (!cachedPayment) return sortFeeRecords(records);

    const updatedRecords = records.map((record) => {
        const sameAcademicYear = !cachedPayment.academicYear || record.academicYear === cachedPayment.academicYear;
        const sameSemester = !cachedPayment.semester || record.semester === cachedPayment.semester;
        const stillOpen = record.paymentStatus === 'Pending' || record.paymentStatus === 'Overdue';

        if (sameAcademicYear && sameSemester && stillOpen) {
            return {
                ...record,
                paymentStatus: 'Paid',
                paymentDate: cachedPayment.paymentDate || record.paymentDate,
            };
        }

        return record;
    });

    return sortFeeRecords(updatedRecords);
};

const getTransactionDescription = (txn) => {
    if (txn.remarks?.trim()) return txn.remarks.trim();
    if (txn.semester) return `Semester ${txn.semester} fee payment`;
    return 'Fee payment';
};

const createReceiptSourceFromFeeRecord = (fee) => {
    if (!fee || fee.paymentStatus !== 'Paid') return null;

    return {
        id: `fee-${fee.id}`,
        transactionId: fee.transactionId || `FEE-${fee.id}`,
        razorpayOrderId: fee.razorpayOrderId || '-',
        paymentDate: fee.paymentDate,
        createdAt: fee.paymentDate,
        paymentMethod: fee.paymentMethod || 'Finance record',
        academicYear: fee.academicYear,
        semester: fee.semester,
        amount: fee.totalAmount,
        status: 'SUCCESS',
        remarks: fee.remarks || 'Semester fee payment',
    };
};

const generateReceiptHTML = (txn, studentName) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Payment Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; max-width: 680px; margin: 0 auto; color: #0f172a; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 18px; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 1.5rem; color: #2563eb; }
    .header p { margin: 8px 0 0; color: #64748b; font-size: 0.92rem; }
    .badge { display: inline-block; margin-top: 14px; padding: 6px 16px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; color: #166534; background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 0.95rem; vertical-align: top; }
    td:first-child { width: 42%; color: #64748b; }
    td:last-child { font-weight: 600; }
    .amount-row td { color: #1d4ed8; font-size: 1.02rem; font-weight: 800; }
    .footer { margin-top: 24px; font-size: 0.82rem; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AcaSync Payment Receipt</h1>
    <p>Generated from the student payment history portal</p>
    <span class="badge">${txn.status || 'SUCCESS'}</span>
  </div>
  <table>
    <tr><td>Student Name</td><td>${studentName}</td></tr>
    <tr><td>Transaction ID</td><td>${txn.transactionId || '-'}</td></tr>
    <tr><td>Order ID</td><td>${txn.razorpayOrderId || '-'}</td></tr>
    <tr><td>Payment Date</td><td>${formatDate(txn.paymentDate || txn.createdAt)}</td></tr>
    <tr><td>Payment Method</td><td>${txn.paymentMethod || '-'}</td></tr>
    <tr><td>Academic Year</td><td>${txn.academicYear || '-'}</td></tr>
    <tr><td>Semester</td><td>${txn.semester || '-'}</td></tr>
    <tr><td>Description</td><td>${getTransactionDescription(txn)}</td></tr>
    <tr class="amount-row"><td>Amount Paid</td><td>${formatCurrency(txn.amount)}</td></tr>
  </table>
  <div class="footer">This is a computer-generated receipt and does not require a signature.</div>
</body>
</html>`;

const StudentFeeHistory = () => {
    const { currentUser, userData } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [feeRecords, setFeeRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feeFilter, setFeeFilter] = useState('ALL');

    const fetchTransactions = async () => {
        if (!currentUser) return;

        setLoading(true);
        const cachedPayment = getCachedSuccessfulPayment();

        const [transactionResult, feeResult] = await Promise.allSettled([
            api.get(`/fee-transactions/student/${currentUser.uid}`),
            api.get(`/finance/fees/student/${currentUser.uid}`),
        ]);

        if (transactionResult.status === 'fulfilled') {
            const records = transactionResult.value.data || [];
            const mergedTransactions = mergeTransactions(records, cachedPayment);
            const backendHasCachedPayment = cachedPayment && records.some((record) =>
                record.transactionId === cachedPayment.transactionId
                || record.razorpayOrderId === cachedPayment.razorpayOrderId
            );

            if (backendHasCachedPayment) {
                localStorage.removeItem(PAYMENT_HISTORY_CACHE_KEY);
            }

            setTransactions(mergedTransactions);
        } else {
            console.error('Failed to load transaction history:', transactionResult.reason);
            setTransactions(cachedPayment ? [cachedPayment] : []);
        }

        if (feeResult.status === 'fulfilled') {
            setFeeRecords(mergeFeeRecords(feeResult.value.data || [], cachedPayment));
        } else {
            console.error('Failed to load fee records:', feeResult.reason);
            setFeeRecords([]);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchTransactions();
    }, [currentUser]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchTransactions();
            }
        };

        window.addEventListener('focus', fetchTransactions);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', fetchTransactions);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [currentUser]);

    const stats = useMemo(() => {
        const success = transactions.filter((txn) => txn.status === 'SUCCESS');
        const paidFeeEntries = feeRecords.filter((fee) => fee.paymentStatus === 'Paid');
        const feeDue = feeRecords
            .filter((fee) => fee.paymentStatus === 'Pending' || fee.paymentStatus === 'Overdue')
            .reduce((sum, fee) => sum + Number(fee.totalAmount || 0), 0);
        const overdueCount = feeRecords.filter((fee) => fee.paymentStatus === 'Overdue').length;
        const paidFeeRecords = paidFeeEntries.length;
        const fallbackLatestPaid = paidFeeEntries[0] || null;
        const totalPaidFromTransactions = success.reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
        const totalPaidFromFees = paidFeeEntries.reduce((sum, fee) => sum + Number(fee.totalAmount || 0), 0);

        return {
            totalPaid: totalPaidFromTransactions || totalPaidFromFees,
            successfulPayments: success.length || paidFeeRecords,
            latestPayment: success[0] || createReceiptSourceFromFeeRecord(fallbackLatestPaid),
            totalFeeDue: feeDue,
            overdueCount,
            paidFeeRecords,
        };
    }, [transactions, feeRecords]);

    const filteredFeeRecords = useMemo(() => {
        if (feeFilter === 'ALL') return feeRecords;

        return feeRecords.filter((fee) => fee.paymentStatus === FEE_FILTER_TO_STATUS[feeFilter]);
    }, [feeRecords, feeFilter]);

    const feeCounts = useMemo(() => {
        return FEE_FILTERS.reduce((acc, item) => {
            acc[item] = item === 'ALL'
                ? feeRecords.length
                : feeRecords.filter((fee) => fee.paymentStatus === FEE_FILTER_TO_STATUS[item]).length;
            return acc;
        }, {});
    }, [feeRecords]);

    const receiptSource = useMemo(() => {
        if (stats.latestPayment) return stats.latestPayment;

        const latestPaidFeeRecord = feeRecords.find((fee) => fee.paymentStatus === 'Paid');
        return createReceiptSourceFromFeeRecord(latestPaidFeeRecord);
    }, [stats.latestPayment, feeRecords]);

    const downloadReceipt = (txn) => {
        const html = generateReceiptHTML(txn, userData?.fullName || 'Student');
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment_receipt_${txn.transactionId || txn.id}.html`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <Hourglass size="40" bgOpacity="0.1" speed="1.75" color="black" />
            </div>
        );
    }

    return (
        <div className="fee-history-page">
            <section className="fh-hero">
                <div className="fh-hero-copy">
                    <div className="fh-eyebrow">
                        <Receipt size={14} />
                        Student Finance
                    </div>
                    <h1>Payment History</h1>
                    <p>
                        Review all fee transactions, keep track of successful payments,
                        and download receipts whenever you need them.
                    </p>
                </div>

                <div className="fh-highlight-card">
                    <span className="fh-highlight-label">Total collected from you</span>
                    <strong>{formatCurrency(stats.totalPaid)}</strong>
                    <span className="fh-highlight-meta">
                        {receiptSource
                            ? `Last success on ${formatDate(receiptSource.paymentDate || receiptSource.createdAt)}`
                            : 'No successful payment recorded yet'}
                    </span>
                </div>
            </section>

            <section className="fh-stats-grid">
                <article className="fh-stat-card">
                    <div className="fh-stat-icon blue">
                        <Wallet size={18} />
                    </div>
                    <div>
                        <span className="fh-stat-label">Total paid</span>
                        <strong>{formatCurrency(stats.totalPaid)}</strong>
                    </div>
                </article>

                <article className="fh-stat-card">
                    <div className="fh-stat-icon green">
                        <CheckCircle size={18} />
                    </div>
                    <div>
                        <span className="fh-stat-label">Successful payments</span>
                        <strong>{stats.successfulPayments}</strong>
                    </div>
                </article>

                <article className="fh-stat-card">
                    <div className="fh-stat-icon amber">
                        <Clock size={18} />
                    </div>
                    <div>
                        <span className="fh-stat-label">Total due</span>
                        <strong>{formatCurrency(stats.totalFeeDue)}</strong>
                    </div>
                </article>

                <article className="fh-stat-card">
                    <div className="fh-stat-icon indigo">
                        <RefreshCw size={18} />
                    </div>
                    <div>
                        <span className="fh-stat-label">Fee records paid</span>
                        <strong>{stats.paidFeeRecords}</strong>
                    </div>
                </article>
            </section>

            {receiptSource ? (
                <section className="fh-card fh-payment-proof-card">
                    <div className="fh-card-header">
                        <div>
                            <h2>Payment bill and transaction details</h2>
                            <p>
                                Enabled after a successful payment. Download your bill or review the transaction details below.
                            </p>
                        </div>
                        <button className="btn-receipt" onClick={() => downloadReceipt(receiptSource)}>
                            <Download size={14} />
                            Download bill
                        </button>
                    </div>

                    <div className="fh-payment-proof-grid">
                        <div className="fh-proof-item">
                            <span>Transaction ID</span>
                            <strong>{receiptSource.transactionId || '-'}</strong>
                        </div>
                        <div className="fh-proof-item">
                            <span>Order ID</span>
                            <strong>{receiptSource.razorpayOrderId || '-'}</strong>
                        </div>
                        <div className="fh-proof-item">
                            <span>Payment date</span>
                            <strong>{formatDate(receiptSource.paymentDate || receiptSource.createdAt)}</strong>
                        </div>
                        <div className="fh-proof-item">
                            <span>Payment method</span>
                            <strong>{receiptSource.paymentMethod || 'Not available'}</strong>
                        </div>
                        <div className="fh-proof-item">
                            <span>Academic year</span>
                            <strong>{receiptSource.academicYear || '-'}</strong>
                        </div>
                        <div className="fh-proof-item">
                            <span>Semester</span>
                            <strong>{receiptSource.semester ? `Semester ${receiptSource.semester}` : '-'}</strong>
                        </div>
                        <div className="fh-proof-item">
                            <span>Amount paid</span>
                            <strong>{formatCurrency(receiptSource.amount)}</strong>
                        </div>
                        <div className="fh-proof-item">
                            <span>Status</span>
                            <strong className="fh-proof-success">Success</strong>
                        </div>
                    </div>
                </section>
            ) : null}

            <section className="fh-card fh-fee-records-card">
                <div className="fh-card-header">
                    <div>
                        <h2>Fee details</h2>
                        <p>
                            Semester-wise fee breakdown from the finance records
                        </p>
                    </div>
                    <div className="fh-card-header-note">
                        {stats.overdueCount > 0
                            ? `${stats.overdueCount} overdue record${stats.overdueCount === 1 ? '' : 's'}`
                            : 'No overdue fee records'}
                    </div>
                </div>

                <div className="fh-card-filters" aria-label="Fee details filters">
                    {FEE_FILTERS.map((item) => (
                        <button
                            key={item}
                            className={`fh-filter-tab ${feeFilter === item ? 'active' : ''}`}
                            onClick={() => setFeeFilter(item)}
                        >
                            {FEE_FILTER_LABELS[item]}
                            <span className="fh-count">{feeCounts[item] || 0}</span>
                        </button>
                    ))}
                </div>

                {filteredFeeRecords.length === 0 ? (
                    <div className="fh-empty">
                        <FileText size={42} />
                        <h3>No fee details available</h3>
                        <p>
                            {feeRecords.length === 0
                                ? 'Fee records added by the finance team will appear here with tuition, activities, miscellaneous, and payment status details.'
                                : 'No fee records match the selected status right now.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="fh-table-wrap">
                            <table className="fh-table fh-fee-table">
                                <thead>
                                    <tr>
                                        <th>Academic year</th>
                                        <th>Semester</th>
                                        <th>Tuition</th>
                                        <th>Activities</th>
                                        <th>Miscellaneous</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFeeRecords.map((fee) => {
                                        const status = getFeeStatusConfig(fee.paymentStatus);

                                        return (
                                            <tr key={fee.id}>
                                                <td>
                                                    <span className="fh-primary-text">{fee.academicYear || '-'}</span>
                                                    <span className="fh-secondary-text">{fee.remarks || 'Fee record'}</span>
                                                </td>
                                                <td className="fh-amount-cell">Semester {fee.semester || '-'}</td>
                                                <td>{formatCurrency(fee.tuitionFee)}</td>
                                                <td>{formatCurrency(fee.activitiesFee)}</td>
                                                <td>{formatCurrency(fee.miscellaneous)}</td>
                                                <td className="fh-amount-cell">{formatCurrency(fee.totalAmount)}</td>
                                                <td>
                                                    <span
                                                        className="fh-status-badge"
                                                        style={{ color: status.color, background: status.bg }}
                                                    >
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="fh-primary-text">
                                                        {fee.paymentDate
                                                            ? new Date(fee.paymentDate).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })
                                                            : '-'}
                                                    </span>
                                                    <span className="fh-secondary-text">
                                                        {fee.paymentStatus === 'Paid' ? 'Payment recorded' : 'Awaiting clearance'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="fh-mobile-list fh-fee-mobile-list">
                            {filteredFeeRecords.map((fee) => {
                                const status = getFeeStatusConfig(fee.paymentStatus);

                                return (
                                    <article className="fh-mobile-card" key={`fee-${fee.id}`}>
                                        <div className="fh-mobile-top">
                                            <div>
                                                <h3>{fee.academicYear || 'Academic year not set'}</h3>
                                                <p>Semester {fee.semester || '-'} fee record</p>
                                            </div>
                                            <span
                                                className="fh-status-badge"
                                                style={{ color: status.color, background: status.bg }}
                                            >
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="fh-mobile-grid">
                                            <div>
                                                <span>Tuition</span>
                                                <strong>{formatCurrency(fee.tuitionFee)}</strong>
                                            </div>
                                            <div>
                                                <span>Activities</span>
                                                <strong>{formatCurrency(fee.activitiesFee)}</strong>
                                            </div>
                                            <div>
                                                <span>Miscellaneous</span>
                                                <strong>{formatCurrency(fee.miscellaneous)}</strong>
                                            </div>
                                            <div>
                                                <span>Total</span>
                                                <strong>{formatCurrency(fee.totalAmount)}</strong>
                                            </div>
                                        </div>

                                        <div className="fh-fee-note">
                                            {fee.remarks || 'No remarks added for this fee record.'}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};

export default StudentFeeHistory;
