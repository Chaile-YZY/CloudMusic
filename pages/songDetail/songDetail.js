import PubSub from 'pubsub-js';
import moment from 'moment';
import request from '../../utils/request'
// 获取全局实例
const appInstance = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        isPlay: false, // 音乐是否播放
        song: {}, // 歌曲详情对象
        songData: '',
        musicId: '', // 音乐id
        musicLink: '', // 音乐的链接
        recommendList: [],
        index: 0,//传入数据的musicId下标
        currentId: 0,//音乐下标
        value: 0,
        maxValue: 0,
        currentTime: '00:00',  // 实时时间
        durationTime: '00:00', // 总时长
        currentWidth: 0, // 实时进度条的宽度
        showAlert: false,//列表初始状态
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        // options: 用于接收路由跳转的query参数
        // 原生小程序中路由传参，对参数的长度有限制，如果参数长度过长会自动截取掉
        // console.log(JSON.parse(options.songPackage));
        let musicId = parseInt(options.musicId);
        this.setData({
            musicId,
        })
        console.log(musicId);
        // 获取音乐详情
        this.getMusicInfo(musicId);
        let recommendListData = await request('/recommend/songs');
        let recommendList = recommendListData.data.dailySongs;
        let index = recommendList.findIndex(x => x.id == parseInt(musicId));
        console.log('index的值:' + index);
        let length = parseInt(recommendList.length);
        let songData = await request('/song/detail', { ids: musicId });
        let song = songData.songs[0];
        this.setData({
            index: index,
            currentId: index,
            recommendList: recommendList,
            songData: songData,
            length: length,
            song: song,
        })

        /*
        * 问题： 如果用户操作系统的控制音乐播放/暂停的按钮，页面不知道，导致页面显示是否播放的状态和真实的音乐播放状态不一致
        * 解决方案：
        *   1. 通过控制音频的实例 backgroundAudioManager 去监视音乐播放/暂停
        *
        * */

        // 判断当前页面音乐是否在播放
        if (appInstance.globalData.isMusicPlay && appInstance.globalData.musicId === musicId) {
            // 修改当前页面音乐播放状态为true
            this.setData({
                isPlay: true
            })
        }

        // 创建控制音乐播放的实例
        this.BackgroundAudioManager = wx.getBackgroundAudioManager();
        // 监视音乐播放/暂停/停止
        this.BackgroundAudioManager.onPlay(() => {
            this.changePlayState(true);
            // 修改全局音乐播放的状态
            appInstance.globalData.musicId = musicId;
        });
        this.BackgroundAudioManager.onPause(() => {
            this.changePlayState(false);
        });
        this.BackgroundAudioManager.onStop(() => {
            this.changePlayState(false);
        });

        // 监听音乐播放自然结束
        this.BackgroundAudioManager.onEnded(() => {
            // 自动切换至下一首音乐，并且自动播放
            this.BackgroundAudioManager.stop();
            PubSub.subscribe('musicId', (msg, musicId) => {
                // console.log(musicId);
                let index = this.data.recommendList.findIndex(x => x.id == parseInt(musicId));
                this.setData({
                    index: index,
                    currentId: index,
                })
                // 获取音乐详情信息
                this.getMusicInfo(musicId);
                // 自动播放当前的音乐
                this.musicControl(true, musicId);
                // 取消订阅
                PubSub.unsubscribe('musicId');
            })
            PubSub.publish('switchType', 'next')
            // 将实时进度条的长度还原成 0；时间还原成 0；
            this.setData({
                value: 0,
                currentTime: '00:00',
            })
        });

        // 监听音乐实时播放的进度
        this.BackgroundAudioManager.onTimeUpdate(() => {
            // console.log('总时长: ', this.backgroundAudioManager.duration);
            // console.log('实时的时长: ', this.backgroundAudioManager.currentTime);
            // 格式化实时的播放时间
            let currentTime = moment(this.BackgroundAudioManager.currentTime * 1000).format('mm:ss');
            this.setData({
                currentTime: currentTime,
                value: this.BackgroundAudioManager.currentTime,
                maxValue: this.BackgroundAudioManager.duration,
            })
        })
    },
    // 修改播放状态的功能函数
    changePlayState(isPlay) {
        // 修改音乐是否的状态
        this.setData({
            isPlay
        })

        // 修改全局音乐播放的状态
        appInstance.globalData.isMusicPlay = isPlay;
    },
    // 获取音乐详情的功能函数
    async getMusicInfo(musicId) {
        let songData = await request('/song/detail', { ids: musicId });
        let musicLinkData = await request('/song/url', { id: musicId });
        // songData.songs[0].dt 单位ms
        let songfee = parseInt(songData.songs[0].fee);
        let durationTime = '';
        if (songfee == 1 || songfee == 4) {
            durationTime = moment(musicLinkData.data[0].time).format('mm:ss');
        } else {
            durationTime = moment(songData.songs[0].dt).format('mm:ss');
        }
        if (songfee == 1 || songfee == 4) {
            wx.showToast({
                title: '当前播放VIP音乐,完整播放需开通会员',
                icon: 'none',
                duration: 2000,
            })
        }
        let singer = songData.songs[0].ar[0].name;
        let picUrl = songData.songs[0].al.picUrl;
        this.setData({
            song: songData.songs[0],
            singer: singer,
            picUrl: picUrl,
            durationTime
        })

        // 动态修改窗口标题
        wx.setNavigationBarTitle({
            title: this.data.song.name
        })
    },
    // 点击播放/暂停的回调
    handleMusicPlay() {
        let isPlay = !this.data.isPlay;
        // // 修改是否播放的状态
        // this.setData({
        //   isPlay
        // })

        let { musicId, musicLink } = this.data;
        this.musicControl(isPlay, musicId, musicLink);
    },

    // 控制音乐播放/暂停的功能函数
    async musicControl(isPlay, musicId, musicLink) {
        if (isPlay) { // 音乐播放
            let songData = await request('/song/detail', { ids: musicId });
            if (!musicLink) {
                // 获取音乐播放链接
                let musicLinkData = await request('/song/url', { id: musicId });
                musicLink = musicLinkData.data[0].url;
                this.setData({
                    musicLink,
                })
            }
            this.BackgroundAudioManager.src = musicLink;
            this.BackgroundAudioManager.title = songData.songs[0].name;
            this.BackgroundAudioManager.singer = songData.songs[0].ar[0].name;
            this.BackgroundAudioManager.coverImgUrl = songData.songs[0].al.picUrl;
        } else { // 暂停音乐
            this.BackgroundAudioManager.pause();
        }

    },
    sliderChange(e) {
        console.log(e.detail.value);
        let time = e.detail.value;
        this.BackgroundAudioManager.seek(time);
    },
    // 点击切歌的回调
    handleSwitch(event) {
        // 获取切歌的类型
        let type = event.currentTarget.id;
        // 关闭当前播放的音乐
        this.BackgroundAudioManager.stop();
        // // 订阅来自recommendSong页面发布的musicId消息
        PubSub.subscribe('musicId', (msg, musicId) => {
            // console.log(musicId);
            // 获取音乐详情信息
            let index = this.data.recommendList.findIndex(x => x.id == parseInt(musicId));
            this.setData({
                index: index,
                currentId: index,
            })
            this.getMusicInfo(musicId);
            // 自动播放当前的音乐
            this.musicControl(true, musicId);
            // 取消订阅
            PubSub.unsubscribe('musicId');
        })
        // 发布消息数据给recommendSong页面
        PubSub.publish('switchType', type);
        this.setData({
            PlayState: true,
        })
    },

    showAction() {
        let list = this.data.recommendList.map(x => {
            return {
                "name": x.name,
                "singer": x.ar[0].name,
            }
        });
        this.setData({
            list,
            showAlert: true,
        })
    },
    closeAlert() {
        this.setData({
            showAlert: false,
        })
    },
    change(event) {
        let index = event.currentTarget.dataset.index;
        let currentId = this.data.currentId;
        if (currentId != index) {
            currentId = index;
        }
        let musicId = this.data.recommendList[index].id;
        this.getMusicInfo(musicId);
        this.musicControl(true, musicId);
        this.setData({
            index: index,
            currentId: currentId,
            showAlert: false,
        })
        PubSub.publish('currentId', currentId);
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})
