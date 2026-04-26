import type { GoogleDriveOptionsWithDefaults } from './google-drive-types.ts';
export declare function initDriveStructure(googleDriveOptions: GoogleDriveOptionsWithDefaults): Promise<{
    rootFolderId: string;
    docsFolderId: string;
    signalingFolderId: string;
    replicationIdentifier: string;
    rxdbJson: {
        status: number;
        etag: any;
        createdTime: any;
        fileId: any;
        size: number;
    };
    transactionFile: {
        status: number;
        etag: any;
        createdTime: any;
        fileId: any;
        size: number;
    };
    walFile: {
        status: number;
        etag: any;
        createdTime: any;
        fileId: any;
        size: number;
    };
}>;
export type DriveStructure = Awaited<ReturnType<typeof initDriveStructure>>;
