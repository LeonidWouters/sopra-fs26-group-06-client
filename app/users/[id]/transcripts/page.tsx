"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Spin } from "antd";
import { DeleteOutlined, DownloadOutlined, FileTextOutlined, LogoutOutlined } from "@ant-design/icons";
import Image from "next/image";
import mainStyles from "@/styles/mainpage.module.css";
import styles from "./transcripts.module.css";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";
import { TranscriptOrNote } from "@/types/transcript";

const TranscriptsPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const { id } = useParams();
    const { token, isReady } = useAuth();
    const { clear: clearToken } = useLocalStorage<string>("token", "");
    const { clear: clearId } = useLocalStorage<string>("id", "");

    const [items, setItems] = useState<TranscriptOrNote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isReady) return;
        if (!token) {
            router.push("/");
            return;
        }
        // Data will be loaded once the backend exposes GET /users/{id}/transcripts
        setLoading(false);
    }, [isReady, token, router]);

    const handleLogout = (): void => {
        apiService.put("/users/logout", null, token);
        clearToken();
        clearId();
        router.push("/");
    };

    const handleDownload = (item: TranscriptOrNote) => {
        const filename = `${item.kind}-${item.createdAt ?? item.id}.txt`;
        const blob = new Blob([item.content ?? ""], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDelete = async (item: TranscriptOrNote) => {
        const endpoint = item.kind === "transcript"
            ? `/transcripts/${item.id}`
            : `/notes/${item.id}`;
        try {
            await apiService.delete(endpoint);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
        } catch {
            // silently ignore — user stays on page
        }
    };

    const formatDate = (iso: string) => {
        try {
            return iso.slice(0, 10);
        } catch {
            return iso;
        }
    };

    const formatSize = (content: string) => {
        const bytes = new TextEncoder().encode(content).length;
        return `${Math.round(bytes / 1024)} KB`;
    };

    if (!isReady || loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className={mainStyles.container}>
            <div className={mainStyles.navbar}>
                <div className={mainStyles.logoWrapper}>
                    <Image
                        src="/unnamed-Photoroom.png"
                        alt="CommunicALL"
                        width={200}
                        height={55}
                        style={{ width: "auto", maxWidth: "200px", height: "100%", maxHeight: "55px" }}
                    />
                </div>
                <div className={mainStyles.navButtons}>
                    <Button color="default" variant="text" onClick={() => router.push(`/users/${id}`)}>
                        ← Back
                    </Button>
                    <Button color="danger" variant="text" icon={<LogoutOutlined />} onClick={handleLogout}>
                        Sign Out
                    </Button>
                </div>
            </div>

            <div className={mainStyles.mainContent}>
                <h1 className={styles.pageTitle}>Available Transcripts &amp; Notes</h1>

                {items.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FileTextOutlined style={{ fontSize: 48, color: "#c4b5fd" }} />
                        <p>No transcripts or notes yet.</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {items.map((item) => (
                            <div key={item.id} className={styles.card}>
                                <button
                                    className={styles.deleteBtn}
                                    aria-label="Delete"
                                    onClick={() => handleDelete(item)}
                                >
                                    <DeleteOutlined />
                                </button>
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconWrapper}>
                                        <FileTextOutlined style={{ fontSize: 24, color: "#4f46e5" }} />
                                    </div>
                                    <div>
                                        <div className={styles.cardTitle}>
                                            Video Call {formatDate(item.createdAt)}
                                        </div>
                                        <div className={styles.cardMeta}>{formatSize(item.content)}</div>
                                    </div>
                                </div>
                                <div className={styles.participants}>
                                    {item.participants?.length
                                        ? `Participants: ${item.participants.join(", ")}`
                                        : ""}
                                </div>
                                <Button
                                    icon={<DownloadOutlined />}
                                    block
                                    onClick={() => handleDownload(item)}
                                    style={{
                                        background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                                        border: "none",
                                        color: "#fff",
                                        borderRadius: 8,
                                        fontWeight: 500,
                                        marginTop: 16,
                                    }}
                                >
                                    Download
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranscriptsPage;
