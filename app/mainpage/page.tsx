"use client";

import React, {useEffect, useState} from 'react';
import {Card, Button, Typography, message, Tag, ConfigProvider} from 'antd';
import Image from 'next/image';
import styles from "@/styles/mainpage.module.css";
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import {useRouter} from 'next/navigation';
import {User} from "@/types/user";
import {useApi} from "@/hooks/useApi";
import {useAuth} from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";


export interface Room {
    id: number;
    name: string;
    description: string;
    roomStatus: "EMPTY" | "JOINABLE" | "FULL";
    callerID: number | null;
    calleeID: number | null;
}

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const [user, setUser] = useState<User | null>(null);
    const { token, isReady } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!isReady) return; // wait for hydration

        const fetchUser = async () => {
            if (!token) {
                router.push("/"); // redirect if token missing
                return;
            }

            try {
                if (!isReady) return;
                const rawId = globalThis.localStorage.getItem("id");

                if (!rawId) return;
                const parsedId = JSON.parse(rawId);
                setUserId(parsedId);
                const user: User = await apiService.get<User>(`/users/${parsedId}`, token);

                setUser(user);
                console.log("Fetched user:", user);
                const fetchedRooms: Room[] = await apiService.get<Room[]>("/rooms", token);
                setRooms(fetchedRooms);
                console.log("Fetched rooms:", fetchedRooms);
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

    const handleJoinRoom = async (roomId: number) => {
        try {
            await apiService.put(`/rooms/${roomId}/join`, null,token);

            message.success("Successfully joined Room!");

            router.push(`/rooms/${roomId}`);

        } catch (error) {
            if (error instanceof Error) {
                message.error(`Couldn't join room: ${error.message}`);
            } else {
                message.error("Couldn't join room.");
            }
            console.error(error);
        }
    };
    const {
        // is commented out because we dont need to know the token value for logout
        // is commented out because we dont need to set or update the token value
        clear: clearToken, // all we need in this scenario is a method to clear the token
    } = useLocalStorage<string>("token", "");
    const handleLogout = (): void => {
        // Clear token using the returned function 'clear' from the hook
        apiService.put("/users/logout", null, token); // make a PUT request to the backend to invalidate the token, pass the token in the header for authentication
        clearToken();
        globalThis.localStorage.removeItem("id");
        router.push("/");
    };

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
                            onClick = { () => router.push(`/users/${userId}`) }>
                        My Profile
                    </Button>
                    <Button onClick={handleLogout} color="danger" variant="text" icon=<LogoutOutlined/>>
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
                    {rooms.length > 0 ? (
                        rooms.map((room) => (
                            <ConfigProvider
                                key={room.id}
                                theme={{
                                    components: {
                                        Button: {
                                            colorPrimary: '#ffffff',
                                            colorPrimaryHover: '#e0e0e0',
                                            colorTextLightSolid: '#2c2c54',
                                            colorBgContainerDisabled: '#2a2a4a',
                                            colorTextDisabled: '#8a8aa3',
                                            borderColorDisabled: '#2a2a4a',
                                        }
                                    }
                                }}
                            >
                                <Card
                                className={styles.card}
                                title={room.name}
                                extra={
                                    <Tag
                                        color={room.roomStatus === "FULL" ? "red" : "green"}
                                        style={{ margin: 0 }}
                                    >
                                        {room.roomStatus === "EMPTY" ? "0/2" : (room.roomStatus === "JOINABLE" ? "1/2" : "2/2")}
                                    </Tag>
                                }
                                bordered={false}
                                styles={{
                                    header: { backgroundColor: 'rgba(44, 44, 84, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                                    body: { backgroundColor: 'rgba(64, 64, 122, 0.85)' }
                                }}
                            >
                                <Paragraph>{room.description}</Paragraph>

                                <Button
                                    type="primary"
                                    disabled={room.roomStatus === "FULL"}
                                    onClick={() => handleJoinRoom(room.id)}
                                >
                                    {room.roomStatus === "FULL" ? "Room Full" : "Join Room"}
                                </Button>
                            </Card>
                            </ConfigProvider>
                        ))
                    ) : (
                        <Paragraph>Loading rooms or no rooms available...</Paragraph>
                    )}
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