"use client";

import React, {useEffect, useRef, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button, Form, Input, Segmented, Spin, Drawer, message} from "antd";
import {useApi} from "@/hooks/useApi";
import {useAuth} from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";
import dynamic from 'next/dynamic';
import {User} from "@/types/user";
import styles from "@/styles/mainpage.module.css";
import Image from "next/image";
import {CloseCircleOutlined} from "@ant-design/icons";
import {getApiDomain} from "@/utils/domain";


const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {ssr: false});

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
    const {token, isReady} = useAuth();
    const {id} = useParams();
    const clientRef = useRef<HTMLVideoElement>(null);
    const remoteRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const [messages, setMessages] = useState<textMsg[]>([]);
    const [markdownText, setMarkdownText] = useState<string>("");
    const [activeEditor, setActiveEditor] = useState<string>("Loading...");
    const [participants, setParticipants] = useState<string[]>(["Loading...", "Waiting..."]);
    const [myUsername, setMyUsername] = useState<string>("");
    const {value: myUserId} = useLocalStorage<string>("id", "");
    const [roomName, setRoomName] = useState<string>("Loading...");
    const [occupancy, setOccupancy] = useState<number>(0);
    const [callStarted, setCallStarted] = useState<boolean>(false);
    const [disabilityStatusLocal, setDisabilityStatusLocal] = useState<string>("");
    const [disabilityStatusRemote, setDisabilityStatusRemote] = useState<string>("");
    const [subtitleText, setSubtitleText] = useState<string>("");
    const speechRef = useRef<SpeechRecognition>(null);
    const ttsEnabledRef = useRef<boolean>(false);
    const [chat, setChat] = useState<boolean>(false);
    const [chatHistory,setChatHistory] = useState(false);
    const [form] = Form.useForm();

    interface textMsg {
        message: string;
        client: boolean; //handle local vs remote messages
        timestamp: string;
    }

    const leaveRoom = async (): Promise<void> => {
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;

        if (markdownText.trim() !== "" && callStarted) {
            try {
                const sessionId = crypto.randomUUID();
                await apiService.post("/notes", {
                    content: markdownText,
                    sessionId: sessionId
                }, token);

            } catch (error) {
                console.error("Couldnt save notes:", error);
            }
        }
        await apiService.put(`/rooms/${id}/leave`, null, token);
        router.push("/mainpage");
    };

    useEffect(() => {
        if (isReady && !token) router.push("");
    }, [isReady, token]);

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
                        if (String(caller.id) === String(myUserId)) {
                            myName = caller.username;
                        }
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
        if (occupancy === 2) {
            setCallStarted(true);

            if (!peerConnectionRef.current) {
                startCall();
            }
        }
    }, [occupancy]);

    useEffect(() => {
        if (!isReady) return;
        const socket = new WebSocket(`${getApiDomain().replace(/^http/, "ws")}/ws/SocketsHandler?token=${token}&roomId=${id}`);


        wsRef.current = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({id}));
        }
        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "offer") {
                await answerCall(message.offer);
            }

            if (message.type === "answer") {
                await peerConnectionRef.current?.setRemoteDescription(message.answer);
            }

            if (message.type === "ice-candidate") {
                await peerConnectionRef.current?.addIceCandidate(message.candidate);
            }

            if (message.type === "markdown-update") {
                setMarkdownText(message.content);
            }

            if (message.type === "editor-change") {
                setActiveEditor(message.editor);
            }

            if (message.type === "text-msg") {
                setMessages((messages) => [...messages, message.content]);
                if (ttsEnabledRef.current) {
                    const voices = window.speechSynthesis.getVoices();
                    const utterance = new SpeechSynthesisUtterance(message.content.message)
                    utterance.voice = voices[0]; // select fixed voice, user changeable as a feature enhancement
                    window.speechSynthesis.speak(utterance);
                }
                if (chat){
                    setSubtitleText(message.content.message);
                }
            }

            if (message.type === "speech-to-text") {
                setSubtitleText(message.content);
            }
        };

        socket.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        return () => {
            socket.close(1000, "component unmounted");
        };
    }, [apiService, token, isReady]);

    const sendText = (data:string) => {
        console.log(data);
        const remoteMessage : textMsg = {
            message : data,
            client: false,
            timestamp: new Date().toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })
        }

        const localMessage : textMsg = {
            message : data,
            client : true,
            timestamp : new Date().toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })
        }

        wsRef.current?.send(JSON.stringify({
            type: "text-msg",
            content: remoteMessage,
        }));
        setMessages((messages) => [...messages, localMessage]);
    };

    const loadChat = () => {
        setChatHistory(true);
    }

    const closeChat = () =>{
        setChatHistory(false);
    }


    const setupPeerConnection = () => {

        const session = new RTCPeerConnection(); //start
        peerConnectionRef.current = session;

        const ownStream = clientRef.current?.srcObject as MediaStream | null;  //kamera added
        if (ownStream) {
            ownStream.getTracks().forEach(track => session.addTrack(track, ownStream));
        }

        session.ontrack = (event) => { //partner video
            console.log(event.type);
            if (remoteRef.current) {
                remoteRef.current.srcObject = event.streams[0];
            }
        };

        session.onicecandidate = (event) => { //transfer zu websocket
            if (event.candidate && wsRef.current) {
                wsRef.current.send(JSON.stringify({
                    type: "ice-candidate",
                    candidate: event.candidate
                }));
            }
        };

        return session;
    };


    const startCall = async () => {
        console.log("Starting call");
        const session = setupPeerConnection();

        const offer = await session.createOffer();
        await session.setLocalDescription(offer);

        wsRef.current?.send(JSON.stringify({
            type: "offer",
            offer: offer
        }));
    };
    const answerCall = async (offer: RTCSessionDescriptionInit) => {
        const session = setupPeerConnection();

        await session.setRemoteDescription(offer);

        const answer = await session.createAnswer();
        await session.setLocalDescription(answer);

        wsRef.current?.send(JSON.stringify({
            type: "answer",
            answer: answer
        }));
    };

    const setDS = async () => {
        const room = await apiService.get<Room>(`/rooms/${id}`, token);
        const user1 = await apiService.get<User>(`/users/${room.CallerID}`, token)
        const user2 = await apiService.get<User>(`/users/${room.CalleeID}`, token)
        if (myUserId == room.CallerID?.toString()) {

            setDisabilityStatusLocal(user1.disabilityStatus || "Unknown");
            setDisabilityStatusRemote(user2.disabilityStatus || "Unknown");
        }

        if (myUserId == room.CalleeID?.toString()) {
            setDisabilityStatusLocal(user2.disabilityStatus || "Unknown");
            setDisabilityStatusRemote(user1.disabilityStatus || "Unknown");
        }
    };

    function startTTT() {
        setChat(true);//turns on chat feature so it is visible

    }

    function startSTT() {
        if (speechRef.current) {
            speechRef.current.stop();
        }


        speechRef.current = new SpeechRecognition() || new window.webkitSpeechRecognition; //get speech recognition object based on browser

        if (!speechRef.current) {
            setSubtitleText("Speech recognition not supported in this browser, activating text to text chat");
            setChat(true);
            return;
        }
        speechRef.current.continuous = true;
        speechRef.current.interimResults = true;
        speechRef.current.start();
        console.log(speechRef.current);

        speechRef.current.onresult = event => {
            let message = "";
            console.log(event.results);
            for (let i = event.resultIndex; i < event.results.length; i++) {
                message += event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    console.log("Final transcript:", message);

                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({
                            type: "speech-to-text",
                            content: message
                        }));
                    }
                }
            }
        };

        speechRef.current.onend = () => {
            if(speechRef.current){
                speechRef.current.start();
            }
            else {
                startSTT();//restart clean in case of speechRef being hard reset
            }
        }

    }


    function startTTS() {
        ttsEnabledRef.current = true;
    }

    useEffect(() => {
        if (!callStarted || !isReady) return;

        const loadDisabilityStatus = async () => {
            await setDS();
        };

        loadDisabilityStatus();
    }, [callStarted, isReady]);

    useEffect(() => {
        if (!callStarted || !isReady) return;

        if (!disabilityStatusLocal || !disabilityStatusRemote) return;

        console.log("Accessibility check", {
            disabilityStatusLocal,
            disabilityStatusRemote,
        });


        const initializeAccessibility = async () => {

            if (disabilityStatusLocal == "DEAF" && disabilityStatusRemote == "DEAF") {
                console.log("TTT")
                startTTT();
            }
            if (disabilityStatusRemote == "DEAF" && disabilityStatusLocal == "HEARING") {
                console.log("STT")
                startSTT();
                startTTS();
            }
            if (disabilityStatusLocal == "HEARING" && disabilityStatusRemote == "HEARING") {
                console.log("do nothing")
            }
            if (disabilityStatusLocal == "DEAF" && disabilityStatusRemote == "HEARING") {
                console.log("chat for deaf")
                setChat(true);
            }
        };

        initializeAccessibility();
    }, [callStarted, isReady,disabilityStatusRemote,disabilityStatusLocal]);

    useEffect(() => {
        if (!isReady) return; //ensure token is loaded
        let stream: MediaStream | null;
        const startMediaDevice = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
                clientRef.current!.srcObject = stream;
            } catch (error) {
                console.error("Error accessing media devices.", error);
            }
        }
        startMediaDevice();
        return () => {
            stream?.getTracks().forEach(track => track.stop());
            if (clientRef.current) {
                clientRef.current.srcObject = null
            }
            ;
        }
    }, [apiService, token, isReady]);

    return (
        <div style={{display: "flex", flexDirection: "column", width: "100%", height: "100vh"}}>

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

                <div style={{display: "flex", alignItems: "center", gap: "24px"}}>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "flex-end"
                    }}>
                        <div style={{
                            margin: 0,
                            color: "black",
                            fontSize: "16px",
                            fontWeight: "bold",
                            lineHeight: "1.2"
                        }}>
                            {roomName}
                        </div>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            color: "black",
                            fontSize: "13px",
                            marginTop: "2px"
                        }}>
                            <span style={{
                                width: "8px",
                                height: "8px",
                                backgroundColor: "#48bb78",
                                borderRadius: "50%",
                                display: "inline-block"
                            }}></span>
                            {occupancy}/2 in room
                        </div>
                    </div>
                    <div className={styles.navButtons}>
                        <Button color="danger" variant="text" icon={<CloseCircleOutlined/>} onClick={leaveRoom}>
                            Leave Call
                        </Button>
                    </div>
                </div>
            </div>

            <div style={{display: "flex", flex: 1}}>
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    margin: "12px"
                }}>
                    <div style={{flex: 1, position: "relative", backgroundColor: "#1a0533"}}>
                        {occupancy < 2 ? (
                            <div style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "16px",
                                color: "#c9c2c2"
                            }}>
                                <Spin size="large"/>
                                <p style={{margin: 0, fontSize: "16px"}}>Waiting for someone to join...</p>
                            </div>
                        ) : (
                            <video
                                ref={remoteRef}
                                autoPlay
                                style={{width: "100%", height: "100%", objectFit: "cover"}}
                            />
                        )}

                        <video
                            ref={clientRef}
                            autoPlay
                            muted
                            style={{
                                position: "absolute",
                                top: "16px",
                                left: "16px",
                                width: "200px",
                                borderRadius: "12px",
                                backgroundColor: "#2e1065"
                            }}
                            poster="/nocamera.png"
                        />

                        {subtitleText && (
                            <div style={{
                                position: "absolute",
                                bottom: "16px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "rgba(0, 0, 0, 0.65)",
                                color: "#ffffff",
                                padding: "10px 24px",
                                borderRadius: "8px",
                                fontSize: "16px",
                                fontWeight: 500,
                                maxWidth: "80%",
                                textAlign: "center",
                                pointerEvents: "none",
                            }}>
                                {subtitleText}
                            </div>
                        )}
                    </div>

                    <div style={{padding: "12px 24px", borderTop: "1px solid #e5e7eb"}}>
                        <Form form = {form} onFinish={(values) => {
                            sendText(values.message);
                            form.resetFields();
                        }} layout="inline">
                            <Form.Item name="message" style={{flex: 1, marginBottom: 0}} hidden={!chat}>
                                <Input placeholder="Press enter to submit" />
                            </Form.Item>
                        </Form>
                        <Button type ="default" onClick={loadChat}>show chat history</Button>
                        <Drawer title = "Chat History" open={chatHistory} onClose={closeChat} placement={"left"} mask={false}>
                            {messages.map((msg, index) => <div key={index}
                            style={{padding: "8px 12px", marginBottom: "8px", backgroundColor: msg.client ? "#2e1065" : "#b5b5b5", borderRadius: "8px", color : "white", justifyContent : msg.client ? "flex-start" : "flex-end"}}>
                            {msg.timestamp + " : " + msg.message}</div>)}
                        </Drawer>
                    </div>
                </div>
                <div style={{flex: 1, padding: "24px", display: "flex", flexDirection: "column"}}>
                    <div style={{
                        display: "flex", //notes linke seite
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px"
                    }}>
                        <h2 style={{color: "black", margin: 0}}>Shared Notes</h2>

                        <Segmented
                            options={participants}
                            value={activeEditor}
                            onChange={(value) => {
                                const newEditor = value as string;
                                setActiveEditor(newEditor);
                                if (wsRef.current?.readyState === WebSocket.OPEN) {
                                    wsRef.current.send(JSON.stringify({ type: "editor-change", editor: newEditor }));
                                }
                            }}
                        />
                    </div>

                    <div data-color-mode="light" style={{flex: 1}}>
                        <MDEditor
                            value={markdownText}
                            onChange={(value: string | undefined) => {
                                const newText = value || '';
                                setMarkdownText(newText);
                                if (wsRef.current?.readyState === WebSocket.OPEN) {
                                    wsRef.current.send(JSON.stringify({ type: "markdown-update", content: newText }));
                                }
                            }}
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