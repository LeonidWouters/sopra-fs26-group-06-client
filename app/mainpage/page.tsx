"use client";

import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, message, Tag, ConfigProvider, Modal, Input, Select, Form } from 'antd';
import Image from 'next/image';
import styles from "@/styles/mainpage.module.css";
import { LogoutOutlined, UserOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { User } from "@/types/user";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";
import { getAvatarColor, getAvatarInitials } from "@/utils/avatarColor";


export interface Room {
    id: number;
    name: string;
    description: string;
    roomStatus: "EMPTY" | "JOINABLE" | "FULL";
    callerID: number | null;
    calleeID: number | null;
    isPrivate?: boolean;
    creatorId?: number;
    invitedUserId?: number;
}

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const [user, setUser] = useState<User | null>(null);
    const { token, isReady } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);

    // Modal & User States
    const [userId, setUserId] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);
    const [privateRoomName, setPrivateRoomName] = useState("");
    const [privateRoomDesc, setPrivateRoomDesc] = useState("");
    const [inviteeUsername, setInviteeUsername] = useState<string | null>(null);
    const [notifiedRoomIds, setNotifiedRoomIds] = useState<number[]>([]);
    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase();
        const matchName = (user.name || "").toLowerCase().includes(query);
        const matchUsername = (user.username || "").toLowerCase().includes(query);
        return matchName || matchUsername;
    });

    useEffect(() => {
        if (!isReady) return; // wait for hydration

        const fetchUser = async () => {
            if (!token) {
                router.push("/"); // redirect if token missing
                return;
            }

            try {
                const rawId = globalThis.localStorage.getItem("id");
                if (!rawId) return;

                let parsedId = rawId;
                try {
                    parsedId = JSON.parse(rawId);
                } catch (e) {
                    console.error("Could not parse ID", e);
                }

                setUserId(parsedId);

                const fetchedUser: User = await apiService.get<User>(`/users/${parsedId}`, token);
                setUser((prev) => JSON.stringify(prev) === JSON.stringify(fetchedUser) ? prev : fetchedUser);
                console.log("Fetched user:", fetchedUser);

                const fetchedRooms: Room[] = await apiService.get<Room[]>("/rooms", token);
                setRooms((prev) => JSON.stringify(prev) === JSON.stringify(fetchedRooms) ? prev : fetchedRooms);
                console.log("Fetched rooms:", fetchedRooms);

                const fetchedUsers: User[] = await apiService.get<User[]>("/users", token);
                setUsers((prev) => JSON.stringify(prev) === JSON.stringify(fetchedUsers) ? prev : fetchedUsers);
                console.log("Fetched users:", fetchedUsers);
            } catch (error) {
                console.error("Error fetching data in background:", error);
            }
        };
        fetchUser();
        const interval = setInterval(fetchUser, 3000);
        return () => clearInterval(interval);
    }, [apiService, isReady, token, router]);

    useEffect(() => {
        if (!userId) return;
        const newInvites = rooms.filter(r => r.isPrivate && String(r.invitedUserId) === String(userId) && !notifiedRoomIds.includes(r.id));

        if (newInvites.length > 0) {
            newInvites.forEach(room => {
                const inviter = users.find(u => String(u.id) === String(room.creatorId));
                const inviterName = inviter ? inviter.name : "a friend";
                message.info(`You got invited to join "${room.name}" by ${inviterName}!`);
            });
            setNotifiedRoomIds(prev => [...prev, ...newInvites.map(r => r.id)]);
        }
    }, [rooms, userId, notifiedRoomIds, users]);

    const handleCreatePrivateRoom = async () => {
        if (!inviteeUsername) {
            message.error("Please invite a friend.");
            return;
        }
        if (!privateRoomName){
            message.error("Please enter a room name!.");
            return;
        }
        try {
            const newRoom = await apiService.post<Room>("/rooms/private", { name: privateRoomName, description: privateRoomDesc }, token);
            await apiService.post(`/rooms/${newRoom.id}/invite`, { username: inviteeUsername }, token);

            message.success("Room created & invitation sent!");
            setIsPrivateModalOpen(false);
            setPrivateRoomName("");
            setPrivateRoomDesc("");
            setInviteeUsername(null);

            const fetchedRooms: Room[] = await apiService.get<Room[]>("/rooms", token);
            setRooms(fetchedRooms);
            handleJoinRoom(newRoom.id);
        } catch (error) {
            message.error("An error eccurred while creating the room or sending the invitation.");
            console.error(error);
        }
    };


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

    const { clear: clearToken } = useLocalStorage<string>("token", "");

    const handleLogout = (): void => {
        apiService.put("/users/logout", null, token);
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
                    <Button color="default" variant="text" icon={<UserOutlined/>}
                            onClick={() => router.push(`/users/${userId}`)}>
                        My Profile
                    </Button>
                    <Button onClick={handleLogout} color="danger" variant="text" icon={<LogoutOutlined/>}>
                        Sign Out
                    </Button>
                </div>
            </div>


            <div className={styles.mainContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2} className={styles.title} style={{ margin: 0 }}>Available Rooms</Title>
                    <Button type="primary" onClick={() => setIsPrivateModalOpen(true)} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", border: "none" }}>
                        + Create Private Room
                    </Button>
                </div>

                <Modal
                    title="Create Private Room"
                    open={isPrivateModalOpen}
                    onOk={handleCreatePrivateRoom}
                    onCancel={() => setIsPrivateModalOpen(false)}
                    okText="Create & Invite"
                >
                    <Form layout="vertical" style={{ marginTop: "16px" }}>
                        <Form.Item label="Room Name" required>
                            <Input
                                placeholder="Enter room name"
                                value={privateRoomName}
                                onChange={e => setPrivateRoomName(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item label="Description">
                            <Input.TextArea
                                placeholder="Enter description (optional)"
                                value={privateRoomDesc}
                                onChange={e => setPrivateRoomDesc(e.target.value)}
                                rows={3}
                            />
                        </Form.Item>

                        <Form.Item label="Invite a Friend" required>
                            <Select
                                placeholder="Select a friend to invite"
                                value={inviteeUsername}
                                onChange={value => setInviteeUsername(value)}
                                style={{ width: "100%" }}
                            >
                                {users.filter(u => u.id && (user?.friends || []).map(String).includes(String(u.id))).map(friend => (
                                    <Select.Option key={friend.id} value={friend.username}>
                                        {friend.name} (@{friend.username})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
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
                                    title={<span style={{ color: '#ffffff' }}>{room.name} {room.isPrivate && <Tag color="purple" style={{ marginLeft: 8 }}>Private</Tag>}</span>}
                                    extra={
                                        <span className={`${styles.roomStatusBadge} ${
                                            room.roomStatus === "EMPTY" ? styles.roomStatusBadgeEmpty :
                                            room.roomStatus === "JOINABLE" ? styles.roomStatusBadgeJoinable :
                                            styles.roomStatusBadgeFull
                                        }`}>
                                            <span className={`${styles.statusDot} ${
                                                room.roomStatus === "EMPTY" ? styles.statusDotEmpty :
                                                room.roomStatus === "JOINABLE" ? styles.statusDotJoinable :
                                                styles.statusDotFull
                                            }`} />
                                            {room.roomStatus === "EMPTY" ? "Available" :
                                             room.roomStatus === "JOINABLE" ? "1 Person Waiting" :
                                             "Full"}
                                        </span>
                                    }
                                    bordered={false}
                                    styles={{
                                        header: { backgroundColor: 'rgba(44, 44, 84, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                                        body: { backgroundColor: 'rgba(64, 64, 122, 0.85)' }
                                    }}
                                >
                                    <Paragraph style={{ color: '#e2e8f0' }}>{room.description}</Paragraph>

                                    <div className={styles.occupancySlots}>
                                        <div className={`${styles.occupancySlot} ${room.roomStatus !== "EMPTY" ? styles.occupancySlotFilled : styles.occupancySlotEmpty}`}>
                                            {room.roomStatus !== "EMPTY" ? "👤" : ""}
                                        </div>
                                        <div className={`${styles.occupancySlot} ${room.roomStatus === "FULL" ? styles.occupancySlotFilled : styles.occupancySlotEmpty}`}>
                                            {room.roomStatus === "FULL" ? "👤" : ""}
                                        </div>
                                    </div>

                                    <Button
                                        type="primary"
                                        disabled={room.roomStatus === "FULL"}
                                        onClick={() => handleJoinRoom(room.id)}
                                        style={{ marginTop: 12 }}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <Title level={2} className={styles.userTitle} style={{ margin: 0 }}>
                        Browse Users
                    </Title>
                    <Button
                        color="default"
                        variant="outlined"
                        icon={<UsergroupAddOutlined />}
                        onClick={showModal}
                    >
                        All Users
                    </Button>
                    <Modal
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '32px' }}>
                                <span style={{ color: '#000', fontSize: '20px', fontWeight: 600 }}>All Users</span>
                                <Input
                                    placeholder="Search user"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    allowClear
                                    style={{ maxWidth: '300px' }}
                                />
                            </div>
                        }
                        open={isModalOpen}
                        onCancel={handleCancel}
                        footer={null}
                        width={800}
                    >
                        <div style={{
                            maxHeight: '60vh',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            paddingRight: '12px',
                            marginTop: '16px'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                {filteredUsers.length > 0 ? (
                                    [...filteredUsers].sort((a, b) => (a.name || "").localeCompare(b.name || "")).map((user) => (
                                        <div key={user.id}>
                                            <Card
                                                onClick={() => router.push(`/users/${user.id}`)}
                                                className={styles.card}
                                                title={
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                                                        <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: getAvatarColor(user.username ?? ""), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                                            {getAvatarInitials(user.username ?? "")}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                                            <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>{user.name}</span>
                                                            <span style={{ fontSize: '12px', color: '#a0a0b8', fontWeight: 'normal', marginTop: '1.5px' }}>@{user.username}</span>
                                                        </div>
                                                    </div>
                                                }
                                                extra={
                                                    <Tag
                                                        color={user.status === "OFFLINE" ? "red" : "green"}
                                                        style={{ margin: 0 }}
                                                    >
                                                        {user.status === "ONLINE" ? "ONLINE" : "OFFLINE"}
                                                    </Tag>
                                                }
                                                bordered={false}
                                                styles={{
                                                    header: { backgroundColor: 'rgba(44, 44, 84, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                                                    body: { backgroundColor: 'rgba(64, 64, 122, 0.85)', cursor: 'pointer' }
                                                }}
                                            >
                                                <Paragraph
                                                    ellipsis={{ rows: 2, tooltip: user.bio }}
                                                    style={{ margin: 0, color: '#e2e8f0' }}
                                                >
                                                    {user.bio}
                                                </Paragraph>
                                            </Card>
                                        </div>
                                    ))
                                ) : (
                                    <Paragraph style={{ color: 'black' }}>
                                        {users.length === 0 ? "Loading users..." : "No users found matching your search."}
                                    </Paragraph>
                                )}
                            </div>
                        </div>
                    </Modal>
                </div>
                <Paragraph className={styles.userSubtitle}>
                    {users.filter((user) => user.status === "ONLINE").length} user online • Click to view profile and start a call
                </Paragraph>
                <div className={styles.userGrid}>
                    {users.length > 0 ? (
                        users.filter((user) => user.status === "ONLINE").map((user) => (
                            <div
                                key={user.id}
                            >
                                <Card
                                    onClick = { () => router.push(`/users/${user.id}`) }
                                    className={styles.card}
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: getAvatarColor(user.username ?? ""), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                                {getAvatarInitials(user.username ?? "")}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                                <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>{user.name}</span>
                                                <span style={{ fontSize: '12px', color: '#a0a0b8', fontWeight: 'normal', marginTop: '1.5px' }}>@{user.username}</span>
                                            </div>
                                        </div>
                                    }
                                    extra={
                                        <Tag
                                            color={user.status === "OFFLINE" ? "red" : "green"}
                                            style={{ margin: 0 }}
                                        >
                                            {user.status === "ONLINE" ? "ONLINE" : "OFFLINE"}
                                        </Tag>
                                    }
                                    bordered={false}
                                    styles={{
                                        header: { backgroundColor: 'rgba(44, 44, 84, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                                        body: { backgroundColor: 'rgba(64, 64, 122, 0.85)', cursor: 'pointer' }
                                    }}
                                >
                                    <Paragraph
                                        ellipsis={{ rows: 2, tooltip: user.bio }}
                                        style={{ margin: 0, color: '#e2e8f0' }}
                                    >
                                        {user.bio}
                                    </Paragraph>

                                </Card>
                            </div>
                        ))
                    ) : (
                        <Paragraph>Loading users or no users available...</Paragraph>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;