import { useState, useEffect, useCallback } from 'react'
import { server } from '../utils/gas-bridge'
interface useVersioningReturn {
    localVersion: string | null;
    performAuthorizedChange: (action: () => Promise<any>) => Promise<void>
    updateLocalSheetVersion: (newVersion: string) => void;
    checkSync: () => Promise<void>
}
interface useVersioningProps {
    onInvalidate: () => void
}

const useVersioning = ({
    onInvalidate
}: useVersioningProps): useVersioningReturn => {
    const [localVersion, setLocalVersion] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    // useEffect(() => {
    //     server.getSheetVersion().then(setLocalVersion)
    // }, []);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const checkSync = useCallback(async () => {
        if (isChecking) return;
        setIsChecking(true);

        try {
            await delay(500);
            const cloudVersion = await server.getSheetVersion();

            if (localVersion && cloudVersion !== localVersion) {
                onInvalidate();
            }
        } finally {
            setIsChecking(false);
        }
    }, [localVersion, onInvalidate, isChecking])

    useEffect(() => {
        const onFocus = () => checkSync();
        window.addEventListener('focus', onFocus);

        return () => window.removeEventListener('focus', onFocus);
    }, [checkSync]);


    const performAuthorizedChange = useCallback(async (action: () => Promise<any>) => {
        try {
            await action();
            const nextVersion = await server.incrementSheetVersion();

            setLocalVersion(nextVersion);
        } catch (error) {
            throw new Error(`Version sync failed ${error}`);
        }
    }, []);

    const updateLocalSheetVersion = (newVersion: string) => {
        setLocalVersion(newVersion);
    }
    return { localVersion, performAuthorizedChange, checkSync, updateLocalSheetVersion };
};

export default useVersioning
