import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress, getLiabilityPresets } from '../config/network';
import LiabilityPresetABI from '../abis/LiabilityPreset.json';

const LIABILITY_MODELS = {
  0: { name: 'Standard', label: '标准', color: '#4CAF50', description: '无额外责任保障' },
  1: { name: 'Limited', label: '有限责任', color: '#FF9800', description: '责任上限保护' },
  2: { name: 'Insured', label: '保险模式', color: '#2196F3', description: '第三方保险保障' },
  3: { name: 'Bonded', label: '保证金', color: '#9C27B0', description: '双方质押保证金' }
};

export const useLiability = (signer) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContract = useCallback(() => {
    if (!signer) return null;
    const address = getContractAddress('LiabilityPreset');
    if (!address) return null;
    return new ethers.Contract(address, LiabilityPresetABI.abi, signer);
  }, [signer]);

  // 获取预设信息
  const getPresetInfo = useCallback(async (presetId) => {
    const contract = getContract();
    if (!contract) return null;

    try {
      const preset = await contract.presets(presetId);
      return {
        model: Number(preset.model),
        publisherLiability: preset.publisherLiability,
        workerLiability: preset.workerLiability,
        insurancePremium: preset.insurancePremium,
        insuranceProvider: preset.insuranceProvider,
        disputeWindow: Number(preset.disputeWindow),
        enabled: preset.enabled,
        ...LIABILITY_MODELS[Number(preset.model)]
      };
    } catch (err) {
      console.error('Get preset info error:', err);
      return null;
    }
  }, [getContract]);

  // 应用预设到任务
  const applyPreset = useCallback(async (taskId, presetId, value) => {
    const contract = getContract();
    if (!contract) throw new Error('Contract not available');

    setLoading(true);
    setError(null);

    try {
      const tx = await contract.applyPreset(taskId, presetId, {
        value: ethers.parseEther(value.toString())
      });
      await tx.wait();
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  // 工作者质押
  const depositWorkerLiability = useCallback(async (taskId, amount) => {
    const contract = getContract();
    if (!contract) throw new Error('Contract not available');

    setLoading(true);
    setError(null);

    try {
      const tx = await contract.depositWorkerLiability(taskId, {
        value: ethers.parseEther(amount.toString())
      });
      await tx.wait();
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  // 检查是否需要工作者质押
  const checkWorkerDepositRequired = useCallback(async (taskId) => {
    const contract = getContract();
    if (!contract) return { required: false, amount: 0 };

    try {
      const [required, amount] = await contract.requiresWorkerDeposit(taskId);
      return { required, amount: ethers.formatEther(amount) };
    } catch (err) {
      return { required: false, amount: 0 };
    }
  }, [getContract]);

  // 获取所有预设
  const getAllPresets = useCallback(() => {
    return getLiabilityPresets();
  }, []);

  return {
    loading,
    error,
    LIABILITY_MODELS,
    getPresetInfo,
    applyPreset,
    depositWorkerLiability,
    checkWorkerDepositRequired,
    getAllPresets
  };
};

export default useLiability;
