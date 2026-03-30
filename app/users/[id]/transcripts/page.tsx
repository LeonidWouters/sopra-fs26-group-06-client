"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "antd";
import { DeleteOutlined, DownloadOutlined, FileTextOutlined, LogoutOutlined } from "@ant-design/icons";
import Image from "next/image";
import mainStyles from "@/styles/mainpage.module.css";
import styles from "./transcripts.module.css";

const TranscriptsPage: React.FC = () => {
    const router = useRouter();
    const { id } = useParams();

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
                    <Button color="danger" variant="text" icon={<LogoutOutlined />}>
                        Sign Out
                    </Button>
                </div>
            </div>

            <div className={mainStyles.mainContent}>
                <h1 className={styles.pageTitle}>Available Transcripts &amp; Notes</h1>
                <div className={styles.grid}>
                    {/* Placeholder cards — will be replaced with real data */}
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={styles.card}>
                            <button className={styles.deleteBtn} aria-label="Delete">
                                <DeleteOutlined />
                            </button>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconWrapper}>
                                    <FileTextOutlined style={{ fontSize: 24, color: "#4f46e5" }} />
                                </div>
                                <div>
                                    <div className={styles.cardTitle}>Video Call</div>
                                    <div className={styles.cardMeta}>— KB</div>
                                </div>
                            </div>
                            <div className={styles.participants}>Participants: —</div>
                            <Button
                                icon={<DownloadOutlined />}
                                block
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
            </div>
        </div>
    );
};

export default TranscriptsPage;
