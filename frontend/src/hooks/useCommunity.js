import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getNetworkConfig } from '../config/network';
import CommunityGovernanceABI from '../abis/CommunityGovernance.json';

// 模拟数据作为 fallback
const MOCK_POSTS = [
  {
    id: 1,
    author: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    title: 'Welcome to coidea.ai Community!',
    content: 'This is the first post in our community.',
    postType: 3,
    upvotes: 42,
    downvotes: 0,
    replyCount: 15,
    createdAt: Math.floor(Date.now() / 1000) - 86400,
    isPinned: true
  }
];

export function useCommunity(signer) {
  const [contract, setContract] = useState(null);
  const [posts, setPosts] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const config = getNetworkConfig();

  // 初始化合约
  useEffect(() => {
    if (!signer || !config.contracts.CommunityGovernance) {
      setContract(null);
      setPosts(MOCK_POSTS);
      return;
    }

    try {
      const communityContract = new ethers.Contract(
        config.contracts.CommunityGovernance,
        CommunityGovernanceABI.abi,
        signer
      );
      setContract(communityContract);
    } catch (err) {
      console.error('Contract initialization error:', err);
      setContract(null);
      setPosts(MOCK_POSTS);
    }
  }, [signer, config.contracts.CommunityGovernance]);

  // 获取用户统计
  const fetchUserStats = useCallback(async (address) => {
    if (!contract || !address) return;

    try {
      const stats = await contract.userStats(address);
      setUserStats({
        expPoints: Number(stats.expPoints),
        creditScore: Number(stats.creditScore),
        forumPosts: Number(stats.forumPosts),
        forumReplies: Number(stats.forumReplies),
        level: await contract.getUserLevel(address)
      });
    } catch (err) {
      console.error('Fetch user stats error:', err);
    }
  }, [contract]);

  // 获取帖子
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    
    if (!contract) {
      setPosts(MOCK_POSTS);
      setLoading(false);
      return;
    }

    try {
      // 由于合约没有枚举所有帖子的方法，我们使用事件日志
      // 实际项目中应该使用后端索引
      const provider = signer.provider;
      const filter = contract.filters.ForumPostCreated();
      const events = await contract.queryFilter(filter, -1000); // 最近1000个区块
      
      const postsData = await Promise.all(
        events.map(async (event) => {
          const postId = event.args[0];
          const post = await contract.forumPosts(postId);
          return {
            id: Number(postId),
            author: post.author,
            title: post.title,
            content: post.content,
            postType: Number(post.postType),
            upvotes: Number(post.upvotes),
            downvotes: Number(post.downvotes),
            createdAt: Number(post.createdAt),
            isPinned: post.isPinned
          };
        })
      );
      
      setPosts(postsData.reverse()); // 最新的在前
    } catch (err) {
      console.error('Fetch posts error:', err);
      setPosts(MOCK_POSTS);
      setError(err.message);
    }
    
    setLoading(false);
  }, [contract, signer]);

  // 创建帖子
  const createPost = useCallback(async (title, content, postType) => {
    if (!contract) {
      throw new Error('Contract not available');
    }

    const tx = await contract.createForumPost(title, content, postType);
    const receipt = await tx.wait();
    
    // 解析事件获取帖子ID
    const event = receipt.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === 'ForumPostCreated';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = contract.interface.parseLog(event);
      return { success: true, postId: Number(parsed.args[0]) };
    }
    
    return { success: true };
  }, [contract]);

  // 投票
  const votePost = useCallback(async (postId, isUpvote) => {
    if (!contract) {
      throw new Error('Contract not available');
    }

    const tx = await contract.votePost(postId, isUpvote);
    await tx.wait();
    
    return { success: true };
  }, [contract]);

  // 回复帖子
  const replyToPost = useCallback(async (parentId, content) => {
    if (!contract) {
      throw new Error('Contract not available');
    }

    const tx = await contract.replyToPost(parentId, content);
    await tx.wait();
    
    return { success: true };
  }, [contract]);

  return {
    contract,
    posts,
    userStats,
    loading,
    error,
    fetchPosts,
    fetchUserStats,
    createPost,
    votePost,
    replyToPost
  };
}

export default useCommunity;
