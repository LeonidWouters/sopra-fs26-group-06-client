"use client";

import React, {useEffect, useRef} from 'react';
import { useParams } from 'next/navigation';


const RoomPage: React.FC = () => {
    const { id } = useParams();
    const videoRef = useRef(null);
    useEffect(() => {
        let Stream;
        const startMediaDevice = async() =>{
            try {
                Stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                videoRef.current.srcObject = Stream;
            }
           catch (error) {
                console.error("Error accessing media devices.", error);
           }
        }
        startMediaDevice();
    }, []);
    return (
        <div
            style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "black"}}
        >
            Room {id}
            <video ref ={videoRef} autoPlay muted />
        </div>
    );
};

export default RoomPage;