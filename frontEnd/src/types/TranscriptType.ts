import type { UserType } from "./UserType";

export interface TranscriptType {
    id: number;
    speakers: UserType[];
    currentSpeakerName: string;
    listeners: UserType[];
    text: string;
    timestamp: Date;
    isFinal: boolean;
}