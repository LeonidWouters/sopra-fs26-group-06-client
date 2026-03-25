"use client";

import React from 'react';
import { useParams } from 'next/navigation';

const RoomPage: React.FC = () => {
    const { id } = useParams();

    return (
        <div
            style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "black"}}
        >
            Room {id}
        </div>
    );
};

export default RoomPage;