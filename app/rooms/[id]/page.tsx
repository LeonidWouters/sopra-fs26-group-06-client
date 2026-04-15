"use client";

import React, {useEffect, useRef, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button, Form, Input, Segmented, Spin,Drawer} from "antd";
import {useApi} from "@/hooks/useApi";
import {useAuth} from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";
import dynamic from 'next/dynamic';
import {User} from "@/types/user";
import styles from "@/styles/mainpage.module.css";
import Image from "next/image";
import {CloseCircleOutlined} from "@ant-design/icons";
import {isProduction} from "@/utils/environment";
import {getApiDomain} from "@/utils/domain";

type SpeechRecognitionLike = {
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

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
    const localStreamRef = useRef<MediaStream | null>(null);
    const localStreamAcquirePromiseRef = useRef<Promise<MediaStream | null> | null>(null);
    const [messages, setMessages] = useState<textMsg[]>([]);
    const [transcriptChunks, setTranscriptChunks] = useState<string[]>([]);
    const [markdownText, setMarkdownText] = useState<string>("");
    const [activeEditor, setActiveEditor] = useState<string>("Loading...");
    const [participants, setParticipants] = useState<string[]>(["Loading...", "Waiting..."]);
    const [myUsername, setMyUsername] = useState<string>("");
    const {value: myUserId} = useLocalStorage<string>("id", "");
    const [roomName, setRoomName] = useState<string>("Loading...");
    const [occupancy, setOccupancy] = useState<number>(0);
    const [callStarted, setCallStarted] = useState<boolean>(false);
    const [isCaller, setIsCaller] = useState<boolean>(false);
    const [socketReady, setSocketReady] = useState<boolean>(false);
    const [joinedSocketRoom, setJoinedSocketRoom] = useState<boolean>(false);
    const [peerInSocketRoom, setPeerInSocketRoom] = useState<boolean>(false);
    const [localStreamReady, setLocalStreamReady] = useState<boolean>(false);
    const [disabilityStatusLocal, setDisabilityStatusLocal] = useState<string>("");
    const [disabilityStatusRemote, setDisabilityStatusRemote] = useState<string>("");
    const [subtitleText, setSubtitleText] = useState<string>("");
    const speechRef = useRef<SpeechRecognitionLike | null>(null);
    const ttsEnabledRef = useRef<boolean>(false);
    const callSessionIdRef = useRef<string>("");
    const artifactsFlushedRef = useRef<boolean>(false);
    const latestMarkdownRef = useRef<string>("");
    const latestMessagesRef = useRef<textMsg[]>([]);
    const latestTranscriptChunksRef = useRef<string[]>([]);
    const latestCallStartedRef = useRef<boolean>(false);
    const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const [chat, setChat] = useState<boolean>(false);
    const [chatHistory,setChatHistory] = useState(false);

    interface textMsg {
        message: string;
        client: boolean; //handle local vs remote messages
        timestamp: string;
    }

    const getOrCreateSessionId = (): string => {
        if (!callSessionIdRef.current) {
            callSessionIdRef.current = crypto.randomUUID();
        }
        return callSessionIdRef.current;
    };

    const buildTranscriptContent = (chatMessages: textMsg[], speechChunks: string[]): string => {
        const chatLines = chatMessages
            .filter((msg) => msg.message?.trim())
            .map((msg) => `${msg.timestamp} ${msg.client ? "Me" : "Peer"}: ${msg.message}`);

        const speechLines = speechChunks
            .filter((chunk) => chunk?.trim())
            .map((chunk) => `Speech: ${chunk}`);

        return [...chatLines, ...speechLines].join("\n");
    };

    const flushCallArtifacts = async (): Promise<void> => {
        if (artifactsFlushedRef.current || !callStarted) {
            return;
        }

        const noteContent = markdownText.trim();
        const transcriptContent = buildTranscriptContent(messages, transcriptChunks).trim();
        if (!noteContent && !transcriptContent) {
            return;
        }

        const sessionId = getOrCreateSessionId();

        try {
            if (noteContent) {
                await apiService.post("/notes", {
                    content: noteContent,
                    sessionId,
                }, token);
            }

            if (transcriptContent) {
                await apiService.post("/transcripts", {
                    content: transcriptContent,
                    sessionId,
                }, token);
            }

            artifactsFlushedRef.current = true;
        }
        catch (error) {
            console.error("Could not flush call artifacts:", error);
        }
    };

    const flushCallArtifactsWithBeacon = (): void => {
        if (artifactsFlushedRef.current || !latestCallStartedRef.current || !token || !id) {
            return;
        }

        const noteContent = latestMarkdownRef.current.trim();
        const transcriptContent = buildTranscriptContent(latestMessagesRef.current, latestTranscriptChunksRef.current).trim();
        if (!noteContent && !transcriptContent) {
            return;
        }

        const sessionId = getOrCreateSessionId();
        const encodedToken = encodeURIComponent(token);
        const baseUrl = apiService.getBaseURL();

        if (noteContent) {
            navigator.sendBeacon(
                `${baseUrl}/notes?token=${encodedToken}`,
                new Blob([JSON.stringify({content: noteContent, sessionId})], {type: "application/json"}),
            );
        }

        if (transcriptContent) {
            navigator.sendBeacon(
                `${baseUrl}/transcripts?token=${encodedToken}`,
                new Blob([JSON.stringify({content: transcriptContent, sessionId})], {type: "application/json"}),
            );
        }

        artifactsFlushedRef.current = true;
    };

    const leaveRoom = async (): Promise<void> => {
        resetPeerConnection();
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({type: "leave"}));
        }
        wsRef.current?.close(1000, "left room");
        wsRef.current = null;
        setSocketReady(false);
        setJoinedSocketRoom(false);
        setPeerInSocketRoom(false);

        await flushCallArtifacts();
        await apiService.put(`/rooms/${id}/leave`, null, token);
        router.push("/mainpage");
    };

    const resetPeerConnection = () => {
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        pendingIceCandidatesRef.current = [];
        if (remoteRef.current) {
            remoteRef.current.srcObject = null;
        }
    };

    const stopLocalStream = () => {
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        localStreamAcquirePromiseRef.current = null;
        if (clientRef.current) {
            clientRef.current.srcObject = null;
        }
        setLocalStreamReady(false);
    };

    const attachLocalTracks = (session: RTCPeerConnection, stream: MediaStream) => {
        const existingTrackIds = new Set(
            session.getSenders()
                .map(sender => sender.track?.id)
                .filter((id): id is string => Boolean(id)),
        );

        stream.getTracks().forEach(track => {
            if (!existingTrackIds.has(track.id)) {
                session.addTrack(track, stream);
            }
        });
    };

    const ensureLocalStream = async (): Promise<MediaStream | null> => {
        const existingStream = localStreamRef.current || clientRef.current?.srcObject as MediaStream | null;
        if (existingStream) {
            localStreamRef.current = existingStream;
            setLocalStreamReady(true);
            return existingStream;
        }

        if (localStreamAcquirePromiseRef.current) {
            return await localStreamAcquirePromiseRef.current;
        }

        const acquirePromise = (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
                localStreamRef.current = stream;
                if (clientRef.current) {
                    clientRef.current.srcObject = stream;
                }
                setLocalStreamReady(true);
                return stream;
            } catch (error) {
                console.error("Error accessing media devices.", error);
                setLocalStreamReady(false);
                return null;
            } finally {
                localStreamAcquirePromiseRef.current = null;
            }
        })();

        localStreamAcquirePromiseRef.current = acquirePromise;
        return await acquirePromise;
    };

    const flushPendingIceCandidates = async (session: RTCPeerConnection) => {
        const queuedCandidates = [...pendingIceCandidatesRef.current];
        pendingIceCandidatesRef.current = [];

        for (const candidate of queuedCandidates) {
            try {
                await session.addIceCandidate(candidate);
            }
            catch (error) {
                console.error("Could not add queued ICE candidate:", error);
            }
        }
    };

    const handleIncomingIceCandidate = async (candidate: RTCIceCandidateInit) => {
        const session = peerConnectionRef.current;
        if (!session || !session.remoteDescription) {
            pendingIceCandidatesRef.current.push(candidate);
            return;
        }

        try {
            await session.addIceCandidate(candidate);
        }
        catch (error) {
            console.error("Could not add ICE candidate:", error);
        }
    };

    useEffect(() => {
        latestMarkdownRef.current = markdownText;
    }, [markdownText]);

    useEffect(() => {
        latestMessagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        latestTranscriptChunksRef.current = transcriptChunks;
    }, [transcriptChunks]);

    useEffect(() => {
        latestCallStartedRef.current = callStarted;
    }, [callStarted]);

    useEffect(() => {
        if (!isReady) return;

        const handlePageExit = () => {
            // Logout beacon is emitted by useAuth; server-side logout now persists call artifacts.
        };

        window.addEventListener("beforeunload", handlePageExit);
        window.addEventListener("pagehide", handlePageExit);

        return () => {
            window.removeEventListener("beforeunload", handlePageExit);
            window.removeEventListener("pagehide", handlePageExit);
        };
    }, [isReady, token, id, apiService]);

    useEffect(() => {
        if (isReady && !token) router.push("/login");
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
                setIsCaller(String(room.CallerID) === String(myUserId));

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
        }
        else {
            setPeerInSocketRoom(false);
            resetPeerConnection();
        }
    }, [occupancy]);

    useEffect(() => {
        if (occupancy !== 2 || !isCaller || !socketReady || !joinedSocketRoom || !peerInSocketRoom || !localStreamReady) {
            return;
        }
        if (!peerConnectionRef.current) {
            void startCall();
        }
    }, [occupancy, isCaller, socketReady, joinedSocketRoom, peerInSocketRoom, localStreamReady]);

    useEffect(() => {
        if (!isReady) return;
        const socket = new WebSocket(`${getApiDomain().replace(/^http/, "ws")}/ws/SocketsHandler?token=${token}&roomId=${id}`);


        wsRef.current = socket;

        socket.onopen = () => {
            setSocketReady(true);
            setJoinedSocketRoom(false);
            setPeerInSocketRoom(false);
            socket.send(JSON.stringify({id}));
        }
        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "joined") {
                setJoinedSocketRoom(true);
            }

            if (message.type === "peer-joined") {
                setPeerInSocketRoom(true);
            }

            if (message.type === "peer-left") {
                setPeerInSocketRoom(false);
                resetPeerConnection();
            }

            if (message.type === "offer") {
                await answerCall(message.offer);
            }

            if (message.type === "answer") {
                const session = peerConnectionRef.current;
                if (session) {
                    await session.setRemoteDescription(message.answer);
                    await flushPendingIceCandidates(session);
                }
            }

            if (message.type === "ice-candidate") {
                await handleIncomingIceCandidate(message.candidate);
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
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance(message.content.message));
                }
            }

            if (message.type === "speech-to-text") {
                setSubtitleText(message.content);
                setTranscriptChunks((chunks) => [...chunks, message.content]);
            }
        };

        socket.onclose = () => {
            setSocketReady(false);
            setJoinedSocketRoom(false);
            setPeerInSocketRoom(false);
            resetPeerConnection();
        };

        socket.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        return () => {
            setSocketReady(false);
            setJoinedSocketRoom(false);
            setPeerInSocketRoom(false);
            socket.close(1000, "component unmounted");
        };
    }, [apiService, token, isReady]);

    const sendText = (data:string) => {
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
        if (peerConnectionRef.current) {
            return peerConnectionRef.current;
        }

        const session = new RTCPeerConnection(); //start
        peerConnectionRef.current = session;

        const ownStream = clientRef.current?.srcObject as MediaStream | null;  //kamera added
        if (ownStream) {
            attachLocalTracks(session, ownStream);
        }

        session.ontrack = (event) => { //partner video
            if (remoteRef.current) {
                remoteRef.current.srcObject = event.streams[0];
            }
        };

        session.onicecandidate = (event) => { //transfer zu websocket
            if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: "ice-candidate",
                    candidate: event.candidate
                }));
            }
        };

        return session;
    };


    const startCall = async () => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
            return;
        }

        if (!peerInSocketRoom) {
            return;
        }

        const ownStream = await ensureLocalStream();
        if (!ownStream) {
            return;
        }

        const session = setupPeerConnection();
        attachLocalTracks(session, ownStream);

        if (session.signalingState !== "stable") {
            return;
        }

        const offer = await session.createOffer();
        await session.setLocalDescription(offer);

        wsRef.current?.send(JSON.stringify({
            type: "offer",
            offer: offer
        }));
    };
    const answerCall = async (offer: RTCSessionDescriptionInit) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
            return;
        }

        const ownStream = await ensureLocalStream();
        if (!ownStream) {
            return;
        }

        const session = setupPeerConnection();
        attachLocalTracks(session, ownStream);

        if (session.signalingState !== "stable") {
            try {
                await session.setLocalDescription({type: "rollback"});
            }
            catch {
                resetPeerConnection();
                return;
            }
        }

        await session.setRemoteDescription(offer);
        await flushPendingIceCandidates(session);

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
        if(speechRef.current){
            speechRef.current.stop();
        }

        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) {
            console.error("SpeechRecognition is not supported by this browser.");
            return;
        }

        speechRef.current = new SpeechRecognitionCtor();
        speechRef.current.continuous = true;
        speechRef.current.interimResults = true;
        speechRef.current.start();

        speechRef.current.onresult = (event: SpeechRecognitionEvent) => {
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

        const stopSpeechRecognition = () => {
            if (speechRef.current) {
                speechRef.current.stop();
            }
        }
        return stopSpeechRecognition;
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
            }
            if (disabilityStatusLocal == "HEARING" && disabilityStatusRemote == "HEARING") {
                console.log("do nothing")
            }
            if (disabilityStatusRemote == "DEAF" && disabilityStatusLocal == "HEARING") {
                console.log("TTS")
                startTTS();
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
        const startMediaDevice = async () => {
            const stream = await ensureLocalStream();
            if (stream && peerConnectionRef.current) {
                attachLocalTracks(peerConnectionRef.current, stream);
            }
        }
        void startMediaDevice();
        return () => {
            stopLocalStream();
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
                        <Form onFinish={(values) => sendText(values.message)} layout="inline">
                            <Form.Item name="message" style={{flex: 1, marginBottom: 0}} hidden={!chat}>
                                <Input placeholder="Type a message..."/>
                            </Form.Item>
                            <Form.Item style={{marginBottom: 0}} hidden={!chat}>
                                <Button htmlType="submit" type="primary" >Send</Button>
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