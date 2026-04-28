"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Spin, Badge, Tooltip } from "antd";
import { DeleteOutlined, DownloadOutlined, EyeOutlined, FileTextOutlined, LogoutOutlined, AppstoreOutlined, TeamOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Image from "next/image";
import mainStyles from "@/styles/mainpage.module.css";
import styles from "./transcripts.module.css";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";
import { DocumentItem, UserDocumentsGetDTO } from "@/types/transcript";
import {getAvatarColor, getAvatarInitials} from "@/utils/avatarColor";
import {User} from "@/types/user";

const TranscriptsPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const { id } = useParams();
    const { token, isReady } = useAuth();
    const { clear: clearToken } = useLocalStorage<string>("token", "");
    const { clear: clearId } = useLocalStorage<string>("id", "");
    const { value: loggedInId } = useLocalStorage<string>("id", "");

    const [items, setItems] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState<User | null>(null);

    useEffect(() => {
        if (!isReady) return;
        if (!token) {
            router.push("/");
            return;
        }

        const fetchDocuments = async () => {
            try {
                const data = await apiService.get<UserDocumentsGetDTO>(`/users/${id}/documents`, token);
                const transcripts = (data.transcripts ?? []).map((t) => ({ ...t, kind: "transcript" as const }));
                const notes = (data.notes ?? []).map((n) => ({ ...n, kind: "note" as const }));
                console.log(transcripts,notes);
                setItems([...transcripts, ...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
            } catch(e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
            const fetchedMe: User = await apiService.get<User>(`/users/${loggedInId}`, token);
            setMe(fetchedMe);
        };

        fetchDocuments();
    }, [isReady, token, id, router, apiService]);

    const handleLogout = (): void => {
        apiService.put("/users/logout", null, token);
        clearToken();
        clearId();
        router.push("/");
    };

    const handleDownload = (item: DocumentItem) => {
        const filename = `${item.kind}-${item.createdAt.slice(0, 10)}-${item.id}.txt`;
        const blob = new Blob([item.content ?? ""], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDelete = async (item: DocumentItem) => {
        const endpoint = item.kind === "transcript"
            ? `/transcripts/${item.id}`
            : `/notes/${item.id}`;
        try {
            await apiService.delete(endpoint, token);
            setItems((prev) => prev.filter((i) => i.id !== item.id || i.kind !== item.kind));
        } catch {
            // silently ignore
        }
    };

    const formatSize = (content: string) => {
        const bytes = new TextEncoder().encode(content).length;
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
    };

    const wordCount = (content: string) => {
        const words = content.trim().split(/\s+/).filter(Boolean).length;
        return `${words} word${words !== 1 ? "s" : ""}`;
    };

    if (!isReady || loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className={mainStyles.appShell}>
            <aside className={mainStyles.sidebar}>
                <div className={mainStyles.sidebarTop}>
                    <div className={mainStyles.sbLogo}>
                        <Image src="/banner_logo.png" alt="Logo" width={32} height={32}
                               style={{width: 32, height: 32, objectFit: 'contain'}}/>
                    </div>
                    <Tooltip title="Rooms" placement="right">
                        <div className={mainStyles.sbIcon} onClick={() => router.push("/mainpage")}>
                            <AppstoreOutlined/>
                        </div>
                    </Tooltip>
                    <Tooltip title="Friends" placement="right">
                        <Badge count={me?.pendingFriendRequests?.length ?? 0} size="small" offset={[-4, 4]}>
                            <div className={mainStyles.sbIcon} onClick={() => router.push(`/users/${loggedInId}/friends`)}>
                                <TeamOutlined/>
                            </div>
                        </Badge>
                    </Tooltip>
                    <Tooltip title="Transcripts & Notes" placement="right">
                        <div className={`${mainStyles.sbIcon} ${mainStyles.sbIconActive}`}>
                            <FileTextOutlined/>
                        </div>
                    </Tooltip>
                </div>
                <div className={mainStyles.sidebarBottom}>
                    <Tooltip title="Sign Out" placement="right">
                        <div className={mainStyles.sbIcon} onClick={() => {
                            apiService.put("/users/logout", null, token);
                            clearToken();
                            clearId();
                            router.push("/");
                        }}>
                            <LogoutOutlined/>
                        </div>
                    </Tooltip>
                    <Tooltip title="My Profile" placement="right">
                        <div className={mainStyles.sbAvatar}
                             style={{backgroundColor: getAvatarColor(me?.username ?? "")}}
                             onClick={() => router.push(`/users/${id}`)}>
                            {getAvatarInitials(me?.username ?? "")}
                        </div>
                    </Tooltip>
                </div>
            </aside>
            <div className={mainStyles.container}>
                <Button icon={<ArrowLeftOutlined/>} type="text"
                        onClick={() => router.push(`/mainpage`)} style={{marginBottom: 16}}>
                    Back
                </Button>
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
                            <div key={`${item.kind}-${item.id}`} className={styles.card}>
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
                                            {item.kind === "transcript" ? "Transcript" : "Note"} · {formatDate(item.createdAt)}
                                        </div>
                                        <div className={styles.cardMeta}>{wordCount(item.content)} · {formatSize(item.content)}</div>
                                    </div>
                                </div>
                                <div className={styles.participants}>
                                    <span style={{
                                        display: "inline-block",
                                        padding: "2px 10px",
                                        borderRadius: 12,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        background: item.kind === "transcript" ? "#ede9fe" : "#dcfce7",
                                        color: item.kind === "transcript" ? "#6d28d9" : "#059669",
                                    }}>
                                        {item.kind === "transcript" ? "Transcript" : "Note"}
                                    </span>
                                    {"updatedAt" in item && (
                                        <span style={{fontSize: 11, color: "#9ca3af", marginLeft: 8}}>
                                            updated {formatDate((item as {updatedAt: string}).updatedAt)}
                                        </span>
                                    )}
                                </div>
                                <div style={{position: "relative", marginTop: 10, minHeight: 58}}>
                                    <div style={{
                                        fontSize: 12,
                                        color: "#6b7280",
                                        lineHeight: 1.6,
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                    }}>
                                        {item.content?.trim() || "No content"}
                                    </div>
                                    <div style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: 20,
                                        background: "linear-gradient(to bottom, transparent, white)",
                                        pointerEvents: "none",
                                    }}/>
                                </div>
                                <Button
                                    icon={<EyeOutlined />}
                                    block
                                    onClick={() => router.push(`/users/${id}/transcripts/${item.id}?kind=${item.kind}`)}
                                    style={{
                                        background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                                        border: "none",
                                        color: "#fff",
                                        borderRadius: 8,
                                        fontWeight: 500,
                                        marginTop: 16,
                                    }}
                                >
                                    View
                                </Button>
                                <Button
                                    icon={<DownloadOutlined />}
                                    block
                                    onClick={() => handleDownload(item)}
                                    style={{
                                        borderRadius: 8,
                                        fontWeight: 500,
                                        marginTop: 8,
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
        </div>
    );
};

export default TranscriptsPage;
