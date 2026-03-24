"use client";

import React, {useEffect, useState} from 'react';
import {Card, Button, Typography, message} from 'antd';
import Image from 'next/image';
import styles from "@/styles/mainpage.module.css";
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import {useParams, useRouter} from 'next/navigation';
import {User} from "@/types/user";
import {useApi} from "@/hooks/useApi";
import {useAuth} from "@/hooks/useAuth";



const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const [user, setUser] = useState<User | null>(null);
    const { id } = useParams();
    const { token, isReady } = useAuth();

    useEffect(() => {
        if (!isReady) return; // wait for hydration

        const fetchUser = async () => {
            if (!token) {
                router.push("/"); // redirect if token missing
                return;
            }

            try {
                if (!isReady) return;
                const user: User = await apiService.get<User>(`/users/${id}`, token);
                setUser(user);
                console.log("Fetched user:", user);
            } catch (error) {
                if (error instanceof Error) {
                    alert(
                        `Something went wrong while fetching the user:\n${error.message}`,
                    );
                } else {
                    console.error("An unknown error occurred while fetching the user.");
                }
            }
        };
        fetchUser();
    }, [apiService, isReady, token, router]);
    return (
        <div className={styles.container}>

            <div className={styles.navbar}>
                <div className={styles.logoWrapper}>
                    <Image
                        src="/unnamed-Photoroom.png"
                        alt="Logo"
                        width={200}
                        height={55}
                        style={{
                            width: "auto",
                            maxWidth: "200px",
                            height: "100%",
                            maxHeight: "55px",
                            display: "block",
                            margin: "0 auto"
                        }}
                    />
                </div>
                <div className={styles.navButtons}>
                    <Button color="default" variant="text" icon=<UserOutlined/>
                            onClick = { () => router.push(`/users/${id}`) }>
                        My Profile
                    </Button>
                    <Button color="danger" variant="text" icon=<LogoutOutlined/>>
                        Sign Out
                    </Button>
                </div>
            </div>


            <div className={styles.mainContent}>
                <Title level={2} className={styles.title}>Available Rooms</Title>
                <Paragraph className={styles.subtitle}>
                    Join a room to start a video call • Maximum 2 people per room
                </Paragraph>
                <div className={styles.cardContainer}>
                    <Card className={styles.card} title="General" bordered={false} styles={{
                        header: { backgroundColor: 'rgba(31,0,229,0.2)' },
                        body: { backgroundColor: 'rgba(103,0,229,0.08)' }
                    }}>
                        <Paragraph>General conversation</Paragraph>
                        <Button type="primary">Join Room</Button>
                    </Card>
                    <Card className={styles.card} title="Work" bordered={false} styles={{
                        header: { backgroundColor: 'rgba(31,0,229,0.2)' },
                        body: { backgroundColor: 'rgba(103,0,229,0.08)' }
                    }}>
                        <Paragraph>Work discussions</Paragraph>
                        <Button type="primary">Join Room</Button>
                    </Card>
                    <Card className={styles.card} title="Coffee Break" bordered={false} styles={{
                        header: { backgroundColor: 'rgba(31,0,229,0.2)' },
                        body: { backgroundColor: 'rgba(103,0,229,0.08)' }
                    }}>
                        <Paragraph>Casual chat</Paragraph>
                        <Button type="primary">Join Room</Button>
                    </Card>
                    <Card className={styles.card} title="Support" bordered={false} styles={{
                        header: { backgroundColor: 'rgba(31,0,229,0.2)' },
                        body: { backgroundColor: 'rgba(103,0,229,0.08)' }
                    }}>
                        <Paragraph>Help & support</Paragraph>
                        <Button type="primary">Join Room</Button>
                    </Card>
                    <Card className={styles.card} title="Gaming" bordered={false} styles={{
                        header: { backgroundColor: 'rgba(31,0,229,0.2)' },
                        body: { backgroundColor: 'rgba(103,0,229,0.08)' }
                    }}>
                        <Paragraph>Play and relax</Paragraph>
                        <Button type="primary">Join Room</Button>
                    </Card>
                    <Card className={styles.card} title="Study" bordered={false} styles={{
                        header: { backgroundColor: 'rgba(31,0,229,0.2)' },
                        body: { backgroundColor: 'rgba(103,0,229,0.08)' }
                    }}>
                        <Paragraph>Focus and learn</Paragraph>
                        <Button type="primary">Join Room</Button>
                    </Card>
                </div>
            </div>


            <div className={styles.userOverview}>
                <Title level={2} className={styles.userTitle}>Browse Users</Title>
                <Paragraph className={styles.userSubtitle}>
                    ... user registered • Click to view profile and start a call
                </Paragraph>
                <div className={styles.userCard}>
                    <div className={styles.userAvatar}>
                        <div className={styles.avatarCircle}>
                            <span className={styles.avatarInitials}>LE</span>
                        </div>
                    </div>
                    <div className={styles.userInfo}>
                        <Title level={4} className={styles.userName}>Here a user will be displayed</Title>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;