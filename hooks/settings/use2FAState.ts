import { useState, useCallback } from 'react';
import { useToast } from '@/components/toast';
import {
    get2FAStatus, enable2FA, verify2FASetup, disable2FA, regenerateBackupCodes,
    TwoFactorStatus, TwoFactorEnableResponse,
} from '@/services/SecurityService';

export type TwoFAStep = 'info' | 'qr' | 'verify' | 'backup';

export function use2FAState() {
    const toast = useToast();
    
    const [twoFAStatus, setTwoFAStatus] = useState<TwoFactorStatus | null>(null);
    const [twoFASetupData, setTwoFASetupData] = useState<TwoFactorEnableResponse | null>(null);
    const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>('info');
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetch2FAStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            const status = await get2FAStatus();
            const enabled = status.enabled ?? status.twoFactorEnabled ?? false;
            setTwoFAStatus({ enabled, enabledAt: status.enabledAt });
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to fetch 2FA status');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleEnable2FA = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await enable2FA();
            setTwoFASetupData(data);
            setTwoFAStep('qr');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to enable 2FA');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleVerify2FA = useCallback(async () => {
        if (verificationCode.length !== 6) {
            toast.error('Invalid Code', 'Please enter a 6-digit code');
            return;
        }
        try {
            setIsLoading(true);
            const response = await verify2FASetup(verificationCode);
            setBackupCodes(response.backupCodes || twoFASetupData?.backupCodes || []);
            setTwoFAStep('backup');
            setTwoFAStatus({ enabled: true, enabledAt: new Date().toISOString() });
            toast.success('Success', '2FA has been enabled');
        } catch (error: any) {
            toast.error('Error', error.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    }, [verificationCode, twoFASetupData, toast]);

    const handleDisable2FA = useCallback(async () => {
        if (!disablePassword) {
            toast.error('Error', 'Password is required');
            return;
        }
        try {
            setIsLoading(true);
            await disable2FA(disablePassword);
            setTwoFAStatus({ enabled: false });
            setShowDisable2FAModal(false);
            setDisablePassword('');
            toast.success('Success', '2FA has been disabled');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to disable 2FA');
        } finally {
            setIsLoading(false);
        }
    }, [disablePassword, toast]);

    const handleRegenerateBackupCodes = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await regenerateBackupCodes();
            setBackupCodes(response.backupCodes);
            setTwoFAStep('backup');
            setShow2FAModal(true);
            toast.success('Success', 'New backup codes generated');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to regenerate codes');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const reset2FAModal = useCallback(() => {
        setShow2FAModal(false);
        setTwoFAStep('info');
        setVerificationCode('');
    }, []);

    const openEnable2FAModal = useCallback(() => {
        setTwoFAStep('info');
        setShow2FAModal(true);
    }, []);

    return {
        twoFAStatus,
        twoFASetupData,
        twoFAStep,
        setTwoFAStep,
        verificationCode,
        setVerificationCode,
        backupCodes,
        show2FAModal,
        setShow2FAModal,
        showDisable2FAModal,
        setShowDisable2FAModal,
        disablePassword,
        setDisablePassword,
        isLoading,
        fetch2FAStatus,
        handleEnable2FA,
        handleVerify2FA,
        handleDisable2FA,
        handleRegenerateBackupCodes,
        reset2FAModal,
        openEnable2FAModal,
    };
}
