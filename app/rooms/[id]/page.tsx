"use client";

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button, Form, Input, Segmented} from "antd";
import {useApi} from "@/hooks/useApi";
import {useAuth} from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";
import dynamic from 'next/dynamic';
import { User } from "@/types/user";
import styles from "@/styles/mainpage.module.css";
import Image from "next/image";
import {CloseCircleOutlined} from "@ant-design/icons";


const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export interface Room {
    id: number;
    name: string;
    description: string;
    roomStatus: string;
    CallerID: number | null;
    CalleeID: number | null;
}

const RoomPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const { token, isReady } = useAuth();
    const { id } = useParams();
    const clientRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket>(null);
    const [messages, setMessages] = useState<unknown[]>([]);
    const [markdownText, setMarkdownText] = useState<string>("");
    const [activeEditor, setActiveEditor] = useState<string>("Loading...");
    const [participants, setParticipants] = useState<string[]>(["Loading...", "Waiting..."]);
    const [myUsername, setMyUsername] = useState<string>("");
    const { value: myUserId } = useLocalStorage<string>("id", "");
    const { clear: clearToken } = useLocalStorage<string>("token", "");
    const [roomName, setRoomName] = useState<string>("Loading...");
    const [occupancy, setOccupancy] = useState<number>(0);

    const leaveRoom = (): void => {
        // Clear token using the returned function 'clear' from the hook
        apiService.put(`/rooms/${id}/leave`, null, token);
        router.push("/mainpage");
    };
    useEffect(() => {
        if (!isReady || !token || !id) return;

        const fetchParticipants = async () => {
            try {
                const room = await apiService.get<Room>(`/rooms/${id}`, token);

                setRoomName(room.name);
                let count = 0;
                if (room.CallerID) count++;
                if (room.CalleeID) count++;
                setOccupancy(count);

                const users: string[] = [];
                let myName = "";

                if (room.CallerID) {
                    const caller = await apiService.get<User>(`/users/${room.CallerID}`, token);
                    if (caller.username) {
                        users.push(caller.username);
                        if (String(caller.id) === String(myUserId)) myName = caller.username;
                    }
                }

                if (room.CalleeID) {
                    const callee = await apiService.get<User>(`/users/${room.CalleeID}`, token);
                    if (callee.username) {
                        users.push(callee.username);
                        if (String(callee.id) === String(myUserId)) myName = callee.username;
                    }
                }
                if (users.length === 0) {
                    users.push("Loading...", "Waiting...");
                } else if (users.length === 1) {
                    users.push("Waiting...");
                }

                setMyUsername(myName);

                setParticipants((prev) => {
                    if (JSON.stringify(prev) !== JSON.stringify(users)) {
                        if (activeEditor === "Loading...") {
                            setActiveEditor(users[0]);
                        }
                        return users;
                    }
                    return prev;
                });

            } catch (error) {
                console.error("Error while fetching room data:", error);
            }
        };

        fetchParticipants();

        const interval = setInterval(fetchParticipants, 3000);
        return () => clearInterval(interval);

    }, [apiService, id, isReady, token, myUserId]);

    useEffect(() => {
        if (!isReady) return;
        const socket = new WebSocket(`ws://localhost:8080/ws/SocketsHandler?token=${token}`);
        wsRef.current = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({id}));
        }
        socket.onmessage = (event) => {
            setMessages((prev) => [...prev, event.data]);
        };

        socket.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        return () => {
            socket.close(1000, "component unmounted");
        };
    }, [apiService, token, isReady]);

    const send = (data:string) => {
        wsRef.current?.send(JSON.stringify({data}));
    };


    useEffect(() => {
        if(!isReady) return; //ensure token is loaded
        let stream: MediaStream | null;
        const startMediaDevice = async() =>{
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                clientRef.current!.srcObject = stream;
            }
           catch (error) {
                console.error("Error accessing media devices.", error);
           }
        }
        startMediaDevice();
        return() =>{
            stream?.getTracks().forEach(track => track.stop());
            if (clientRef.current) {
                clientRef.current.srcObject = null
            };
        }
    }, [apiService, token, isReady]);

    return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100vh", color: "blueviolet" }}>

            <div className={styles.navbar}>
                <div className={styles.logoWrapper}>
                    <Image
                        src="/unnamed-Photoroom.png"
                        alt="CommunicALL"
                        width={200}
                        height={55}
                        style={{width: "auto", maxWidth: "200px", height: "100%", maxHeight: "55px"}}
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end" }}>
                        <div style={{ margin: 0, color: "black", fontSize: "16px", fontWeight: "bold", lineHeight: "1.2" }}>
                            {roomName}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "black", fontSize: "13px", marginTop: "2px" }}>
                            <span style={{ width: "8px", height: "8px", backgroundColor: "#48bb78", borderRadius: "50%", display: "inline-block" }}></span>
                            {occupancy}/2 in room
                        </div>
                    </div>
                    <div className={styles.navButtons}>
                        <Button color="danger" variant="text" icon={<CloseCircleOutlined/>}
                                onClick={leaveRoom}>
                            Leave Call
                        </Button>
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", flex: 1 }}>

                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "24px",
                    padding: "24px",
                    borderRight: "1px solid #e5e7eb"
                }}>
                    <div style={{ width: "100%", maxWidth: "600px" }}>
                        <video
                            ref={clientRef}
                            autoPlay
                            muted
                            style={{ width: "100%", borderRadius: "8px", backgroundColor: "#1a1a1a" }}
                        />
                    </div>
                    <div style={{ width: "100%", maxWidth: "400px" }}>
                        <Form onFinish={(values) => send(values)} layout="vertical">
                            <Form.Item name="message" label="Message" style={{ marginBottom: "12px" }}>
                                <Input placeholder="Type a message..." />
                            </Form.Item>

                            <div style={{ display: "flex", gap: "12px" }}>
                                <Button htmlType="submit" type="primary" style={{ flex: 1 }}>
                                    Send Message
                                </Button>
                            </div>
                        </Form>
                    </div>
                </div>

                <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h2 style={{ color: "black", margin: 0 }}>Shared Notes</h2>

                        <Segmented
                            options={participants}
                            value={activeEditor}
                            onChange={(value) => setActiveEditor(value as string)}
                        />
                    </div>

                    <div data-color-mode="light" style={{ flex: 1 }}>
                        <MDEditor
                            value={markdownText}
                            onChange={(value) => setMarkdownText(value || '')}
                            height={600}
                            preview={activeEditor === myUsername ? "live" : "preview"}
                            textareaProps={{
                                placeholder: "# Shared notes\n\nHere you can collaboratively edit notes..."
                            }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RoomPage;