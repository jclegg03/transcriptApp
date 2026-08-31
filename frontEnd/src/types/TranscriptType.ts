import type { UserType } from "./UserType";

export interface TranscriptType {
    id: number;
    speakers: UserType[];
    speakerName: string;
    listeners: UserType[];
    text: string;
    timestamp: Date;
    isFinal: boolean;
}